type FrameSubscriber = (timestamp: number) => void;

const subscribers = new Set<FrameSubscriber>();
let frameId: number | undefined;

function tick(timestamp: number) {
  for (const subscriber of subscribers) {
    subscriber(timestamp);
  }
  frameId = subscribers.size > 0 ? window.requestAnimationFrame(tick) : undefined;
}

export function subscribeToOfficeFrame(subscriber: FrameSubscriber) {
  subscribers.add(subscriber);
  if (frameId === undefined) {
    frameId = window.requestAnimationFrame(tick);
  }

  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0 && frameId !== undefined) {
      window.cancelAnimationFrame(frameId);
      frameId = undefined;
    }
  };
}
