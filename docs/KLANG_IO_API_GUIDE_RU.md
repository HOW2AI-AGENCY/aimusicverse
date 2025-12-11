Подробное руководство по интеграции Klang.io API
Транскрипция музыки, MIDI, распознавание аккордов и нотная запись
Оглавление
Введение в Klang.io
Обзор функционала
Архитектура и технология
Инструменты и приложения
REST API и интеграция
Форматы файлов
Практическая интеграция
Примеры кода
Best Practices
Введение {#введение}
Klang.io — это компания, специализирующаяся на автоматической транскрипции музыки с использованием искусственного интеллекта. Платформа конвертирует аудиозаписи в редактируемую музыкальную нотацию в различных форматах, включая:

Sheet Music (нотная запись)
MIDI (quantized и unquantized)
MusicXML
Guitar Pro (GP5)
PDF
TAB (для гитары)
Платформа обслуживает более 15,000 транскрипций ежедневно и поддерживает множество инструментов: вокал, пианино, барабаны, гитара, бас, синтезатор, струнные и духовые инструменты.

Обзор функционала {#обзор-функционала}
Основные возможности
1. Транскрипция музыки в ноты
Автоматическое преобразование аудио в нотную запись
Поддержка полифонической нотации (несколько одновременно звучащих нот)
Выявление мелодии, аккордов и гармоний
Сохранение tempo и time signature информации
2. Конвертация в MIDI
Создание unquantized MIDI (сохранение оригинального timing'а)
Создание quantized MIDI (для лучшей работы в DAW)
Multi-track MIDI с отдельными треками для каждого инструмента
Поддержка velocity detection (в разработке)
3. Распознавание аккордов
Определение гармонического содержания трека
Lead sheet notation (мелодия + символы аккордов)
Определение тональности и масштаба
Анализ структуры гармонии
4. Анализ ритма и метра
Beat tracking и downbeat detection
BPM определение
Time signature распознавание
Preservation of timing информации
5. Мультиинструментальная обработка
Одновременное распознавание до 8 инструментов
Разделение аудио на отдельные стемы
Инструмент-специфичные AI модели
Архитектура и технология {#архитектура}
Как работает система Klang.io
Klang.io использует proprietary AI систему, разработанную еще до эпохи ChatGPT. Вот как это функционирует:

Шаг 1: Спектрограмма
Аудио → Спектрограмма (2D изображение)
         ├─ Ось X: время
         ├─ Ось Y: частота
         └─ Яркость: громкость

Шаг 2: Извлечение признаков
Применение методов распознавания образов из computer vision
Использование speech recognition моделей
Извлечение: шаги, ритм, гармонии
Шаг 3: Языковая модель музыки
Применение musical grammar модели
Инструмент-специфичные модели для каждого инструмента
Генерация читаемой и воспроизводимой нотной записи
Инструмент-специфичные AI модели
Модель	Специализация	Выпуск
Guitar2Tabs	Гитара, бас, распознавание стиля	Базовая
Piano Transcription	Пианино, синтезатор	Базовая
Drums AI	Ударные инструменты	Базовая
Rock Model	Lead guitar, rhythm guitar, bass, drums	Октябрь 2025
Classical Model	Скрипка, виолончель, духовые инструменты	Октябрь 2025
Обработка обучающих данных
Klang.io столкнулась с проблемой авторского права при сборе данных. Решение:

Разработана система генерации синтетических музыкальных образцов
Миллионы синтетических примеров используются для обучения моделей
Это позволило избежать нарушения авторских прав при сборе датасета
Инструменты и приложения {#инструменты}
1. Klangio Transcription Studio
Тип: Web-приложение (браузер)

Возможности:

Загрузка аудио/видео файлов (YouTube ссылки поддерживаются)
Multi-instrument transcription
Встроенный Edit Mode
Превью MIDI в pianoroll
Экспорт в 6+ форматов
Интеграция: Доступно через веб-интерфейс, может быть встроено в веб-приложение через iframe или API

2. Klangio Transcription Plugin
Тип: VST3 плагин + Standalone приложение

Платформы:

Windows VST3
macOS AU
Standalone (независимое приложение)
Возможности:

Прямая интеграция в DAW (Ableton, Logic, Cubase и т.д.)
Drag & drop аудио в плагин
Drag & drop MIDI обратно в DAW
Бесплатный preview режим
Требует активного интернета
Рабочий процесс:

DAW Audio Track → VST3 Plugin → Transcribe → MIDI Output → DAW Track

3. Melody Scanner
Тип: Web-приложение

Специализация: Мелодия и аккорды

Режимы:

Lead Sheet (мелодия + символы аккордов)
Arrangement (полная композиция)
Universal (авто-детектирование)
Особенность: Фокус на преобразование в ноты, а не на точную транскрипцию

4. Guitar2Tabs
Тип: Web-приложение

Специализация: Гитара

Функции:

Распознавание TAB нотации
Определение стиля (strumming vs picking)
Экспорт в PDF, MIDI, MusicXML, Guitar Pro
5. Piano Transcription Studio
Тип: Web-приложение

Специализация: Пианино

Особенности:

Полный аккордовый анализ
Arrangement для одного пианино
Edit Mode для коррекции
REST API и интеграция {#rest-api}
API Endpoints
Основные endpoints для интеграции:

1. Загрузка файла для транскрипции
POST /api/v1/transcribe

Headers:

Content-Type: multipart/form-data
X-API-KEY: your_api_key
X-API-SECRET: your_api_secret

Query Parameters:

Параметр	Тип	Обязательный	Описание
callback_url	string	Да	URL для получения результата после обработки
callback_nonce	string	Нет	Уникальный идентификатор для верификации
language	string	Нет	Язык (по умолчанию: "swe", доступен "eng")
output_format	string	Нет	Формат вывода ("transcript", "subtitle")
spell_check	number	Нет	Включить проверку орфографии (0 или 1)
min_prob	number	Нет	Минимальная вероятность сегмента (0-1)
name	string	Нет	Пользовательское имя транскрипции
Request Body:

file: binary (audio/video file)

Supported formats:

Видео: MP4, MPEG, WebM, AVI, MKV, MOV
Аудио: MP3, WAV, OGG, Opus, FLAC, M4A, WMA
Ответ:

{
  "id": "transcription_id_123",
  "status": "processing"
}

2. Webhook Callback для результатов
Payload структура:

{
  "id": "transcription_id_123",
  "status": "completed",
  "nonce": "callback_nonce_value",
  "metrics": {
    "duration": 180.5,
    "confidence": 0.92
  },
  "duration": 180.5,
  "data": {
    "midi": {
      "base64": "...",
      "format": "mid",
      "instruments": ["piano", "guitar"]
    },
    "musicxml": {
      "base64": "...",
      "format": "xml"
    },
    "notes": [
      {
        "pitch": 60,
        "start": 0.0,
        "duration": 0.5,
        "velocity": 100,
        "instrument": "piano"
      }
    ],
    "chords": [
      {
        "chord": "C",
        "start": 0.0,
        "duration": 4.0
      }
    ],
    "tempo": {
      "bpm": 120,
      "time_signature": "4/4"
    }
  }
}

3. REST Hooks (Webhooks)
Регистрация webhook'а:

POST /api/v1/resthook

Payload:

{
  "hookUrl": "https://your-domain.com/webhooks/klang",
  "type": "transcriptionFinished"
}

Удаление webhook'а:

DELETE /api/v1/resthook

Аутентификация
Klang.io использует API ключ и секрет:

X-KLANG-API-KEY: your_api_key
X-KLANG-API-SECRET: your_api_secret

Оба заголовка должны быть включены в каждый запрос к API.

Форматы файлов {#форматы-файлов}
MIDI (Musical Instrument Digital Interface)
Определение: MIDI — это стандарт для представления музыкальной информации в цифровом виде.

Klang.io MIDI структура:

Квантизованный MIDI (Quantized)
├─ Ноты выравнены на сетку (например, 16th notes)
├─ Фиксированная длительность нот
├─ Хороший для DAW редактирования
└─ Velocity: детектируется (экспериментально)

Неквантизованный MIDI (Unquantized)
├─ Сохраняет оригинальный timing
├─ Точнее отражает оригинальное исполнение
├─ Может требовать квантизации в DAW
└─ Лучше для анализа

MIDI Velocity значения:

Диапазон: 0-127
0 = Note Off
1-126 = Различные уровни громкости
127 = Максимальная громкость
MusicXML
Определение: Открытый стандарт для обмена музыкальной нотацией.

Особенности:

Редактируемая нотация (как MIDI)
Форматирование как Sheet Music
Совместимость с MuseScore, Sibelius, Finale
Не адаптируется к изменениям tempo (использует номинальный tempo)
Sheet Music (PDF)
Формат: Визуальное представление нотной записи

Экспорт включает:

Нотная запись
Ритм
Темп
Аккорды (опционально)
Название песни и инструмента
Guitar Pro (GP5)
Специализация: Гитарная нотация

Содержимое:

TAB notation
Standard notation
Drum patterns
Tempo и time signature
TAB (Tablature)
Для гитары:

e|---0---2---3---|
B|---1---3---4---|
G|---0---2---3---|
D|---2---4---5---|
A|---3---5---6---|
E|---0---2---3---|

Для баса:

G|---0---2---3---|
D|---1---3---4---|
A|---0---2---3---|
E|---2---4---5---|

PDF с лирикой
Экспорт лирики:

Текст можно добавлять в Edit Mode
PDF экспорт включает лирику
MusicXML экспорт лирики не поддерживает (на текущий момент)
Практическая интеграция {#практическая-интеграция}
Сценарий 1: Backend интеграция с Node.js/Express
1.1 Загрузка файла и получение результата через webhook
Архитектура:

Frontend (браузер)
    ↓ (загружает файл)
Backend (Express)
    ↓ (отправляет на Klang.io API)
Klang.io API
    ↓ (обрабатывает)
Webhook Callback
    ↓ (отправляет результат на backend)
Database (сохраняет MIDI/notes)
    ↓ (отправляет результат на frontend)
Frontend (отображает результат)

1.2 Настройка Webhook сервера
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const app = express();
app.use(express.json());

const API_HOST = 'https://api.klang.io';
const { API_KEY, API_SECRET } = process.env;
const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL || 'https://your-domain.com';

// Регистрация webhook'а при старте
async function registerWebhook() {
  try {
    await axios.post(`${API_HOST}/api/v1/resthook`, {
      hookUrl: `${WEBHOOK_BASE_URL}/webhooks/transcription`,
      type: 'transcriptionFinished'
    }, {
      headers: {
        'X-KLANG-API-KEY': API_KEY,
        'X-KLANG-API-SECRET': API_SECRET
      }
    });
    console.log('Webhook registered successfully');
  } catch (error) {
    console.error('Error registering webhook:', error);
  }
}

// Endpoint для загрузки аудио файла
app.post('/api/transcribe', async (req, res) => {
  const { filePath } = req.body;

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      contentType: 'audio/mp3'
    });

    const nonce = crypto.randomBytes(16).toString('hex');
    const callbackUrl = `${WEBHOOK_BASE_URL}/webhooks/transcription`;

    const response = await axios.post(
      `${API_HOST}/api/v1/transcribe`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'X-KLANG-API-KEY': API_KEY,
          'X-KLANG-API-SECRET': API_SECRET
        },
        params: {
          callback_url: callbackUrl,
          callback_nonce: nonce,
          language: 'eng'
        }
      }
    );

    // Сохраняем ID транскрипции в DB для отслеживания
    const { id } = response.data;
    console.log('Transcription started with ID:', id);

    res.json({
      transcriptionId: id,
      status: 'processing',
      message: 'Your transcription is being processed'
    });
  } catch (error) {
    console.error('Error starting transcription:', error.message);
    res.status(500).json({ error: 'Failed to start transcription' });
  }
});

// Webhook endpoint для получения результатов
app.post('/webhooks/transcription', (req, res) => {
  const { id, status, nonce, data } = req.body;

  console.log(`Webhook received - ID: ${id}, Status: ${status}`);

  if (status === 'completed') {
    try {
      // Обработка результатов
      const { midi, musicxml, notes, chords, tempo } = data;

      // Сохранение MIDI в файл
      if (midi && midi.base64) {
        const midiBuffer = Buffer.from(midi.base64, 'base64');
        fs.writeFileSync(`./output/${id}.mid`, midiBuffer);
        console.log(`MIDI saved: ${id}.mid`);
      }

      // Сохранение MusicXML
      if (musicxml && musicxml.base64) {
        const xmlBuffer = Buffer.from(musicxml.base64, 'base64');
        fs.writeFileSync(`./output/${id}.xml`, xmlBuffer);
        console.log(`MusicXML saved: ${id}.xml`);
      }

      // Сохранение информации о нотах в DB
      console.log(`Transcription complete. Notes count: ${notes ? notes.length : 0}`);
      console.log(`Chords count: ${chords ? chords.length : 0}`);
      console.log(`Tempo: ${tempo.bpm} BPM, Time Signature: ${tempo.time_signature}`);

      // TODO: сохранить в БД для дальнейшей работы

      // Отправить результат на frontend (через Socket.io, например)
      // io.emit('transcription:complete', { id, status, data });
    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  }

  // Всегда отвечаем 200 OK
  res.json({ status: 'ok' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
  registerWebhook();
});

Сценарий 2: Frontend интеграция с React/TypeScript
import React, { useState } from 'react';
import axios from 'axios';

interface TranscriptionResult {
  id: string;
  status: 'processing' | 'completed' | 'error';
  midiUrl?: string;
  musicXmlUrl?: string;
  notes?: Note[];
  chords?: Chord[];
  tempo?: TempoInfo;
}

interface Note {
  pitch: number;
  start: number;
  duration: number;
  velocity: number;
  instrument: string;
}

interface Chord {
  chord: string;
  start: number;
  duration: number;
}

interface TempoInfo {
  bpm: number;
  time_signature: string;
}

const MusicTranscriptionApp: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleTranscribe = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Загрузка файла
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { transcriptionId } = response.data;
      setTranscriptionId(transcriptionId);

      // Опрос статуса (polling)
      pollTranscriptionStatus(transcriptionId);
    } catch (err) {
      setError('Failed to start transcription');
      setIsLoading(false);
    }
  };

  const pollTranscriptionStatus = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/transcription/${id}/status`);
        const { status, data } = response.data;

        if (status === 'completed') {
          clearInterval(interval);
          setResult({ id, status: 'completed', ...data });
          setIsLoading(false);
        } else if (status === 'error') {
          clearInterval(interval);
          setError('Transcription failed');
          setIsLoading(false);
        }
      } catch (err) {
        clearInterval(interval);
        setError('Failed to check status');
        setIsLoading(false);
      }
    }, 2000); // Check every 2 seconds
  };

  const downloadMidi = () => {
    if (result?.midiUrl) {
      const a = document.createElement('a');
      a.href = result.midiUrl;
      a.download = `transcription-${result.id}.mid`;
      a.click();
    }
  };

  const downloadMusicXml = () => {
    if (result?.musicXmlUrl) {
      const a = document.createElement('a');
      a.href = result.musicXmlUrl;
      a.download = `transcription-${result.id}.xml`;
      a.click();
    }
  };

  return (
    <div className="transcription-container">
      <h1>Music Transcription Tool</h1>

      <div className="upload-section">
        <input
          type="file"
          accept="audio/*,video/*"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        <button
          onClick={handleTranscribe}
          disabled={!file || isLoading}
        >
          {isLoading ? 'Transcribing...' : 'Transcribe'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="results">
          <h2>Results</h2>

          <section className="metadata">
            <h3>Audio Information</h3>
            <p><strong>Tempo:</strong> {result.tempo?.bpm} BPM</p>
            <p><strong>Time Signature:</strong> {result.tempo?.time_signature}</p>
          </section>

          <section className="notes">
            <h3>Notes ({result.notes?.length || 0})</h3>
            <div className="notes-list">
              {result.notes?.slice(0, 20).map((note, i) => (
                <div key={i} className="note-item">
                  <span>Pitch: {note.pitch}</span>
                  <span>Time: {note.start.toFixed(2)}s</span>
                  <span>Duration: {note.duration.toFixed(2)}s</span>
                </div>
              ))}
            </div>
          </section>

          <section className="chords">
            <h3>Chords ({result.chords?.length || 0})</h3>
            <div className="chords-list">
              {result.chords?.map((chord, i) => (
                <div key={i} className="chord-item">
                  <span className="chord-name">{chord.chord}</span>
                  <span>Time: {chord.start.toFixed(2)}s</span>
                </div>
              ))}
            </div>
          </section>

          <section className="downloads">
            <h3>Download</h3>
            <button onClick={downloadMidi}>Download MIDI</button>
            <button onClick={downloadMusicXml}>Download MusicXML</button>
          </section>
        </div>
      )}
    </div>
  );
};

export default MusicTranscriptionApp;

Сценарий 3: Python интеграция
import requests
import json
import time
import os
from pathlib import Path
from typing import Dict, Optional, List
import asyncio
from flask import Flask, request, jsonify

class KlangIOTranscriber:
    def __init__(self, api_key: str, api_secret: str):
        self.api_key = api_key
        self.api_secret = api_secret
        self.api_host = 'https://api.klang.io'
        self.headers = {
            'X-KLANG-API-KEY': api_key,
            'X-KLANG-API-SECRET': api_secret
        }
        self.results_cache = {}

    def upload_and_transcribe(
        self,
        file_path: str,
        callback_url: str,
        language: str = 'eng'
    ) -> Dict:
        """
        Загружает аудио файл на Klang.io для транскрипции

        Args:
            file_path: Путь к аудио файлу
            callback_url: URL для получения результатов
            language: Язык ('eng' или 'swe')

        Returns:
            Словарь с ID транскрипции и статусом
        """
        with open(file_path, 'rb') as f:
            files = {'file': f}
            params = {
                'callback_url': callback_url,
                'language': language,
                'spell_check': 1
            }

            response = requests.post(
                f'{self.api_host}/api/v1/transcribe',
                files=files,
                headers=self.headers,
                params=params
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    'transcription_id': data.get('id'),
                    'status': 'processing',
                    'success': True
                }
            else:
                return {
                    'success': False,
                    'error': f'API Error: {response.status_code}'
                }

    def save_callback_result(
        self,
        transcription_id: str,
        result_data: Dict
    ) -> None:
        """Сохраняет результаты webhook callback в кэш"""
        self.results_cache[transcription_id] = result_data

    def get_result(self, transcription_id: str) -> Optional[Dict]:
        """Получает результаты транскрипции из кэша"""
        return self.results_cache.get(transcription_id)

    def extract_midi_data(self, result: Dict) -> Dict:
        """Извлекает MIDI данные из результата"""
        midi_data = result.get('data', {}).get('midi', {})
        return {
            'format': midi_data.get('format'),
            'instruments': midi_data.get('instruments', []),
            'base64': midi_data.get('base64')
        }

    def extract_notes(self, result: Dict) -> List[Dict]:
        """Извлекает информацию о нотах"""
        return result.get('data', {}).get('notes', [])

    def extract_chords(self, result: Dict) -> List[Dict]:
        """Извлекает информацию об аккордах"""
        return result.get('data', {}).get('chords', [])

    def extract_tempo(self, result: Dict) -> Dict:
        """Извлекает информацию о темпе"""
        return result.get('data', {}).get('tempo', {})

    def save_midi_file(
        self,
        result: Dict,
        output_path: str
    ) -> bool:
        """Сохраняет MIDI файл из результатов"""
        import base64

        try:
            midi_data = self.extract_midi_data(result)
            if not midi_data.get('base64'):
                return False

            midi_bytes = base64.b64decode(midi_data['base64'])

            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'wb') as f:
                f.write(midi_bytes)

            return True
        except Exception as e:
            print(f'Error saving MIDI: {e}')
            return False


# Flask приложение для обработки webhook'ов
app = Flask(__name__)
transcriber = KlangIOTranscriber(
    api_key=os.getenv('KLANG_API_KEY'),
    api_secret=os.getenv('KLANG_API_SECRET')
)

@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    """Endpoint для загрузки файла на транскрипцию"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        file.save('temp_audio.wav')

        result = transcriber.upload_and_transcribe(
            'temp_audio.wav',
            callback_url='https://your-domain.com/webhooks/transcription'
        )

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/webhooks/transcription', methods=['POST'])
def webhook_transcription():
    """Webhook endpoint для получения результатов"""
    try:
        data = request.get_json()
        transcription_id = data.get('id')
        status = data.get('status')

        # Сохраняем результаты в кэш
        transcriber.save_callback_result(transcription_id, data)

        if status == 'completed':
            # Сохраняем MIDI файл
            transcriber.save_midi_file(
                data,
                f'output/{transcription_id}.mid'
            )

            # Обработка результатов
            notes = transcriber.extract_notes(data)
            chords = transcriber.extract_chords(data)
            tempo = transcriber.extract_tempo(data)

            print(f'Transcription {transcription_id} completed')
            print(f'  Notes: {len(notes)}')
            print(f'  Chords: {len(chords)}')
            print(f'  Tempo: {tempo.get("bpm")} BPM')

        return jsonify({'status': 'ok'})
    except Exception as e:
        print(f'Error processing webhook: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/transcription/<transcription_id>/result', methods=['GET'])
def get_transcription_result(transcription_id):
    """Получить результаты транскрипции"""
    result = transcriber.get_result(transcription_id)
    if result:
        return jsonify(result)
    else:
        return jsonify({'error': 'Not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=3000)

Примеры кода {#примеры-кода}
Пример 1: cURL запрос для загрузки аудио
curl -X POST https://api.klang.io/api/v1/transcribe \
  -H "X-KLANG-API-KEY: your_api_key" \
  -H "X-KLANG-API-SECRET: your_api_secret" \
  -F "file=@/path/to/audio.mp3" \
  -G \
  --data-urlencode "callback_url=https://your-domain.com/webhooks" \
  --data-urlencode "language=eng"

Пример 2: Обработка MIDI результатов (JavaScript)
const { readFileSync, writeFileSync } = require('fs');

function processMidiData(webhookPayload) {
  const { id, data } = webhookPayload;
  const { midi, notes, chords, tempo } = data;

  // Декодирование base64 MIDI
  if (midi && midi.base64) {
    const midiBuffer = Buffer.from(midi.base64, 'base64');
    writeFileSync(`${id}.mid`, midiBuffer);
    console.log(`Saved MIDI: ${id}.mid`);
  }

  // Анализ нот
  const analysis = {
    totalNotes: notes.length,
    instruments: [...new Set(notes.map(n => n.instrument))],
    noteRange: {
      min: Math.min(...notes.map(n => n.pitch)),
      max: Math.max(...notes.map(n => n.pitch))
    },
    averageVelocity: notes.reduce((sum, n) => sum + n.velocity, 0) / notes.length,
    duration: Math.max(...notes.map(n => n.start + n.duration))
  };

  // Анализ аккордов
  const chordProgression = chords.map(c => c.chord).join(' → ');

  console.log('Analysis Results:');
  console.log(JSON.stringify(analysis, null, 2));
  console.log('Chord Progression:', chordProgression);
  console.log('Tempo:', tempo.bpm, 'BPM', tempo.time_signature);

  return { analysis, chordProgression, tempo };
}

Пример 3: MIDI файл структура
// Структура MIDI файла (после декодирования)
// Header chunk
// ├─ MThd (4 bytes)
// ├─ Length (4 bytes) = 6
// ├─ Format (2 bytes) = 0 (single track), 1 (multi-track)
// ├─ Number of tracks (2 bytes)
// └─ Division (2 bytes) = Ticks per quarter note

// Track chunk
// ├─ MTrk (4 bytes)
// ├─ Length (4 bytes)
// └─ Track events
//    ├─ Meta Events (0xFF)
//    │  ├─ Track Name (0x03)
//    │  ├─ Instrument Name (0x04)
//    │  ├─ Tempo (0x51)
//    │  └─ End of Track (0x2F)
//    └─ MIDI Events (0x80-0xEF)
//       ├─ Note On (0x90)
//       ├─ Note Off (0x80)
//       ├─ Program Change (0xC0)
//       └─ Control Change (0xB0)

// Пример декодирования MIDI в JavaScript
class MidiDecoder {
  constructor(arrayBuffer) {
    this.data = new Uint8Array(arrayBuffer);
    this.offset = 0;
  }

  readBytes(count) {
    const result = this.data.slice(this.offset, this.offset + count);
    this.offset += count;
    return result;
  }

  readString(length) {
    return String.fromCharCode(...this.readBytes(length));
  }

  readVarLength() {
    let value = 0;
    let byte;
    do {
      byte = this.data[this.offset++];
      value = (value << 7) | (byte & 0x7F);
    } while (byte & 0x80);
    return value;
  }

  parse() {
    const header = this.readString(4);
    const headerLength = this.readInt32();
    const format = this.readInt16();
    const numTracks = this.readInt16();
    const division = this.readInt16();

    console.log(`Format: ${format}, Tracks: ${numTracks}, Division: ${division}`);

    const tracks = [];
    for (let i = 0; i < numTracks; i++) {
      tracks.push(this.parseTrack());
    }
    return { format, numTracks, division, tracks };
  }

  readInt16() {
    const result = (this.data[this.offset] << 8) | this.data[this.offset + 1];
    this.offset += 2;
    return result;
  }

  readInt32() {
    let result = 0;
    for (let i = 0; i < 4; i++) {
      result = (result << 8) | this.data[this.offset++];
    }
    return result;
  }

  parseTrack() {
    const trackStart = this.readString(4);
    const trackLength = this.readInt32();
    const trackEnd = this.offset + trackLength;

    const events = [];
    let time = 0;

    while (this.offset < trackEnd) {
      const deltaTime = this.readVarLength();
      time += deltaTime;

      const event = this.data[this.offset];
      if (event === 0xFF) {
        // Meta event
        this.offset++;
        const metaType = this.data[this.offset++];
        const length = this.readVarLength();
        const metaData = this.readBytes(length);

        events.push({
          type: 'meta',
          metaType,
          time,
          data: metaData
        });
      } else if (event >= 0x80) {
        // MIDI event
        const status = this.data[this.offset++];
        const channel = status & 0x0F;
        const command = status >> 4;

        if (command === 9) {
          // Note Off
          const note = this.data[this.offset++];
          const velocity = this.data[this.offset++];
          events.push({
            type: 'noteOff',
            time,
            channel,
            note,
            velocity
          });
        } else if (command === 10) {
          // Note On
          const note = this.data[this.offset++];
          const velocity = this.data[this.offset++];
          events.push({
            type: 'noteOn',
            time,
            channel,
            note,
            velocity
          });
        }
      }
    }

    return { events };
  }
}

// Использование
const midiBytes = Buffer.from(base64String, 'base64');
const decoder = new MidiDecoder(midiBytes.buffer);
const midiStructure = decoder.parse();
console.log(midiStructure);

Best Practices {#best-practices}
1. Обработка ошибок и retry логика
async function transcribeWithRetry(
  filePath,
  maxRetries = 3,
  delayMs = 1000
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await transcriber.upload_and_transcribe(filePath);
      if (result.success) {
        return result;
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error('Transcription failed after all retries');
}

2. Валидация входных данных
function validateAudioFile(file) {
  const allowedMimes = [
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac',
    'video/mp4', 'video/webm', 'video/quicktime'
  ];

  const allowedExtensions = [
    '.mp3', '.wav', '.ogg', '.flac', '.m4a',
    '.mp4', '.mov', '.webm', '.avi', '.mkv'
  ];

  const fileName = file.name.toLowerCase();
  const hasValidExt = allowedExtensions.some(ext => fileName.endsWith(ext));
  const hasValidMime = allowedMimes.includes(file.type);

  if (!hasValidExt || !hasValidMime) {
    throw new Error('Invalid file format');
  }

  // Проверка размера файла (например, max 500MB)
  const maxSize = 500 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File too large');
  }

  return true;
}

3. Безопасность webhook'ов
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return hash === signature;
}

app.post('/webhooks/transcription', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body;

  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Обработка webhook'а
  processTranscription(payload);
  res.json({ status: 'ok' });
});

4. Кэширование результатов
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // 1 час

async function getTranscriptionWithCache(transcriptionId) {
  // Проверяем кэш
  const cached = cache.get(transcriptionId);
  if (cached) {
    return cached;
  }

  // Получаем из БД или API
  const result = await transcriber.getResult(transcriptionId);

  if (result) {
    cache.set(transcriptionId, result);
  }

  return result;
}

5. Логирование и мониторинг
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

async function transcribeWithLogging(filePath) {
  const startTime = Date.now();
  const transcriptionId = uuid.v4();

  try {
    logger.info('Starting transcription', {
      transcriptionId,
      filePath,
      timestamp: new Date().toISOString()
    });

    const result = await transcriber.upload_and_transcribe(filePath);

    const duration = Date.now() - startTime;
    logger.info('Transcription initiated', {
      transcriptionId,
      duration,
      result
    });

    return result;
  } catch (error) {
    logger.error('Transcription failed', {
      transcriptionId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    });
    throw error;
  }
}

6. Оптимизация производительности
// Использование Worker Threads для обработки MIDI
const { Worker } = require('worker_threads');

function processMidiInWorker(midiData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./midi-processor.js');

    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker exited with code ${code}`));
      }
    });

    worker.postMessage(midiData);
  });
}

