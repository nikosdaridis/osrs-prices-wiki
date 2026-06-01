interface PromptOptions {
  title: string;
  label: string;
  placeholder?: string;
  initial?: string;
  primary?: string;
  validate?: (value: string) => boolean;
}

interface ConfirmOptions {
  title: string;
  message: string;
  primary?: string;
  danger?: boolean;
}

interface ModalRefs {
  root: HTMLElement;
  backdrop: HTMLElement;
  title: HTMLElement;
  message: HTMLElement;
  field: HTMLElement;
  label: HTMLElement;
  input: HTMLInputElement;
  cancel: HTMLButtonElement;
  confirm: HTMLButtonElement;
}

let activeResolver: ((value: unknown) => void) | null = null;
let activeMode: "prompt" | "confirm" | null = null;
let promptValidate: ((value: string) => boolean) | null = null;

function refs(): ModalRefs | null {
  const root = document.getElementById("modal-root");
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("modal-title");
  const message = document.getElementById("modal-message");
  const field = document.getElementById("modal-field");
  const label = document.getElementById("modal-label");
  const input = document.getElementById("modal-input");
  const cancel = document.getElementById("modal-cancel");
  const confirm = document.getElementById("modal-confirm");
  if (
    root === null ||
    backdrop === null ||
    title === null ||
    message === null ||
    field === null ||
    label === null ||
    cancel === null ||
    confirm === null ||
    !(input instanceof HTMLInputElement) ||
    !(cancel instanceof HTMLButtonElement) ||
    !(confirm instanceof HTMLButtonElement)
  ) {
    return null;
  }
  return {
    root,
    backdrop,
    title,
    message,
    field,
    label,
    input,
    cancel,
    confirm,
  };
}

function isPromptValueValid(references: ModalRefs): boolean {
  const value = references.input.value.trim();
  if (value === "") {
    return false;
  }
  return promptValidate === null || promptValidate(value);
}

function updateConfirmEnabled(): void {
  const references = refs();
  if (references === null) {
    return;
  }
  references.confirm.disabled =
    activeMode === "prompt" && !isPromptValueValid(references);
}

function close(value: unknown): void {
  const references = refs();
  if (references === null) {
    return;
  }
  references.root.classList.add("hidden");
  references.root.classList.remove("flex");
  references.confirm.disabled = false;
  promptValidate = null;
  document.removeEventListener("keydown", onKeydown, true);
  if (activeResolver !== null) {
    const resolver = activeResolver;
    activeResolver = null;
    activeMode = null;
    resolver(value);
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    event.preventDefault();
    close(activeMode === "confirm" ? false : null);
  } else if (event.key === "Enter" && activeMode === "prompt") {
    event.preventDefault();
    const references = refs();
    if (references !== null && isPromptValueValid(references)) {
      close(references.input.value.trim());
    }
  }
}

function wireOnce(references: ModalRefs): void {
  if (references.root.dataset.wired === "true") {
    return;
  }
  references.root.dataset.wired = "true";
  references.cancel.addEventListener("click", () =>
    close(activeMode === "confirm" ? false : null),
  );
  references.confirm.addEventListener("click", () => {
    if (activeMode === "prompt") {
      if (!isPromptValueValid(references)) {
        return;
      }
      close(references.input.value.trim());
      return;
    }
    close(true);
  });
  references.input.addEventListener("input", updateConfirmEnabled);
  references.backdrop.addEventListener("click", () =>
    close(activeMode === "confirm" ? false : null),
  );
}

export function promptModal(options: PromptOptions): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    const references = refs();
    if (references === null) {
      resolve(null);
      return;
    }
    wireOnce(references);

    references.title.textContent = options.title;
    references.message.classList.add("hidden");
    references.message.textContent = "";
    references.field.classList.remove("hidden");
    references.field.classList.add("flex");
    references.label.textContent = options.label;
    references.input.value = options.initial ?? "";
    references.input.placeholder = options.placeholder ?? "";
    references.confirm.textContent = options.primary ?? "Save";
    references.confirm.classList.remove(
      "bg-danger",
      "enabled:hover:opacity-90",
    );
    references.confirm.classList.add(
      "bg-accent",
      "enabled:hover:bg-accent-bright",
    );

    promptValidate = options.validate ?? null;
    activeMode = "prompt";
    activeResolver = resolve as (value: unknown) => void;
    updateConfirmEnabled();

    references.root.classList.remove("hidden");
    references.root.classList.add("flex");
    document.addEventListener("keydown", onKeydown, true);
    setTimeout(() => {
      references.input.focus();
      references.input.select();
    }, 0);
  });
}

export function confirmModal(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const references = refs();
    if (references === null) {
      resolve(false);
      return;
    }
    wireOnce(references);

    references.title.textContent = options.title;
    references.message.classList.remove("hidden");
    references.message.textContent = options.message;
    references.field.classList.add("hidden");
    references.field.classList.remove("flex");
    references.confirm.textContent = options.primary ?? "Confirm";
    if (options.danger === true) {
      references.confirm.classList.remove(
        "bg-accent",
        "enabled:hover:bg-accent-bright",
      );
      references.confirm.classList.add("bg-danger", "enabled:hover:opacity-90");
    } else {
      references.confirm.classList.remove(
        "bg-danger",
        "enabled:hover:opacity-90",
      );
      references.confirm.classList.add(
        "bg-accent",
        "enabled:hover:bg-accent-bright",
      );
    }

    promptValidate = null;
    activeMode = "confirm";
    activeResolver = resolve as (value: unknown) => void;
    updateConfirmEnabled();

    references.root.classList.remove("hidden");
    references.root.classList.add("flex");
    document.addEventListener("keydown", onKeydown, true);
    setTimeout(() => {
      references.confirm.focus();
    }, 0);
  });
}
