/**
 * useLikeSessionTracker - Track likes in current session
 * Suggests playlist creation after N likes
 */

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ListMusic } from "lucide-react";

const LIKES_THRESHOLD = 3;
const SESSION_KEY = "session_like_count";
const SUGGESTION_SHOWN_KEY = "playlist_suggestion_shown";

export function useLikeSessionTracker() {
  const navigate = useNavigate();
  const hasShownSuggestion = useRef(sessionStorage.getItem(SUGGESTION_SHOWN_KEY) === "true");

  const trackLike = useCallback(
    (isLiking: boolean) => {
      if (!isLiking || hasShownSuggestion.current) return;

      // Increment session like count
      const currentCount = parseInt(sessionStorage.getItem(SESSION_KEY) || "0", 10);
      const newCount = currentCount + 1;
      sessionStorage.setItem(SESSION_KEY, String(newCount));

      // Show playlist suggestion after threshold
      if (newCount === LIKES_THRESHOLD) {
        hasShownSuggestion.current = true;
        sessionStorage.setItem(SUGGESTION_SHOWN_KEY, "true");

        toast("🎵 Уже 3 лайка! Создайте плейлист?", {
          description: "Соберите любимые треки в одном месте",
          duration: 6000,
          action: {
            label: "Создать",
            onClick: () => navigate("/playlists?create=true"),
          },
        });
      }
    },
    [navigate],
  );

  const resetSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SUGGESTION_SHOWN_KEY);
    hasShownSuggestion.current = false;
  }, []);

  return { trackLike, resetSession };
}
