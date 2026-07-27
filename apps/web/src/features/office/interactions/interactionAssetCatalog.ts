import einsteinSheet from "../../../../../../assets/game/characters/einstein/runtime-spritesheet-v3.webp";
import einsteinSheet2x from "../../../../../../assets/game/characters/einstein/runtime-spritesheet-v3@2x.webp";
import coffeeMug from "../../../../../../assets/game/processed/office-interactions-v1/held-props/coffee-mug.png";
import envelope from "../../../../../../assets/game/processed/office-interactions-v1/held-props/envelope.png";
import juiceBox from "../../../../../../assets/game/processed/office-interactions-v1/held-props/juice-box.png";
import labelCard from "../../../../../../assets/game/processed/office-interactions-v1/held-props/label-card.png";
import notebook from "../../../../../../assets/game/processed/office-interactions-v1/held-props/notebook.png";
import paperSheet from "../../../../../../assets/game/processed/office-interactions-v1/held-props/paper-sheet.png";
import snackBag from "../../../../../../assets/game/processed/office-interactions-v1/held-props/snack-bag.png";
import smartphone from "../../../../../../assets/game/processed/office-interactions-v1/held-props/smartphone.png";
import sodaCan from "../../../../../../assets/game/processed/office-interactions-v1/held-props/soda-can.png";
import takeawayCup from "../../../../../../assets/game/processed/office-interactions-v1/held-props/takeaway-cup.png";
import tablet from "../../../../../../assets/game/processed/office-interactions-v1/held-props/tablet.png";
import teaCup from "../../../../../../assets/game/processed/office-interactions-v1/held-props/tea-cup.png";
import waterBottle from "../../../../../../assets/game/processed/office-interactions-v1/held-props/water-bottle.png";
import waterCupBlue from "../../../../../../assets/game/processed/office-interactions-v1/held-props/water-cup-blue.png";
import waterCupClear from "../../../../../../assets/game/processed/office-interactions-v1/held-props/water-cup-clear.png";
import yogurtBox from "../../../../../../assets/game/processed/office-interactions-v1/held-props/yogurt-box.png";
import massageMask from "../../../../../../assets/game/processed/office-interactions-v1/foreground-masks/chair-massage-modern-foreground.png";
import officeChairMask from "../../../../../../assets/game/processed/office-interactions-v1/foreground-masks/chair-office-modern-foreground.png";
import sofaThreeMask from "../../../../../../assets/game/processed/office-interactions-v1/foreground-masks/sofa-modern-three-seat-foreground.png";
import sofaTwoMask from "../../../../../../assets/game/processed/office-interactions-v1/foreground-masks/sofa-modern-two-seat-foreground.png";
import meetingTableMask from "../../../../../../assets/game/processed/office-interactions-v1/foreground-masks/table-meeting-foreground.png";
import vendingNeutralA from "../../../../../../assets/game/processed/office-interactions-v1/facility-overlays/vending.machine.loop.item-neutral.a.png";
import vendingNeutralB from "../../../../../../assets/game/processed/office-interactions-v1/facility-overlays/vending.machine.loop.item-neutral.b.png";
import vendingNeutralC from "../../../../../../assets/game/processed/office-interactions-v1/facility-overlays/vending.machine.loop.item-neutral.c.png";
import vendingNeutralD from "../../../../../../assets/game/processed/office-interactions-v1/facility-overlays/vending.machine.loop.item-neutral.d.png";
import type { HeldPropId } from "./officeInteractionContract";

export const einstein15RowStagingAsset = {
  sheet: einsteinSheet,
  sheet2x: einsteinSheet2x,
  rows: 15,
  columns: 8,
  frame: { width: 96, height: 104 },
} as const;

export const heldPropAssetCatalog: Record<HeldPropId, string> = {
  "held.water-cup-clear": waterCupClear,
  "held.water-cup-blue": waterCupBlue,
  "held.water-bottle": waterBottle,
  "held.coffee-mug": coffeeMug,
  "held.takeaway-cup": takeawayCup,
  "held.tea-cup": teaCup,
  "held.soda-can": sodaCan,
  "held.juice-box": juiceBox,
  "held.snack-bag": snackBag,
  "held.yogurt-box": yogurtBox,
  "held.paper-sheet": paperSheet,
  "held.envelope": envelope,
  "held.label-card": labelCard,
  "held.tablet": tablet,
  "held.notebook": notebook,
  "held.smartphone": smartphone,
};

export const foregroundMaskAssetCatalog = {
  "chair.office.modern.foreground": officeChairMask,
  "table.meeting.foreground": meetingTableMask,
  "sofa.modern.three-seat.foreground": sofaThreeMask,
  "sofa.modern.two-seat.foreground": sofaTwoMask,
  "chair.massage.modern.foreground": massageMask,
} as const;

export const vendingItemNeutralOverlay = {
  frames: [vendingNeutralA, vendingNeutralB, vendingNeutralC, vendingNeutralD],
  outputAnchor: { x: 0.5, y: 0.78 },
} as const;
