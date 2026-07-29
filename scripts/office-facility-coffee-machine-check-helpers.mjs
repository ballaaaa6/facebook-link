export function hasExpectedPartInventory(parts, expectedIds, hashFile) {
  const partById = new Map(parts?.map((part) => [part.id, part]));
  return expectedIds.every((id) => partById.has(id))
    && parts.length === expectedIds.length
    && parts.every((part) =>
      hashFile(part.authoringFile) === part.authoringSha256
      && hashFile(part.runtimeFile) === part.runtimeSha256);
}

export function hasExpectedCoffeeAnimation(
  animation,
  shellPartId,
  hashFile,
) {
  return animation?.frameCount === 4
    && animation?.shellPartId === shellPartId
    && animation?.shellStableAcrossFrames === true
    && animation?.basePivotStableAcrossFrames === true
    && animation?.sortPivotStableAcrossFrames === true
    && animation?.outsideViewportChangedPixels === 0
    && JSON.stringify(
      animation.frames.map(({ effectPartIds }) => effectPartIds.length),
    ) === "[0,0,2,0]"
    && animation.frames.every((frame) =>
      hashFile(frame.authoringCompositeFile) === frame.authoringCompositeSha256
      && hashFile(frame.runtimeCompositeFile) === frame.runtimeCompositeSha256);
}

export function hasExpectedCoffeeRoster(roster) {
  return roster?.characterCount === 18
    && roster?.activeFrames === 6
    && roster?.validatedPoseCases === 108
    && roster?.visiblePropCases === 54
    && roster?.facilityOutputAttachmentCases === 18
    && roster?.actorHandAttachmentCases === 36
    && roster?.frontOverlayCases === 36
    && roster?.attachmentDeltaFailures === 0
    && roster?.foregroundMaskUses === 0
    && roster?.visibleAlphaFailures === 0
    && roster?.perCharacterFacilityScaling === false
    && roster?.perCharacterActorOffsets === false
    && roster.characters.every(({ frames }) =>
      frames.length === 6
      && frames.every(({ attachmentDelta, visiblePropAlphaFraction }) =>
        attachmentDelta === null
          ? visiblePropAlphaFraction === null
          : JSON.stringify(attachmentDelta) === "[0,0]"
            && visiblePropAlphaFraction === 1));
}

export function hasExpectedCoffeeReservation(reservation) {
  return reservation?.durationSeconds === 30
    && reservation?.actorCount === 2
    && reservation?.maximumConcurrentReservations === 1
    && reservation?.collisionCount === 0
    && reservation?.blockedAttemptCount === 1
    && reservation?.failureCount === 1
    && reservation?.retrySuccessCount === 1
    && reservation?.releasedAtEnd === true
    && reservation?.samples?.length === 31
    && reservation.samples.at(-1)?.heldBy === null;
}
