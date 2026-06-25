/**
 * CreditPackageCard Component
 * Enhanced card with glassmorphism, premium animations and visual polish
 */

import { cn } from "@/lib/utils";
import { CreditCard, Check, Sparkles, Zap, Crown, TrendingUp, Star, Music } from "lucide-react";
import { motion } from "@/lib/motion";
import { glass, gradientGlass } from "@/lib/glass";
import type { StarsProduct } from "@/services/starsPaymentService";
import { formatRubles } from "@/types/payment";

interface CreditPackageCardProps {
  product: StarsProduct;
  isSelected?: boolean;
  onClick?: (product: StarsProduct) => void;
  className?: string;
  isBestValue?: boolean;
}

export function CreditPackageCard({
  product,
  isSelected = false,
  onClick,
  className,
  isBestValue = false,
}: CreditPackageCardProps) {
  const name =
    typeof product.name === "object" && product.name !== null
      ? (product.name as Record<string, string>).ru || (product.name as Record<string, string>).en
      : String(product.name || "");

  const description =
    typeof product.description === "object" && product.description !== null
      ? (product.description as Record<string, string>)?.ru || (product.description as Record<string, string>)?.en
      : product.description;

  const tracksCount = Math.floor((product.credits_amount ?? 0) / 12);
  const pricePerTrack =
    product.price_rub_cents && tracksCount > 0 ? Math.round(product.price_rub_cents / 100 / tracksCount) : null;

  return (
    <motion.button
      onClick={() => onClick?.(product)}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "relative w-full text-left p-5 rounded-2xl border transition-all duration-300 overflow-hidden",
        "hover:shadow-2xl",
        isSelected
          ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-xl shadow-primary/20"
          : cn(glass.card, "hover:border-primary/50"),
        product.is_featured &&
          !isSelected &&
          "border-amber-500/50 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent",
        isBestValue &&
          !product.is_featured &&
          !isSelected &&
          "border-green-500/50 bg-gradient-to-br from-green-500/15 via-green-500/5 to-transparent",
        className,
      )}
    >
      {/* Background glow effect for selected */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}

      {/* Decorative corner accent */}
      <div
        className={cn(
          "absolute top-0 right-0 w-24 h-24 rounded-bl-[100%] opacity-30 pointer-events-none",
          isSelected
            ? "bg-primary/30"
            : product.is_featured
              ? "bg-amber-500/30"
              : isBestValue
                ? "bg-green-500/30"
                : "bg-muted",
        )}
      />

      {/* Featured Badge */}
      {product.is_featured && (
        <motion.div
          initial={{ scale: 0, rotate: -10, y: -10 }}
          animate={{ scale: 1, rotate: 0, y: 0 }}
          transition={{ type: "spring", stiffness: 500, delay: 0.1 }}
          className="absolute -top-2.5 left-4 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-amber-500/40"
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="w-3 h-3" />
          </motion.div>
          Популярный
        </motion.div>
      )}

      {/* Best Value Badge */}
      {isBestValue && !product.is_featured && (
        <motion.div
          initial={{ scale: 0, rotate: -10, y: -10 }}
          animate={{ scale: 1, rotate: 0, y: 0 }}
          transition={{ type: "spring", stiffness: 500, delay: 0.1 }}
          className="absolute -top-2.5 left-4 px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-green-500/40"
        >
          <Crown className="w-3 h-3" />
          Лучшая цена
        </motion.div>
      )}

      {/* Selected Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 500 }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/40 z-10"
        >
          <Check className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-4 pr-10">
          <h3 className="text-lg font-bold">{name}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>}
        </div>

        {/* Credits Info with animation */}
        <motion.div
          className="flex items-baseline gap-2 mb-4"
          animate={isSelected ? { scale: [1, 1.03, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          <motion.span
            className={cn(
              "text-4xl font-bold bg-clip-text text-transparent",
              isSelected
                ? "bg-gradient-to-r from-primary via-primary to-primary/80"
                : product.is_featured
                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : isBestValue
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : "bg-gradient-to-r from-primary to-primary/70",
            )}
            animate={
              isSelected
                ? {
                    textShadow: [
                      "0 0 10px rgba(var(--primary), 0)",
                      "0 0 20px rgba(var(--primary), 0.3)",
                      "0 0 10px rgba(var(--primary), 0)",
                    ],
                  }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          >
            {product.credits_amount}
          </motion.span>
          <span className="text-muted-foreground text-sm font-medium">кредитов</span>
        </motion.div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-2 text-sm mb-4">
          <motion.div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium",
              isSelected ? "bg-primary/20 text-primary" : "bg-primary/10 text-muted-foreground",
            )}
            whileHover={{ scale: 1.02 }}
          >
            <Music className="w-4 h-4" />
            <span>≈ {tracksCount} треков</span>
          </motion.div>
          {pricePerTrack && (
            <motion.div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                isBestValue
                  ? "bg-green-500/15 text-green-600 dark:text-green-400 font-medium"
                  : "bg-muted text-muted-foreground",
              )}
              whileHover={{ scale: 1.02 }}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>~{pricePerTrack} ₽/трек</span>
            </motion.div>
          )}
        </div>

        {/* Price */}
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm">Картой</span>
            </div>
            <motion.div
              className={cn("text-2xl font-bold", isSelected && "text-primary")}
              animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {product.price_rub_cents ? formatRubles(product.price_rub_cents) : "—"}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
