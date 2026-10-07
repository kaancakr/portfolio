import { test } from "node:test";
import assert from "node:assert/strict";
import { keyById } from "./layout.ts";

const KEY = keyById("about-0")!;

// sound.ts keeps its engine in module state, so every test loads a fresh copy of the module.
let copies = 0;
const loadSound = () => import(`./sound.ts?copy=${++copies}`) as Promise<typeof import("./sound.ts")>;

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

function installAudioContext(AudioContext: unknown) {
  Object.assign(globalThis, { window: { AudioContext } });
}

/** Presses a few keys the way the page does: prime inside the gesture, play from the render loop. */
async function pressKeys(sound: Awaited<ReturnType<typeof loadSound>>, count: number) {
  for (let i = 0; i < count; i++) {
    sound.primeSound();
    sound.playKeySound(KEY);
    await flushPromises();
  }
}

const param = () => ({ value: 0 });
const fakeNode = () => ({
  connect() {},
  disconnect() {},
  gain: param(),
  threshold: param(),
  knee: param(),
  ratio: param(),
  attack: param(),
  release: param(),
});

/** Enough of AudioContext for createEngine; decoding rejects with null like old Safari's. */
function nullRejectingAudioContext(onClose: () => void) {
  return class {
    sampleRate = 8000;
    state = "suspended";
    destination = fakeNode();
    createDynamicsCompressor = fakeNode;
    createGain = fakeNode;
    createConvolver = fakeNode;
    createBuffer(_channels: number, length: number) {
      return { getChannelData: () => new Float32Array(length) };
    }
    decodeAudioData() {
      return Promise.reject(null);
    }
    resume() {
      return Promise.resolve();
    }
    close() {
      onClose();
      return Promise.resolve();
    }
  };
}

test("warns_once_and_stops_trying_when_the_audio_context_constructor_throws", async (t) => {
  let constructed = 0;
  installAudioContext(
    class {
      constructor() {
        constructed++;
        throw new DOMException("No audio output device", "NotSupportedError");
      }
    },
  );
  const warn = t.mock.method(console, "warn", () => {});
  await pressKeys(await loadSound(), 3);
  assert.equal(warn.mock.callCount(), 1);
  assert.equal(constructed, 1);
});

test("warns_once_when_decoding_rejects_with_null", async (t) => {
  installAudioContext(nullRejectingAudioContext(() => {}));
  const warn = t.mock.method(console, "warn", () => {});
  await pressKeys(await loadSound(), 3);
  assert.equal(warn.mock.callCount(), 1);
});

test("closes_the_audio_context_when_setup_fails_after_creating_it", async (t) => {
  let closed = 0;
  installAudioContext(nullRejectingAudioContext(() => closed++));
  t.mock.method(console, "warn", () => {});
  await pressKeys(await loadSound(), 3);
  assert.equal(closed, 1);
});
