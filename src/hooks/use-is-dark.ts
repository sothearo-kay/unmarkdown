import { useSyncExternalStore } from "react";

// Tracks the class `useTheme` writes onto <html>, so leaf components can react
// to the resolved theme without threading props through.
export function useIsDark() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributeFilter: ["class"],
    attributes: true,
  });
  return () => observer.disconnect();
}
