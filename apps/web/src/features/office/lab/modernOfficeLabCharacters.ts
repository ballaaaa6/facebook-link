import aiWorkbotSheet from "../../../../../../assets/game/characters/ai-workbot/runtime-spritesheet-v3.webp";
import aiWorkbotSheet2x from "../../../../../../assets/game/characters/ai-workbot/runtime-spritesheet-v3@2x.webp";
import annaSheet from "../../../../../../assets/game/characters/anna/runtime-spritesheet-v3.webp";
import annaSheet2x from "../../../../../../assets/game/characters/anna/runtime-spritesheet-v3@2x.webp";
import asukaSheet from "../../../../../../assets/game/characters/asuka-2/runtime-spritesheet-v3.webp";
import asukaSheet2x from "../../../../../../assets/game/characters/asuka-2/runtime-spritesheet-v3@2x.webp";
import baobaoSheet from "../../../../../../assets/game/characters/baobao-2/runtime-spritesheet-v3.webp";
import baobaoSheet2x from "../../../../../../assets/game/characters/baobao-2/runtime-spritesheet-v3@2x.webp";
import doraemonSheet from "../../../../../../assets/game/characters/doraemon/runtime-spritesheet-v4.webp";
import doraemonSheet2x from "../../../../../../assets/game/characters/doraemon/runtime-spritesheet-v4@2x.webp";
import einsteinSheet from "../../../../../../assets/game/characters/einstein/runtime-spritesheet-v3.webp";
import einsteinSheet2x from "../../../../../../assets/game/characters/einstein/runtime-spritesheet-v3@2x.webp";
import gugugagaSheet from "../../../../../../assets/game/characters/gugugaga/runtime-spritesheet-v3.webp";
import gugugagaSheet2x from "../../../../../../assets/game/characters/gugugaga/runtime-spritesheet-v3@2x.webp";
import itachiSheet from "../../../../../../assets/game/characters/itachi/runtime-spritesheet-v3.webp";
import itachiSheet2x from "../../../../../../assets/game/characters/itachi/runtime-spritesheet-v3@2x.webp";
import jesusSheet from "../../../../../../assets/game/characters/jesus/runtime-spritesheet-v3.webp";
import jesusSheet2x from "../../../../../../assets/game/characters/jesus/runtime-spritesheet-v3@2x.webp";
import lianSheet from "../../../../../../assets/game/characters/lian-3/runtime-spritesheet-v3.webp";
import lianSheet2x from "../../../../../../assets/game/characters/lian-3/runtime-spritesheet-v3@2x.webp";
import mikuSheet from "../../../../../../assets/game/characters/miku/runtime-spritesheet-v3.webp";
import mikuSheet2x from "../../../../../../assets/game/characters/miku/runtime-spritesheet-v3@2x.webp";
import naiLongSheet from "../../../../../../assets/game/characters/nai-long/runtime-spritesheet-v3.webp";
import naiLongSheet2x from "../../../../../../assets/game/characters/nai-long/runtime-spritesheet-v3@2x.webp";
import noirSheet from "../../../../../../assets/game/characters/noir-webling/runtime-spritesheet-v3.webp";
import noirSheet2x from "../../../../../../assets/game/characters/noir-webling/runtime-spritesheet-v3@2x.webp";
import qqPenguinSheet from "../../../../../../assets/game/characters/qq-penguin/runtime-spritesheet-v3.webp";
import qqPenguinSheet2x from "../../../../../../assets/game/characters/qq-penguin/runtime-spritesheet-v3@2x.webp";
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

export interface PrototypeCharacterReviewEntry {
  id: string;
  label: string;
  definition: CharacterDefinition;
  roster: "active" | "alternate";
}

