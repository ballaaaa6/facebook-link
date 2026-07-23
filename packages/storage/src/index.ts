import { createHash } from "node:crypto";
import { access, mkdir, readFile, rename, rm, stat as fileStat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import type { ObjectStore, PutObjectInput, StoredObject } from "@affiliate-ops/contracts";

function safeSegment(value: string, label: string): string {
  const normalized = value.replace(/[^a-zA-Z0-9-]/g, "");
  if (!normalized) throw new Error(`${label} must contain letters, numbers, or hyphens.`);
  return normalized;
}

function assertInsideRoot(root: string, candidate: string): void {
  const pathFromRoot = relative(root, candidate);
  if (pathFromRoot.startsWith("..") || pathFromRoot === "") {
    throw new Error("Object key resolved outside the storage root.");
  }
}

export class LocalFilesystemStore implements ObjectStore {
  readonly #root: string;

  constructor(root: string) {
    this.#root = resolve(root);
  }

  async put(input: PutObjectInput): Promise<StoredObject> {
    const workspace = safeSegment(input.workspaceId, "workspaceId");
    const extension = safeSegment(input.extension.replace(/^\./, ""), "extension").toLowerCase();
    const sha256 = createHash("sha256").update(input.bytes).digest("hex");
    const key = join(workspace, "sha256", sha256.slice(0, 2), sha256.slice(2, 4), `${sha256}.${extension}`).replaceAll("\\", "/");
    const target = this.#resolveKey(key);
    const metadata: StoredObject = {
      workspaceId: input.workspaceId,
      key,
      sha256,
      byteLength: input.bytes.byteLength,
      contentType: input.contentType,
      createdAt: new Date().toISOString(),
    };

    await mkdir(dirname(target), { recursive: true });
    if (!(await this.exists(key))) {
      const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(temporary, input.bytes, { flag: "wx" });
      await rename(temporary, target);
      await writeFile(`${target}.meta.json`, `${JSON.stringify(metadata, null, 2)}\n`, { flag: "wx" });
    }
    return (await this.stat(key)) ?? metadata;
  }

  async read(key: string): Promise<Uint8Array> {
    return readFile(this.#resolveKey(key));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.#resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }

  async stat(key: string): Promise<StoredObject | undefined> {
    const target = this.#resolveKey(key);
    try {
      const metadata = JSON.parse(await readFile(`${target}.meta.json`, "utf8")) as StoredObject;
      const stats = await fileStat(target);
      return { ...metadata, byteLength: stats.size };
    } catch {
      return undefined;
    }
  }

  async delete(key: string): Promise<void> {
    const target = this.#resolveKey(key);
    await rm(target, { force: true });
    await rm(`${target}.meta.json`, { force: true });
  }

  #resolveKey(key: string): string {
    if (key.includes("..") || extname(key) === "") throw new Error("Invalid object key.");
    const target = resolve(this.#root, key);
    assertInsideRoot(this.#root, target);
    return target;
  }
}
