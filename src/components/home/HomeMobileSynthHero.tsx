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
 */

import { memo, useState, useCallback } from "react";
import { motion } from "@/lib/motion";
import { Zap, Flame, ArrowRight, Music2 } from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { useUserCredits } from "@/hooks/useUserCredits";

interface HomeMobileSynthHeroProps {
  onCreateClick: (prompt?: string) => void;
}

const HERO_TITLE = "О чём будет твой";
const HERO_TITLE_2 = "следующий хит?";
const PROMPT_PLACEHOLDER = "Напр. фонк про ночной Токио…";

function HomeMobileSynthHeroImpl({ onCreateClick }: HomeMobileSynthHeroProps) {
  const { user } = useAuth();
  const { balance, credits } = useUserCredits();
  const [prompt, setPrompt] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onCreateClick(prompt.trim() || undefined);
    },
    [prompt, onCreateClick],
  );

  const streak = credits?.current_streak ?? 0;
  const showChips = !!user;

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
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#12142B] px-3 py-1.5"
            aria-label={`Баланс: ${balance} кредитов`}
          >
            <span
              className="h-2 w-2 rounded-full bg-[#7C5CFF]"
              style={{ boxShadow: "0 0 8px #7C5CFF" }}
              aria-hidden
            />
            <Zap className="h-3 w-3 text-[#B7A6FF]" aria-hidden />
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#EDEDF5] font-sans">
              {balance} кредитов
            </span>
          </div>

          <div
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#12142B] px-3 py-1.5"
            aria-label={`Серия: ${streak} ${streak === 1 ? "день" : "дней"}`}
          >
            <Flame className="h-3 w-3 text-[#22E4A7]" aria-hidden />
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#EDEDF5] font-sans">
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
        className="relative overflow-hidden rounded-[28px] p-6"
        style={{
          background: "linear-gradient(135deg, #7C5CFF 0%, #3B2A8A 100%)",
        }}
        aria-labelledby="synth-hero-title"
      >
        {/* mint glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full"
          style={{
            background: "#22E4A7",
            filter: "blur(60px)",
            opacity: 0.3,
          }}
        />

        <h1
          id="synth-hero-title"
          className="relative z-10 mb-4 text-2xl leading-tight text-white"
          style={{
            fontFamily:
              '"Bricolage Grotesque", "Inter", ui-sans-serif, system-ui, sans-serif',
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
          <input
            id="synth-hero-prompt"
            type="text"
            inputMode="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={PROMPT_PLACEHOLDER}
            aria-describedby="synth-hero-hint"
            className="w-full rounded-2xl border border-white/25 bg-black/40 px-4 py-4 pr-28 text-sm text-white placeholder:text-white/70 transition-all outline-none focus-visible:border-[#22E4A7] focus-visible:ring-2 focus-visible:ring-[#22E4A7]/60"
          />
          <span id="synth-hero-hint" className="sr-only">
            Нажмите Enter или кнопку «Создать», чтобы начать генерацию
          </span>
          <button
            type="submit"
            aria-label={prompt.trim() ? `Создать трек: ${prompt.trim()}` : "Открыть форму создания трека"}
            className="absolute bottom-2 right-2 top-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#22E4A7] px-4 text-sm font-bold text-[#0A0B14] shadow-[0_6px_20px_rgba(34,228,167,0.35)] transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            Создать
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
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
          className="group flex w-full items-center gap-4 rounded-3xl border border-white/10 bg-[#12142B] p-4 text-left transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22E4A7]/60"
        >
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, #7C5CFF 0%, #22E4A7 100%)",
            }}
            aria-hidden
          >
            <Music2 className="h-6 w-6 text-[#0A0B14]" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-[10px] uppercase tracking-[0.2em] text-[#B4B6D6]"
              style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700 }}
            >
              Продолжи создавать
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-[#EDEDF5] font-sans">
              Новая идея ждёт
            </p>
          </div>
          <ArrowRight
            className="h-5 w-5 shrink-0 text-[#B4B6D6] transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </motion.button>
      )}
    </section>
  );
}

export const HomeMobileSynthHero = memo(HomeMobileSynthHeroImpl);
