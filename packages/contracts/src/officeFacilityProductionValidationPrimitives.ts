export type RecordValue = Record<string, unknown>;

export function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function requireValue(
  issues: string[],
  condition: boolean,
  message: string,
) {
  if (!condition) issues.push(message);
}

export function hasSha256(value: unknown) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function isBox(value: unknown) {
  return Array.isArray(value)
    && value.length === 4
    && value.every(Number.isInteger)
    && value[0] < value[2]
    && value[1] < value[3];
}

export function isIntegerPoint(value: unknown) {
  return isRecord(value) && Number.isInteger(value.x) && Number.isInteger(value.y);
}

export function validateFileHash(
  value: RecordValue,
  fileField: string,
  hashField: string,
  prefix: string,
  issues: string[],
) {
  requireValue(
    issues,
    typeof value[fileField] === "string"
      && (value[fileField] as string).startsWith(prefix),
    `${fileField} must use ${prefix}`,
  );
  requireValue(
    issues,
    hasSha256(value[hashField]),
    `${hashField} must be SHA-256`,
  );
}
