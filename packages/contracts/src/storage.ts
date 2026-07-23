import type { IsoDateTime, WorkspaceScoped } from "./identity";

export interface StoredObject extends WorkspaceScoped {
  key: string;
  sha256: string;
  byteLength: number;
  contentType: string;
  createdAt: IsoDateTime;
}

export interface PutObjectInput extends WorkspaceScoped {
  bytes: Uint8Array;
  contentType: string;
  extension: string;
}

export interface ObjectStore {
  put(input: PutObjectInput): Promise<StoredObject>;
  read(key: string): Promise<Uint8Array>;
  exists(key: string): Promise<boolean>;
  stat(key: string): Promise<StoredObject | undefined>;
  delete(key: string): Promise<void>;
}

export interface AssetGateway {
  previewUrl(objectKey: string): Promise<string>;
}
