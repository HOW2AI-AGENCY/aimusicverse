import { useEffect, useState } from "react";

/**
 * Diagnostic overlay that visualises the active safe-area insets
 * (iOS notch / home indicator, Android cutouts, Telegram WebApp insets,
 * and the unified `--bottom-stack-h` chrome variable).
 *
 * Enable with:
 *   - `?debugSafeArea=1` query param, or
 *   - `localStorage.setItem('mv:debug-safe-area', '1')`
 *
 * Inactive by default and tree-shaken out of production usage unless toggled.
 */
export function SafeAreaDebugOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [insets, setInsets] = useState({ top: 0, right: 0, bottom: 0, left: 0, tg: 0, stack: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const flag =
      params.get("debugSafeArea") === "1" ||
      window.localStorage.getItem("mv:debug-safe-area") === "1";
    setEnabled(flag);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const probe = document.createElement("div");
    probe.style.cssText = `
      position:fixed;inset:0;pointer-events:none;visibility:hidden;
      padding-top:env(safe-area-inset-top,0px);
      padding-right:env(safe-area-inset-right,0px);
      padding-bottom:env(safe-area-inset-bottom,0px);
      padding-left:env(safe-area-inset-left,0px);
    `;
    document.body.appendChild(probe);
    const read = () => {
      const cs = getComputedStyle(probe);
      const tgTop =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--tg-safe-area-inset-top") || "0",
        ) || 0;
      const stack =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--bottom-stack-h") || "0",
        ) || 0;
      setInsets({
        top: parseFloat(cs.paddingTop) || 0,
        right: parseFloat(cs.paddingRight) || 0,
        bottom: parseFloat(cs.paddingBottom) || 0,
        left: parseFloat(cs.paddingLeft) || 0,
        tg: tgTop,
        stack,
      });
    };
    read();
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    return () => {
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
      probe.remove();
    };
  }, [enabled]);

  if (!enabled) return null;

  const bar = "fixed pointer-events-none z-[9998] bg-fuchsia-500/40 backdrop-blur-[1px]";

  return (
    <>
      <div className={bar} style={{ top: 0, left: 0, right: 0, height: insets.top }} />
      <div className={bar} style={{ bottom: 0, left: 0, right: 0, height: insets.bottom }} />
      <div className={bar} style={{ top: 0, bottom: 0, left: 0, width: insets.left }} />
      <div className={bar} style={{ top: 0, bottom: 0, right: 0, width: insets.right }} />
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[9999] rounded-lg bg-black/85 px-3 py-2 text-[11px] font-mono text-fuchsia-200 shadow-xl pointer-events-auto"
        style={{ top: `calc(${insets.top}px + 8px)` }}
      >
        <div>env t:{insets.top} r:{insets.right} b:{insets.bottom} l:{insets.left}</div>
        <div>tg-top:{insets.tg} • bottom-stack:{insets.stack}</div>
        <button
          className="mt-1 text-fuchsia-300 underline"
          onClick={() => {
            window.localStorage.removeItem("mv:debug-safe-area");
            setEnabled(false);
          }}
        >
          disable
        </button>
      </div>
    </>
  );
}
