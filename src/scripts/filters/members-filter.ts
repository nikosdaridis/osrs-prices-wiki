import type {
  IDoesFilterPassParams,
  IFilterComp,
  IFilterParams,
} from "ag-grid-community";
import type { Item } from "../types";

export interface MembersFilterModel {
  members: boolean;
  free: boolean;
}

const CHECKED_CLASS = "ag-checked";

/**
 * Two checkbox filter for the boolean members column.
 * Active only when exactly one option is checked, both or neither checked shows everything.
 */
export class MembersFilter implements IFilterComp<Item> {
  private _parameters!: IFilterParams<Item>;
  private _guiElement!: HTMLDivElement;
  private _membersInput!: HTMLInputElement;
  private _freeInput!: HTMLInputElement;

  public init(parameters: IFilterParams<Item>): void {
    this._parameters = parameters;
    this._guiElement = document.createElement("div");
    this._guiElement.className = "osrs-filter osrs-filter--members";

    this._membersInput = this.buildCheckbox("Members");
    this._freeInput = this.buildCheckbox("Free to play");
    this.setChecked(this._membersInput, true);
    this.setChecked(this._freeInput, true);
  }

  public getGui(): HTMLElement {
    return this._guiElement;
  }

  public isFilterActive(): boolean {
    return this._membersInput.checked !== this._freeInput.checked;
  }

  public doesFilterPass(parameters: IDoesFilterPassParams<Item>): boolean {
    const isMember =
      this._parameters.getValue<boolean>(parameters.node) === true;
    return isMember ? this._membersInput.checked : this._freeInput.checked;
  }

  public getModel(): MembersFilterModel | null {
    if (!this.isFilterActive()) {
      return null;
    }
    return {
      members: this._membersInput.checked,
      free: this._freeInput.checked,
    };
  }

  public setModel(model: MembersFilterModel | null | undefined): void {
    if (model === null || model === undefined) {
      this.setChecked(this._membersInput, true);
      this.setChecked(this._freeInput, true);
      return;
    }
    this.setChecked(this._membersInput, model.members === true);
    this.setChecked(this._freeInput, model.free === true);
  }

  public getModelAsString(model: MembersFilterModel | null): string {
    if (model === null) {
      return "";
    }
    if (model.members && !model.free) {
      return "Members";
    }
    if (model.free && !model.members) {
      return "Free-to-play";
    }
    return "";
  }

  public refresh(newParameters: IFilterParams<Item>): boolean {
    this._parameters = newParameters;
    return true;
  }

  private buildCheckbox(labelText: string): HTMLInputElement {
    const row: HTMLLabelElement = document.createElement("label");
    row.className = "ag-checkbox ag-input-field osrs-filter__check";

    const wrapper: HTMLDivElement = document.createElement("div");
    wrapper.className = "ag-wrapper ag-input-wrapper ag-checkbox-input-wrapper";
    wrapper.setAttribute("role", "presentation");

    const input: HTMLInputElement = document.createElement("input");
    input.type = "checkbox";
    input.className = "ag-input-field-input ag-checkbox-input";
    input.addEventListener("change", () => {
      wrapper.classList.toggle(CHECKED_CLASS, input.checked);
      this._parameters.filterChangedCallback();
    });
    wrapper.append(input);

    const text: HTMLSpanElement = document.createElement("span");
    text.className = "ag-label";
    text.textContent = labelText;

    row.append(wrapper, text);
    this._guiElement.append(row);
    return input;
  }

  // Sets checkbox state and the wrapper's checked class together (no event fired).
  private setChecked(input: HTMLInputElement, checked: boolean): void {
    input.checked = checked;
    const wrapper: HTMLElement | null = input.closest(
      ".ag-checkbox-input-wrapper",
    );
    wrapper?.classList.toggle(CHECKED_CLASS, checked);
  }
}
