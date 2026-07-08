#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# MODE=emoji — эмодзи, работает везде (по умолчанию)
# MODE=nerd  — Nerd Font + Powerline-разделители, нужен Nerd Font в терминале
MODE="${MUSICVERSE_STATUSLINE_MODE:-emoji}"

if [ "$MODE" = "nerd" ]; then
  ICON_PROJECT="󰝚"
  ICON_BRANCH=""
  ICON_STAGED=""
  ICON_MODIFIED=""
  ICON_UNTRACKED=""
  ICON_AHEAD=""
  ICON_BEHIND=""
  ICON_DIVERGED=""
  ICON_TIME=""
  SEP=""
  LSEP=""
  RSEP=""
else
  ICON_PROJECT="🎵"
  ICON_BRANCH="🌿"
  ICON_STAGED="●"
  ICON_MODIFIED="✎"
  ICON_UNTRACKED="❓"
  ICON_AHEAD="↑"
  ICON_BEHIND="↓"
  ICON_DIVERGED="↕"
  ICON_TIME="🕐"
  SEP="│"
  LSEP=""
  RSEP=""
fi

# ANSI-цвета
c_reset='\033[0m'
c_gray='\033[0;90m'
c_cyan='\033[1;36m'
c_cyan_bg='\033[48;5;31m'
c_cyan_fg='\033[38;5;31m'
c_purple='\033[1;35m'
c_purple_bg='\033[48;5;98m'
c_purple_fg='\033[38;5;98m'
c_yellow='\033[1;33m'
c_green='\033[1;32m'
c_blue='\033[1;34m'
c_white='\033[1;37m'
c_dark='\033[38;5;236m'
c_gray_bg='\033[48;5;240m'
c_gray_fg='\033[38;5;240m'
c_dim='\033[0;37m'

branch=$(git branch --show-current 2>/dev/null || echo "unknown")
short_sha=$(git rev-parse --short HEAD 2>/dev/null || echo "----")

status=$(git status --porcelain 2>/dev/null || true)
staged=$(printf '%s\n' "$status" | grep -c '^[MADRC]' 2>/dev/null || true)
modified=$(printf '%s\n' "$status" | grep -c '^ [MADRC]' 2>/dev/null || true)
untracked=$(printf '%s\n' "$status" | grep -c '^??' 2>/dev/null || true)

ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo 0)
behind=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo 0)

time_str=$(date +'%H:%M')

# Рендер сегмента: иконка + текст + цвет
seg() {
  local icon="$1"
  local text="$2"
  local fg="$3"
  printf '%b%s %s%b' "$fg" "$icon" "$text" "$c_reset"
}

# Разделитель между сегментами (только для emoji-режима)
div() {
  printf ' %b%s%b ' "$c_gray" "$SEP" "$c_reset"
}

if [ "$MODE" = "nerd" ]; then
  # Левая скобка
  printf '%b%s%b' "$c_cyan_fg" "$LSEP" "$c_reset"
  # Проект
  printf '%b %s MusicVerse %b' "$c_cyan_bg$c_dark" "$ICON_PROJECT" "$c_reset"
  printf '%b%s%b' "$c_cyan_fg" "$SEP" "$c_reset"
  # Ветка
  printf '%b %s %s %b' "$c_purple_bg$c_white" "$ICON_BRANCH" "$branch" "$c_reset"
  printf '%b%s%b' "$c_purple_fg" "$SEP" "$c_reset"
  # Тёмный «хвост» со статусом и временем
  printf '%b' "$c_gray_bg$c_white"

  [ "$staged" -gt 0 ]   && printf ' %s %s' "$ICON_STAGED" "$staged"
  [ "$modified" -gt 0 ] && printf ' %s %s' "$ICON_MODIFIED" "$modified"
  [ "$untracked" -gt 0 ]&& printf ' %s %s' "$ICON_UNTRACKED" "$untracked"

  if [ "$ahead" -gt 0 ] && [ "$behind" -gt 0 ]; then
    printf ' %s %s/%s' "$ICON_DIVERGED" "$ahead" "$behind"
  elif [ "$ahead" -gt 0 ]; then
    printf ' %s %s' "$ICON_AHEAD" "$ahead"
  elif [ "$behind" -gt 0 ]; then
    printf ' %s %s' "$ICON_BEHIND" "$behind"
  fi

  printf ' %s %s' "$ICON_TIME" "$time_str"
  printf '%b%b%s%b\n' "$c_reset" "$c_gray_fg" "$RSEP" "$c_reset"
else
  # Emoji mode: компактные цветные сегменты
  seg "$ICON_PROJECT" "MusicVerse" "$c_cyan"; div
  seg "$ICON_BRANCH" "$branch" "$c_purple"

  [ "$staged" -gt 0 ]   && { div; seg "$ICON_STAGED" "$staged" "$c_green"; }
  [ "$modified" -gt 0 ] && { div; seg "$ICON_MODIFIED" "$modified" "$c_yellow"; }
  [ "$untracked" -gt 0 ]&& { div; seg "$ICON_UNTRACKED" "$untracked" "$c_dim"; }

  if [ "$ahead" -gt 0 ] && [ "$behind" -gt 0 ]; then
    div; seg "$ICON_DIVERGED" "${ahead}/${behind}" "$c_blue"
  elif [ "$ahead" -gt 0 ]; then
    div; seg "$ICON_AHEAD" "$ahead" "$c_blue"
  elif [ "$behind" -gt 0 ]; then
    div; seg "$ICON_BEHIND" "$behind" "$c_blue"
  fi

  div; seg "$ICON_TIME" "$time_str" "$c_cyan"
  printf '\n'
fi
