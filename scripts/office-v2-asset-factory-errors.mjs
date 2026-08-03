export class AssetFactoryError extends Error {
  constructor(code, message, context = {}) {
    super(`[${code}] ${message}`);
    this.name = "AssetFactoryError";
    this.code = code;
    this.owner = "asset";
    this.version = 1;
    this.context = context;
    this.diagnostic = { code, owner: "asset", version: 1, message, context };
  }
}

export function fail(code, message, context = {}) {
  throw new AssetFactoryError(code, message, context);
}
