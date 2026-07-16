/**
 * HomeMobileSynthHero — Cyber-synth energy redesign of the mobile home hero.
 *
 * Redesign direction: locked palette (bg #0A0B14, surface #12142B, primary #7C5CFF,
 * mint #22E4A7), Bricolage Grotesque headings + Inter body, mobile feed layout.
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
    <section aria-label="Быстрое создание трека" className="w-full space-y-5">
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
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card px-3 py-1.5"
            aria-label={`Баланс: ${balance} кредитов`}
          >
            <span
              aria-hidden
              className="h-2 w-2 rounded-full bg-brand-violet shadow-[0_0_8px_hsl(var(--brand-violet))]"
            />
            <Zap className="h-3 w-3 text-brand-violet-soft" aria-hidden />
            <span className="text-[11px] font-medium uppercase tracking-wider text-foreground font-sans">
              {balance} кредитов
            </span>
          </div>

          <div
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card px-3 py-1.5"
            aria-label={`Серия: ${streak} ${streak === 1 ? "день" : "дней"}`}
          >
            <Flame className="h-3 w-3 text-mint" aria-hidden />
            <span className="text-[11px] font-medium uppercase tracking-wider text-foreground font-sans">
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
        className="relative overflow-hidden rounded-[24px] bg-gradient-brand p-4 sm:p-6 shadow-glow-generate"
        aria-labelledby="synth-hero-title"
      >
        {/* mint glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-mint blur-[60px] opacity-30"
        />

        <h1
          id="synth-hero-title"
          className="relative z-10 mb-3 sm:mb-4 text-lg sm:text-2xl leading-tight text-white font-display font-bold tracking-tight"
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
              className="w-full rounded-2xl border border-white/25 bg-black/40 pl-3 pr-[104px] py-3 text-sm text-white placeholder:text-white/70 transition-all outline-none focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint/60"
            />
            <button
              type="submit"
              aria-label={prompt.trim() ? `Создать трек: ${prompt.trim()}` : "Открыть форму создания трека"}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-9 items-center gap-1 rounded-xl bg-mint px-3 text-xs font-bold text-background shadow-glow transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              Создать
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>

          <div
            id="synth-hero-hint"
            className="mt-2 flex min-h-[1.25rem] items-center justify-between gap-2 text-[11px] sm:text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setShowTips((s) => !s)}
                aria-expanded={showTips}
                aria-controls="synth-hero-tips"
                className="inline-flex items-center gap-1 rounded-md text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <Lightbulb className="h-3 w-3" aria-hidden />
                <span>Идеи</span>
              </button>
              {isTooShort ? (
                <span className="text-white/70 truncate">Мин. {MIN_PROMPT_LENGTH} симв.</span>
              ) : null}
            </div>
            <span
              id="synth-hero-charcount"
              aria-live="polite"
              className={`shrink-0 font-mono tabular-nums ${isNearLimit ? "text-mint" : "text-white/50"}`}
            >
              {charCount}
              {charCount >= MIN_PROMPT_LENGTH ? `/${RECOMMENDED_LENGTH}` : ""}
            </span>
          </div>

          {/* Tips row */}
          {showTips && (
            <div id="synth-hero-tips" className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Быстрые подсказки">
              {QUICK_TIPS.map((tip) => (
                <button
                  key={tip}
                  type="button"
                  onClick={() => handleTipClick(tip)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] text-white/85 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
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
          className="group flex w-full items-center gap-4 rounded-3xl border border-white/10 bg-card p-4 text-left transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/60"
        >
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-brand-accent"
            aria-hidden
          >
            <Music2 className="h-6 w-6 text-background" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-display font-bold">
              Продолжи создавать
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground font-sans">Новая идея ждёт</p>
          </div>
          <ArrowRight
            className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </motion.button>
      )}
    </section>
  );
}

export const HomeMobileSynthHero = memo(HomeMobileSynthHeroImpl);
