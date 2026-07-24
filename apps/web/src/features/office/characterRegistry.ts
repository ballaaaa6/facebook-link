import aiWorkbotSheet from "../../../../../assets/game/characters/ai-workbot/spritesheet.webp";
import doraemonSheet from "../../../../../assets/game/characters/doraemon/spritesheet.webp";
import einsteinSheet from "../../../../../assets/game/characters/einstein/spritesheet.webp";
import luffySheet from "../../../../../assets/game/characters/luffy/spritesheet.webp";
import noirWeblingSheet from "../../../../../assets/game/characters/noir-webling/spritesheet.webp";
import remSheet from "../../../../../assets/game/characters/rem-xl/spritesheet.webp";
import ruriSheet from "../../../../../assets/game/characters/ruri/spritesheet.webp";
import taffySheet from "../../../../../assets/game/characters/taffy-2/spritesheet.webp";
import tianSheet from "../../../../../assets/game/characters/tian-zekun-2/spritesheet.webp";
import yinyueSheet from "../../../../../assets/game/characters/yinyue-2/spritesheet.webp";

export type CharacterState = "failed" | "idle" | "review" | "waiting" | "walk-left" | "walk-right" | "waving" | "working";

export interface CharacterDefinition {
  sheet: string;
  sourceSlug: string;
  scale: number;
}

export const characterStates: Record<CharacterState, { row: number; frames: number; fps: number }> = {
  idle: { row: 0, frames: 6, fps: 4 },
  "walk-right": { row: 1, frames: 8, fps: 9 },
  "walk-left": { row: 2, frames: 8, fps: 9 },
  waving: { row: 3, frames: 4, fps: 5 },
  failed: { row: 5, frames: 8, fps: 6 },
  waiting: { row: 6, frames: 6, fps: 4 },
  working: { row: 7, frames: 6, fps: 7 },
  review: { row: 8, frames: 6, fps: 5 },
};

export const characterRegistry: Record<string, CharacterDefinition> = {
  "market-scout": { sheet: noirWeblingSheet, sourceSlug: "noir-webling", scale: 0.72 },
  "product-ranker": { sheet: einsteinSheet, sourceSlug: "einstein", scale: 0.7 },
  "growth-strategist": { sheet: ruriSheet, sourceSlug: "ruri", scale: 0.72 },
  "performance-analyst": { sheet: tianSheet, sourceSlug: "tian-zekun-2", scale: 0.75 },
  "gemini-copywriter": { sheet: yinyueSheet, sourceSlug: "yinyue-2", scale: 0.73 },
  "flow-visual-producer": { sheet: taffySheet, sourceSlug: "taffy-2", scale: 0.72 },
  "link-attribution": { sheet: doraemonSheet, sourceSlug: "doraemon", scale: 0.7 },
  "qa-editor": { sheet: remSheet, sourceSlug: "rem-xl", scale: 0.75 },
  publisher: { sheet: luffySheet, sourceSlug: "luffy", scale: 0.73 },
  "session-keeper": { sheet: aiWorkbotSheet, sourceSlug: "ai-workbot", scale: 0.72 },
};
