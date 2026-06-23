/**
 * Self contained dropdown matching the grid's filter controls. AG Grid's Theming API injects its
 * widget CSS in a form that does NOT style hand-built markup (only the `--ag-*` variables cascade),
 * so reusing AG's `.ag-select-list` etc. classes leaves the element unstyled. This widget therefore
 * styles itself with the `--color-*` tokens (see `.osrs-select*` rules in global.css).
 */

const ACTIVE_OPTION_CLASS = "osrs-select__option--active";
const OPEN_CLASS = "osrs-select--open";
const DROPDOWN_Z_INDEX = "10000";
const CHEVRON_SVG =
  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>';

export interface ThemedSelectOption<TKey extends string> {
  value: TKey;
  label: string;
}

export class ThemedSelect<TKey extends string> {
  public readonly element: HTMLDivElement;

  private readonly _options: ReadonlyArray<ThemedSelectOption<TKey>>;
  private readonly _onChange: () => void;
  private readonly _controlElement: HTMLDivElement;
  private readonly _labelElement: HTMLSpanElement;
  private _value: TKey;

  private _listElement: HTMLDivElement | null = null;
  private _activeIndex = -1;

  private readonly _onDocumentPointerDown = (event: PointerEvent): void => {
    if (this._listElement === null) {
      return;
    }
    const target = event.target as Node | null;
    if (
      target !== null &&
      (this.element.contains(target) ||
        (this._listElement?.contains(target) ?? false))
    ) {
      return;
    }
    this.close();
  };

  private readonly _onReposition = (): void => this.close();

  public constructor(
    options: ReadonlyArray<ThemedSelectOption<TKey>>,
    initialValue: TKey,
    onChange: () => void,
  ) {
    this._options = options;
    this._onChange = onChange;
    this._value = initialValue;

    this.element = document.createElement("div");
    this.element.className = "osrs-select";

    this._controlElement = document.createElement("div");
    this._controlElement.className = "osrs-select__control";
    this._controlElement.tabIndex = 0;
    this._controlElement.setAttribute("role", "combobox");
    this._controlElement.setAttribute("aria-haspopup", "listbox");
    this._controlElement.setAttribute("aria-expanded", "false");

    this._labelElement = document.createElement("span");
    this._labelElement.className = "osrs-select__label";

    const chevronElement: HTMLSpanElement = document.createElement("span");
    chevronElement.className = "osrs-select__chevron";
    chevronElement.innerHTML = CHEVRON_SVG;

    this._controlElement.append(this._labelElement, chevronElement);
    this.element.append(this._controlElement);

    this.renderLabel();

    this._controlElement.addEventListener("click", () => this.toggle());
    this._controlElement.addEventListener("keydown", (event) =>
      this.onControlKeyDown(event),
    );
  }

  public getValue(): TKey {
    return this._value;
  }

  /** Sets the value without firing the change callback (for model restore). */
  public setValue(value: TKey): void {
    if (!this._options.some((option) => option.value === value)) {
      return;
    }
    this._value = value;
    this.renderLabel();
  }

  public destroy(): void {
    this.close();
  }

  private renderLabel(): void {
    const selected: ThemedSelectOption<TKey> | undefined = this._options.find(
      (option) => option.value === this._value,
    );
    this._labelElement.textContent = selected?.label ?? "";
  }

  private toggle(): void {
    if (this._listElement === null) {
      this.open();
    } else {
      this.close();
    }
  }

  private open(): void {
    if (this._listElement !== null) {
      return;
    }

    const list: HTMLDivElement = document.createElement("div");
    list.className = "osrs-select__list";
    list.setAttribute("role", "listbox");

    this._options.forEach((option, index) => {
      const item: HTMLDivElement = document.createElement("div");
      item.className = "osrs-select__option";
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(option.value === this._value));
      item.textContent = option.label;

      item.addEventListener("mouseenter", () => this.setActiveIndex(index));
      item.addEventListener("click", () => this.commit(option.value));
      list.append(item);
    });

    // Append to <body>, not the picker: AG positions the filter menu with an inline transform,
    // which would make this fixed positioned list resolve against the menu.
    // A body child has no transformed ancestor, so `fixed` is truly viewport relative and flush.
    // Self contained styling means it stays themed regardless of where it lives.
    document.body.append(list);
    this._listElement = list;
    this.positionList();

    this.element.classList.add(OPEN_CLASS);
    this._controlElement.setAttribute("aria-expanded", "true");
    this.setActiveIndex(
      this._options.findIndex((option) => option.value === this._value),
    );

    // Capture phase so the dropdown closes before inner handlers swallow the event.
    document.addEventListener("pointerdown", this._onDocumentPointerDown, true);
    window.addEventListener("scroll", this._onReposition, true);
    window.addEventListener("resize", this._onReposition);
  }

  private close(): void {
    if (this._listElement === null) {
      return;
    }
    document.removeEventListener(
      "pointerdown",
      this._onDocumentPointerDown,
      true,
    );
    window.removeEventListener("scroll", this._onReposition, true);
    window.removeEventListener("resize", this._onReposition);

    this._listElement.remove();
    this._listElement = null;
    this._activeIndex = -1;

    this.element.classList.remove(OPEN_CLASS);
    this._controlElement.setAttribute("aria-expanded", "false");
  }

  private positionList(): void {
    if (this._listElement === null) {
      return;
    }
    const rect: DOMRect = this._controlElement.getBoundingClientRect();
    const style: CSSStyleDeclaration = this._listElement.style;
    style.left = `${rect.left}px`;
    style.top = `${rect.bottom}px`;
    style.minWidth = `${rect.width}px`;
    style.zIndex = DROPDOWN_Z_INDEX;
  }

  private setActiveIndex(index: number): void {
    if (this._listElement === null) {
      return;
    }
    const items: HTMLCollection = this._listElement.children;
    const previous: Element | undefined = items[this._activeIndex];
    if (previous !== undefined) {
      previous.classList.remove(ACTIVE_OPTION_CLASS);
    }
    this._activeIndex = index;
    const active: Element | undefined = items[index];
    if (active !== undefined) {
      active.classList.add(ACTIVE_OPTION_CLASS);
      active.scrollIntoView({ block: "nearest" });
    }
  }

  private commit(value: TKey): void {
    const changed: boolean = value !== this._value;
    this._value = value;
    this.renderLabel();
    this.close();
    this._controlElement.focus();
    if (changed) {
      this._onChange();
    }
  }

  private onControlKeyDown(event: KeyboardEvent): void {
    if (this._listElement === null) {
      if (
        event.key === "ArrowDown" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        this.open();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.setActiveIndex(
          Math.min(this._activeIndex + 1, this._options.length - 1),
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        this.setActiveIndex(Math.max(this._activeIndex - 1, 0));
        break;
      case "Enter":
      case " ": {
        event.preventDefault();
        const activeOption = this._options[this._activeIndex];
        if (activeOption !== undefined) {
          this.commit(activeOption.value);
        }
        break;
      }
      case "Escape":
        event.preventDefault();
        this.close();
        this._controlElement.focus();
        break;
      default:
        break;
    }
  }
}
