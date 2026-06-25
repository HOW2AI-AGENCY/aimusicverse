/**
 * Content Analytics Panel
 * Displays popular genres, moods, styles, and content trends
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Treemap,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Music, Palette, Hash, TrendingUp, Mic2, Disc3 } from "@/lib/icons";

interface ContentAnalyticsPanelProps {
  timePeriod: string;
}

interface ContentStats {
  total_tracks: number;
  public_tracks: number;
  avg_duration_sec: number;
  genres: Array<{ name: string; count: number }>;
  moods: Array<{ name: string; count: number }>;
  styles: Array<{ name: string; count: number }>;
  languages: Array<{ name: string; count: number }>;
  top_tags: Array<{ tag: string; count: number }>;
  instrumental_ratio: number;
  with_lyrics_ratio: number;
}

export function ContentAnalyticsPanel({ timePeriod }: ContentAnalyticsPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["content-analytics", timePeriod],
    queryFn: async (): Promise<ContentStats> => {
      const periodDays =
        timePeriod === "24 hours" ? 1 : timePeriod === "7 days" ? 7 : timePeriod === "30 days" ? 30 : 90;

      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

      const { data: tracks } = await supabase
        .from("tracks")
        .select(
          "computed_genre, computed_mood, style, tags, lyrics_language, duration_seconds, lyrics, is_public, status",
        )
        .gte("created_at", startDate.toISOString())
        .eq("status", "completed");

      const allTracks = tracks || [];

      // Count by genre
      const genreMap = new Map<string, number>();
      const moodMap = new Map<string, number>();
      const styleMap = new Map<string, number>();
      const languageMap = new Map<string, number>();
      const tagMap = new Map<string, number>();

      let totalDuration = 0;
      let instrumentalCount = 0;
      let withLyricsCount = 0;

      allTracks.forEach((track) => {
        // Genre
        if (track.computed_genre) {
          genreMap.set(track.computed_genre, (genreMap.get(track.computed_genre) || 0) + 1);
        }

        // Mood
        if (track.computed_mood) {
          moodMap.set(track.computed_mood, (moodMap.get(track.computed_mood) || 0) + 1);
        }

        // Style
        if (track.style) {
          styleMap.set(track.style, (styleMap.get(track.style) || 0) + 1);
        }

        // Language
        if (track.lyrics_language) {
          languageMap.set(track.lyrics_language, (languageMap.get(track.lyrics_language) || 0) + 1);
        }

        // Tags - it's a string, not array, so parse it
        if (track.tags) {
          const tagsArray = track.tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean);
          tagsArray.forEach((tag: string) => {
            tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
          });
        }

        // Duration
        if (track.duration_seconds) {
          totalDuration += track.duration_seconds;
        }

        // Instrumental vs Lyrics
        if (track.lyrics && track.lyrics.trim().length > 0) {
          withLyricsCount++;
        } else {
          instrumentalCount++;
        }
      });

      const mapToArray = (map: Map<string, number>) =>
        Array.from(map.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

      return {
        total_tracks: allTracks.length,
        public_tracks: allTracks.filter((t) => t.is_public).length,
        avg_duration_sec: allTracks.length > 0 ? totalDuration / allTracks.length : 0,
        genres: mapToArray(genreMap),
        moods: mapToArray(moodMap),
        styles: mapToArray(styleMap),
        languages: mapToArray(languageMap),
        top_tags: Array.from(tagMap.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20),
        instrumental_ratio: allTracks.length > 0 ? (instrumentalCount / allTracks.length) * 100 : 0,
        with_lyrics_ratio: allTracks.length > 0 ? (withLyricsCount / allTracks.length) * 100 : 0,
      };
    },
    staleTime: 60000,
    refetchInterval: 120000,
  });

  if (isLoading) {
    return <ContentAnalyticsSkeleton />;
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">Нет данных о контенте</CardContent>
      </Card>
    );
  }

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(142, 76%, 36%)",
    "hsl(38, 92%, 50%)",
    "hsl(280, 87%, 65%)",
    "hsl(200, 95%, 50%)",
    "hsl(340, 82%, 52%)",
    "hsl(166, 76%, 40%)",
    "hsl(25, 95%, 53%)",
  ];

  const lyricsData = [
    { name: "С текстом", value: data.with_lyrics_ratio },
    { name: "Инструментал", value: data.instrumental_ratio },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <ContentStatCard
          icon={Music}
          label="Всего треков"
          value={data.total_tracks.toLocaleString()}
          iconColor="text-blue-500"
        />
        <ContentStatCard
          icon={TrendingUp}
          label="Публичных"
          value={data.public_tracks.toLocaleString()}
          subtext={`${data.total_tracks > 0 ? ((data.public_tracks / data.total_tracks) * 100).toFixed(0) : 0}%`}
          iconColor="text-green-500"
        />
        <ContentStatCard
          icon={Disc3}
          label="Ср. длина"
          value={formatDuration(data.avg_duration_sec)}
          iconColor="text-purple-500"
        />
        <ContentStatCard
          icon={Mic2}
          label="С текстом"
          value={`${data.with_lyrics_ratio.toFixed(0)}%`}
          subtext={`Инстр: ${data.instrumental_ratio.toFixed(0)}%`}
          iconColor="text-orange-500"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Genres */}
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Disc3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Популярные жанры
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {data.genres.length > 0 ? (
              <div className="h-[180px] sm:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.genres.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                    <Tooltip
                      formatter={(value: any) => [value, "Треков"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[180px] sm:h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                Нет данных
              </div>
            )}
          </CardContent>
        </Card>

        {/* Moods */}
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Настроения
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {data.moods.length > 0 ? (
              <div className="h-[180px] sm:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.moods.slice(0, 6)}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {data.moods.slice(0, 6).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [value, "Треков"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[180px] sm:h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                Нет данных
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Languages */}
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-base">Языки</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {data.languages.length > 0 ? (
              <div className="space-y-1.5 sm:space-y-2">
                {data.languages.slice(0, 6).map((lang, i) => (
                  <div key={lang.name} className="flex items-center gap-2">
                    <div
                      className="h-1.5 sm:h-2 rounded-full"
                      style={{
                        width: `${(lang.count / data.languages[0].count) * 100}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                        minWidth: "16px",
                      }}
                    />
                    <span className="text-xs sm:text-sm font-medium min-w-[50px]">{formatLanguage(lang.name)}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">{lang.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                Нет данных о языках
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lyrics vs Instrumental */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Текст vs Инструментал</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lyricsData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                  >
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(var(--secondary))" />
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value.toFixed(1)}%`, ""]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Tags */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Популярные теги
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.top_tags.length > 0 ? (
              data.top_tags.map((tag, i) => (
                <Badge key={tag.tag} variant={i < 5 ? "default" : "secondary"} className="gap-1">
                  {tag.tag}
                  <span className="text-xs opacity-70">({tag.count})</span>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">Нет данных о тегах</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatLanguage(code: string): string {
  const map: Record<string, string> = {
    ru: "Русский",
    en: "English",
    es: "Español",
    de: "Deutsch",
    fr: "Français",
    ja: "日本語",
    ko: "한국어",
    zh: "中文",
  };
  return map[code] || code;
}

interface ContentStatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext?: string;
  iconColor: string;
}

function ContentStatCard({ icon: Icon, label, value, subtext, iconColor }: ContentStatCardProps) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-1">
          <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-lg sm:text-2xl font-bold truncate">{value}</p>
            {subtext && <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{subtext}</p>}
          </div>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function ContentAnalyticsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-4">
              <Skeleton className="h-14 sm:h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-4">
              <Skeleton className="h-[180px] sm:h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
