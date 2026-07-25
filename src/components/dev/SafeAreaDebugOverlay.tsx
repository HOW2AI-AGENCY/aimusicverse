import { useEffect, useState } from "react";

interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
  tg: number;
  stack: number;
}

interface BBox {
  top: number;
  left: number;
  width: number;
  height: number;
  label: string;
}

/**
 * Diagnostic overlay for safe-area + skeleton/container debugging.
 *
 * Visualises:
 *   - iOS `env(safe-area-inset-*)`, Android cutouts, Telegram WebApp insets
 *     as magenta edge bars.
 *   - `--bottom-stack-h` chrome height.
 *   - Container width of the active main scroll area (`#main-content` or
 *     `<main>`), showing whether RTL/LTR or rotation has shifted gutters.
 *   - Bounding boxes of every `[data-safe-skeleton]` mounted by
 *     `SafeAreaSkeletonPlaceholder` plus every Sonner toast, so off-axis
 *     drifts in portrait/landscape and RTL are visible at a glance.
 *
 * Enable with `?debugSafeArea=1` or `localStorage.setItem('mv:debug-safe-area','1')`.
 */
export function SafeAreaDebugOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [insets, setInsets] = useState<Insets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    tg: 0,
    stack: 0,
  });
  const [bboxes, setBboxes] = useState<BBox[]>([]);
  const [container, setContainer] = useState<BBox | null>(null);
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("debugSafeArea") === "1" || window.localStorage.getItem("mv:debug-safe-area") === "1";
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
      const root = getComputedStyle(document.documentElement);
      const tgTop = parseFloat(root.getPropertyValue("--tg-safe-area-inset-top") || "0") || 0;
      const stack = parseFloat(root.getPropertyValue("--bottom-stack-h") || "0") || 0;
      setInsets({
        top: parseFloat(cs.paddingTop) || 0,
        right: parseFloat(cs.paddingRight) || 0,
        bottom: parseFloat(cs.paddingBottom) || 0,
        left: parseFloat(cs.paddingLeft) || 0,
        tg: tgTop,
        stack,
      });
      setDir((document.documentElement.dir as "ltr" | "rtl") || "ltr");

      // Container: prefer #main-content, fall back to <main>
      const mainEl = (document.getElementById("main-content") as HTMLElement | null) ?? document.querySelector("main");
      if (mainEl) {
        const r = mainEl.getBoundingClientRect();
        setContainer({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          label: `container ${Math.round(r.width)}×${Math.round(r.height)}`,
        });
      } else {
        setContainer(null);
      }

      // Skeleton bounding boxes + toast bounding boxes
      const targets: Array<{ el: Element; label: string }> = [];
      document.querySelectorAll("[data-safe-skeleton]").forEach((el) => targets.push({ el, label: "skeleton" }));
      document.querySelectorAll("[data-sonner-toast]").forEach((el) => targets.push({ el, label: "toast" }));

      setBboxes(
        targets.map(({ el, label }) => {
          const r = (el as HTMLElement).getBoundingClientRect();
          return {
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            label: `${label} ${Math.round(r.width)}×${Math.round(r.height)}`,
          };
        }),
      );
    };

    read();
    const interval = window.setInterval(read, 500);
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    window.addEventListener("scroll", read, { passive: true });
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
      window.removeEventListener("scroll", read);
      probe.remove();
    };
  }, [enabled]);

  if (!enabled) return null;

  const bar = "fixed pointer-events-none z-[9998] bg-fuchsia-500/40 backdrop-blur-[1px]";

  return (
    <>
      {/* Safe-area edge bars */}
      <div className={bar} style={{ top: 0, left: 0, right: 0, height: insets.top }} />
      <div className={bar} style={{ bottom: 0, left: 0, right: 0, height: insets.bottom }} />
      <div className={bar} style={{ top: 0, bottom: 0, left: 0, width: insets.left }} />
      <div className={bar} style={{ top: 0, bottom: 0, right: 0, width: insets.right }} />

      {/* Container outline */}
      {container && (
        <div
          className="fixed pointer-events-none z-[9997] border border-cyan-400/70 outline-1 outline-cyan-400/40"
          style={{
            top: container.top,
            left: container.left,
            width: container.width,
            height: container.height,
          }}
        >
          <span className="absolute -top-4 left-0 text-[0.625rem] font-mono text-cyan-300 bg-black/70 px-1 rounded-sm">
            {container.label}
          </span>
        </div>
      )}

      {/* Tracked bounding boxes */}
      {bboxes.map((b, i) => (
        <div
          key={i}
          className="fixed pointer-events-none z-[9997] border-2 border-emerald-400/80"
          style={{ top: b.top, left: b.left, width: b.width, height: b.height }}
        >
          <span className="absolute -top-4 left-0 text-[0.625rem] font-mono text-emerald-300 bg-black/70 px-1 rounded-sm whitespace-nowrap">
            {b.label}
          </span>
        </div>
      ))}

      {/* HUD */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[9999] rounded-lg bg-black/85 px-3 py-2 text-[0.6875rem] font-mono text-fuchsia-200 shadow-xl pointer-events-auto space-y-0.5"
        style={{ top: `calc(${insets.top}px + 8px)` }}
      >
        <div>
          env t:{insets.top} r:{insets.right} b:{insets.bottom} l:{insets.left}
        </div>
        <div>
          tg-top:{insets.tg} • bottom-stack:{insets.stack} • dir:{dir}
        </div>
        {container && (
          <div className="text-cyan-300">
            main: {Math.round(container.width)}px @ x={Math.round(container.left)}
          </div>
        )}
        <div className="text-emerald-300">tracked: {bboxes.length}</div>
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