const characterDefinitions = {
  "ai-workbot": stagedCharacter("ai-workbot", aiWorkbotSheet, aiWorkbotSheet2x),
  anna: stagedCharacter("anna", annaSheet, annaSheet2x),
  "asuka-2": stagedCharacter("asuka-2", asukaSheet, asukaSheet2x),
  "baobao-2": stagedCharacter("baobao-2", baobaoSheet, baobaoSheet2x),
  doraemon: stagedCharacter("doraemon", doraemonSheet, doraemonSheet2x),
  einstein: stagedCharacter("einstein", einsteinSheet, einsteinSheet2x),
  gugugaga: stagedCharacter("gugugaga", gugugagaSheet, gugugagaSheet2x),
  itachi: stagedCharacter("itachi", itachiSheet, itachiSheet2x),
  jesus: stagedCharacter("jesus", jesusSheet, jesusSheet2x),
  "lian-3": stagedCharacter("lian-3", lianSheet, lianSheet2x),
  miku: stagedCharacter("miku", mikuSheet, mikuSheet2x),
  "nai-long": stagedCharacter("nai-long", naiLongSheet, naiLongSheet2x),
  "noir-webling": stagedCharacter("noir-webling", noirSheet, noirSheet2x),
  "qq-penguin": stagedCharacter("qq-penguin", qqPenguinSheet, qqPenguinSheet2x),
  "rem-xl": stagedCharacter("rem-xl", remSheet, remSheet2x),
  ruri: stagedCharacter("ruri", ruriSheet, ruriSheet2x),
  "taffy-2": stagedCharacter("taffy-2", taffySheet, taffySheet2x),
  "yinyue-2": stagedCharacter("yinyue-2", yinyueSheet, yinyueSheet2x),
} as const;

export const modernOfficeLabCharacters: Readonly<Record<string, CharacterDefinition>> = {
  "market-scout": characterDefinitions["yinyue-2"],
  "product-ranker": characterDefinitions.einstein,
  "growth-strategist": characterDefinitions.ruri,
  "performance-analyst": characterDefinitions["noir-webling"],
  "gemini-copywriter": characterDefinitions.anna,
  "flow-visual-producer": characterDefinitions["taffy-2"],
  "link-attribution": characterDefinitions.doraemon,
  "qa-editor": characterDefinitions["rem-xl"],
  publisher: characterDefinitions.miku,
  "session-keeper": characterDefinitions["ai-workbot"],
};

export const prototypeCharacterReviewRoster: readonly PrototypeCharacterReviewEntry[] = [
  { id: "yinyue-2", label: "Yinyue", definition: characterDefinitions["yinyue-2"], roster: "active" },
  { id: "einstein", label: "Einstein", definition: characterDefinitions.einstein, roster: "active" },
  { id: "ruri", label: "Ruri", definition: characterDefinitions.ruri, roster: "active" },
  { id: "noir-webling", label: "Noir", definition: characterDefinitions["noir-webling"], roster: "active" },
  { id: "anna", label: "Anna", definition: characterDefinitions.anna, roster: "active" },
  { id: "taffy-2", label: "Taffy", definition: characterDefinitions["taffy-2"], roster: "active" },
  { id: "doraemon", label: "Doraemon", definition: characterDefinitions.doraemon, roster: "active" },
  { id: "rem-xl", label: "Rem", definition: characterDefinitions["rem-xl"], roster: "active" },
  { id: "miku", label: "Miku", definition: characterDefinitions.miku, roster: "active" },
  { id: "ai-workbot", label: "AI Workbot", definition: characterDefinitions["ai-workbot"], roster: "active" },
  { id: "asuka-2", label: "Asuka", definition: characterDefinitions["asuka-2"], roster: "alternate" },
  { id: "baobao-2", label: "Baobao", definition: characterDefinitions["baobao-2"], roster: "alternate" },
  { id: "gugugaga", label: "Gugugaga", definition: characterDefinitions.gugugaga, roster: "alternate" },
  { id: "itachi", label: "Itachi", definition: characterDefinitions.itachi, roster: "alternate" },
  { id: "jesus", label: "Jesus", definition: characterDefinitions.jesus, roster: "alternate" },
  { id: "lian-3", label: "Lian", definition: characterDefinitions["lian-3"], roster: "alternate" },
  { id: "nai-long", label: "Nai-long", definition: characterDefinitions["nai-long"], roster: "alternate" },
  { id: "qq-penguin", label: "QQ Penguin", definition: characterDefinitions["qq-penguin"], roster: "alternate" },
];
