import { ROW_UNITS } from "@/components/keyboard/layout";
import type { KeyDef } from "@/components/keyboard/layout";
import { THOCK_SAMPLE_BASE64 } from "@/components/keyboard/thock-sample";

type SoundCategory = "normal" | "spacebar" | "modifier";

interface ThockEngine {
  ctx: AudioContext;
  dry: GainNode;
  wet: GainNode;
  buffer: AudioBuffer;
  supportsPanning: boolean;
}

const CATEGORY_PROFILE: Record<SoundCategory, { rate: [number, number]; gain: number; filterHz: number | null }> = {
  normal: { rate: [0.97, 1.04], gain: 0.85, filterHz: null },
  spacebar: { rate: [0.72, 0.78], gain: 1.0, filterHz: 1600 },
  modifier: { rate: [0.86, 0.92], gain: 0.68, filterHz: 3000 },
};

const PAN_STRENGTH = 0.3;
const PAN_JITTER = 0.08;

let muted = false;
let disabled = false;
let enginePromise: Promise<ThockEngine | null> | null = null;
// Set synchronously on creation so primeSound can resume it inside the user gesture.
let audioContext: AudioContext | null = null;

function disable(reason: string): null {
  disabled = true;
  console.warn(`Key sound disabled: ${reason}`);
  return null;
}

function categoryFor(key: KeyDef): SoundCategory {
  if (key.id === "space") return "spacebar";
  if (key.kind === "modifier" || key.kind === "action") return "modifier";
  return "normal";
}

function panFor(key: KeyDef): number {
  const center = key.x + key.width / 2;
  const pan = ((center / ROW_UNITS) * 2 - 1) * PAN_STRENGTH + (Math.random() - 0.5) * PAN_JITTER;
  return Math.max(-1, Math.min(1, pan));
}

/** A short noise burst that gives each hit the resonance of a wooden case. */
function buildCaseImpulse(ctx: AudioContext): AudioBuffer {
  const length = Math.ceil(ctx.sampleRate * 0.2);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let lowPassed = 0;
    for (let i = 0; i < length; i++) {
      const raw = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.8);
      lowPassed += (raw - lowPassed) * 0.3;
      data[i] = lowPassed;
    }
  }
  return buffer;
}

function decodeBase64(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function createEngine(): Promise<ThockEngine | null> {
  const AudioContextCtor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return disable("Web Audio API is not available");

  const ctx = new AudioContextCtor();
  audioContext = ctx;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -20;
  compressor.knee.value = 12;
  compressor.ratio.value = 5;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.08;

  const master = ctx.createGain();
  master.gain.value = 0.9;
  compressor.connect(master);
  master.connect(ctx.destination);

  const dry = ctx.createGain();
  dry.gain.value = 0.85;
  dry.connect(compressor);

  const wet = ctx.createGain();
  wet.gain.value = 0.3;
  const convolver = ctx.createConvolver();
  convolver.normalize = true;
  convolver.buffer = buildCaseImpulse(ctx);
  wet.connect(convolver);
  convolver.connect(compressor);

  let buffer: AudioBuffer;
  try {
    buffer = await ctx.decodeAudioData(decodeBase64(THOCK_SAMPLE_BASE64));
  } catch (error) {
    // decodeAudioData rejects with a DOMException (e.g. EncodingError) when the browser can't decode Ogg Vorbis.
    if (!(error instanceof DOMException)) throw error;
    audioContext = null;
    void ctx.close();
    return disable(`could not decode the key sample (${error.message})`);
  }

  return { ctx, dry, wet, buffer, supportsPanning: typeof ctx.createStereoPanner === "function" };
}

function getEngine(): Promise<ThockEngine | null> {
  enginePromise ??= createEngine();
  return enginePromise;
}

function playOn(engine: ThockEngine, key: KeyDef) {
  const { ctx, dry, wet, buffer, supportsPanning } = engine;
  if (ctx.state === "suspended") void ctx.resume();

  const profile = CATEGORY_PROFILE[categoryFor(key)];
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const [minRate, maxRate] = profile.rate;
  source.playbackRate.value = minRate + Math.random() * (maxRate - minRate);

  const gain = ctx.createGain();
  gain.gain.value = profile.gain * (0.96 + Math.random() * 0.08);
  source.connect(gain);

  const nodes: AudioNode[] = [source, gain];
  let tail: AudioNode = gain;
  if (profile.filterHz) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = profile.filterHz;
    filter.Q.value = 0.7;
    tail.connect(filter);
    tail = filter;
    nodes.push(filter);
  }
  if (supportsPanning) {
    const panner = ctx.createStereoPanner();
    panner.pan.value = panFor(key);
    tail.connect(panner);
    tail = panner;
    nodes.push(panner);
  }
  tail.connect(dry);
  tail.connect(wet);

  source.onended = () => {
    for (const node of nodes) node.disconnect();
  };
  source.start(ctx.currentTime);
}

/**
 * Creates or resumes the audio context. Call it synchronously from a pointer/keyboard
 * handler: Safari only unlocks audio inside a user gesture, while key sounds themselves
 * play later from the render loop.
 */
export function primeSound(): void {
  if (muted || disabled) return;
  if (!audioContext) {
    void getEngine();
    return;
  }
  if (audioContext.state === "suspended") void audioContext.resume();
}

export function playKeySound(key: KeyDef): void {
  if (muted || disabled) return;
  void getEngine().then((engine) => {
    if (engine && !muted) playOn(engine, key);
  });
}

export function setSoundMuted(value: boolean): void {
  muted = value;
}
