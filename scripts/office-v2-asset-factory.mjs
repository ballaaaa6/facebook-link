import { resolve } from "node:path";
import { AssetFactoryError } from "./office-v2-asset-factory-errors.mjs";
import { encodeRgbaPng as encodePng, hashBytes } from "./office-v2-asset-factory-format.mjs";
import { buildAssetExport } from "./office-v2-asset-factory-build.mjs";
import { assertDimensions } from "./office-v2-asset-factory-validation.mjs";
import { runCli } from "./office-v2-asset-factory-cli.mjs";

/**
 * Local source-neutral input shape: ordered RGBA frames plus a fail-closed,
 * two-clean-build export recipe. Objects are canonicalized for hashes and
 * output paths are normalized to `/` separators.
 */
export { AssetFactoryError, buildAssetExport, hashBytes };

export function encodeRgbaPng(input = {}) {
  return encodePng(input, assertDimensions);
}

const modulePath = resolve(import.meta.dirname, "office-v2-asset-factory.mjs");
if (process.argv[1] && resolve(process.argv[1]) === modulePath) runCli();
