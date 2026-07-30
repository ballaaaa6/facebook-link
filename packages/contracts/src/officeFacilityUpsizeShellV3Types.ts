export type OfficeFacilityUpsizeShellV3Slug =
  | "coffee-machine-c02"
  | "water-dispenser-w02"
  | "vending-machine-u02"
  | "massage-chair-r03";

export type OfficeFacilityUpsizeShellV3File = {
  file: string;
  sha256: string;
  size: [number, number];
};

export type OfficeFacilityUpsizeShellV3Family = {
  slug: OfficeFacilityUpsizeShellV3Slug;
  label: string;
  kind: "coffee" | "water" | "vending" | "massage";
  shellSource: {
    chroma: OfficeFacilityUpsizeShellV3File;
    alpha: OfficeFacilityUpsizeShellV3File;
    views: Array<{
      view: "front" | "left" | "right" | "back";
      sourceBox: [number, number, number, number];
      sourceSize: [number, number];
      runtimeOrigin: [number, number];
      runtimeSize: [number, number];
    }>;
  };
  runtimeShell: {
    views: Record<
      "front" | "left" | "right" | "back",
      OfficeFacilityUpsizeShellV3File
    >;
    foreground: OfficeFacilityUpsizeShellV3File;
  };
  effectAuthority: {
    manifest: "assets/game/manifests/office-facility-upsize-motion-v2.json";
    regions: Record<string, [number, number, number, number]>;
    parts: Array<{
      role: string;
      phase: "a" | "b" | "c" | "d";
      approvedEffectSource: {
        file: string;
        sha256: string;
        sourceRecord: Record<string, unknown>;
      };
      runtimeLayer: OfficeFacilityUpsizeShellV3File;
    }>;
  };
  seamLoop: {
    transition: ["a", "b", "c", "d", "a"];
    durationMs: number;
    frames: Array<
      OfficeFacilityUpsizeShellV3File & {
        phase: "a" | "b" | "c" | "d";
      }
    >;
    gif: OfficeFacilityUpsizeShellV3File;
    outsideDeclaredChangedPixels: [0, 0, 0, 0];
    pivotDeltaPixels: [0, 0];
  };
  finiteUse: {
    states: string[];
    frames: Array<
      OfficeFacilityUpsizeShellV3File & {
        index: number;
        state: string;
      }
    >;
    idleReturnExact: true;
    interactionGif: OfficeFacilityUpsizeShellV3File;
  };
};

export type OfficeFacilityUpsizeShellV3Manifest = {
  schemaVersion: 1;
  id: "office.facility.upsize-shell.v3";
  revision: string;
  status: "shell-integration-owner-review";
  createdOn: string;
  developmentOnly: true;
  decisionBoundary: {
    motionV2: {
      manifest: string;
      manifestSha256: string;
      effects: "accepted";
      shellIntegration: "rejected-at-owner-review";
    };
    replacementScope: "fresh-shell-pixels-and-integration-only";
    approvedEffectRegeneration: false;
    fullProductionRebuildBeforeVisualApproval: false;
  };
  sourcePolicy: {
    workflow: "built-in ImageGen";
    promptRecord: { file: string; sha256: string };
    oldShellPixelReuse: false;
    approvedMotionV2EffectReuse: true;
    freshShellPixelGeneration: true;
    proceduralRuntimeShellPixels: false;
    proceduralRuntimeEffectPixels: false;
    codeMayCrop: true;
    codeMayChromaRemove: true;
    codeMayNearestResize: true;
    codeMayIntegerTranslate: true;
    codeMayAlphaMask: true;
    codeMayAlphaComposite: true;
    missingAssetFallback: false;
  };
  physicalContract: {
    physicalScaleTiles: [2, 2, 4];
    floorFootprintTiles: [2, 2];
    renderBoxTiles: [3, 4];
    runtimeCanvas: [96, 128];
    basePivotPixels: [48, 124];
  };
  families: OfficeFacilityUpsizeShellV3Family[];
  gates: Record<string, { status: string }>;
  roomIsolation: {
    f9Manifest: string;
    f9ManifestSha256: string;
    f9Changed: false;
    activeOfficeChanged: false;
    reservationSlotsActivated: 0;
  };
  permissions: {
    visualReview: true;
    fullProductionRebuild: false;
    reservationSlotTransfer: false;
    f9Composition: false;
    activeOfficePromotion: false;
  };
  ownerDecision: null;
};
