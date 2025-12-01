import type { Meta, StoryObj } from '@storybook/react';
import { CompactPlayer } from './CompactPlayer';
import { Track } from '@/hooks/useTracksOptimized';
// import { fn } from '@storybook/test';
import * as AudioPlayerHook from '@/hooks/useAudioPlayer';
import * as LyricsHook from '@/hooks/useTimestampedLyrics';

const fn = () => {};

const meta: Meta<typeof CompactPlayer> = {
  title: 'Components/CompactPlayer',
  component: CompactPlayer,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
        <div className="relative h-screen bg-background p-4 flex items-center justify-center">
          <Story />
        </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onClose: fn(),
    onMaximize: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof CompactPlayer>;

const mockTrack: Track = {
  id: '1',
  user_id: 'user-123',
  project_id: 'proj-456',
  suno_id: 'suno-789',
  title: 'Midnight Groove',
  style: 'Jazz, Funk',
  cover_url: 'https://picsum.photos/seed/3/500/500',
  audio_url: 'https://example.com/audio.mp3',
  streaming_url: 'https://example.com/stream.mp3',
  duration: 240,
  created_at: new Date().toISOString(),
  status: 'completed',
};

const mockWaveformData = Array.from({ length: 100 }, () => Math.random());

const mockAudioPlayer = (isPlaying: boolean, currentTime: number) => {
    // jest.spyOn(AudioPlayerHook, 'useAudioPlayer').mockImplementation(() => ({
    //     isPlaying,
    //     currentTime,
    //     duration: 240,
    //     togglePlay: fn(),
    //     seek: fn(),
    //     setVolume: fn(),
    //   }));
}

const mockLyrics = (isLoading: boolean, waveformData: number[]) => {
    // jest.spyOn(LyricsHook, 'useTimestampedLyrics').mockImplementation(() => ({
    //     data: { waveformData },
    //     isLoading,
    //     isError: false,
    //   }));
}

export const Default: Story = {
  args: {
    track: mockTrack,
  },
  render: (args) => {
    mockAudioPlayer(false, 30);
    mockLyrics(false, mockWaveformData);
    return <CompactPlayer {...args} />;
  },
};

export const Playing: Story = {
    args: {
        ...Default.args,
    },
    render: (args) => {
        mockAudioPlayer(true, 90);
        mockLyrics(false, mockWaveformData);
        return <CompactPlayer {...args} />;
    },
}

export const NoWaveform: Story = {
    args: {
        ...Default.args,
    },
    render: (args) => {
        mockAudioPlayer(false, 10);
        mockLyrics(true, []);
        return <CompactPlayer {...args} />;
    },
}
