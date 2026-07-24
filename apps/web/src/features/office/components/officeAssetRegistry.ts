import bookshelfLow from "../../../../../../assets/game/processed/core-furniture-c-v1/bookshelf.low.png";
import cabinetFiling from "../../../../../../assets/game/processed/core-furniture-c-v1/cabinet.filing.png";
import chairOffice from "../../../../../../assets/game/processed/core-furniture-c-v1/chair.office.up.png";
import chairStudio from "../../../../../../assets/game/processed/core-furniture-c-v1/chair.studio.up.png";
import counterCoffee from "../../../../../../assets/game/processed/core-furniture-c-v1/counter.coffee.png";
import deskCreative from "../../../../../../assets/game/processed/core-furniture-c-v1/desk.creative.up.png";
import deskNoc from "../../../../../../assets/game/processed/core-furniture-c-v1/desk.noc.up.png";
import deskStandard from "../../../../../../assets/game/processed/core-furniture-c-v1/desk.standard.up.png";
import dividerPlanter from "../../../../../../assets/game/processed/core-furniture-c-v1/divider.planter.png";
import missionTable from "../../../../../../assets/game/processed/core-furniture-c-v1/table.mission.png";
import petBed from "../../../../../../assets/game/processed/core-furniture-c-v1/pet-bed.round.png";
import sectionalSofa from "../../../../../../assets/game/processed/core-furniture-c-v1/sofa.sectional.png";
import stoolLounge from "../../../../../../assets/game/processed/core-furniture-c-v1/stool.lounge.png";
import tableCoffee from "../../../../../../assets/game/processed/core-furniture-c-v1/table.coffee.png";
import binWaste from "../../../../../../assets/game/processed/decor-mechanical-c-v1/bin.waste.png";
import boxParcel from "../../../../../../assets/game/processed/decor-mechanical-c-v1/box.parcel.png";
import clockWall from "../../../../../../assets/game/processed/decor-mechanical-c-v1/clock.wall.png";
import cupCoffee from "../../../../../../assets/game/processed/decor-mechanical-c-v1/cup.coffee.png";
import doorClosed from "../../../../../../assets/game/processed/decor-mechanical-c-v1/door.closed.png";
import extinguisherWall from "../../../../../../assets/game/processed/decor-mechanical-c-v1/extinguisher.wall.png";
import lampDesk from "../../../../../../assets/game/processed/decor-mechanical-c-v1/lamp.desk.png";
import papersStack from "../../../../../../assets/game/processed/decor-mechanical-c-v1/papers.stack.png";
import plantSmall from "../../../../../../assets/game/processed/decor-mechanical-c-v1/plant.small.png";
import plantTall from "../../../../../../assets/game/processed/decor-mechanical-c-v1/plant.tall.png";
import signExit from "../../../../../../assets/game/processed/decor-mechanical-c-v1/sign.exit.png";
import cameraCctv from "../../../../../../assets/game/processed/equipment-c-v1/camera.cctv.png";
import cameraTripod from "../../../../../../assets/game/processed/equipment-c-v1/camera.tripod.png";
import dispenserWater from "../../../../../../assets/game/processed/equipment-c-v1/dispenser.water.png";
import keyboardMouse from "../../../../../../assets/game/processed/equipment-c-v1/keyboard.mouse.png";
import laptopOpen from "../../../../../../assets/game/processed/equipment-c-v1/laptop.open.png";
import lightStudio from "../../../../../../assets/game/processed/equipment-c-v1/light.studio.png";
import machineCoffee from "../../../../../../assets/game/processed/equipment-c-v1/machine.coffee.png";
import monitorDualActive from "../../../../../../assets/game/processed/equipment-c-v1/monitor.dual.active.png";
import monitorFrontActive from "../../../../../../assets/game/processed/equipment-c-v1/monitor.front.active.png";
import networkStack from "../../../../../../assets/game/processed/equipment-c-v1/network.stack.png";
import phonePreview from "../../../../../../assets/game/processed/equipment-c-v1/phone.preview.png";
import printerDesktop from "../../../../../../assets/game/processed/equipment-c-v1/printer.desktop.png";
import serverRack from "../../../../../../assets/game/processed/equipment-c-v1/server.rack.png";
import stationMultidevice from "../../../../../../assets/game/processed/equipment-c-v1/station.multidevice.png";
import tabletDrawing from "../../../../../../assets/game/processed/equipment-c-v1/tablet.drawing.png";
import chairMeeting from "../../../../../../assets/game/processed/office-utility-c-v1/chair.meeting.svg";
import chairLounge from "../../../../../../assets/game/processed/office-utility-c-v1/chair.lounge.svg";
import refrigerator from "../../../../../../assets/game/processed/office-utility-c-v1/refrigerator.svg";
import microwave from "../../../../../../assets/game/processed/office-utility-c-v1/microwave.svg";
import sink from "../../../../../../assets/game/processed/office-utility-c-v1/sink.svg";
import pantryShelf from "../../../../../../assets/game/processed/office-utility-c-v1/pantry.shelf.svg";
import locker from "../../../../../../assets/game/processed/office-utility-c-v1/locker.svg";
import coatRack from "../../../../../../assets/game/processed/office-utility-c-v1/coat.rack.svg";
import whiteboard from "../../../../../../assets/game/processed/office-utility-c-v1/whiteboard.svg";
import displayScreen from "../../../../../../assets/game/processed/office-utility-c-v1/display.screen.svg";
import recycleBin from "../../../../../../assets/game/processed/office-utility-c-v1/recycle.bin.svg";
import firstAid from "../../../../../../assets/game/processed/office-utility-c-v1/first.aid.svg";
import smokeDetector from "../../../../../../assets/game/processed/office-utility-c-v1/smoke.detector.svg";
import emergencyLight from "../../../../../../assets/game/processed/office-utility-c-v1/emergency.light.svg";
import ups from "../../../../../../assets/game/processed/office-utility-c-v1/ups.svg";
import cableTray from "../../../../../../assets/game/processed/office-utility-c-v1/cable.tray.svg";

