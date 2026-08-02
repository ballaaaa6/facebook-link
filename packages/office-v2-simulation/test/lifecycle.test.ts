import assert from "node:assert/strict";
import test from "node:test";
import {
  createLifecyclePort,
  LIFECYCLE_MAX_TICKS_PER_PUMP,
  LIFECYCLE_TICK_RATE_HZ,
} from "../src/lifecycle.ts";

test("uses the frozen lifecycle states and transition sequence", () => {
  const port = createLifecyclePort();
  assert.equal(port.snapshot().state, "mounted");
  assert.equal(port.transition("show").snapshot.state, "visible");
  assert.equal(port.transition("hide").snapshot.state, "hidden");
  assert.equal(port.transition("pageshow").snapshot.state, "restoring");
  assert.equal(port.transition("bfcache-restore").snapshot.state, "visible");
  assert.deepEqual(port.snapshot().transitions.map((entry) => `${entry.from}:${entry.event}:${entry.to}`), [
    "mounted:show:visible",
    "visible:hide:hidden",
    "hidden:pageshow:restoring",
    "restoring:bfcache-restore:visible",
  ]);
  assert.equal(port.snapshot().tickRateHz, LIFECYCLE_TICK_RATE_HZ);
});

test("pauses hidden time and caps visible catch-up with a diagnostic", () => {
  const ticks: number[] = [];
  const diagnostics: string[] = [];
  const port = createLifecyclePort({
    onTick: (tick) => ticks.push(tick),
    onDiagnostic: (diagnostic) => diagnostics.push(diagnostic.code),
  });
  port.transition("show");
  assert.equal(port.pump(2).appliedTicks, 2);
  port.transition("pagehide");
  assert.deepEqual(port.pump(9), { snapshot: port.snapshot(), appliedTicks: 0, discardedTicks: 9 });
  port.transition("pageshow");
  port.transition("bfcache-restore");
  const result = port.pump(9);
  assert.equal(result.appliedTicks, LIFECYCLE_MAX_TICKS_PER_PUMP);
  assert.equal(result.discardedTicks, 4);
  assert.equal(result.diagnostic?.code, "simulation.lifecycle-catch-up-capped");
  assert.deepEqual(ticks, [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(diagnostics, ["simulation.lifecycle-catch-up-capped"]);
});

test("subscriptions are idempotent and teardown releases every resource once", () => {
  const releases: string[] = [];
  const port = createLifecyclePort();
  const listener = { resourceId: "listener:visibility", kind: "listener" as const, release: () => releases.push("listener") };
  const poller = { resourceId: "poller:simulation", kind: "poller" as const, release: () => releases.push("poller") };
  assert.equal(port.subscribe(listener), true);
  assert.equal(port.subscribe(listener), false);
  assert.equal(port.subscribe(poller), true);
  port.transition("show");
  port.transition("hide");
  assert.equal(port.snapshot().resources.length, 2);
  port.teardown();
  assert.equal(port.snapshot().state, "destroyed");
  assert.deepEqual(port.snapshot().resources, []);
  assert.deepEqual(releases.sort(), ["listener", "poller"]);
  port.teardown();
  assert.deepEqual(releases.sort(), ["listener", "poller"]);
  assert.equal(port.transition("remount").snapshot.state, "mounted");
  assert.equal(port.subscribe(listener), true);
  assert.equal(port.release("listener:visibility"), true);
  assert.deepEqual(releases.sort(), ["listener", "listener", "poller"]);
});

test("unmount during load destroys pending resources and remount starts clean", () => {
  let releases = 0;
  const port = createLifecyclePort();
  assert.equal(port.subscribe({
    resourceId: "load:scene-bundle",
    kind: "pending-load",
    release: () => { releases += 1; },
  }), true);
  const result = port.transition("unmount-during-load");
  assert.equal(result.snapshot.state, "destroyed");
  assert.equal(result.snapshot.resources.length, 0);
  assert.equal(releases, 1);
  assert.equal(port.transition("remount").snapshot.state, "mounted");
  assert.equal(port.snapshot().logicalTick, 0);
});

test("context recovery does not advance logical time or duplicate resources", () => {
  const port = createLifecyclePort();
  port.transition("show");
  assert.equal(port.pump(3).appliedTicks, 3);
  port.transition("context-lost");
  assert.equal(port.snapshot().state, "restoring");
  assert.equal(port.pump(4).appliedTicks, 0);
  port.transition("context-restored");
  assert.equal(port.snapshot().state, "visible");
  assert.equal(port.pump(1).snapshot.logicalTick, 4);
});

test("separate visible schedules with the same bounded work reach the same tick", () => {
  const left = createLifecyclePort();
  const right = createLifecyclePort();
  left.transition("show");
  right.transition("show");
  left.pump(2);
  left.pump(3);
  right.pump(5);
  assert.equal(left.snapshot().logicalTick, right.snapshot().logicalTick);
  assert.deepEqual(left.snapshot().diagnostics, right.snapshot().diagnostics);
});

test("rejects invalid pump and resource configuration", () => {
  assert.throws(() => createLifecyclePort({ maximumTicksPerPump: 0 }), /maximumTicksPerPump/);
  const port = createLifecyclePort();
  assert.throws(() => port.pump(-1), /accumulatedTicks/);
  assert.throws(() => port.subscribe({ resourceId: "", kind: "listener", release: () => undefined }), /resourceId/);
});
