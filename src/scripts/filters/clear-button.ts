/**
 * Adds a search box style clear × button inside AG Grid filter inputs. The button sits at the
 * inline-end of the input's `.ag-input-wrapper` and is shown only while the input holds a value.
 * Clearing dispatches a bubbling `input` event so AG Grid (or a custom filter listening on the same input) re filters.
 */

const DECORATED_ATTR = "data-osrs-clear";
const CLEAR_ICON_SVG =
  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';

export function attachClearButton(input: HTMLInputElement): void {
  if (input.getAttribute(DECORATED_ATTR) === "true") {
    return;
  }
  const wrapper: HTMLElement | null = input.parentElement;
  if (wrapper === null) {
    return;
  }
  input.setAttribute(DECORATED_ATTR, "true");

  const button: HTMLButtonElement = document.createElement("button");
  button.type = "button";
  button.className = "osrs-input-clear";
  button.tabIndex = -1;
  button.setAttribute("aria-label", "Clear");
  button.title = "Clear";
  button.innerHTML = CLEAR_ICON_SVG;

  const update = (): void => {
    button.classList.toggle("osrs-input-clear--visible", input.value !== "");
  };

  input.addEventListener("input", update);
  button.addEventListener("mousedown", (event) => event.preventDefault());
  button.addEventListener("click", () => {
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    update();
    input.focus();
  });

  wrapper.append(button);
  update();
}

function decorateAll(root: HTMLElement): void {
  const inputs: NodeListOf<HTMLInputElement> = root.querySelectorAll(
    "input.ag-input-field-input",
  );
  inputs.forEach((input) => {
    if (input.type === "text" || input.type === "number") {
      attachClearButton(input);
    }
  });
}

/**
 * Decorates every text/number input inside a filter and keeps watching it, so inputs revealed later get a clear button too.
 * Returns the observer so the caller can disconnect it when the next filter opens.
 */
export function decorateFilterInputs(root: HTMLElement): MutationObserver {
  decorateAll(root);
  const observer = new MutationObserver(() => decorateAll(root));
  observer.observe(root, { childList: true, subtree: true });
  return observer;
}
