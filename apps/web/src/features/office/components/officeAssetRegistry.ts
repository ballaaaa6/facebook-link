import bookshelfLow from "../../../../../../assets/game/processed/core-furniture-c-v1/bookshelf.low.png";
import cabinetFiling from "../../../../../../assets/game/processed/core-furniture-c-v1/cabinet.filing.png";
import chairOffice from "../../../../../../assets/game/processed/core-furniture-c-v1/chair.office.up.png";
import chairOfficeSide from "../../../../../../assets/game/processed/core-furniture-c-v1/chair.office.side.png";
import chairStudio from "../../../../../../assets/game/processed/core-furniture-c-v1/chair.studio.up.png";
import counterCoffee from "../../../../../../assets/game/processed/core-furniture-c-v1/counter.coffee.png";
import deskCreative from "../../../../../../assets/game/processed/core-furniture-c-v1/desk.creative.up.png";
import deskNoc from "../../../../../../assets/game/processed/core-furniture-c-v1/desk.noc.up.png";
import deskStandard from "../../../../../../assets/game/processed/core-furniture-c-v1/desk.standard.up.png";
import dividerPlanter from "../../../../../../assets/game/processed/core-furniture-c-v1/divider.planter.png";
import petBed from "../../../../../../assets/game/processed/core-furniture-c-v1/pet-bed.round.png";
import sectionalSofa from "../../../../../../assets/game/processed/core-furniture-c-v1/sofa.sectional.png";
import stoolLounge from "../../../../../../assets/game/processed/core-furniture-c-v1/stool.lounge.png";
import tableCoffee from "../../../../../../assets/game/processed/core-furniture-c-v1/table.coffee.png";
import meetingTableEmpty from "../../../../../../assets/game/processed/core-furniture-c-v2/table.meeting.empty.png";
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
import officeAssetGeometryJson from "../../../../../../assets/game/manifests/office-assets.json";
import type { OfficeAnchor, OfficeLayer, OfficeSupport } from "../officeTypes";

export type { OfficeAnchor, OfficeLayer, OfficeSupport } from "../officeTypes";

export interface OfficeFootprint {
  width: number;
  depth: number;
}

export interface OfficeRenderBox {
  width: number;
  height: number;
}

export interface OfficeAssetSlot {
  x: number;
  y: number;
  surface: OfficeSupport;
}

export interface OfficeAssetGeometry {
  renderBox: OfficeRenderBox;
  fit?: "contain" | "fill";
  layer: OfficeLayer;
  anchor: OfficeAnchor;
  supports: OfficeSupport[];
  footprint?: OfficeFootprint;
  slotSet?: string;
}

interface OfficeAssetGeometryManifest {
  version: number;
  slotSets: Record<string, Record<string, OfficeAssetSlot>>;
  assets: Record<string, OfficeAssetGeometry>;
}

export interface OfficeAssetDefinition extends OfficeAssetGeometry {
  file: string;
}

const geometryManifest = officeAssetGeometryJson as unknown as OfficeAssetGeometryManifest;

const assetFiles: Record<string, string> = {
  "bookshelf.low": bookshelfLow,
  "cabinet.filing": cabinetFiling,
  "chair.office.up": chairOffice,
  "chair.office.side": chairOfficeSide,
  "chair.studio.up": chairStudio,
  "counter.coffee": counterCoffee,
  "desk.creative.up": deskCreative,
  "desk.noc.up": deskNoc,
  "desk.standard.up": deskStandard,
  "divider.planter": dividerPlanter,
  "table.meeting.empty": meetingTableEmpty,
  "pet-bed.round": petBed,
  "sofa.sectional": sectionalSofa,
  "stool.lounge": stoolLounge,
  "table.coffee": tableCoffee,
  "bin.waste": binWaste,
  "box.parcel": boxParcel,
  "cup.coffee": cupCoffee,
  "lamp.desk": lampDesk,
  "papers.stack": papersStack,
  "plant.small": plantSmall,
  "plant.tall": plantTall,
  "clock.wall": clockWall,
  "door.closed": doorClosed,
  "extinguisher.wall": extinguisherWall,
  "sign.exit": signExit,
  "camera.cctv": cameraCctv,
  "camera.tripod": cameraTripod,
  "dispenser.water": dispenserWater,
  "keyboard.mouse": keyboardMouse,
  "laptop.open": laptopOpen,
  "light.studio": lightStudio,
  "machine.coffee": machineCoffee,
  "monitor.dual.active": monitorDualActive,
  "monitor.front.active": monitorFrontActive,
  "network.stack": networkStack,
  "phone.preview": phonePreview,
  "printer.desktop": printerDesktop,
  "server.rack": serverRack,
  "station.multidevice": stationMultidevice,
  "tablet.drawing": tabletDrawing,
};

export const officeSlotSets = geometryManifest.slotSets;

export const officeAssetRegistry = Object.fromEntries(
  Object.entries(geometryManifest.assets).map(([id, geometry]) => {
    const file = assetFiles[id];
    if (!file) throw new Error(`Missing runtime file for office asset ${id}`);
    return [id, { ...geometry, file }];
  }),
) as Record<string, OfficeAssetDefinition>;
