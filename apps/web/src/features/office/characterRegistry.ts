import aiWorkbotSheet from "../../../../../assets/game/characters/ai-workbot/runtime-spritesheet-v2.webp";
import aiWorkbotSheet2x from "../../../../../assets/game/characters/ai-workbot/runtime-spritesheet-v2@2x.webp";
import doraemonSheet from "../../../../../assets/game/characters/doraemon/runtime-spritesheet-v2.webp";
import doraemonSheet2x from "../../../../../assets/game/characters/doraemon/runtime-spritesheet-v2@2x.webp";
import einsteinSheet from "../../../../../assets/game/characters/einstein/runtime-spritesheet-v2.webp";
import einsteinSheet2x from "../../../../../assets/game/characters/einstein/runtime-spritesheet-v2@2x.webp";
import luffySheet from "../../../../../assets/game/characters/luffy/runtime-spritesheet-v2.webp";
import luffySheet2x from "../../../../../assets/game/characters/luffy/runtime-spritesheet-v2@2x.webp";
import noirWeblingSheet from "../../../../../assets/game/characters/noir-webling/runtime-spritesheet-v2.webp";
import noirWeblingSheet2x from "../../../../../assets/game/characters/noir-webling/runtime-spritesheet-v2@2x.webp";
import remSheet from "../../../../../assets/game/characters/rem-xl/runtime-spritesheet-v2.webp";
import remSheet2x from "../../../../../assets/game/characters/rem-xl/runtime-spritesheet-v2@2x.webp";
import ruriSheet from "../../../../../assets/game/characters/ruri/runtime-spritesheet-v2.webp";
import ruriSheet2x from "../../../../../assets/game/characters/ruri/runtime-spritesheet-v2@2x.webp";
import taffySheet from "../../../../../assets/game/characters/taffy-2/runtime-spritesheet-v2.webp";
import taffySheet2x from "../../../../../assets/game/characters/taffy-2/runtime-spritesheet-v2@2x.webp";
import tianSheet from "../../../../../assets/game/characters/tian-zekun-2/runtime-spritesheet-v2.webp";
import tianSheet2x from "../../../../../assets/game/characters/tian-zekun-2/runtime-spritesheet-v2@2x.webp";
import yinyueSheet from "../../../../../assets/game/characters/yinyue-2/runtime-spritesheet-v2.webp";
import yinyueSheet2x from "../../../../../assets/game/characters/yinyue-2/runtime-spritesheet-v2@2x.webp";

export type CharacterState = "celebrating" | "failed" | "idle" | "review" | "seated" | "waiting" | "walk-left" | "walk-right" | "waving" | "working";

export interface CharacterDefinition {
  sheet: string;
  sheet2x: string;
  sourceSlug: string;
}

export const characterStates: Record<CharacterState, { row: number; frames: number; fps: number; loop: boolean }> = {
  idle: { row: 0, frames: 6, fps: 4, loop: true },
  "walk-right": { row: 1, frames: 8, fps: 9, loop: true },
  "walk-left": { row: 2, frames: 8, fps: 9, loop: true },
  waving: { row: 3, frames: 4, fps: 5, loop: true },
  celebrating: { row: 4, frames: 5, fps: 7, loop: false },
  seated: { row: 4, frames: 1, fps: 1, loop: true },
  failed: { row: 5, frames: 8, fps: 6, loop: false },
  waiting: { row: 6, frames: 6, fps: 4, loop: true },
  working: { row: 7, frames: 6, fps: 7, loop: true },
  review: { row: 8, frames: 6, fps: 5, loop: true },
};

export const characterRegistry: Record<string, CharacterDefinition> = {
  "market-scout": { sheet: noirWeblingSheet, sheet2x: noirWeblingSheet2x, sourceSlug: "noir-webling" },
  "product-ranker": { sheet: einsteinSheet, sheet2x: einsteinSheet2x, sourceSlug: "einstein" },
  "growth-strategist": { sheet: ruriSheet, sheet2x: ruriSheet2x, sourceSlug: "ruri" },
  "performance-analyst": { sheet: tianSheet, sheet2x: tianSheet2x, sourceSlug: "tian-zekun-2" },
  "gemini-copywriter": { sheet: yinyueSheet, sheet2x: yinyueSheet2x, sourceSlug: "yinyue-2" },
  "flow-visual-producer": { sheet: taffySheet, sheet2x: taffySheet2x, sourceSlug: "taffy-2" },
  "link-attribution": { sheet: doraemonSheet, sheet2x: doraemonSheet2x, sourceSlug: "doraemon" },
  "qa-editor": { sheet: remSheet, sheet2x: remSheet2x, sourceSlug: "rem-xl" },
  publisher: { sheet: luffySheet, sheet2x: luffySheet2x, sourceSlug: "luffy" },
  "session-keeper": { sheet: aiWorkbotSheet, sheet2x: aiWorkbotSheet2x, sourceSlug: "ai-workbot" },
};

export function characterImageSet(character: CharacterDefinition) {
  return `image-set(url("${character.sheet}") 1x, url("${character.sheet2x}") 2x)`;
}
