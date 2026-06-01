export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function isPresent<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}
