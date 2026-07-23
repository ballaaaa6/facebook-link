import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const root = process.cwd();
export const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css"]);
const ignored = new Set(["node_modules", "dist", ".git", "runtime-data", "coverage"]);

export async function walk(directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

export async function sourceFiles() {
  return (await walk()).filter((file) => sourceExtensions.has(path.extname(file)));
}

export async function readLines(file) {
  return (await readFile(file, "utf8")).split(/\r?\n/);
}

export function relative(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}
