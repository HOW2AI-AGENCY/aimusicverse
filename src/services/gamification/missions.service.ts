/**
 * Gamification Mission Services
 * Business logic for daily missions, weekly challenges, streak calendar,
 * special challenges, and quick stats panels (C3 Batch B).
 */

import * as creditsApi from "@/api/credits.api";
import * as tracksApi from "@/api/tracks.api";
import * as paymentsApi from "@/api/payments.api";

// ==========================================
// Daily Missions
// ==========================================

export interface DailyActivity {
  generations: number;
  shares: number;
  likes: number;
  checkedIn: boolean;
  claimedIds: Set<string>;
}

/**
 * Aggregate all data required by the DailyMissions panel: today's counts of
 * generations, shares, likes, plus the user's checkin state and claimed
 * missions for the day.
 */
export async function fetchDailyActivity(userId: string, todayIsoDate: string): Promise<DailyActivity> {
  const todayStart = `${todayIsoDate}T00:00:00.000Z`;
  const todayEnd = `${todayIsoDate}T23:59:59.999Z`;

  const [generations, shares, likes, checkin, claimedMissions] = await Promise.all([
    creditsApi.countTracksCreatedBetween(userId, todayStart, todayEnd),
    creditsApi.countUserActivityBetween(userId, "share", todayStart, todayEnd),
    creditsApi.countUserTrackLikesBetween(userId, todayStart, todayEnd),
    creditsApi.fetchTodayCheckin(userId, todayIsoDate),
    creditsApi.fetchClaimedMissionActions(userId, todayStart, todayEnd),
  ]);

  const claimedIds = new Set(claimedMissions.map((m) => m.action_type.replace("mission_", "")));

  return {
    generations,
    shares,
    likes,
    checkedIn: !!checkin,
    claimedIds,
  };
}

export interface MissionRewardInput {
  userId: string;
  missionId: string;
  title: string;
  credits: number;
  xp: number;
}

/**
 * Claim a daily mission reward by invoking the reward-action edge function.
 */
export async function claimMissionReward(input: MissionRewardInput): Promise<void> {
  const { error } = await creditsApi.invokeRewardAction({
    userId: input.userId,
    actionType: `mission_${input.missionId}`,
    customCredits: input.credits,
    customExperience: input.xp,
    description: `Миссия: ${input.title}`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

// ==========================================
// Streak Calendar
// ==========================================

export interface CheckinDay {
  checkin_date: string;
  credits_earned: number;
  streak_day: number;
}

/**
 * Fetch last N days of checkins for the streak calendar heatmap.
 */
export async function fetchStreakCalendarDays(userId: string, sinceIsoDate: string): Promise<CheckinDay[]> {
  return creditsApi.fetchCheckinsSince(userId, sinceIsoDate);
}

// ==========================================
// Quick Stats
// ==========================================

export interface QuickStatsSummary {
  tracks: number;
  achievements: number;
}

/**
 * Aggregate counts shown on the QuickStats panel.
 */
export async function fetchQuickStats(userId: string): Promise<QuickStatsSummary> {
  const [tracks, achievements] = await Promise.all([
    creditsApi.countCompletedTracks(userId),
    creditsApi.countUserAchievements(userId),
  ]);

  return { tracks, achievements };
}

// ==========================================
// Special Challenges
// ==========================================

export interface SpecialChallengeStats {
  totalTracks: number;
  totalLikes: number;
  longestStreak: number;
  level: number;
  artistsCount: number;
  achievementsCount: number;
}

/**
 * Aggregate stats powering the SpecialChallenges milestone grid.
 */
export async function fetchSpecialChallengeStats(userId: string): Promise<SpecialChallengeStats> {
  const tracksResponse = await tracksApi.fetchTracks({ userId });
  const allUserTracks = tracksResponse.data ?? [];
  const totalTracks = tracksResponse.count ?? allUserTracks.length;
  const trackIds = allUserTracks.map((t) => t.id);

  const [totalLikes, credits, artistsCount, achievementsCount] = await Promise.all([
    creditsApi.countLikesForTracks(trackIds),
    paymentsApi.getUserCredits(userId),
    creditsApi.countUserArtists(userId),
    creditsApi.countUserAchievements(userId),
  ]);

  return {
    totalTracks,
    totalLikes,
    longestStreak: (credits as any)?.longest_streak ?? 0,
    level: (credits as any)?.level ?? 1,
    artistsCount,
    achievementsCount,
  };
}

// ==========================================
// Weekly Challenges
// ==========================================

export interface WeeklyChallengeStats {
  generations: number;
  shares: number;
  likesReceived: number;
  currentStreak: number;
}

/**
 * Aggregate stats powering the WeeklyChallenges grid.
 */
export async function fetchWeeklyChallengeStats(
  userId: string,
  weekStartIso: string,
  weekEndIso: string,
): Promise<WeeklyChallengeStats> {
  const [generations, shares, credits] = await Promise.all([
    creditsApi.countTracksCreatedBetween(userId, weekStartIso, weekEndIso, "completed"),
    creditsApi.countUserActivityBetween(userId, "share", weekStartIso, weekEndIso),
    paymentsApi.getUserCredits(userId),
  ]);

  const tracksResponse = await tracksApi.fetchTracks({ userId });
  const trackIds = (tracksResponse.data ?? []).map((t) => t.id);
  const likesReceived = await creditsApi.countLikesForTracksBetween(trackIds, weekStartIso, weekEndIso);

  return {
    generations,
    shares,
    likesReceived,
    currentStreak: (credits as any)?.current_streak ?? 0,
  };
}
