# Audio & DAW Agent

## Role
Специализированный агент для работы с аудиофайлами, редактированием, визуализацией и DAW функциями.

## Expertise
- Web Audio API
- Tone.js для синтеза и эффектов
- WaveSurfer.js для визуализации
- MIDI обработка (@tonejs/midi)
- Stem separation и mixing
- Audio encoding/decoding

## Key Files
- `src/components/stem-studio/` - Stem Studio компоненты
- `src/components/player/` - Аудио плеер
- `src/hooks/useAudio*.ts` - Аудио хуки
- `src/lib/audio/` - Аудио утилиты

## Core Concepts

### Audio Context Management
```typescript
// Singleton AudioContext (избегай множественных контекстов)
let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Обязательно resume после user gesture
export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}
```

### WaveSurfer Integration
```typescript
import WaveSurfer from 'wavesurfer.js';

const wavesurfer = WaveSurfer.create({
  container: containerRef.current,
  waveColor: 'hsl(var(--primary) / 0.5)',
  progressColor: 'hsl(var(--primary))',
  cursorColor: 'hsl(var(--primary))',
  barWidth: 2,
  barGap: 1,
  barRadius: 2,
  height: 80,
  normalize: true,
  backend: 'WebAudio',
});

// События
wavesurfer.on('ready', () => setDuration(wavesurfer.getDuration()));
wavesurfer.on('audioprocess', () => setCurrentTime(wavesurfer.getCurrentTime()));
wavesurfer.on('seek', (progress) => setCurrentTime(progress * duration));

// Cleanup
useEffect(() => () => wavesurfer?.destroy(), []);
```

### Tone.js Effects Chain
```typescript
import * as Tone from 'tone';

// Создание эффектов
const eq = new Tone.EQ3({
  low: 0,
  mid: 0,
  high: 0,
});

const reverb = new Tone.Reverb({
  decay: 2,
  wet: 0.3,
});

const compressor = new Tone.Compressor({
  threshold: -24,
  ratio: 4,
  attack: 0.003,
  release: 0.25,
});

// Цепочка эффектов
const player = new Tone.Player(audioUrl);
player.chain(eq, compressor, reverb, Tone.Destination);

// Управление
player.start();
player.stop();
player.seek(time);
```

### MIDI Processing
```typescript
import { Midi } from '@tonejs/midi';

// Парсинг MIDI
const midi = new Midi(arrayBuffer);

// Извлечение нот
const notes = midi.tracks.flatMap(track =>
  track.notes.map(note => ({
    name: note.name,
    midi: note.midi,
    time: note.time,
    duration: note.duration,
    velocity: note.velocity,
  }))
);

// Создание MIDI
const newMidi = new Midi();
const track = newMidi.addTrack();
track.addNote({
  midi: 60, // C4
  time: 0,
  duration: 0.5,
  velocity: 0.8,
});

// Экспорт
const blob = new Blob([newMidi.toArray()], { type: 'audio/midi' });
```

### Audio Analysis
```typescript
// Анализатор частот
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

function visualize() {
  analyser.getByteFrequencyData(dataArray);
  // dataArray содержит частотные данные 0-255
  requestAnimationFrame(visualize);
}

// Определение BPM (упрощённо)
function detectBPM(audioBuffer: AudioBuffer): number {
  const peaks = findPeaks(audioBuffer);
  const intervals = calculateIntervals(peaks);
  return 60 / averageInterval(intervals);
}
```

## Stem Mixing

### Volume & Pan
```typescript
interface StemChannel {
  id: string;
  player: Tone.Player;
  gain: Tone.Gain;
  panner: Tone.Panner;
  solo: boolean;
  mute: boolean;
}

function createStemChannel(url: string): StemChannel {
  const player = new Tone.Player(url);
  const gain = new Tone.Gain(1);
  const panner = new Tone.Panner(0);
  
  player.chain(gain, panner, Tone.Destination);
  
  return { id: crypto.randomUUID(), player, gain, panner, solo: false, mute: false };
}

function setVolume(channel: StemChannel, value: number) {
  channel.gain.gain.value = value;
}

function setPan(channel: StemChannel, value: number) {
  channel.panner.pan.value = value; // -1 to 1
}
```

### Solo/Mute Logic
```typescript
function updateSoloMute(channels: StemChannel[]) {
  const anySolo = channels.some(c => c.solo);
  
  channels.forEach(channel => {
    if (anySolo) {
      // Если есть solo, mute всех кроме solo
      channel.gain.gain.value = channel.solo ? 1 : 0;
    } else {
      // Иначе используй mute состояние
      channel.gain.gain.value = channel.mute ? 0 : 1;
    }
  });
}
```

## Common Issues

### Issue: Audio not playing
```typescript
// 1. Проверь AudioContext state
if (audioContext.state === 'suspended') {
  await audioContext.resume();
}

// 2. Добавь user gesture handler
button.addEventListener('click', async () => {
  await Tone.start();
  player.start();
});

// 3. Проверь CORS для аудио URL
// Используй crossOrigin: 'anonymous' для <audio> элементов
```

### Issue: Memory leaks
```typescript
// Всегда dispose Tone.js объекты
useEffect(() => {
  const player = new Tone.Player(url);
  
  return () => {
    player.stop();
    player.dispose();
  };
}, [url]);

// Отключай MediaStream после использования
stream.getTracks().forEach(track => track.stop());
```

### Issue: Waveform not rendering
```typescript
// Убедись что container существует перед созданием
if (!containerRef.current) return;

// Дождись загрузки аудио
wavesurfer.on('ready', () => {
  setIsReady(true);
});

// Проверь CORS
wavesurfer.load(url, undefined, 'anonymous');
```

## Commands
- `/create-player` - создай аудио плеер
- `/create-visualizer` - создай визуализатор
- `/create-mixer` - создай микшер для стемов
- `/add-effect` - добавь аудио эффект
- `/export-audio` - экспортируй аудио
