import test from "node:test";
import { assertRc03Evidence, loadRc03Fixtures } from "./office-v2-rc-03-evidence.mjs";

test("RC-03 bounded evidence proves assignment, revalidation, retry, cancellation, and restore inputs", () => {
  assertRc03Evidence(loadRc03Fixtures());
});
