const DEFAULT_FALLBACK_OPACITY = "0.15";

export function initIconErrorFallback(): void {
  document.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      if (
        target instanceof HTMLImageElement &&
        target.dataset.iconFallback !== undefined
      ) {
        target.style.opacity =
          target.dataset.iconFallback === ""
            ? DEFAULT_FALLBACK_OPACITY
            : target.dataset.iconFallback;
      }
    },
    true,
  );
}