// midi-processor.js
const { parentPort } = require('worker_threads');

parentPort.on('message', (midiData) => {
  // Тяжёлая обработка MIDI
  const processed = analyzeMidiData(midiData);
  parentPort.postMessage(processed);
});

7. Тестирование интеграции
const request = require('supertest');
const app = require('./app');

describe('Music Transcription API', () => {
  it('should upload audio and return transcription ID', async () => {
    const response = await request(app)
      .post('/api/transcribe')
      .attach('file', './test-audio.mp3');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('transcriptionId');
    expect(response.body.status).toBe('processing');
  });

  it('should handle webhook callback', async () => {
    const payload = {
      id: 'test-123',
      status: 'completed',
      data: {
        notes: [],
        chords: [],
        tempo: { bpm: 120, time_signature: '4/4' }
      }
    };

    const response = await request(app)
      .post('/webhooks/transcription')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('should retrieve transcription results', async () => {
    // Предварительно обработаём webhook
    const payload = {
      id: 'test-123',
      status: 'completed',
      data: { /* ... */ }
    };
    await request(app).post('/webhooks/transcription').send(payload);

    // Получаем результаты
    const response = await request(app)
      .get('/api/transcription/test-123/result');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('completed');
  });
});

Заключение
Klang.io предоставляет мощный набор инструментов для автоматической транскрипции музыки. Интеграция включает:

REST API для программной загрузки файлов
Webhook callbacks для асинхронной обработки
Множество форматов экспорта (MIDI, MusicXML, PDF, TAB)
Multi-instrument поддержку для комплексных композиций
Инструмент-специфичные AI модели для точности
При правильной интеграции Klang.io может стать основой мощного приложения для анализа и обработки музыки.

Полезные ссылки
Klang.io: https://klang.io
Продукты: https://klang.io/transcription-plugin/, https://klang.io/melodyscanner/
Help Center: https://klang.io/help/get-started/
Формы поддержки: Support через Klang.io портал
