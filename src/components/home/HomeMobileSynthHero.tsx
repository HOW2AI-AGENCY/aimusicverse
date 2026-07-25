/**
 * HomeMobileSynthHero — Cyber-synth energy redesign of the mobile home hero.
 *
 * Palette: uses --synth-* CSS aliases (defined in index.css .dark block)
 * which map to brand-violet + mint tokens. Space Grotesk headings + DM Sans body.
 * Mobile-first feed layout.
 *
 * Composition mirrors the approved prototype: stat chips (credits + streak),
 * violet-gradient prompt card ("О чём будет твой следующий хит?"), and a
 * compact "Продолжи создавать" continue-draft strip. Desktop keeps the existing
 * cluster layout — this component renders only on mobile.
 *
 * P0+P1: Token consolidation + hero affordances (char-count, tips, soft min-char hint).
 */

import { memo, useState, useCallback } from "react";
import { motion } from "@/lib/motion";
import { Zap, Flame, ArrowRight, Music2, Lightbulb } from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { useUserCredits } from "@/hooks/useUserCredits";

interface HomeMobileSynthHeroProps {
  onCreateClick: (prompt?: string) => void;
}

const HERO_TITLE = "О чём будет твой";
const HERO_TITLE_2 = "следующий хит?";
const PROMPT_PLACEHOLDER = "Напр. фонк про ночной Токио…";

const MIN_PROMPT_LENGTH = 5;
const RECOMMENDED_LENGTH = 120;
const QUICK_TIPS = ["Фонк про ночь", "Лёгкий lo-fi", "Энергичный поп"] as const;

