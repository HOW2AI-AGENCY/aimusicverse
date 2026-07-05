import { useEffect, useState } from "react";
import { Plus } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { dispatchOpenGenerateSheet } from "@/lib/events";

/**
 * Sprint 055-B7: Home sticky CTA for cold users
 *
 * Mini floating button that appears on home page for users who haven't seen
 * the create hint yet. Tapping opens the generate sheet via CustomEvent.
 *
 * Logic:
 * - Only shown if localStorage.musicverse_seen_create_hint is NOT set
 * - Dismissed after first tap (user discovered create action)
 * - Fixed position bottom-24 (above BottomNavigation) right-4
 */
export function HomeStickyCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const hasSeenHint = localStorage.getItem("musicverse_seen_create_hint");

    if (!hasSeenHint) {
      // Small delay for smooth animation
      const mountTimer = setTimeout(() => setIsMounted(true), 100);
      const showTimer = setTimeout(() => setIsVisible(true), 500);

      return () => {
        clearTimeout(mountTimer);
        clearTimeout(showTimer);
      };
    }
  }, []);

  const handleClick = () => {
    dispatchOpenGenerateSheet();
    // Mark as seen after first interaction
    localStorage.setItem("musicverse_seen_create_hint", "true");
    setIsVisible(false);
  };

  if (!isMounted) return null;

  return (
    <button
      onClick={handleClick}
      className={cn(
        "fixed right-4 z-40 rounded-2xl shadow-lg transition-all duration-300",
        "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        "active:scale-95 hover:scale-105",
        // Above BottomNavigation (bottom-16) + margin
        "bottom-24 w-14 h-14",
        "flex items-center justify-center",
        // Animation classes
        "opacity-0 scale-90 translate-y-4",
        isVisible && "opacity-100 scale-100 translate-y-0",
        // Pulse animation for attention
        "animate-bounce",
      )}
      aria-label="Создать музыку"
    >
      <Plus className="w-6 h-6" strokeWidth={2.4} />
    </button>
  );
}
