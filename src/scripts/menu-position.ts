export const VIEWPORT_MARGIN_PX = 8;

export function clampMenuIntoViewport(
  menu: HTMLElement,
  marginPx: number = VIEWPORT_MARGIN_PX,
): void {
  menu.style.right = "0px";
  const left = menu.getBoundingClientRect().left;
  if (left < marginPx) {
    menu.style.right = `${left - marginPx}px`;
  }
}
