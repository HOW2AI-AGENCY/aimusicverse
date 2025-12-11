import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Guitar, Music, FileMusic, Mic } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { MusicLabAudioProvider } from '@/contexts/MusicLabAudioContext';

/**
 * Music Lab Hub - Unified Creative Workspace
 * 
 * Consolidates Guitar Studio, Chord Detection, Tab Editor, and Melody Mixer
 * into a single, cohesive workspace with shared audio context.
 * 
 * Sprint 025: US-025-001
 */
export default function MusicLab() {
  const [activeTab, setActiveTab] = useState('guitar');

  return (
    <MusicLabAudioProvider>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">🎵 Music Lab</h1>
          <p className="text-muted-foreground">
            Your unified creative workspace for music creation and analysis
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="guitar" className="flex items-center gap-2">
              <Guitar className="h-4 w-4" />
              <span className="hidden sm:inline">Guitar Studio</span>
              <span className="sm:hidden">Guitar</span>
            </TabsTrigger>
            <TabsTrigger value="chords" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">Chords</span>
              <span className="sm:hidden">Chords</span>
            </TabsTrigger>
            <TabsTrigger value="tabs" className="flex items-center gap-2">
              <FileMusic className="h-4 w-4" />
              <span className="hidden sm:inline">Tab Editor</span>
              <span className="sm:hidden">Tabs</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Voice Input</span>
              <span className="sm:hidden">Voice</span>
            </TabsTrigger>
          </TabsList>

          {/* Guitar Studio Tab */}
          <TabsContent value="guitar" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">🎸 Guitar Studio</h2>
              <p className="text-muted-foreground">
                Record guitar, analyze chords, and generate full tracks from your riffs.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Guitar Studio components will be integrated here from the existing GuitarStudio page.
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Chord Detection Tab */}
          <TabsContent value="chords" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">🎹 Chord Detection</h2>
              <p className="text-muted-foreground">
                Real-time chord recognition from audio input or uploaded files.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Chord detection UI will be integrated here.
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Tab Editor Tab */}
          <TabsContent value="tabs" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">📝 Tab Editor</h2>
              <p className="text-muted-foreground">
                Create and edit guitar tablature with visual feedback.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Tab editor components will be integrated here.
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Voice Input Tab */}
          <TabsContent value="voice" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">🎤 Voice Input</h2>
              <p className="text-muted-foreground">
                Hum or sing melodies to create tracks instantly.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Voice input and melody recognition will be integrated here.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions Footer */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
            <h3 className="font-semibold mb-2">🚀 Quick Generate</h3>
            <p className="text-sm text-muted-foreground">
              Create a track from your current work
            </p>
          </Card>
          <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
            <h3 className="font-semibold mb-2">💾 Save Project</h3>
            <p className="text-sm text-muted-foreground">
              Save your progress for later
            </p>
          </Card>
          <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
            <h3 className="font-semibold mb-2">📚 Open Library</h3>
            <p className="text-sm text-muted-foreground">
              Browse your created tracks
            </p>
          </Card>
        </div>
      </div>
    </MusicLabAudioProvider>
  );
}
