import bookshelfLow from "../../../../../../assets/game/processed/core-furniture-c-v1/bookshelf.low.png";
import cabinetFiling from "../../../../../../assets/game/processed/core-furniture-c-v1/cabinet.filing.png";
import counterCoffee from "../../../../../../assets/game/processed/core-furniture-c-v1/counter.coffee.png";
import deskCreative from "../../../../../../assets/game/processed/core-furniture-c-v1/desk.creative.up.png";
import deskNoc from "../../../../../../assets/game/processed/core-furniture-c-v1/desk.noc.up.png";
import deskStandard from "../../../../../../assets/game/processed/core-furniture-c-v1/desk.standard.up.png";
import dividerPlanter from "../../../../../../assets/game/processed/core-furniture-c-v1/divider.planter.png";
import missionTable from "../../../../../../assets/game/processed/core-furniture-c-v1/table.mission.png";
import petBed from "../../../../../../assets/game/processed/core-furniture-c-v1/pet-bed.round.png";
import sectionalSofa from "../../../../../../assets/game/processed/core-furniture-c-v1/sofa.sectional.png";
import binWaste from "../../../../../../assets/game/processed/decor-mechanical-c-v1/bin.waste.png";
import boxParcel from "../../../../../../assets/game/processed/decor-mechanical-c-v1/box.parcel.png";
import clockWall from "../../../../../../assets/game/processed/decor-mechanical-c-v1/clock.wall.png";
import cupCoffee from "../../../../../../assets/game/processed/decor-mechanical-c-v1/cup.coffee.png";
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

export type OfficeLayer = "wall" | "furniture" | "equipment" | "decor";
export type OfficeAnchor = "center" | "bottom-center" | "wall-center";

export interface OfficeAssetDefinition {
  file: string;
  widthTiles: number;
  layer: OfficeLayer;
  anchor: OfficeAnchor;
}

const furniture = (file: string, widthTiles: number): OfficeAssetDefinition => ({ file, widthTiles, layer: "furniture", anchor: "center" });
const equipment = (file: string, widthTiles: number): OfficeAssetDefinition => ({ file, widthTiles, layer: "equipment", anchor: "bottom-center" });
const decor = (file: string, widthTiles: number, anchor: OfficeAnchor = "center"): OfficeAssetDefinition => ({ file, widthTiles, layer: "decor", anchor });
const wall = (file: string, widthTiles: number): OfficeAssetDefinition => ({ file, widthTiles, layer: "wall", anchor: "wall-center" });

export const officeAssetRegistry: Record<string, OfficeAssetDefinition> = {
  "bookshelf.low": furniture(bookshelfLow, 3.8),
  "cabinet.filing": furniture(cabinetFiling, 2.8),
  "counter.coffee": furniture(counterCoffee, 5.6),
  "desk.creative.up": furniture(deskCreative, 4.4),
  "desk.noc.up": furniture(deskNoc, 4.4),
  "desk.standard.up": furniture(deskStandard, 4.4),
  "divider.planter": furniture(dividerPlanter, 3.4),
  "table.mission": furniture(missionTable, 6.4),
  "pet-bed.round": furniture(petBed, 2.8),
  "sofa.sectional": furniture(sectionalSofa, 5.2),
  "bin.waste": decor(binWaste, 1.2),
  "box.parcel": decor(boxParcel, 1.4),
  "cup.coffee": decor(cupCoffee, 0.9, "bottom-center"),
  "lamp.desk": decor(lampDesk, 1.15, "bottom-center"),
  "papers.stack": decor(papersStack, 1.2, "bottom-center"),
  "plant.small": decor(plantSmall, 1.65, "bottom-center"),
  "plant.tall": decor(plantTall, 2.2, "bottom-center"),
  "clock.wall": wall(clockWall, 1.8),
  "extinguisher.wall": wall(extinguisherWall, 1.2),
  "sign.exit": wall(signExit, 2.1),
  "camera.cctv": equipment(cameraCctv, 1.5),
  "camera.tripod": equipment(cameraTripod, 1.8),
  "dispenser.water": equipment(dispenserWater, 1.8),
  "keyboard.mouse": equipment(keyboardMouse, 1.7),
  "laptop.open": equipment(laptopOpen, 1.8),
  "light.studio": equipment(lightStudio, 1.45),
  "machine.coffee": equipment(machineCoffee, 1.8),
  "monitor.dual.active": equipment(monitorDualActive, 2.5),
  "monitor.front.active": equipment(monitorFrontActive, 1.9),
  "network.stack": equipment(networkStack, 1.8),
  "phone.preview": equipment(phonePreview, 1.1),
  "printer.desktop": equipment(printerDesktop, 1.55),
  "server.rack": equipment(serverRack, 2),
  "station.multidevice": equipment(stationMultidevice, 2.5),
  "tablet.drawing": equipment(tabletDrawing, 1.7),
};
