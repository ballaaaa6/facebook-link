import bookshelfBase from "../../../../../../assets/game/processed/office-derived-v1/step-16/active-office-registry/bookshelf.low.base.png";
import bookshelfForeground from "../../../../../../assets/game/processed/office-derived-v1/step-16/active-office-registry/bookshelf.low.foreground.png";
import cabinetBase from "../../../../../../assets/game/processed/office-derived-v1/step-15/env-10-storage-operations-detail/cabinet.storage.low.base.png";
import cabinetForeground from "../../../../../../assets/game/processed/office-derived-v1/step-15/env-10-storage-operations-detail/cabinet.storage.low.foreground.png";
import cartBase from "../../../../../../assets/game/processed/office-derived-v1/step-15/env-10-storage-operations-detail/cart.utility.base.png";
import cartForeground from "../../../../../../assets/game/processed/office-derived-v1/step-15/env-10-storage-operations-detail/cart.utility.foreground.png";
import counterBase from "../../../../../../assets/game/processed/office-derived-v1/step-16/active-office-registry/counter.coffee.base.png";
import counterForeground from "../../../../../../assets/game/processed/office-derived-v1/step-16/active-office-registry/counter.coffee.foreground.png";
import doorBase from "../../../../../../assets/game/processed/office-derived-v1/step-16/active-office-registry/door.closed.base.png";
import sectionalBase from "../../../../../../assets/game/processed/office-derived-v1/step-16/active-office-registry/sofa.sectional.base.png";
import sectionalForeground from "../../../../../../assets/game/processed/office-derived-v1/step-16/active-office-registry/sofa.sectional.foreground.png";
import sofaThreeBase from "../../../../../../assets/game/processed/office-derived-v1/step-15/env-05-facility-lounge/sofa.modern.three-seat.base.png";
import sofaThreeForeground from "../../../../../../assets/game/processed/office-derived-v1/step-15/env-05-facility-lounge/sofa.modern.three-seat.foreground.png";
import sofaTwoBase from "../../../../../../assets/game/processed/office-derived-v1/step-15/env-05-facility-lounge/sofa.modern.two-seat.base.png";
import sofaTwoForeground from "../../../../../../assets/game/processed/office-derived-v1/step-15/env-05-facility-lounge/sofa.modern.two-seat.foreground.png";
import boardTableBase from "../../../../../../assets/game/processed/office-derived-v1/step-15/env-05-facility-lounge/table.board-game.base.png";
import boardTableForeground from "../../../../../../assets/game/processed/office-derived-v1/step-15/env-05-facility-lounge/table.board-game.foreground.png";
import cafeTableBase from "../../../../../../assets/game/processed/office-derived-v1/step-16/active-office-registry/table.cafe.round.base.png";
import cafeTableForeground from "../../../../../../assets/game/processed/office-derived-v1/step-16/active-office-registry/table.cafe.round.foreground.png";
import coffeeTableBase from "../../../../../../assets/game/processed/office-derived-v1/step-16/active-office-registry/table.coffee.base.png";
import coffeeTableForeground from "../../../../../../assets/game/processed/office-derived-v1/step-16/active-office-registry/table.coffee.foreground.png";
import meetingTableBase from "../../../../../../assets/game/processed/office-derived-v1/step-16/active-office-registry/table.meeting.empty.base.png";
import meetingTableForeground from "../../../../../../assets/game/processed/office-derived-v1/step-16/active-office-registry/table.meeting.empty.foreground.png";
import sideTableBase from "../../../../../../assets/game/processed/office-derived-v1/step-15/env-06-decor-architecture-tv/table.side.base.png";
import sideTableForeground from "../../../../../../assets/game/processed/office-derived-v1/step-15/env-06-decor-architecture-tv/table.side.foreground.png";

export interface DerivedAssetPreview {
  id: string;
  wave: "step-15" | "step-16";
  base: string;
  foreground?: string;
}

export const derivedAssetPreviews: DerivedAssetPreview[] = [
  { id: "sofa.modern.three-seat", wave: "step-15", base: sofaThreeBase, foreground: sofaThreeForeground },
  { id: "sofa.modern.two-seat", wave: "step-15", base: sofaTwoBase, foreground: sofaTwoForeground },
  { id: "table.board-game", wave: "step-15", base: boardTableBase, foreground: boardTableForeground },
  { id: "table.side", wave: "step-15", base: sideTableBase, foreground: sideTableForeground },
  { id: "cabinet.storage.low", wave: "step-15", base: cabinetBase, foreground: cabinetForeground },
  { id: "cart.utility", wave: "step-15", base: cartBase, foreground: cartForeground },
  { id: "bookshelf.low", wave: "step-16", base: bookshelfBase, foreground: bookshelfForeground },
  { id: "counter.coffee", wave: "step-16", base: counterBase, foreground: counterForeground },
  { id: "door.closed", wave: "step-16", base: doorBase },
  { id: "sofa.sectional", wave: "step-16", base: sectionalBase, foreground: sectionalForeground },
  { id: "table.cafe.round", wave: "step-16", base: cafeTableBase, foreground: cafeTableForeground },
  { id: "table.coffee", wave: "step-16", base: coffeeTableBase, foreground: coffeeTableForeground },
  { id: "table.meeting.empty", wave: "step-16", base: meetingTableBase, foreground: meetingTableForeground },
];
