import aiWorkbotSheet from "../../../../../assets/game/characters/ai-workbot/runtime-spritesheet-v2.webp";
import aiWorkbotSheet2x from "../../../../../assets/game/characters/ai-workbot/runtime-spritesheet-v2@2x.webp";
import annaSheet from "../../../../../assets/game/characters/anna/spritesheet.webp";
import mikuSheet from "../../../../../assets/game/characters/miku/spritesheet.webp";
import doraemonSheet from "../../../../../assets/game/characters/doraemon/runtime-spritesheet-v3.webp";
import doraemonSheet2x from "../../../../../assets/game/characters/doraemon/runtime-spritesheet-v3@2x.webp";
import einsteinSheet from "../../../../../assets/game/characters/einstein/runtime-spritesheet-v2.webp";
import einsteinSheet2x from "../../../../../assets/game/characters/einstein/runtime-spritesheet-v2@2x.webp";
import noirWeblingSheet from "../../../../../assets/game/characters/noir-webling/runtime-spritesheet-v2.webp";
import noirWeblingSheet2x from "../../../../../assets/game/characters/noir-webling/runtime-spritesheet-v2@2x.webp";
import remSheet from "../../../../../assets/game/characters/rem-xl/runtime-spritesheet-v2.webp";
import remSheet2x from "../../../../../assets/game/characters/rem-xl/runtime-spritesheet-v2@2x.webp";
import ruriSheet from "../../../../../assets/game/characters/ruri/runtime-spritesheet-v2.webp";
import ruriSheet2x from "../../../../../assets/game/characters/ruri/runtime-spritesheet-v2@2x.webp";
import taffySheet from "../../../../../assets/game/characters/taffy-2/runtime-spritesheet-v2.webp";
import taffySheet2x from "../../../../../assets/game/characters/taffy-2/runtime-spritesheet-v2@2x.webp";
import yinyueSheet from "../../../../../assets/game/characters/yinyue-2/runtime-spritesheet-v2.webp";
import yinyueSheet2x from "../../../../../assets/game/characters/yinyue-2/runtime-spritesheet-v2@2x.webp";

export type CharacterState =
  | "celebrating"
  | "failed"
  | "inspect-front"
  | "interact-front"
  | "idle"
  | "lounge-front"
  | "lounging"
  | "review"
  | "seated"
  | "waiting"
  | "walk-down"
  | "walk-left"
  | "walk-right"
  | "walk-up"
  | "waving"
  | "working-back"
  | "working";

export interface CharacterDefinition {
  sheet: string;
  sheet2x: string;
  sourceSlug: string;
  rows?: number;
}

export interface StateConfig {
  row: number;
  frames: number;
  fps: number;
  loop: boolean;
}

export const characterStates9Row: Record<CharacterState, StateConfig> = {
  idle: { row: 0, frames: 6, fps: 4, loop: true },
  "walk-right": { row: 1, frames: 8, fps: 9, loop: true },
  "walk-left": { row: 2, frames: 8, fps: 9, loop: true },
  "walk-up": { row: 2, frames: 8, fps: 9, loop: true },
  "walk-down": { row: 1, frames: 8, fps: 9, loop: true },
  waving: { row: 3, frames: 4, fps: 5, loop: true },
  celebrating: { row: 4, frames: 5, fps: 7, loop: false },
  seated: { row: 4, frames: 1, fps: 1, loop: true },
  failed: { row: 5, frames: 8, fps: 6, loop: false },
  waiting: { row: 6, frames: 6, fps: 4, loop: true },
  working: { row: 7, frames: 6, fps: 7, loop: true },
  review: { row: 8, frames: 6, fps: 5, loop: true },
  lounging: { row: 0, frames: 6, fps: 4, loop: true },
  "working-back": { row: 7, frames: 6, fps: 7, loop: true },
  "interact-front": { row: 3, frames: 4, fps: 5, loop: true },
  "inspect-front": { row: 0, frames: 6, fps: 4, loop: true },
  "lounge-front": { row: 0, frames: 6, fps: 4, loop: true },
};

