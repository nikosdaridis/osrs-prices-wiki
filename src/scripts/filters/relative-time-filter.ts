import type {
  IDoesFilterPassParams,
  IFilterComp,
  IFilterParams,
} from "ag-grid-community";
import type { Item } from "../types";
import { ThemedSelect, type ThemedSelectOption } from "./themed-select";

export type RelativeTimeDirection = "within" | "older";
export type RelativeTimeUnit =
  | "seconds"
  | "minutes"
  | "hours"
  | "days"
  | "months";

export interface RelativeTimeFilterModel {
  direction: RelativeTimeDirection;
  value: number;
  unit: RelativeTimeUnit;
}

const SECONDS_PER_UNIT: Readonly<Record<RelativeTimeUnit, number>> = {
  seconds: 1,
  minutes: 60,
  hours: 3_600,
  days: 86_400,
  months: 2_628_000,
};

const DIRECTION_LABELS: Readonly<Record<RelativeTimeDirection, string>> = {
  within: "Within last",
  older: "Older than",
};

const UNIT_LABELS: Readonly<Record<RelativeTimeUnit, string>> = {
  seconds: "Seconds",
  minutes: "Minutes",
  hours: "Hours",
  days: "Days",
  months: "Months",
};

const DEFAULT_DIRECTION: RelativeTimeDirection = "within";
const DEFAULT_UNIT: RelativeTimeUnit = "hours";
const MILLISECONDS_PER_SECOND = 1_000;

function toOptions<TKey extends string>(
  labels: Readonly<Record<TKey, string>>,
): ThemedSelectOption<TKey>[] {
  return (Object.keys(labels) as TKey[]).map((value) => ({
    value,
    label: labels[value],
  }));
}

function isDirection(value: string): value is RelativeTimeDirection {
  return value === "within" || value === "older";
}

function isUnit(value: string): value is RelativeTimeUnit {
  return Object.prototype.hasOwnProperty.call(SECONDS_PER_UNIT, value);
}

export class RelativeTimeFilter implements IFilterComp<Item> {
  private _parameters!: IFilterParams<Item>;
  private _guiElement!: HTMLDivElement;
  private _directionSelect!: ThemedSelect<RelativeTimeDirection>;
  private _valueInput!: HTMLInputElement;
  private _unitSelect!: ThemedSelect<RelativeTimeUnit>;

  public init(parameters: IFilterParams<Item>): void {
    this._parameters = parameters;
    const onChange = (): void => this._parameters.filterChangedCallback();

    this._guiElement = document.createElement("div");
    this._guiElement.className = "osrs-filter";

    this._directionSelect = new ThemedSelect(
      toOptions(DIRECTION_LABELS),
      DEFAULT_DIRECTION,
      onChange,
    );

    this._unitSelect = new ThemedSelect(
      toOptions(UNIT_LABELS),
      DEFAULT_UNIT,
      onChange,
    );

    // AG Grid input markup so the theme styles the number field, the clear button
    // is injected by the shared onFilterOpened decorator (see clear-button.ts).
    const inputField: HTMLDivElement = document.createElement("div");
    inputField.className = "ag-input-field ag-text-field osrs-filter__value";
    const inputWrapper: HTMLDivElement = document.createElement("div");
    inputWrapper.className = "ag-wrapper ag-input-wrapper";
    inputWrapper.setAttribute("role", "presentation");

    this._valueInput = document.createElement("input");
    this._valueInput.className = "ag-input-field-input ag-text-field-input";
    this._valueInput.type = "number";
    this._valueInput.min = "1";
    this._valueInput.step = "1";
    this._valueInput.inputMode = "numeric";
    this._valueInput.placeholder = "0";
    this._valueInput.addEventListener("input", onChange);

    inputWrapper.append(this._valueInput);
    inputField.append(inputWrapper);

    const row: HTMLDivElement = document.createElement("div");
    row.className = "osrs-filter__row";
    row.append(inputField, this._unitSelect.element);

    this._guiElement.append(this._directionSelect.element, row);
  }

  public getGui(): HTMLElement {
    return this._guiElement;
  }

  public isFilterActive(): boolean {
    return this.enteredValue() !== null;
  }

  public doesFilterPass(parameters: IDoesFilterPassParams<Item>): boolean {
    const value = this.enteredValue();
    if (value === null) {
      return true;
    }
    const timestamp = this._parameters.getValue<number | null>(parameters.node);
    if (timestamp === null || timestamp === undefined) {
      return false;
    }
    const nowSeconds = Date.now() / MILLISECONDS_PER_SECOND;
    const cutoffSeconds =
      nowSeconds - value * SECONDS_PER_UNIT[this._unitSelect.getValue()];
    return this._directionSelect.getValue() === "within"
      ? timestamp >= cutoffSeconds
      : timestamp < cutoffSeconds;
  }

  public getModel(): RelativeTimeFilterModel | null {
    const value = this.enteredValue();
    if (value === null) {
      return null;
    }
    return {
      direction: this._directionSelect.getValue(),
      value,
      unit: this._unitSelect.getValue(),
    };
  }

  public setModel(model: RelativeTimeFilterModel | null | undefined): void {
    if (model === null || model === undefined) {
      this._directionSelect.setValue(DEFAULT_DIRECTION);
      this._valueInput.value = "";
      this._unitSelect.setValue(DEFAULT_UNIT);
      return;
    }
    this._directionSelect.setValue(
      isDirection(model.direction) ? model.direction : DEFAULT_DIRECTION,
    );
    this._valueInput.value =
      Number.isFinite(model.value) && model.value > 0
        ? String(model.value)
        : "";
    this._unitSelect.setValue(isUnit(model.unit) ? model.unit : DEFAULT_UNIT);
  }

  public getModelAsString(model: RelativeTimeFilterModel | null): string {
    if (model === null) {
      return "";
    }
    return `${DIRECTION_LABELS[model.direction]} ${model.value} ${UNIT_LABELS[model.unit]}`;
  }

  public refresh(newParameters: IFilterParams<Item>): boolean {
    this._parameters = newParameters;
    return true;
  }

  public destroy(): void {
    this._directionSelect.destroy();
    this._unitSelect.destroy();
  }

  private enteredValue(): number | null {
    const raw = this._valueInput.value.trim();
    if (raw === "") {
      return null;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return Math.floor(parsed);
  }
}