export type OfficeLayer = "wall" | "furniture" | "equipment" | "decor";
export type OfficeAnchor = "center" | "bottom-center" | "wall-top" | "wall-right";
export type OfficeSupport = "floor" | "desk-surface" | "table-surface" | "wall" | "ceiling";

export interface OfficeAssetDefinition {
  file: string;
  widthTiles: number;
  layer: OfficeLayer;
  anchor: OfficeAnchor;
  support: OfficeSupport;
}

const asset = (file: string, widthTiles: number, layer: OfficeLayer, anchor: OfficeAnchor, support: OfficeSupport): OfficeAssetDefinition => ({ file, widthTiles, layer, anchor, support });
const furniture = (file: string, widthTiles: number): OfficeAssetDefinition => asset(file, widthTiles, "furniture", "center", "floor");
const floorEquipment = (file: string, widthTiles: number): OfficeAssetDefinition => asset(file, widthTiles, "equipment", "bottom-center", "floor");
const deskEquipment = (file: string, widthTiles: number): OfficeAssetDefinition => asset(file, widthTiles, "equipment", "bottom-center", "desk-surface");
const floorDecor = (file: string, widthTiles: number): OfficeAssetDefinition => asset(file, widthTiles, "decor", "bottom-center", "floor");
const surfaceDecor = (file: string, widthTiles: number, support: OfficeSupport = "desk-surface"): OfficeAssetDefinition => asset(file, widthTiles, "decor", "bottom-center", support);
const wall = (file: string, widthTiles: number, anchor: OfficeAnchor = "wall-top"): OfficeAssetDefinition => asset(file, widthTiles, "wall", anchor, "wall");

export const officeAssetRegistry: Record<string, OfficeAssetDefinition> = {
  "bookshelf.low": furniture(bookshelfLow, 3.2),
  "cabinet.filing": furniture(cabinetFiling, 1.45),
  "chair.office.up": furniture(chairOffice, 1.25),
  "chair.studio.up": furniture(chairStudio, 1.25),
  "counter.coffee": furniture(counterCoffee, 5),
  "desk.creative.up": furniture(deskCreative, 4.1),
  "desk.noc.up": furniture(deskNoc, 4.1),
  "desk.standard.up": furniture(deskStandard, 4.1),
  "divider.planter": furniture(dividerPlanter, 3),
  "table.mission": furniture(missionTable, 5.8),
  "pet-bed.round": furniture(petBed, 2.2),
  "sofa.sectional": furniture(sectionalSofa, 4.5),
  "stool.lounge": furniture(stoolLounge, 1.05),
  "table.coffee": furniture(tableCoffee, 2.3),
  "chair.meeting": furniture(chairMeeting, 1.35),
  "chair.lounge": furniture(chairLounge, 1.65),
  "refrigerator": furniture(refrigerator, 1.55),
  "microwave": furniture(microwave, 1.55),
  "sink": furniture(sink, 1.8),
  "pantry.shelf": furniture(pantryShelf, 1.65),
  "locker": furniture(locker, 2.1),
  "coat.rack": furniture(coatRack, 1.35),
  "bin.waste": floorDecor(binWaste, 0.7),
  "recycle.bin": floorDecor(recycleBin, 0.7),
  "box.parcel": floorDecor(boxParcel, 0.9),
  "cup.coffee": surfaceDecor(cupCoffee, 0.35, "table-surface"),
  "lamp.desk": surfaceDecor(lampDesk, 0.65),
  "papers.stack": surfaceDecor(papersStack, 0.8, "table-surface"),
  "plant.small": floorDecor(plantSmall, 1.05),
  "plant.tall": floorDecor(plantTall, 1.35),
  "clock.wall": wall(clockWall, 1.05),
  "door.closed": wall(doorClosed, 1.5, "wall-right"),
  "extinguisher.wall": wall(extinguisherWall, 0.65),
  "sign.exit": wall(signExit, 1.4),
  "whiteboard": wall(whiteboard, 3.8),
  "display.screen": wall(displayScreen, 3.8),
  "first.aid": wall(firstAid, 1.05),
  "smoke.detector": wall(smokeDetector, 0.75),
  "emergency.light": wall(emergencyLight, 1.25),
  "camera.cctv": wall(cameraCctv, 0.95, "wall-right"),
  "camera.tripod": floorEquipment(cameraTripod, 0.9),
  "dispenser.water": floorEquipment(dispenserWater, 0.85),
  "keyboard.mouse": deskEquipment(keyboardMouse, 0.95),
  "laptop.open": deskEquipment(laptopOpen, 1.1),
  "light.studio": floorEquipment(lightStudio, 0.8),
  "machine.coffee": deskEquipment(machineCoffee, 0.9),
  "monitor.dual.active": deskEquipment(monitorDualActive, 1.8),
  "monitor.front.active": deskEquipment(monitorFrontActive, 1.35),
  "network.stack": floorEquipment(networkStack, 1.15),
  "phone.preview": deskEquipment(phonePreview, 0.6),
  "printer.desktop": deskEquipment(printerDesktop, 1),
  "server.rack": floorEquipment(serverRack, 1.8),
  "ups": floorEquipment(ups, 1.1),
  "cable.tray": deskEquipment(cableTray, 1.1),
  "station.multidevice": deskEquipment(stationMultidevice, 1.8),
  "tablet.drawing": deskEquipment(tabletDrawing, 1.05),
};
