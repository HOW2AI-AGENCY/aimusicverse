import type { Meta, StoryObj } from '@storybook/react';
import Library from './Library';
import * as AuthHook from '@/hooks/useAuth';
import * as TracksHook from '@/hooks/useTracksOptimized';
import * as PlayerStore from '@/hooks/usePlayerState';
import { Track } from '@/hooks/useTracksOptimized';

const meta: Meta<typeof Library> = {
  title: 'Pages/Library',
  component: Library,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Library>;

const mockTracks: Track[] = Array.from({ length: 8 }, (_, i) => ({
  id: `${i + 1}`,
  user_id: 'user-123',
  project_id: `proj-${i}`,
  suno_id: `suno-${i}`,
  title: `Awesome Track ${i + 1}`,
  style: 'Synthwave',
  cover_url: `https://picsum.photos/seed/${i + 10}/500/500`,
  audio_url: 'https://example.com/audio.mp3',
  is_liked: i % 3 === 0,
  likes_count: 10 + i * 5,
  play_count: 50 + i * 10,
  created_at: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
  status: 'completed',
}));

const mockAllHooks = (isLoading = false, tracks = mockTracks) => {
    jest.spyOn(AuthHook, 'useAuth').mockReturnValue({ isAuthenticated: true, loading: false });
    jest.spyOn(TracksHook, 'useTracks').mockReturnValue({
      tracks,
      isLoading,
      deleteTrack: () => {},
      toggleLike: () => {},
      logPlay: () => {},
      downloadTrack: () => {},
    });
    jest.spyOn(PlayerStore, 'usePlayerStore').mockReturnValue({ activeTrack: tracks.length > 0 ? tracks[0] : null, playTrack: () => {} });
  };

export const Default: Story = {
  loaders: [
    async () => {
      mockAllHooks();
      return {};
    },
  ],
  render: () => <Library />,
};

export const Loading: Story = {
    loaders: [
        async () => {
          mockAllHooks(true, []);
          return {};
        },
      ],
      render: () => <Library />,
};

export const Empty: Story = {
    loaders: [
        async () => {
          mockAllHooks(false, []);
          return {};
        },
      ],
      render: () => <Library />,
};
