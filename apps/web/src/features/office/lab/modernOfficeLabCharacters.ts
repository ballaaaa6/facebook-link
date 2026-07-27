import aiWorkbotSheet from "../../../../../../assets/game/characters/ai-workbot/runtime-spritesheet-v3.webp";
import aiWorkbotSheet2x from "../../../../../../assets/game/characters/ai-workbot/runtime-spritesheet-v3@2x.webp";
import annaSheet from "../../../../../../assets/game/characters/anna/runtime-spritesheet-v3.webp";
import annaSheet2x from "../../../../../../assets/game/characters/anna/runtime-spritesheet-v3@2x.webp";
import doraemonSheet from "../../../../../../assets/game/characters/doraemon/runtime-spritesheet-v4.webp";
import doraemonSheet2x from "../../../../../../assets/game/characters/doraemon/runtime-spritesheet-v4@2x.webp";
import einsteinSheet from "../../../../../../assets/game/characters/einstein/runtime-spritesheet-v3.webp";
import einsteinSheet2x from "../../../../../../assets/game/characters/einstein/runtime-spritesheet-v3@2x.webp";
import mikuSheet from "../../../../../../assets/game/characters/miku/runtime-spritesheet-v3.webp";
import mikuSheet2x from "../../../../../../assets/game/characters/miku/runtime-spritesheet-v3@2x.webp";
import noirSheet from "../../../../../../assets/game/characters/noir-webling/runtime-spritesheet-v3.webp";
import noirSheet2x from "../../../../../../assets/game/characters/noir-webling/runtime-spritesheet-v3@2x.webp";
import remSheet from "../../../../../../assets/game/characters/rem-xl/runtime-spritesheet-v3.webp";
import remSheet2x from "../../../../../../assets/game/characters/rem-xl/runtime-spritesheet-v3@2x.webp";
import ruriSheet from "../../../../../../assets/game/characters/ruri/runtime-spritesheet-v3.webp";
import ruriSheet2x from "../../../../../../assets/game/characters/ruri/runtime-spritesheet-v3@2x.webp";
import taffySheet from "../../../../../../assets/game/characters/taffy-2/runtime-spritesheet-v3.webp";
import taffySheet2x from "../../../../../../assets/game/characters/taffy-2/runtime-spritesheet-v3@2x.webp";
import yinyueSheet from "../../../../../../assets/game/characters/yinyue-2/runtime-spritesheet-v3.webp";
import yinyueSheet2x from "../../../../../../assets/game/characters/yinyue-2/runtime-spritesheet-v3@2x.webp";
import type { CharacterDefinition } from "../characterRegistry";

const stagedCharacter = (
  sourceSlug: string,
  sheet: string,
  sheet2x: string,
): CharacterDefinition => ({
  sourceSlug,
  sheet,
  sheet2x,
  rows: 15,
});

export const modernOfficeLabCharacters: Readonly<Record<string, CharacterDefinition>> = {
  "market-scout": stagedCharacter("yinyue-2", yinyueSheet, yinyueSheet2x),
  "product-ranker": stagedCharacter("einstein", einsteinSheet, einsteinSheet2x),
  "growth-strategist": stagedCharacter("ruri", ruriSheet, ruriSheet2x),
  "performance-analyst": stagedCharacter("noir-webling", noirSheet, noirSheet2x),
  "gemini-copywriter": stagedCharacter("anna", annaSheet, annaSheet2x),
  "flow-visual-producer": stagedCharacter("taffy-2", taffySheet, taffySheet2x),
  "link-attribution": stagedCharacter("doraemon", doraemonSheet, doraemonSheet2x),
  "qa-editor": stagedCharacter("rem-xl", remSheet, remSheet2x),
  publisher: stagedCharacter("miku", mikuSheet, mikuSheet2x),
  "session-keeper": stagedCharacter("ai-workbot", aiWorkbotSheet, aiWorkbotSheet2x),
};
