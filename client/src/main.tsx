import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (!window.location.hash) {
  window.location.hash = "#/";
}

// ── Desktop scroll fix for Telegram Web App ──────────────────────────────
// Telegram Desktop intercepts wheel events — forward them manually with smooth easing
(function fixDesktopScroll() {
  let lastTime = 0;
  let accumulated = 0;
  let rafId: number | null = null;

  function smoothScroll(target: Element, delta: number) {
    accumulated += delta;
    if (rafId) return;
    const step = () => {
      if (Math.abs(accumulated) < 0.5) { accumulated = 0; rafId = null; return; }
      const move = accumulated * 0.22; // easing
      target.scrollTop += move;
      accumulated -= move;
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  }

  function getScrollTarget(e: WheelEvent): Element {
    let el = e.target as Element | null;
    while (el && el !== document.documentElement) {
      const cs = window.getComputedStyle(el);
      if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
        return el;
      }
      el = el.parentElement;
    }
    return document.documentElement;
  }

  document.addEventListener('wheel', (e: WheelEvent) => {
    const now = Date.now();
    if (now - lastTime > 100) accumulated = 0; // reset on pause
    lastTime = now;

    let delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 32;
    if (e.deltaMode === 2) delta *= window.innerHeight;

    const target = getScrollTarget(e);
    smoothScroll(target, delta);
  }, { passive: true });

  document.documentElement.style.touchAction = 'pan-y';
  document.body.style.touchAction = 'pan-y';
})();

createRoot(document.getElementById("root")!).render(<App />);
