import {
  fileHashMatches,
  same,
  sha256,
} from "./office-production-check-utils.mjs";

export function checkWaterSourceContract({
  manifest,
  audit,
  sourcePath,
  spatialPath,
}) {
  const failures = [];
  const add = (condition, message) => {
    if (!condition) failures.push(message);
  };
  const sourceFrame = manifest.source?.frames?.[0];
  add(
    manifest.source?.kind === "generated-isolated-clean-source"
      && manifest.source?.path === sourcePath
      && manifest.source?.sha256 === sha256(sourcePath)
      && manifest.source?.extractionMethod === "generated-source-chroma-key"
      && manifest.source?.generation?.tool === "OpenAI built-in image generation"
      && manifest.source?.generation?.ownerDirective
        === "Replace the short audited form with a tall dispenser."
      && manifest.source?.frames?.length === 1,
    "Water W01 generated clean-source authority changed",
  );
  add(
    sourceFrame?.frameId === "base"
      && sourceFrame?.auditRecordId
        === "owner-directive:water-dispenser-w01-tall-clean-source"
      && same(sourceFrame?.sourceBounds, [0, 0, 781, 2012])
      && same(sourceFrame?.ownedBounds, [203, 112, 574, 1906])
      && sourceFrame?.selectedComponentCount === 1
      && sourceFrame?.selectedPixelCount === 637652
      && sourceFrame?.touchesNominalCellBoundary === false
      && sourceFrame?.touchesMasterBoundary === false
      && sourceFrame?.sourcePixelsResampled === false
      && fileHashMatches(
        sourceFrame?.authoringCutout,
        sourceFrame?.authoringCutoutSha256,
        [1024, 2048],
      ),
    "Water W01 clean-source ownership or unscaled authoring cutout changed",
  );
  add(
    fileHashMatches(
      manifest.source?.keyedSource?.file,
      manifest.source?.keyedSource?.sha256,
      [781, 2012],
    )
      && fileHashMatches(
        manifest.source?.ownershipMask?.file,
        manifest.source?.ownershipMask?.sha256,
        [781, 2012],
      ),
    "Water W01 keyed source or ownership mask is missing or stale",
  );

  const auditFamily = audit.families.find(
    ({ familyId }) => familyId === "dispenser.water",
  );
  const neutralRecords = ["a", "b", "c", "d"].map(
    (frame) => `review-facility-completion-v1:review-facility-completion:dispenser.water.neutral.${frame}`,
  );
  const loopRecords = ["a", "b", "c", "d"].map(
    (frame) => `modern-bright-library-v1:env-08-animated-ambient:dispenser.water.loop.${frame}`,
  );
  const sideRecords = [
    "modern-bright-library-v1:env-12-facility-side-orientations:dispenser.water.side-left",
    "modern-bright-library-v1:env-12-facility-side-orientations:dispenser.water.side-right",
  ];
  const auditById = new Map(
    audit.records.map((record) => [record.recordId, record]),
  );
  add(
    auditFamily?.action === "salvage-preferred-master-then-decompose"
      && same(manifest.auditBaseline?.supersededNeutralRecords, neutralRecords)
      && same(manifest.auditBaseline?.rejectedRecords, [
        ...loopRecords,
        ...sideRecords,
      ])
      && manifest.auditBaseline?.pixelReuse === false
      && neutralRecords.every((id) =>
        auditById.get(id)?.currentDecision?.masterPixelsSalvageable === true)
      && loopRecords.every((id) =>
        auditById.get(id)?.currentDecision?.decision
          === "reference-effects-only-use-neutral-front-source"
        && auditById.get(id)?.currentDecision?.masterPixelsSalvageable === false)
      && sideRecords.every((id) =>
        auditById.get(id)?.currentDecision?.decision
          === "reject-regenerate-orientation-if-required"
        && auditById.get(id)?.currentDecision?.masterPixelsSalvageable === false),
    "Water audit references or rejected sources changed",
  );

  add(
    same(manifest.render?.authoringCanvas, [1024, 2048])
      && same(manifest.render?.runtimeCanvas, [64, 128])
      && manifest.render?.uniformIntegerDivisor === 16
      && manifest.render?.nonUniformScaling === false
      && manifest.render?.anchor === "bottom-center"
      && same(manifest.render?.requiredOrientations, ["front"])
      && same(manifest.geometry?.physicalScale, {
        width: 1, depth: 1, height: 4, unit: "tile",
      })
      && same(manifest.geometry?.footprint, {
        width: 1, depth: 1, unit: "tile",
      })
      && same(manifest.geometry?.basePivot, {
        x: 0.5, y: 1, unit: "tile",
      })
      && same(manifest.geometry?.sortPivot, {
        x: 0.5, y: 1, unit: "tile",
      }),
    "Water W01 tall 1x1x4 geometry or uniform render scale changed",
  );
  add(
    manifest.spatial?.authority?.file === spatialPath
      && manifest.spatial?.authority?.sha256 === sha256(spatialPath)
      && manifest.spatial?.authority?.status === "owner-approved"
      && same(manifest.spatial?.localSockets, {
        "base.floor": [32, 128],
        "sort.floor": [32, 128],
        "interaction.target": [32, 126],
        "output.primary": [28, 70],
        "effect.origin": [28, 59],
        "viewport.origin": [20, 46],
      })
      && manifest.spatial?.centerToCenterAttachment === false
      && manifest.spatial?.perSceneAttachmentOffsets === false
      && manifest.spatial?.missingSocketFallback === false,
    "Water W01 spatial socket contract changed",
  );
  return failures;
}
