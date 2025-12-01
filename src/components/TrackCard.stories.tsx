import type { Meta, StoryObj } from '@storybook/react';
import { TrackCard } from './TrackCard';
import { Track } from '@/hooks/useTracksOptimized';

const meta: Meta<typeof TrackCard> = {
  title: 'Components/TrackCard',
  component: TrackCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-background">
          <Story />
        </div>
    ),
  ],
  argTypes: {
    isPlaying: { control: 'boolean' },
    layout: { control: { type: 'radio' }, options: ['grid', 'list'] },
  },
};

export default meta;
type Story = StoryObj<typeof TrackCard>;

const mockTrack: Track = {
  id: '1',
  user_id: 'user-123',
  project_id: 'proj-456',
  suno_id: 'suno-789',
  title: 'Cosmic Dream',
  style: 'Electronic, Lo-fi',
  lyrics: 'Traveling through the stars...',
  cover_url: 'https://picsum.photos/seed/1/500/500',
  audio_url: 'https://example.com/audio.mp3',
  duration: 180,
  tags: 'space, chill, electronic',
  is_public: true,
  is_liked: false,
  likes_count: 42,
  play_count: 1234,
  created_at: new Date().toISOString(),
  status: 'completed',
  has_vocals: true,
  generation_mode: 'full',
};

export const Default: Story = {
  args: {
    track: mockTrack,
    isPlaying: false,
    layout: 'grid',
  },
};

export const Playing: Story = {
  args: {
    ...Default.args,
    isPlaying: true,
  },
};

export const Liked: Story = {
  args: {
    ...Default.args,
    track: { ...mockTrack, is_liked: true, likes_count: (mockTrack.likes_count || 0) + 1 },
  },
};

export const Private: Story = {
  args: {
    ...Default.args,
    track: { ...mockTrack, is_public: false },
  },
};

export const NoCover: Story = {
  args: {
    ...Default.args,
    track: { ...mockTrack, cover_url: null },
  },
};

export const Processing: Story = {
    args: {
      ...Default.args,
      track: { ...mockTrack, status: 'processing', audio_url: null },
    },
  };

export const ListLayout: Story = {
    args: {
      ...Default.args,
      layout: 'list',
    },
    decorators: [
        (Story) => (
            <div className="flex flex-col gap-4 p-4 bg-background max-w-lg mx-auto">
              <Story />
              <Story args={{ ...Default.args, track: {...mockTrack, id: '2', title: "Another Song", cover_url: 'https://picsum.photos/seed/2/500/500'}, layout: 'list' }}/>
            </div>
        ),
      ],
  };
