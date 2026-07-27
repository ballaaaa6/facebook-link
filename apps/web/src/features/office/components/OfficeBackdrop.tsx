import {
  officeSceneAssets,
  officeSceneReference,
  officeWindowViewFor,
  type OfficeSceneTime,
} from "./officeSceneRuntime";

export function OfficeBackdrop({
  sceneTime,
  showAmbientDecor,
}: {
  sceneTime: OfficeSceneTime;
  showAmbientDecor: boolean;
}) {
  const x = (value: number) => `${(value / officeSceneReference.width) * 100}%`;
  const y = (value: number) => `${(value / officeSceneReference.height) * 100}%`;
  const width = (value: number) => `${(value / officeSceneReference.width) * 100}%`;
  const height = (value: number) => `${(value / officeSceneReference.height) * 100}%`;
  const clockCenterX = officeSceneReference.clock.x + officeSceneReference.clock.width / 2;
  const clockCenterY = officeSceneReference.clock.y + officeSceneReference.clock.height / 2;

  return (
    <div className="office-backdrop" aria-hidden="true">
      <img className="office-background-image" src={officeSceneAssets.background} alt="" />
      <img
        className="office-window-view"
        src={officeWindowViewFor(sceneTime)}
        alt=""
        style={{
          left: x(officeSceneReference.window.x),
          top: y(officeSceneReference.window.y),
          width: width(officeSceneReference.window.width),
          height: height(officeSceneReference.window.height),
        }}
      />
      {showAmbientDecor
        ? (
          <>
            <img
              className="office-clock-face"
              src={officeSceneAssets.clockFace}
              alt=""
              style={{
                left: x(officeSceneReference.clock.x),
                top: y(officeSceneReference.clock.y),
                width: width(officeSceneReference.clock.width),
                height: height(officeSceneReference.clock.height),
              }}
            />
            <img
              className="office-clock-hand office-clock-hour-hand"
              src={officeSceneAssets.clockHourHand}
              alt=""
              style={{
                left: x(clockCenterX),
                top: y(clockCenterY),
                width: width(officeSceneReference.clock.width),
                height: height(officeSceneReference.clock.height),
                transform: `translate(-50%, -50%) rotate(${sceneTime.hourAngle}deg)`,
              }}
            />
            <img
              className="office-clock-hand office-clock-minute-hand"
              src={officeSceneAssets.clockMinuteHand}
              alt=""
              style={{
                left: x(clockCenterX),
                top: y(clockCenterY),
                width: width(officeSceneReference.clock.width),
                height: height(officeSceneReference.clock.height),
                transform: `translate(-50%, -50%) rotate(${sceneTime.minuteAngle}deg)`,
              }}
            />
          </>
        )
        : null}
    </div>
  );
}
