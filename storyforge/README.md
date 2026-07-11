# StoryForge AI

**Создавай персонажей, пиши сценарии, строй раскадровку — и оживляй их в видео.**

StoryForge AI — приложение для [Higgsfield $100K App Contest](https://higgsfield.ai/supercomputer/apps). Инструмент для креаторов: от идеи до видео за минуты.

## Конкурс

|           |                                                                    |
| --------- | ------------------------------------------------------------------ |
| Deadline  | July 22, 2026                                                      |
| Платформа | [Higgsfield App Builder](https://higgsfield.ai/supercomputer/apps) |
| Приз      | $100,000 total                                                     |
| Сборка    | Через Claude MCP + Higgsfield CLI                                  |

## Фичи

- **Character Crafter** — текст → персонаж (Soul V2, GPT Image 2)
- **Scene Writer** — редактирование сценария с автоподстановкой персонажей
- **Storyboard Generator** — сцена → ключевой кадр
- **Scene Animator** — кадры → видео (Seedance 2.0)
- **Soul ID** — сохранение персонажа для консистентности

## Структура

```
storyforge/
├── README.md        # Этот файл
├── SPEC.md          # Техническая спецификация
├── PROGRESS.md      # Трекинг задач и спринтов
├── docs/            # Документация, референсы
├── assets/          # Сгенерированные изображения/видео
└── logs/            # Логи генераций
```

## Быстрый старт

```bash
# Убедись что Higgsfield CLI доступен
higgsfield account status

# Генерация персонажа
higgsfield generate create text2image_soul_v2 \
  --prompt "your character description" \
  --aspect_ratio 1:1 --quality 2k --wait

# Сохранение аватара
higgsfield marketing-studio avatars create \
  --name "Character Name" --image <upload_id>

# Анимация сцены (из 2-х кадров)
higgsfield generate create seedance_2_0 \
  --start-image ./frame1.png \
  --end-image ./frame2.png \
  --duration 5 --wait
```

## Лицензия

Проект создан для участия в Higgsfield App Contest.
