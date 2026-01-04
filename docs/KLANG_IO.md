# Документация API Системы Транскрипции Музыки и Конвертации Форматов

## Содержание

1. [Введение](#введение)
2. [Архитектура Системы](#архитектура-системы)
3. [Поддерживаемые Форматы](#поддерживаемые-форматы)
4. [Установка и Настройка](#установка-и-настройка)
5. [REST API Endpoints](#rest-api-endpoints)
6. [Спецификация Форматов](#спецификация-форматов)
7. [Примеры Использования](#примеры-использования)
8. [Обработка Ошибок](#обработка-ошибок)
9. [Оптимизация и Производительность](#оптимизация-и-производительность)
10. [Best Practices](#best-practices)

---

## Введение

Система транскрипции музыки представляет собой мощное решение для автоматического анализа аудиозаписей и преобразования музыкальных данных между различными форматами нотации. Система использует глубокое обучение для распознавания музыкальных паттернов и генерирует высокоточные музыкальные партитуры.

### Основные Возможности

- **Автоматическая Транскрипция**: Анализ аудиофайлов и извлечение нот
- **Мультиинструментальная Поддержка**: Распознавание различных инструментов (пиано, гитара, флейта, скрипка, труба, бас)
- **Полифоническое Распознавание**: Обнаружение аккордов, гармоний и мелодии
- **Конвертация Форматов**: Преобразование между MIDI, MusicXML, GP5, и PDF
- **Генерация Табуляции**: Автоматическое создание гитарной табуляции
- **Интерактивное Редактирование**: Веб-интерфейс для корректировки результатов

### Технологический Стек

```
Frontend: React + TypeScript + Framer Motion
Backend: Node.js + Express/FastAPI
ML Models: PyTorch CRNN, Transformers (MT3, YourMT3+)
Storage: PostgreSQL + S3-compatible storage
Formats Processing: Music21, Partitura, Verovio, PyGuitarPro
```

---

## Архитектура Системы

### Общая Структура

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                         │
│        (Web UI, Mobile Apps, API Clients)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                    API Gateway                              │
│         (Authentication, Rate Limiting, Routing)           │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──┐  ┌──────▼──┐  ┌────▼──────┐
│Transcribe│  │Convert  │  │Export     │
│Service   │  │Service  │  │Service    │
└───────┬──┘  └──────┬──┘  └────┬──────┘
        │            │           │
        └────────────┼───────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                ML/Processing Layer                          │
│      (CRNN Models, Format Parsers, Audio Processing)       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Data Layer                                 │
│        (PostgreSQL, S3, Redis Cache)                       │
└─────────────────────────────────────────────────────────────┘
```

### Микросервисная Архитектура

```yaml
transcription-service:
  - model: CRNN (Convolutional Recurrent Neural Network)
  - input: WAV, MP3, FLAC
  - output: Note Array, Time-stamped data
  - models_per_instrument: 6 (piano, guitar, flute, violin, trumpet, bass)

conversion-service:
  - midi-converter: MIDI ↔ MusicXML ↔ GP5
  - score-renderer: MusicXML → PDF with notation
  - tab-generator: Note data → Guitar tabs
  - format-validators: Schema validation for each format

export-service:
  - pdf-generation: Music rendering + tablature
  - midi-export: Standard MIDI File 1.1 format
  - musicxml-export: MusicXML 4.0 with extended features
  - gp5-export: GuitarPro 5 proprietary format
```

---

## Поддерживаемые Форматы

### Входные Форматы Аудио

| Формат | Расширение | Кодирование | Поддержка |
|--------|-----------|-----------|----------|
| WAV | .wav | PCM | ✅ Full |
| MP3 | .mp3 | MP3 | ✅ Full |
| FLAC | .flac | FLAC | ✅ Full |
| OGG | .ogg | Vorbis | ✅ Full |
| M4A | .m4a | AAC | ✅ Full |
| YouTube | URL | Stream | ✅ Via yt-dlp |

### Выходные Форматы Нотации

#### MIDI (Musical Instrument Digital Interface)

**Описание**: Стандартный формат для обмена музыкальными данными между устройствами и приложениями.

**Структура**:
```
MIDI File Structure:
├── Header Chunk (MThd)
│   ├── Format type (0, 1, or 2)
│   ├── Number of tracks
│   └── Division (ticks per quarter note)
└── Track Chunks (MTrk)
    ├── Meta Events (tempo, time signature, etc.)
    └── MIDI Events (note on/off, controllers, etc.)
```

**Спецификация**:
- Standard MIDI File Specification 1.1
- Поддержка всех MIDI каналов (0-15)
- General MIDI instrument mapping
- Support for variable length quantities
- Controller events и program changes

**Применение**: Совместимость с DAW, синтезаторами, видеоредакторами

#### MusicXML

**Описание**: XML-based формат для представления западной музыкальной нотации (версия 4.0).

**Структура**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN"
  "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work>
    <work-title>Song Title</work-title>
  </work>
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
      <score-instrument id="P1-I1">
        <instr-name>Piano</instr-name>
      </score-instrument>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>
```

**Элементы MusicXML**:
- Partwise format (по частям) или Timewise (по времени)
- Note elements с pitch, duration, type
- Attributes: ключ, размер такта, темп, инструмент
- Notations: артикуляция, динамика, лига и т.д.
- Lyrics и chord symbols
- Dynamics и expression marks

**Поддержка Standard Music Font Layout (SMuFL)**

#### Guitar Pro 5 (GP5)

**Описание**: Проприетарный формат для табуляции и нотации Guitar Pro 5.

**Структура бинарного формата**:
```
GP5 File Structure:
├── Version string ("FICHIER GUITAR PRO v5.xx")
├── Song metadata
│   ├── Title
│   ├── Artist
│   ├── Album
│   ├── Author
│   └── Copyright
├── Triplet feel
├── Lyrics
├── Tempo and key
├── MIDI channels configuration
├── Measures (headers and data)
├── Tracks
├── Measures details
└── Custom effects/playback settings
```

**Особенности GP5**:
- Full tablature support (до 7 струн)
- Advanced effects (hammer-on, pull-off, slide, bend, vibrato)
- Playback engine с General MIDI
- Multiple voices per measure
- Chord diagrams
- Lyrics synchronization

**Структура Track**:
```
Track:
├── Flags (channel, mute, solo, etc.)
├── Channel info
├── Track name
├── Instrument type
├── Tuning (per string)
├── Measures:
│   ├── Clef
│   ├── Tempo marks
│   ├── Voices:
│   │   └── Beats:
│   │       ├── Duration
│   │       ├── Rest flag
│   │       ├── Effects
│   │       └── Notes:
│   │           ├── Fret
│   │           ├── String
│   │           ├── Dynamic
│   │           └── Effects
```

#### PDF с Нотами и Табуляцией

**Описание**: Портативный формат для визуализации полной партитуры с нотами и табуляцией.

**Компоненты PDF**:
- **Staff system**: 5 линий, ключи (скрипичный, басовый)
- **Notation elements**: ноты, паузы, динамика, артикуляция
- **Tablature system**: 6 линий с номерами ладов
- **Timing elements**: размер такта, темп, repeat signs
- **Metadata**: title, artist, composer, key signature

**Процесс генерации**:
```
Note Array → Layout Engine → Verovio/LilyPond → SVG → PDF
```

**Параметры PDF**:
- Page size: A4 or Letter
- Margins: 1 inch
- Font: Standard Music Font (SMuFL compatible)
- Resolution: 300+ DPI
- Compression: Flate encoding

---

## Установка и Настройка

### Требования

```
Python 3.10+
Node.js 18+
PostgreSQL 13+
Redis 6+
CUDA 11.8+ (опционально, для ускорения GPU)
```

### Установка Backend

```bash
# Клонирование репозитория
git clone https://github.com/klang-io/music-transcription-api.git
cd music-transcription-api

# Создание виртуального окружения
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Установка зависимостей
pip install -r requirements.txt

# Загрузка предобученных моделей
python scripts/download_models.py

# Инициализация базы данных
python manage.py migrate
```

### Установка Frontend

```bash
cd frontend
npm install
npm run build
```

### Переменные Окружения

```bash
# .env файл
DATABASE_URL=postgresql://user:password@localhost:5432/music_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# ML Models
MODEL_CACHE_DIR=/path/to/models
USE_GPU=true

# S3 Storage
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=transcriptions

# API Settings
API_RATE_LIMIT=100/hour
MAX_UPLOAD_SIZE=500MB
```

### Docker Deployment

```yaml
# docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: music_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/music_db
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## REST API Endpoints

### Аутентификация

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh-token
GET  /api/v1/auth/profile
```

### Транскрипция

#### Создание заказа транскрипции

```http
POST /api/v1/transcribe
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- audio: File (WAV, MP3, FLAC, OGG, M4A)
- instrument: String (piano, guitar, flute, violin, trumpet, bass)
- confidence_threshold: Float (0.0-1.0, default 0.7)
- include_chords: Boolean (default true)
- include_rhythm: Boolean (default true)
- tempo_detection: Boolean (default true)

Response (201 Created):
{
  "id": "trx_abc123def456",
  "status": "processing",
  "created_at": "2025-12-10T09:15:00Z",
  "estimated_completion": "2025-12-10T09:25:00Z",
  "audio_duration": 180,
  "instrument": "piano"
}
```

#### Получение статуса транскрипции

```http
GET /api/v1/transcribe/{transcription_id}
Authorization: Bearer <token>

Response (200 OK):
{
  "id": "trx_abc123def456",
  "status": "completed",
  "progress": 100,
  "notes_detected": 1247,
  "accuracy_score": 0.94,
  "key_signature": "C major",
  "time_signature": "4/4",
  "bpm": 120,
  "output_formats": {
    "midi": "/api/v1/transcribe/{id}/download/midi",
    "musicxml": "/api/v1/transcribe/{id}/download/musicxml",
    "gp5": "/api/v1/transcribe/{id}/download/gp5",
    "pdf": "/api/v1/transcribe/{id}/download/pdf"
  },
  "result_data": {
    "note_array": [...],
    "chords": [...],
    "rhythm_pattern": {...}
  }
}
```

### Конвертация Форматов

#### Конвертация между форматами

```http
POST /api/v1/convert
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "input_format": "midi",
  "output_format": "musicxml",
  "input_data": "<base64-encoded file or URL>",
  "options": {
    "include_lyrics": true,
    "include_chords": true,
    "transpose": 0,
    "time_signature": "4/4"
  }
}

Response (201 Created):
{
  "conversion_id": "conv_xyz789",
  "status": "processing",
  "input_format": "midi",
  "output_format": "musicxml",
  "created_at": "2025-12-10T09:20:00Z"
}
```

#### Получение конвертированного файла

```http
GET /api/v1/convert/{conversion_id}/download
Authorization: Bearer <token>

Response (200 OK):
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="song.musicxml"
<binary file content>
```

### Экспорт в PDF

#### Генерирование PDF с нотами и табуляцией

```http
POST /api/v1/export/pdf
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "transcription_id": "trx_abc123def456",
  "options": {
    "include_tabs": true,
    "include_chords": true,
    "page_size": "A4",
    "orientation": "portrait",
    "font_size": 12,
    "include_lyrics": false,
    "staff_lines": 5,
    "tab_tuning": "standard"
  }
}

Response (201 Created):
{
  "export_id": "exp_pdf001",
  "status": "generating",
  "file_url": "/api/v1/export/pdf/{export_id}/download"
}
```

### Управление Проектами

```http
GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/{project_id}
PUT    /api/v1/projects/{project_id}
DELETE /api/v1/projects/{project_id}
GET    /api/v1/projects/{project_id}/transcriptions
```

### Batch Обработка

```http
POST /api/v1/batch/transcribe
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "files": [
    {
      "url": "https://example.com/song1.mp3",
      "instrument": "piano"
    },
    {
      "url": "https://example.com/song2.mp3",
      "instrument": "guitar"
    }
  ],
  "output_formats": ["midi", "musicxml", "pdf"]
}

Response (202 Accepted):
{
  "batch_id": "batch_001",
  "total_files": 2,
  "status": "queued",
  "progress_url": "/api/v1/batch/{batch_id}/progress"
}
```

---

## Спецификация Форматов

### MIDI File Specification 1.1

#### Header Chunk (MThd)

```
Byte 0-3:    "MThd"
Byte 4-7:    Length (always 6 in 32-bit big-endian)
Byte 8-9:    Format type
             0 = single track
             1 = multiple tracks, synchronous
             2 = multiple tracks, asynchronous
Byte 10-11:  Number of tracks (16-bit big-endian)
Byte 12-13:  Division (16-bit big-endian)
             Bit 15 = 0: ticks per quarter note
             Bit 15 = 1: SMPTE format
```

#### Track Chunk (MTrk)

```
Byte 0-3:    "MTrk"
Byte 4-7:    Track data length (32-bit big-endian)
Byte 8+:     Track data
             - Variable length quantities for delta time
             - Status bytes and data bytes
             - Meta events (FF format)
             - MIDI events (8x-Ex format)
```

#### Variable Length Quantity

```
Encoding:
- Values 0-127: Single byte (0xxxxxxx)
- Values 128+: Multiple bytes with continuation bit
  Example: 0x81 0x80 represents 128
```

#### Meta Events

```
Format: FF type_byte length_bytes data

Common Meta Events:
FF 00 02 ssss   Sequence Number
FF 01 len text  Text Event
FF 02 len text  Copyright Notice
FF 03 len text  Sequence/Track Name
FF 04 len text  Instrument Name
FF 05 len text  Lyric
FF 58 04 nn dd cc bb  Time Signature
FF 51 03 tttttt Tempo (microseconds/quarter note)
FF 7F len data  Sequencer-Specific Meta-Event
FF 2F 00        End of Track
```

#### MIDI Channel Messages

```
Status: 0x80-0xFE
Data: 0x00-0x7F (two data bytes typically)

Note Off:           0x8n note velocity
Note On:            0x9n note velocity
Aftertouch:         0xAn note pressure
Control Change:     0xBn controller value
Program Change:     0xCn program
Channel Pressure:   0xDn pressure
Pitch Bend:         0xEn lsb msb
```

### MusicXML 4.0 Structure

#### Root Elements

```xml
<score-partwise> <!-- or <score-timewise> -->
  <work>              <!-- Optional work metadata -->
  <movement-number>   <!-- Optional -->
  <movement-title>    <!-- Optional -->
  <identification>    <!-- Software, encoding details -->
  <defaults>          <!-- Page setup, scaling -->
  <credit>            <!-- Page credits -->
  <part-list>         <!-- Score parts definition -->
  <part>              <!-- Part data -->
</score-partwise>
```

#### Key Elements

```xml
<part-list>
  <part-group>        <!-- Group of instruments -->
  <score-part>        <!-- Individual part definition -->
    <part-name>
    <score-instrument>
    <midi-instrument>
</part-list>

<part id="P1">
  <measure number="1">
    <attributes>
      <divisions>     <!-- Ticks per quarter note -->
      <key>          <!-- Key signature -->
      <time>         <!-- Time signature -->
      <clef>         <!-- Clef symbol -->
      <staff-details><!-- Instrument staff details -->
    <note>
      <pitch>        <!-- Pitch definition -->
      <duration>     <!-- Duration in divisions -->
      <voice>        <!-- Voice number -->
      <type>         <!-- Note type (whole, half, quarter, etc.) -->
      <stem>         <!-- Stem direction -->
      <notations>    <!-- Articulations, dynamics, etc. -->
      <lyrics>       <!-- Lyrics -->
    <backup>         <!-- Move backward in time -->
    <forward>        <!-- Move forward in time -->
```

### Guitar Pro 5 File Format

#### Binary Structure Details

```
Header:
Offset  Size   Type      Description
0       31     String    "FICHIER GUITAR PRO v5." + version
32      1      Byte      Title length
...     var    String    Title
...     var    String    Artist
...     var    String    Album
...     var    String    Author
...     var    String    Copyright
...     var    String    Writer
...     var    String    Transcriber
...     var    String    Comments

Metadata:
...     1      Byte      Triplet feel flag
...     4      Int       Tempo (BPM)

Tracks Section:
...     1      Byte      Number of tracks
For each track:
  ...   1      Byte      Flags
  ...   1      Byte      Channel
  ...   1      Byte      Effects channel
  ...   var    String    Track name
  ...   var    Tuning data

Measures:
...     1      Byte      Number of measures
For each measure:
  ...   1      Byte      Time signature flags
  ...   1      Byte      Tempo changes flag
  ...   4      Int       Tempo
```

#### Effects in GP5

```
Bending:
  Type: 0 = bend, 1 = pre-bend, 2 = bend and release
  Value: Bend amount in quarter tones
  Duration: Points for smooth bend curve

Harmonic:
  Type: 1 = natural, 2 = artificial, 3 = tapped,
        4 = pinch, 5 = semi-harmonic

Slide:
  Type: 1 = legato, 2 = slide, 4 = dive, 8 = undive

Vibrato:
  Amplitude and frequency parameters
```

---

## Примеры Использования

### Python примеры

#### Пример 1: Базовая транскрипция

```python
import requests
from pathlib import Path

class TranscriptionClient:
    def __init__(self, api_key: str, base_url: str = "https://api.klang.io/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}"
        })
    
    def transcribe(self, audio_path: str, instrument: str = "piano") -> dict:
        """Транскрибирует аудиофайл в ноты"""
        with open(audio_path, 'rb') as f:
            files = {'audio': f}
            data = {
                'instrument': instrument,
                'confidence_threshold': 0.7,
                'include_chords': True
            }
            response = self.session.post(
                f"{self.base_url}/transcribe",
                files=files,
                data=data
            )
        
        if response.status_code == 201:
            return response.json()
        else:
            raise Exception(f"Error: {response.status_code} - {response.text}")
    
    def get_result(self, transcription_id: str) -> dict:
        """Получает результаты транскрипции"""
        response = self.session.get(
            f"{self.base_url}/transcribe/{transcription_id}"
        )
        return response.json()
    
    def download(self, transcription_id: str, format: str = "midi") -> bytes:
        """Скачивает результат в выбранном формате"""
        response = self.session.get(
            f"{self.base_url}/transcribe/{transcription_id}/download/{format}"
        )
        return response.content

# Использование
client = TranscriptionClient(api_key="your-api-key")

# Транскрибирование
result = client.transcribe("song.mp3", instrument="piano")
transcription_id = result['id']

# Проверка статуса
import time
while True:
    status = client.get_result(transcription_id)
    if status['status'] == 'completed':
        break
    time.sleep(2)

# Скачивание результата
midi_data = client.download(transcription_id, format="midi")
with open("output.mid", "wb") as f:
    f.write(midi_data)
```

#### Пример 2: Конвертация между форматами

```python
from music21 import converter, instrument
from pathlib import Path

class MusicConverter:
    @staticmethod
    def midi_to_musicxml(midi_path: str, output_path: str):
        """Конвертирует MIDI в MusicXML"""
        score = converter.parse(midi_path)
        score.write('musicxml', fp=output_path)
    
    @staticmethod
    def midi_to_gp5(midi_path: str, output_path: str):
        """Конвертирует MIDI в GP5"""
        # Использование Guitar Pro конвертера
        import guitarpro as gp
        
        # Сначала конвертируем в промежуточный формат
        score = converter.parse(midi_path)
        
        # Экспортируем в GP5
        gp_track = gp.Track()
        gp_track.name = score.metadata.title or "Converted"
        
        # Добавляем меры и ноты
        for measure_idx, measure in enumerate(score.parts[0].flatten().getElementsByClass('Measure')):
            gp_measure = gp.Measure(gp.MeasureHeader())
            
            for note in measure.notesAndRests:
                if note.isNote:
                    gp_note = gp.Note()
                    gp_note.value = note.pitch.midi % 12
                    gp_note.string = 1
                    gp_note.fret = note.pitch.midi - 60
            
            gp_track.measures.append(gp_measure)
        
        gp_song = gp.Song()
        gp_song.tracks.append(gp_track)
        gp.write(gp_song, output_path, version=(5, 0, 0))

# Использование
converter = MusicConverter()
converter.midi_to_musicxml("input.mid", "output.musicxml")
converter.midi_to_gp5("input.mid", "output.gp5")
```

#### Пример 3: Генерирование PDF с нотами и табуляцией

```python
from pathlib import Path
import subprocess
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

class PDFGenerator:
    def __init__(self, musicxml_path: str):
        self.musicxml_path = musicxml_path
        self.page_width, self.page_height = A4
    
    def generate_notation_pdf(self, output_path: str):
        """Генерирует PDF с нотной грамотой"""
        # Используем Verovio для рендеринга MusicXML в SVG
        import verovio
        
        vrvToolkit = verovio.toolkit()
        vrvToolkit.setOptions({
            "pageHeight": 2970,
            "pageWidth": 2100,
            "margins": 50,
            "staffSize": 140
        })
        
        # Загружаем MusicXML
        with open(self.musicxml_path, 'r') as f:
            musicxml_content = f.read()
        
        vrvToolkit.loadData(musicxml_content)
        
        # Экспортируем SVG
        svg = vrvToolkit.renderToSVG()
        
        # Конвертируем SVG в PDF
        self._svg_to_pdf(svg, output_path)
    
    def generate_with_tabs(self, output_path: str, guitar_tabs: list):
        """Генерирует PDF с нотами и табуляцией"""
        from reportlab.pdfgen import canvas
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet
        
        doc = SimpleDocTemplate(output_path, pagesize=A4)
        story = []
        
        # Добавляем ноты
        story.append(Paragraph("Sheet Music with Tabs", getSampleStyleSheet()['Heading1']))
        story.append(Spacer(1, 0.5*72))
        
        # Здесь добавляем SVG с нотами
        # и текстовое представление табулатуры
        
        for i, tab_line in enumerate(guitar_tabs):
            story.append(Paragraph(tab_line, getSampleStyleSheet()['Normal']))
        
        doc.build(story)
    
    @staticmethod
    def _svg_to_pdf(svg_content: str, output_path: str):
        """Конвертирует SVG в PDF"""
        from io import BytesIO
        from cairosvg import svg2pdf
        
        svg_bytes = BytesIO(svg_content.encode('utf-8'))
        svg2pdf(bytestring=svg_content, write_to=output_path)

# Использование
generator = PDFGenerator("song.musicxml")
generator.generate_notation_pdf("output.pdf")
```

### JavaScript примеры

#### Пример 1: Web API использование

```typescript
interface TranscriptionOptions {
  instrument: string;
  confidenceThreshold?: number;
  includeChords?: boolean;
  includeRhythm?: boolean;
}

class MusicTranscriptionAPI {
  private apiKey: string;
  private baseUrl: string = "https://api.klang.io/v1";
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async transcribe(
    file: File,
    options: TranscriptionOptions
  ): Promise<{ id: string; status: string }> {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('instrument', options.instrument);
    formData.append('confidence_threshold', 
      (options.confidenceThreshold ?? 0.7).toString());
    formData.append('include_chords', 
      (options.includeChords ?? true).toString());
    
    const response = await fetch(`${this.baseUrl}/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response.json();
  }
  
  async pollStatus(transcriptionId: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/transcribe/${transcriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    );
    
    return response.json();
  }
  
  async downloadFile(
    transcriptionId: string,
    format: 'midi' | 'musicxml' | 'gp5' | 'pdf'
  ): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/transcribe/${transcriptionId}/download/${format}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    );
    
    return response.blob();
  }
}

// React Hook для транскрипции
function useTranscription() {
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [result, setResult] = React.useState(null);
  
  const transcribe = React.useCallback(
    async (file: File, instrument: string) => {
      setLoading(true);
      const api = new MusicTranscriptionAPI('your-api-key');
      
      try {
        // Инициируем транскрипцию
        const { id } = await api.transcribe(file, { instrument });
        
        // Следим за статусом
        const pollInterval = setInterval(async () => {
          const status = await api.pollStatus(id);
          setProgress(status.progress);
          
          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setResult(status);
            setLoading(false);
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setLoading(false);
            throw new Error('Transcription failed');
          }
        }, 2000);
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    []
  );
  
  return { transcribe, loading, progress, result };
}
```

---

## Обработка Ошибок

### Коды Ошибок

```
400 Bad Request
  - Неверный формат аудио
  - Отсутствуют обязательные параметры
  - Некорректный инструмент

401 Unauthorized
  - Отсутствует токен аутентификации
  - Неверный токен
  - Токен истек

403 Forbidden
  - Недостаточно прав доступа
  - Превышен лимит запросов

404 Not Found
  - Транскрипция не найдена
  - Файл не найден

409 Conflict
  - Файл уже обрабатывается
  - Конфликт версий

413 Payload Too Large
  - Размер файла превышает лимит

429 Too Many Requests
  - Превышен rate limit

500 Internal Server Error
  - Ошибка обработки на сервере
```

### Обработка в клиентском коде

```python
class APIClient:
    def handle_response(self, response):
        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            error_data = response.json()
            
            if response.status_code == 400:
                raise ValueError(f"Bad Request: {error_data['message']}")
            elif response.status_code == 401:
                raise AuthenticationError("Invalid credentials")
            elif response.status_code == 429:
                raise RateLimitError(
                    f"Rate limited. Retry after {response.headers.get('Retry-After')}"
                )
            elif response.status_code == 500:
                raise ServerError("Internal server error")
            
            raise e
```

---

## Оптимизация и Производительность

### Оптимизация Моделей

```python
# Quantization для ускорения
import torch
from torch.quantization import quantize_dynamic

# Quantize CRNN model
model = load_crnn_model()
quantized_model = quantize_dynamic(
    model,
    {torch.nn.Linear},
    dtype=torch.qint8
)

# Оптимизация для продакшена
optimized_model = torch.jit.script(quantized_model)
```

### Кэширование

```python
# Redis кэширование для часто используемых форматов
import redis
import hashlib

cache = redis.Redis(host='localhost', port=6379, db=0)

def get_conversion_cached(input_data, from_format, to_format):
    key = hashlib.sha256(
        f"{input_data}{from_format}{to_format}".encode()
    ).hexdigest()
    
    cached = cache.get(key)
    if cached:
        return cached
    
    result = convert_format(input_data, from_format, to_format)
    cache.setex(key, 3600, result)  # Кэш на 1 час
    
    return result
```

### Параллельная обработка

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import asyncio

class BatchProcessor:
    def __init__(self, max_workers: int = 4):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
    
    async def process_batch(self, items: list) -> list:
        loop = asyncio.get_event_loop()
        tasks = [
            loop.run_in_executor(
                self.executor,
                self.process_item,
                item
            )
            for item in items
        ]
        return await asyncio.gather(*tasks)
    
    def process_item(self, item):
        # Обработка отдельного элемента
        return transcribe_audio(item)
```

---

## Best Practices

### 1. Аутентификация и Безопасность

```python
# ✅ Используйте переменные окружения для ключей
import os
api_key = os.getenv('API_KEY')

# ❌ НЕ коммитьте ключи в код
# api_key = "sk-1234567890"

# ✅ Используйте HTTPS для всех запросов
api_url = "https://api.klang.io/v1"

# ✅ Реализуйте retry логику с экспоненциальной задержкой
import backoff

@backoff.on_exception(
    backoff.expo,
    requests.exceptions.RequestException,
    max_tries=3
)
def make_api_request(url):
    return requests.get(url)
```

### 2. Обработка Большых Файлов

```python
# ✅ Используйте streaming для загрузки больших файлов
def upload_large_file(file_path: str):
    with open(file_path, 'rb') as f:
        response = requests.post(
            'https://api.klang.io/v1/transcribe',
            files={'audio': f},
            headers={'Authorization': f'Bearer {api_key}'}
        )
    return response.json()

# ✅ Разбивайте на чанки для более стабильной загрузки
def chunked_upload(file_path: str, chunk_size: int = 1024*1024):
    total_size = os.path.getsize(file_path)
    with open(file_path, 'rb') as f:
        uploaded = 0
        while uploaded < total_size:
            chunk = f.read(chunk_size)
            # Загружаем чанк
            uploaded += len(chunk)
            yield uploaded / total_size
```

### 3. Валидация Входных Данных

```python
# ✅ Всегда валидируйте входные данные
def transcribe_safe(audio_file: str, instrument: str):
    # Проверка формата
    valid_formats = ['.mp3', '.wav', '.flac', '.ogg', '.m4a']
    if not any(audio_file.endswith(fmt) for fmt in valid_formats):
        raise ValueError(f"Unsupported format: {audio_file}")
    
    # Проверка инструмента
    valid_instruments = ['piano', 'guitar', 'flute', 'violin', 'trumpet', 'bass']
    if instrument not in valid_instruments:
        raise ValueError(f"Unknown instrument: {instrument}")
    
    # Проверка размера файла
    max_size = 500 * 1024 * 1024  # 500MB
    if os.path.getsize(audio_file) > max_size:
        raise ValueError(f"File too large: {audio_file}")
    
    # Продолжаем обработку
    return transcribe(audio_file, instrument)
```

### 4. Логирование и Мониторинг

```python
import logging

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def transcribe_with_logging(audio_file: str, instrument: str):
    try:
        logger.info(f"Starting transcription: {audio_file} ({instrument})")
        
        result = transcribe(audio_file, instrument)
        
        logger.info(f"Transcription completed: {result['id']}")
        logger.info(f"Notes detected: {result['notes_detected']}")
        logger.info(f"Accuracy: {result['accuracy_score']:.2%}")
        
        return result
    except Exception as e:
        logger.error(f"Transcription failed: {e}", exc_info=True)
        raise
```

### 5. Версионирование API

```
GET /api/v1/transcribe         # Текущая версия
GET /api/v2/transcribe         # Новая версия (обратно совместима)
GET /api/v1.5/transcribe       # Промежуточная версия
```

---

## Заключение

Эта документация обеспечивает полный обзор системы транскрипции музыки и конвертации форматов. Для получения дополнительной поддержки посетите наш GitHub репозиторий или свяжитесь с командой разработки.

### Полезные Ссылки

- **GitHub**: https://github.com/klang-io/music-transcription-api
- **Support**: support@klang.io
- **Status Page**: https://status.klang.io
- **Community Forum**: https://forum.klang.io
- **API Console**: https://console.klang.io

### Версия Документации

- **Версия**: 2.0.0
- **Дата обновления**: 10 декабря 2025
- **Совместимость**: API v1.0+, v2.0+