function HomeMobileSynthHeroImpl({ onCreateClick }: HomeMobileSynthHeroProps) {
  const { user } = useAuth();
  const { balance, credits } = useUserCredits();
  const [prompt, setPrompt] = useState("");
  const [showTips, setShowTips] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onCreateClick(prompt.trim() || undefined);
    },
    [prompt, onCreateClick],
  );

  const streak = credits?.current_streak ?? 0;
  const showChips = !!user;
  const charCount = prompt.length;
  const isTooShort = charCount > 0 && charCount < MIN_PROMPT_LENGTH;
  const isNearLimit = charCount >= RECOMMENDED_LENGTH;

  const handleTipClick = useCallback((tip: string) => {
    setPrompt(tip);
    setShowTips(false);
  }, []);

  return (
    <section aria-label="Быстрое создание трека" className="w-full space-y-3.5 sm:space-y-5">
      {/* Stat chips */}
      {showChips && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Статистика аккаунта"
        >
          <div
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[hsl(var(--synth-surface))] px-3 py-1.5"
            aria-label={`Баланс: ${balance} кредитов`}
          >
            <span
              className="h-2 w-2 rounded-full bg-[hsl(var(--synth-primary))]"
              style={{ boxShadow: "0 0 8px hsl(var(--synth-primary))" }}
              aria-hidden
            />
            <Zap className="h-3 w-3 text-[hsl(var(--synth-primary-soft))]" aria-hidden />
            <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-[hsl(var(--synth-text))] font-sans">
              {balance} кредитов
            </span>
          </div>

          <div
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[hsl(var(--synth-surface))] px-3 py-1.5"
            aria-label={`Серия: ${streak} ${streak === 1 ? "день" : "дней"}`}
          >
            <Flame className="h-3 w-3 text-[hsl(var(--synth-mint))]" aria-hidden />
            <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-[hsl(var(--synth-text))] font-sans">
              {streak} {streak === 1 ? "день" : "дней"}
            </span>
          </div>
        </motion.div>
      )}

      {/* Hero prompt card */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="relative overflow-hidden rounded-[22px] p-4 sm:rounded-[28px] sm:p-6"
        style={{
          background: "linear-gradient(135deg, hsl(var(--synth-primary)) 0%, hsl(var(--synth-primary-deep)) 100%)",
        }}
        aria-labelledby="synth-hero-title"
      >
        {/* mint glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full sm:h-32 sm:w-32"
          style={{
            background: "hsl(var(--synth-mint))",
            filter: "blur(60px)",
            opacity: 0.3,
          }}
        />

        <h1
          id="synth-hero-title"
          className="relative z-10 mb-3 text-[1.35rem] leading-[1.15] text-white sm:mb-4 sm:text-2xl"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          {HERO_TITLE}
          <br />
          {HERO_TITLE_2}
        </h1>


        <div className="relative z-10">
          <label htmlFor="synth-hero-prompt" className="sr-only">
            Опиши идею трека
          </label>
          <div className="relative">
            <input
              id="synth-hero-prompt"
              type="text"
              inputMode="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={PROMPT_PLACEHOLDER}
              aria-describedby="synth-hero-hint"
              className="w-full rounded-xl border border-white/20 bg-black/30 px-3.5 py-2.5 pr-12 text-[0.8125rem] text-white placeholder:text-white/60 transition-all outline-none focus-visible:border-[hsl(var(--synth-mint))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--synth-mint))]/50 sm:rounded-2xl sm:px-4 sm:py-3 sm:pr-14 sm:text-sm"
            />
            <span id="synth-hero-hint" className="sr-only">
              Нажмите Enter или кнопку «Создать», чтобы начать генерацию
            </span>
            <button
              type="submit"
              aria-label={prompt.trim() ? `Создать трек: ${prompt.trim()}` : "Открыть форму создания трека"}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[hsl(var(--synth-mint))] backdrop-blur-md transition-all hover:bg-white/15 active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--synth-mint))]/70 sm:h-10 sm:w-10 sm:rounded-xl"
            >
              <ArrowRight className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden />
            </button>

          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setShowTips((s) => !s)}
                aria-expanded={showTips}
                aria-controls="synth-hero-tips"
                className="inline-flex items-center gap-1 rounded-md text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <Lightbulb className="h-3 w-3" aria-hidden />
                <span className="text-[0.6875rem]">Идеи</span>
              </button>
              {isTooShort ? (
                <span className="text-[0.6875rem] text-white/70 truncate">Мин. {MIN_PROMPT_LENGTH} симв.</span>
              ) : null}
            </div>
            <span
              id="synth-hero-charcount"
              aria-live="polite"
              className={`shrink-0 text-[0.6875rem] font-mono tabular-nums ${isNearLimit ? "text-[hsl(var(--synth-mint))]" : "text-white/50"}`}
            >
              {charCount}
              {charCount >= MIN_PROMPT_LENGTH ? `/${RECOMMENDED_LENGTH}` : ""}
            </span>
          </div>

          {showTips && (
            <div
              id="synth-hero-tips"
              className="mt-2 flex flex-wrap gap-1.5"
              role="group"
              aria-label="Быстрые подсказки"
            >
              {QUICK_TIPS.map((tip) => (
                <button
                  key={tip}
                  type="button"
                  onClick={() => handleTipClick(tip)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[0.6875rem] text-white/85 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  {tip}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.form>

      {/* Continue creating strip (only when signed in) */}
      {showChips && (
        <motion.button
          type="button"
          onClick={() => onCreateClick()}
          aria-label="Продолжить создание — открыть форму генерации"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[hsl(var(--synth-surface))] p-3 text-left transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--synth-mint))]/60 sm:gap-4 sm:rounded-3xl sm:p-4"
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg sm:h-14 sm:w-14 sm:rounded-xl"
            style={{
              background: "linear-gradient(135deg, hsl(var(--synth-primary)) 0%, hsl(var(--synth-mint)) 100%)",
            }}
            aria-hidden
          >
            <Music2 className="h-5 w-5 text-[hsl(var(--synth-bg))] sm:h-6 sm:w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="truncate text-[0.625rem] uppercase tracking-[0.2em] text-[hsl(var(--synth-text-muted))]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
            >
              Продолжи создавать
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-[hsl(var(--synth-text))] font-sans">
              Новая идея ждёт
            </p>
          </div>
          <ArrowRight
            className="h-5 w-5 shrink-0 text-[hsl(var(--synth-text-muted))] transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </motion.button>
      )}
    </section>
  );
}

export const HomeMobileSynthHero = memo(HomeMobileSynthHeroImpl);