export const characterStates12Row: Record<CharacterState, StateConfig> = {
  idle: { row: 0, frames: 6, fps: 4, loop: true },
  "walk-right": { row: 1, frames: 8, fps: 9, loop: true },
  "walk-left": { row: 2, frames: 8, fps: 9, loop: true },
  "walk-up": { row: 3, frames: 8, fps: 9, loop: true },
  "walk-down": { row: 4, frames: 8, fps: 9, loop: true },
  waving: { row: 5, frames: 4, fps: 5, loop: true },
  celebrating: { row: 6, frames: 5, fps: 7, loop: false },
  seated: { row: 9, frames: 1, fps: 1, loop: true },
  failed: { row: 7, frames: 8, fps: 6, loop: false },
  waiting: { row: 8, frames: 6, fps: 4, loop: true },
  working: { row: 9, frames: 6, fps: 7, loop: true },
  review: { row: 10, frames: 6, fps: 5, loop: true },
  lounging: { row: 11, frames: 6, fps: 3, loop: true },
  "working-back": { row: 9, frames: 6, fps: 7, loop: true },
  "interact-front": { row: 5, frames: 4, fps: 5, loop: true },
  "inspect-front": { row: 0, frames: 6, fps: 4, loop: true },
  "lounge-front": { row: 11, frames: 6, fps: 3, loop: true },
};

export const characterStates13Row: Record<CharacterState, StateConfig> = {
  idle: { row: 0, frames: 6, fps: 4, loop: true },
  "walk-right": { row: 1, frames: 8, fps: 9, loop: true },
  "walk-left": { row: 2, frames: 8, fps: 9, loop: true },
  "walk-up": { row: 2, frames: 8, fps: 9, loop: true },
  "walk-down": { row: 1, frames: 8, fps: 9, loop: true },
  waving: { row: 3, frames: 4, fps: 5, loop: true },
  celebrating: { row: 4, frames: 5, fps: 7, loop: false },
  seated: { row: 12, frames: 6, fps: 4, loop: true },
  failed: { row: 5, frames: 8, fps: 6, loop: false },
  waiting: { row: 6, frames: 6, fps: 4, loop: true },
  working: { row: 7, frames: 6, fps: 7, loop: true },
  review: { row: 8, frames: 6, fps: 5, loop: true },
  lounging: { row: 12, frames: 6, fps: 4, loop: true },
  "working-back": { row: 9, frames: 6, fps: 7, loop: true },
  "interact-front": { row: 10, frames: 6, fps: 5, loop: true },
  "inspect-front": { row: 11, frames: 6, fps: 5, loop: true },
  "lounge-front": { row: 12, frames: 6, fps: 4, loop: true },
};

export const characterStates = characterStates9Row;

export function getCharacterStateConfig(character: CharacterDefinition | undefined, state: CharacterState): StateConfig {
  const table = character?.rows === 13
    ? characterStates13Row
    : character?.rows === 12
      ? characterStates12Row
      : characterStates9Row;
  return table[state] ?? table.idle;
}

export const characterRegistry: Record<string, CharacterDefinition> = {
  "market-scout": { sheet: yinyueSheet, sheet2x: yinyueSheet2x, sourceSlug: "yinyue-2" },
  "product-ranker": { sheet: einsteinSheet, sheet2x: einsteinSheet2x, sourceSlug: "einstein" },
  "growth-strategist": { sheet: ruriSheet, sheet2x: ruriSheet2x, sourceSlug: "ruri" },
  "performance-analyst": { sheet: noirWeblingSheet, sheet2x: noirWeblingSheet2x, sourceSlug: "noir-webling" },
  "gemini-copywriter": { sheet: annaSheet, sheet2x: annaSheet, sourceSlug: "anna" },
  "flow-visual-producer": { sheet: taffySheet, sheet2x: taffySheet2x, sourceSlug: "taffy-2" },
  "link-attribution": { sheet: doraemonSheet, sheet2x: doraemonSheet2x, sourceSlug: "doraemon", rows: 13 },
  "qa-editor": { sheet: remSheet, sheet2x: remSheet2x, sourceSlug: "rem-xl" },
  publisher: { sheet: mikuSheet, sheet2x: mikuSheet, sourceSlug: "miku" },
  "session-keeper": { sheet: aiWorkbotSheet, sheet2x: aiWorkbotSheet2x, sourceSlug: "ai-workbot" },
};

export function characterImageSet(character: CharacterDefinition) {
  return `image-set(url("${character.sheet}") 1x, url("${character.sheet2x}") 2x)`;
}
