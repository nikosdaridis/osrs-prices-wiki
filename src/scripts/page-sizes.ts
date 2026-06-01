const STORAGE_KEY = "osrs-prices-page-sizes";

export const PREDEFINED_PAGE_SIZES: readonly number[] = [25, 50, 100, 250];
export const MIN_PAGE_SIZE = 1;
export const MAX_PAGE_SIZE = 9999;

export function isValidPageSize(size: number): boolean {
  return (
    Number.isInteger(size) && size >= MIN_PAGE_SIZE && size <= MAX_PAGE_SIZE
  );
}

function read(): number[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (value): value is number =>
        typeof value === "number" && isValidPageSize(value),
    );
  } catch {
    return [];
  }
}

function write(sizes: number[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
  } catch (error) {
    console.warn("page-sizes: localStorage write failed", error);
  }
}

export function listCustomPageSizes(): number[] {
  const unique = new Set<number>(
    read().filter((size) => !PREDEFINED_PAGE_SIZES.includes(size)),
  );
  return [...unique].sort((left, right) => left - right);
}

export function saveCustomPageSize(size: number): void {
  if (!isValidPageSize(size) || PREDEFINED_PAGE_SIZES.includes(size)) {
    return;
  }
  const sizes = listCustomPageSizes();
  if (sizes.includes(size)) {
    return;
  }
  write([...sizes, size]);
}

export function deleteCustomPageSize(size: number): void {
  write(listCustomPageSizes().filter((saved) => saved !== size));
}
