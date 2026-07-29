import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const same = (first, second) =>
  JSON.stringify(first) === JSON.stringify(second);
export const readText = (path) => readFileSync(join(root, path), "utf8");
export const readJson = (path) => JSON.parse(readText(path));

export function sha256(path) {
  const bytes = readFileSync(join(root, path));
  const normalized = /\.(json|md|mjs|py|ts|tsx)$/.test(path)
    ? Buffer.from(bytes.toString("utf8").replaceAll("\r\n", "\n"), "utf8")
    : bytes;
  return createHash("sha256").update(normalized).digest("hex");
}

export function pngSize(path) {
  const bytes = readFileSync(join(root, path));
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!bytes.subarray(0, 8).equals(signature)) {
    throw new Error(`Not a PNG: ${path}`);
  }
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

export function recursiveFiles(directory) {
  if (!existsSync(join(root, directory))) return [];
  return readdirSync(join(root, directory), { recursive: true })
    .filter((entry) => statSync(join(root, directory, entry)).isFile())
    .map((entry) => join(directory, entry).replaceAll("\\", "/"))
    .sort();
}

export function fileHashMatches(path, expected, size) {
  return typeof path === "string"
    && existsSync(join(root, path))
    && sha256(path) === expected
    && (!size || same(pngSize(path), size));
}
