import assert from "node:assert/strict";
import { beforeEach, afterEach, after, mock, test } from "node:test";
import { EventEmitter } from "node:events";
import { createRequire } from "node:module";
import { JSDOM } from "jsdom";
import React, { StrictMode, useEffect } from "react";
import { loadTypeScript } from "./test-typescript.mjs";

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: "https://portfolio.example", pretendToBeVisual: true });
for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, MutationObserver: dom.window.MutationObserver })) {
  Object.defineProperty(globalThis, name, { configurable: true, value, writable: true });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = () => ({ matches: false });
const { render: renderComponent, screen, fireEvent, waitFor, cleanup, act } = await import("@testing-library/react");
const require = createRequire(import.meta.url);
const { RoomEvent, ParticipantKind, Track } = require("livekit-client");
const ui = loadTypeScript("../lib/voice-ui.ts");
let rooms;
let verificationOptions;
let automaticVerification;
let proofCount;
let permissionDenied;
let unsupportedBrowser;
let scriptReady;
let onReady;
let onScriptError;
let requests;
let heartbeatCallback;
let pendingCreation;
let expiredTokenFirst;
let sessionExpired;
let playbackAllowed;
let pendingMicrophone;
let microphoneStopped;
let previousKey;
let timeouts;
let intervals;
let pendingConnect;

class FakeRoom extends EventEmitter {
  state = "disconnected";
  remoteParticipants = new Map();
  canPlaybackAudio = true;
  connectCount = 0;
  startAudioCount = 0;
  disconnected = false;
  attributeUpdates = [];
  localParticipant = {
    setAttributes: async (attributes) => { this.attributeUpdates.push(attributes); },
    isMicrophoneEnabled: false, audioLevel: 0,
    setMicrophoneEnabled: async (enabled) => {
      if (permissionDenied) throw Object.assign(new Error("raw-permission-detail"), { name: "NotAllowedError" });
      if (enabled && pendingMicrophone) await pendingMicrophone.promise;
      this.localParticipant.isMicrophoneEnabled = enabled;
      this.emit(enabled ? RoomEvent.TrackUnmuted : RoomEvent.TrackMuted);
      return { track: { stop: () => { microphoneStopped = true; this.localParticipant.isMicrophoneEnabled = false; } } };
    },
  };
  constructor(options) { super(); if (unsupportedBrowser) throw new Error("raw-browser-detail"); this.options = options; rooms.push(this); }
  async startAudio() { this.startAudioCount++; this.canPlaybackAudio = playbackAllowed; }
  async connect() { this.connectCount++; if (pendingConnect) await pendingConnect; this.state = "connected"; this.emit(RoomEvent.ConnectionStateChanged); }
  async disconnect() { this.disconnected = true; this.localParticipant.isMicrophoneEnabled = false; this.state = "disconnected"; }
}
const turnstile = {
  render: (_container, options) => { verificationOptions = options; return "synthetic-widget"; },
  reset: () => {}, remove: () => {},
  execute: () => { if (automaticVerification) queueMicrotask(() => verificationOptions.callback(`synthetic-proof-${++proofCount}`)); },
};
const Script = ({ onReady: ready, onError }) => {
  onReady = ready;
  onScriptError = onError;
  useEffect(() => { if (scriptReady) ready(); }, [ready]);
  return null;
};
const voiceContext = loadTypeScript("../context/VoiceSessionContext.tsx", {
  "next/script": { __esModule: true, default: Script },
  "livekit-client": { Room: FakeRoom, RoomEvent, ParticipantKind, Track },
  "../lib/voice-ui": ui,
});
const controlOverrides = {
  "../context/VoiceSessionContext": voiceContext,
  "../lib/voice-ui": ui,
  "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
};
const { default: VoiceCallControls } = loadTypeScript("../components/VoiceCallControls.tsx", controlOverrides);
const { default: FloatingVoiceControls } = loadTypeScript("../components/FloatingVoiceControls.tsx", controlOverrides);
function TestProvider({ children }) {
  return React.createElement(voiceContext.VoiceSessionProvider, null, children, React.createElement(FloatingVoiceControls));
}
function render(element, options = {}) { return renderComponent(element, { wrapper: TestProvider, ...options }); }
const phase = () => document.querySelector(".voice-call").dataset.voicePhase;
const flush = () => new Promise((resolve) => setImmediate(resolve));
async function click(label) { await act(async () => { fireEvent.click(screen.getByRole("button", { name: label })); await flush(); }); }
function sessionResponse() { return new Response(JSON.stringify({ sessionId: "synthetic-session-id", sessionKey: "synthetic-control-key", serverUrl: "wss://example.invalid", participantToken: "synthetic-participant-token", expiresAt: Math.floor(Date.now() / 1000) + (sessionExpired ? -1 : 300) })); }
function addAgent(room) {
  const agent = { identity: "synthetic-agent", kind: ParticipantKind.AGENT, isSpeaking: false, audioLevel: 0 };
  room.remoteParticipants.set(agent.identity, agent);
  room.emit(RoomEvent.ParticipantConnected, agent);
  return agent;
}

beforeEach(() => {
  previousKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "synthetic-test-sitekey";
  rooms = []; requests = []; automaticVerification = true; proofCount = 0;
  permissionDenied = false; unsupportedBrowser = false; scriptReady = true; pendingCreation = null;
  expiredTokenFirst = false; sessionExpired = false; playbackAllowed = true;
  pendingMicrophone = null; microphoneStopped = false;
  heartbeatCallback = null; verificationOptions = null;
  timeouts = new Map(); intervals = new Map();
  pendingConnect = null;
  window.turnstile = turnstile;
  mock.method(window.HTMLMediaElement.prototype, "play", async () => { if (!playbackAllowed) throw new Error("synthetic-blocked-audio"); });
  const realInterval = globalThis.setInterval;
  const realTimeout = globalThis.setTimeout;
  mock.method(globalThis, "setTimeout", (callback, delay, ...args) => {
    timeouts.set(delay, callback);
    return realTimeout(callback, delay, ...args);
  });
  mock.method(globalThis, "setInterval", (callback, delay, ...args) => {
    intervals.set(delay, (intervals.get(delay) ?? 0) + 1);
    if (delay === 30_000) heartbeatCallback = callback;
    return realInterval(callback, delay, ...args);
  });
  mock.method(globalThis, "fetch", async (url, options) => {
    requests.push({ url, options });
    if (url === "/api/voice/session") {
      if (expiredTokenFirst && proofCount === 1) return new Response('{"code":"verification_failed"}', { status: 403 });
      return pendingCreation ? pendingCreation.promise : sessionResponse();
    }
    if (url === "/api/voice/session/end") return new Response('{"ok":true}');
    if (url === "/api/voice/session/heartbeat") return new Response('{"ok":true}');
    throw new Error("Real provider requests are forbidden");
  });
});
afterEach(async () => {
  await act(async () => { cleanup(); await flush(); });
  mock.restoreAll();
  if (previousKey === undefined) delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  else process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = previousKey;
});
after(() => dom.window.close());

test("ready controls render without executing a challenge or hiding a visible verification widget", () => {
  render(React.createElement(VoiceCallControls));
  assert.equal(phase(), "ready");
  assert.equal(screen.getByRole("button", { name: "Talk to me" }).disabled, false);
  assert.equal(verificationOptions.execution, "execute");
  assert.equal(verificationOptions.appearance, "interaction-only");
  assert.equal(verificationOptions.action, "voice_session");
  assert.equal(document.querySelector(".voice-verification").closest("[hidden],[aria-hidden=true]"), null);
  assert.equal(proofCount, 0);
  assert.equal(requests.length, 0);
});

test("unsupported browser initialization fails gracefully before verification or provisioning", async () => {
  unsupportedBrowser = true;
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  assert.equal(phase(), "error");
  assert.match(screen.getByRole("alert").textContent, /aren’t supported in this browser/);
  assert.equal(requests.length, 0);
  assert.equal(proofCount, 0);
});

test("one click verifies, provisions and connects; track subscription alone never means speaking", async () => {
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  await waitFor(() => assert.equal(phase(), "waiting"));
  assert.equal(requests.filter((request) => request.url === "/api/voice/session").length, 1);
  assert.equal(rooms[0].startAudioCount, 1);
  assert.equal(rooms[0].connectCount, 1);
  const room = rooms[0];
  let agent;
  await act(async () => { agent = addAgent(room); });
  assert.equal(phase(), "listening");
  const element = document.createElement("audio");
  const track = { kind: Track.Kind.Audio, attach: () => element, detach: () => [element] };
  await act(async () => { room.emit(RoomEvent.TrackSubscribed, track, {}, agent); await flush(); });
  assert.equal(phase(), "listening");
  assert.equal(document.body.contains(element), true);
  await act(async () => { agent.isSpeaking = true; room.emit(RoomEvent.ActiveSpeakersChanged, [agent]); });
  assert.equal(phase(), "speaking");
  await act(async () => { agent.isSpeaking = false; room.emit(RoomEvent.ActiveSpeakersChanged, []); });
  assert.equal(phase(), "listening");
  await click("End call");
  assert.equal(phase(), "ready");
  assert.equal(room.disconnected, true);
  assert.equal(document.body.contains(element), false);
});

test("mute and reconnect states reflect the microphone, agent presence and room connection", async () => {
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  const room = rooms[0];
  await act(async () => { addAgent(room); });
  await click("Mute microphone");
  assert.equal(phase(), "muted");
  assert.equal(room.localParticipant.isMicrophoneEnabled, false);
  assert.equal(screen.getByRole("button", { name: "Unmute microphone" }).getAttribute("aria-pressed"), "true");
  await click("Unmute microphone");
  assert.equal(phase(), "listening");
  await act(async () => { room.state = "reconnecting"; room.emit(RoomEvent.ConnectionStateChanged); });
  assert.equal(phase(), "reconnecting");
  assert.equal(screen.getByRole("button", { name: "Mute microphone" }).disabled, true);
  await act(async () => { room.remoteParticipants.clear(); room.state = "connected"; room.emit(RoomEvent.ConnectionStateChanged); });
  assert.equal(phase(), "waiting");
});

test("microphone can be muted immediately while the connected room waits for its agent", async () => {
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  assert.equal(phase(), "waiting");
  await click("Mute microphone");
  assert.equal(rooms[0].localParticipant.isMicrophoneEnabled, false);
  assert.equal(phase(), "waiting");
  await act(async () => { addAgent(rooms[0]); });
  assert.equal(phase(), "muted");
});

test("a click before Turnstile loads resumes automatically when the script becomes ready", async () => {
  scriptReady = false; delete window.turnstile;
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  assert.equal(phase(), "verifying");
  assert.equal(requests.length, 0);
  await act(async () => { window.turnstile = turnstile; onReady(); await flush(); });
  await waitFor(() => assert.equal(phase(), "waiting"));
  assert.equal(rooms.length, 1);
});

test("failed verification is friendly and never starts a server session; retry uses a fresh proof", async () => {
  automaticVerification = false;
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  await act(async () => { verificationOptions["error-callback"](); await flush(); });
  assert.equal(phase(), "error");
  assert.match(screen.getByRole("alert").textContent, /security check/);
  assert.equal(requests.length, 0);
  automaticVerification = true;
  await click("Try talking again");
  await waitFor(() => assert.equal(phase(), "waiting"));
});

test("a blocked Turnstile script gives a refresh action without an endless verification wait", async () => {
  scriptReady = false; delete window.turnstile;
  render(React.createElement(VoiceCallControls));
  await act(async () => { onScriptError(); });
  await click("Talk to me");
  assert.equal(phase(), "error");
  assert.match(screen.getByRole("alert").textContent, /refresh the page/);
  assert.equal(requests.length, 0);
});

test("a single expired/duplicate Siteverify response renews proof without a second click", async () => {
  expiredTokenFirst = true;
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  await waitFor(() => assert.equal(phase(), "waiting"));
  const tokens = requests.filter(({ url }) => url === "/api/voice/session").map(({ options }) => JSON.parse(options.body).turnstileToken);
  assert.deepEqual(tokens, ["synthetic-proof-1", "synthetic-proof-2"]);
  assert.equal(rooms[0].connectCount, 1);
});

test("cancel during provisioning releases a late successful response without connecting", async () => {
  let resolve;
  pendingCreation = { promise: new Promise((done) => { resolve = done; }) };
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  await click("Cancel");
  assert.equal(phase(), "ending");
  await act(async () => { resolve(sessionResponse()); await flush(); });
  await waitFor(() => assert.equal(phase(), "ready"));
  assert.equal(rooms[0].connectCount, 0);
  assert.equal(requests.filter(({ url }) => url === "/api/voice/session/end").length, 1);
});

test("cancel during verification ignores late tokens and never calls admission", async () => {
  automaticVerification = false;
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  await click("Cancel");
  await act(async () => { verificationOptions.callback("late-token"); await flush(); });
  assert.equal(phase(), "ready");
  assert.equal(requests.length, 0);
});

test("microphone permission rejection closes the room and releases the session", async () => {
  permissionDenied = true;
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  await waitFor(() => assert.equal(phase(), "error"));
  assert.match(screen.getByRole("alert").textContent, /Allow microphone access/);
  assert.equal(rooms[0].disconnected, true);
  assert.equal(requests.filter(({ url }) => url === "/api/voice/session/end").length, 1);
});

test("a microphone permission grant arriving after cancellation immediately stops the track", async () => {
  let resolve;
  pendingMicrophone = { promise: new Promise((done) => { resolve = done; }) };
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  assert.equal(phase(), "connecting");
  await click("Cancel");
  await act(async () => { resolve(); await flush(); });
  await waitFor(() => assert.equal(phase(), "ready"));
  assert.equal(microphoneStopped, true);
  assert.equal(rooms[0].localParticipant.isMicrophoneEnabled, false);
});

test("failed heartbeats and the hard session deadline both disconnect and release", async () => {
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  fetch.mock.mockImplementation(async (url) => new Response('{}', { status: url.endsWith("heartbeat") ? 503 : 200 }));
  await act(async () => { await heartbeatCallback(); await flush(); });
  assert.equal(rooms[0].disconnected, true);
  assert.equal(phase(), "error");
  assert.match(screen.getByRole("alert").textContent, /connection was interrupted/);
  cleanup();
  sessionExpired = true;
  fetch.mock.mockImplementation(async (url) => url === "/api/voice/session" ? sessionResponse() : new Response('{}'));
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  await waitFor(() => assert.equal(phase(), "ready"));
  assert.equal(rooms.at(-1).disconnected, true);
});

test("audio blocked by the browser has an explicit playback recovery control", async () => {
  playbackAllowed = false;
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  await act(async () => { rooms[0].emit(RoomEvent.AudioPlaybackStatusChanged); });
  assert.ok(screen.getByRole("button", { name: "Tap to hear the conversation" }));
  playbackAllowed = true;
  await click("Tap to hear the conversation");
  assert.equal(screen.queryByRole("button", { name: "Tap to hear the conversation" }), null);
});

test("pure state mapping never labels an absent/disconnected agent as listening or speaking", () => {
  assert.equal(ui.conversationPhase("connected", false, true, true), "waiting");
  assert.equal(ui.conversationPhase("disconnected", true, true, true), "error");
  assert.equal(ui.conversationPhase("signalReconnecting", true, true, true), "reconnecting");
  assert.equal(ui.conversationPhase("connected", true, false, false), "muted");
  assert.equal(ui.conversationPhase("connected", true, true, false), "speaking");
  assert.ok(!ui.friendlyVoiceError("missing_environment", 503).includes("Vercel"));
});

test("playback acknowledgement waits for successful agent-track play and never repeats on reconnect", async () => {
  let finishPlayback;
  window.HTMLMediaElement.prototype.play.mock.mockImplementation(() => new Promise((resolve) => { finishPlayback = resolve; }));
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  const room = rooms[0];
  let agent;
  const element = document.createElement("audio");
  const track = { kind: Track.Kind.Audio, attach: () => element, detach: () => [element] };
  await act(async () => { agent = addAgent(room); room.emit(RoomEvent.TrackSubscribed, track, {}, agent); });
  assert.deepEqual(room.attributeUpdates, []);
  await act(async () => { finishPlayback(); await flush(); });
  assert.deepEqual(room.attributeUpdates, [{ "voiceagent.playback_ready": "true" }]);
  await act(async () => {
    room.state = "reconnecting"; room.emit(RoomEvent.ConnectionStateChanged);
    room.state = "connected"; room.emit(RoomEvent.ConnectionStateChanged);
    room.emit(RoomEvent.AudioPlaybackStatusChanged);
    await flush();
  });
  assert.equal(room.attributeUpdates.length, 1);
});

test("blocked audio never acknowledges readiness; the playback recovery gesture acknowledges once", async () => {
  playbackAllowed = false;
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  const room = rooms[0];
  const element = document.createElement("audio");
  const track = { kind: Track.Kind.Audio, attach: () => element, detach: () => [element] };
  await act(async () => { room.emit(RoomEvent.TrackSubscribed, track, {}, addAgent(room)); await flush(); });
  assert.deepEqual(room.attributeUpdates, []);
  playbackAllowed = true;
  await click("Tap to hear the conversation");
  assert.deepEqual(room.attributeUpdates, [{ "voiceagent.playback_ready": "true" }]);
});

test("a late playback resolution after ending never acknowledges a stale session", async () => {
  let finishPlayback;
  window.HTMLMediaElement.prototype.play.mock.mockImplementation(() => new Promise((resolve) => { finishPlayback = resolve; }));
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  const room = rooms[0];
  const element = document.createElement("audio");
  await act(async () => {
    room.emit(RoomEvent.TrackSubscribed, { kind: Track.Kind.Audio, attach: () => element, detach: () => [element] }, {}, addAgent(room));
  });
  await click("End call");
  await act(async () => { finishPlayback(); await flush(); });
  assert.equal(phase(), "ready");
  assert.deepEqual(room.attributeUpdates, []);
});

test("worker departure and room disconnect share one authenticated release and restore Ready", async () => {
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  const room = rooms[0];
  let agent;
  await act(async () => { agent = addAgent(room); });
  await act(async () => {
    room.emit(RoomEvent.ParticipantDisconnected, agent);
    room.emit(RoomEvent.Disconnected);
    await flush();
  });
  assert.equal(requests.filter(({ url }) => url === "/api/voice/session/end").length, 1);
  assert.equal(room.disconnected, true);
  assert.equal(phase(), "ready");
  assert.equal(screen.getByRole("button", { name: "Talk to me" }).disabled, false);
});

test("shared layout preserves one conversation, playback acknowledgement and timers across page replacements", async () => {
  const view = render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  const room = rooms[0];
  const element = document.createElement("audio");
  await act(async () => {
    room.emit(RoomEvent.TrackSubscribed, { kind: Track.Kind.Audio, attach: () => element, detach: () => [element] }, {}, addAgent(room));
    await flush();
  });
  await click("Mute microphone");
  const initialTimer = screen.getByLabelText("Remaining conversation time").textContent;
  const listeners = room.eventNames().map(name => [name, room.listenerCount(name)]);
  const timerCounts = new Map(intervals);
  assert.equal(document.querySelector(".voice-floating"), null);
  await act(async () => { view.rerender(React.createElement("main", null, "Projects page")); });
  assert.ok(screen.getByRole("complementary", { name: "Ongoing voice conversation" }));
  assert.equal(document.querySelector(".voice-floating").dataset.voicePhase, "muted");
  assert.equal(screen.getByLabelText("Remaining conversation time").textContent, initialTimer.replace(" remaining", ""));
  assert.equal(document.body.contains(element), true);
  await click("Unmute microphone");
  assert.equal(room.localParticipant.isMicrophoneEnabled, true);
  await act(async () => { view.rerender(React.createElement(VoiceCallControls)); });
  assert.equal(phase(), "listening");
  assert.equal(document.querySelector(".voice-floating"), null);
  assert.equal(screen.queryByRole("button", { name: "Talk to me" }), null);
  assert.equal(rooms.length, 1);
  assert.equal(room.connectCount, 1);
  assert.equal(requests.filter(({ url }) => url === "/api/voice/session").length, 1);
  assert.equal(requests.filter(({ url }) => url.endsWith("/end")).length, 0);
  assert.deepEqual(room.attributeUpdates, [{ "voiceagent.playback_ready": "true" }]);
  assert.deepEqual(room.eventNames().map(name => [name, room.listenerCount(name)]), listeners);
  assert.deepEqual(intervals, timerCounts);
  assert.equal(intervals.get(30_000), 1);
  assert.equal(intervals.get(1_000), 1);
  assert.equal(intervals.get(90), 1);
  await click("Mute microphone");
  assert.equal(room.localParticipant.isMicrophoneEnabled, false);
  await act(async () => { view.rerender(React.createElement("main", null, "Privacy page")); });
  await click("End call");
  assert.equal(document.querySelector(".voice-floating"), null);
  assert.equal(room.disconnected, true);
  assert.equal(requests.filter(({ url }) => url.endsWith("/end")).length, 1);
});

test("floating controls appear only while the inline panel is out of view", async () => {
  let observe;
  class FakeObserver {
    constructor(callback) { observe = callback; }
    observe() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, "IntersectionObserver", { configurable: true, value: FakeObserver });
  try {
    render(React.createElement(VoiceCallControls));
    await click("Talk to me");
    await act(async () => { observe([{ isIntersecting: false, intersectionRatio: 0 }]); });
    assert.ok(document.querySelector(".voice-floating"));
    await act(async () => { observe([{ isIntersecting: true, intersectionRatio: 1 }]); });
    assert.equal(document.querySelector(".voice-floating"), null);
  } finally { delete globalThis.IntersectionObserver; }
});

test("SDK recovery is bounded, retains mute and does not request another session", async () => {
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  const room = rooms[0];
  await act(async () => { addAgent(room); });
  await click("Mute microphone");
  await act(async () => { room.state = "reconnecting"; room.emit(RoomEvent.ConnectionStateChanged); });
  const expireRecovery = timeouts.get(voiceContext.RECONNECT_GRACE_MS);
  assert.equal(typeof expireRecovery, "function");
  assert.equal(phase(), "reconnecting");
  assert.equal(room.disconnected, false);
  assert.equal(room.options.reconnectPolicy.nextRetryDelayInMs({ elapsedMs: 30_000, retryCount: 0 }), null);
  assert.equal(room.options.reconnectPolicy.nextRetryDelayInMs({ elapsedMs: 10, retryCount: 4 }), null);
  await act(async () => { room.state = "connected"; room.emit(RoomEvent.Reconnected); });
  assert.equal(phase(), "muted");
  assert.equal(room.localParticipant.isMicrophoneEnabled, false);
  assert.equal(requests.filter(({ url }) => url === "/api/voice/session").length, 1);
  await act(async () => { room.state = "reconnecting"; room.emit(RoomEvent.ConnectionStateChanged); });
  await act(async () => { timeouts.get(voiceContext.RECONNECT_GRACE_MS)(); await flush(); });
  assert.equal(phase(), "error");
  assert.equal(room.disconnected, true);
  assert.match(screen.getByRole("alert").textContent, /connection was lost/);
  assert.equal(requests.filter(({ url }) => url.endsWith("/end")).length, 1);
});

test("a heartbeat interruption during SDK recovery waits for the bounded grace", async () => {
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  const room = rooms[0];
  await act(async () => { room.state = "reconnecting"; room.emit(RoomEvent.ConnectionStateChanged); });
  fetch.mock.mockImplementation(async url => new Response('{}', { status: url.endsWith("heartbeat") ? 503 : 200 }));
  await act(async () => { await heartbeatCallback(); await flush(); });
  assert.equal(phase(), "reconnecting");
  assert.equal(room.disconnected, false);
  await act(async () => { timeouts.get(voiceContext.RECONNECT_GRACE_MS)(); await flush(); });
  assert.equal(room.disconnected, true);
});

test("pagehide closes once with authenticated keepalive; history restoration never starts a new call", async () => {
  const view = render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  await act(async () => {
    window.dispatchEvent(new window.Event("pagehide"));
    window.dispatchEvent(new window.Event("pagehide"));
    await flush();
    window.dispatchEvent(new window.PageTransitionEvent("pageshow", { persisted: true }));
  });
  const ends = requests.filter(({ url }) => url.endsWith("/end"));
  assert.equal(ends.length, 1);
  assert.equal(ends[0].options.keepalive, true);
  assert.deepEqual(JSON.parse(ends[0].options.body), { sessionId: "synthetic-session-id", sessionKey: "synthetic-control-key" });
  assert.equal(phase(), "ready");
  assert.equal(rooms[0].disconnected, true);
  await act(async () => { view.rerender(React.createElement(VoiceCallControls)); });
  assert.equal(rooms.length, 1);
  assert.equal(requests.filter(({ url }) => url === "/api/voice/session").length, 1);
  assert.equal(window.localStorage.length, 0);
  assert.equal(window.sessionStorage.length, 0);
});

test("failed or unauthorized cleanup keeps controls and keys for retry and never reprovisions", async () => {
  const view = render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  fetch.mock.mockImplementation(async () => new Response('{}', { status: 404 }));
  await click("End call");
  assert.equal(phase(), "error");
  assert.equal(screen.getByRole("button", { name: "Try talking again" }).disabled, true);
  assert.match(screen.getByRole("alert").textContent, /previous conversation is ending/);
  await act(async () => { view.rerender(React.createElement("main", null, "Projects")); });
  assert.ok(screen.getByRole("button", { name: "Retry closing" }));
  fetch.mock.mockImplementation(async (url, options) => {
    requests.push({ url, options });
    return new Response('{"ok":true}');
  });
  await click("Retry closing");
  assert.equal(document.querySelector(".voice-floating"), null);
  assert.equal(requests.filter(({ url }) => url === "/api/voice/session").length, 1);
  assert.deepEqual(JSON.parse(requests.at(-1).options.body), { sessionId: "synthetic-session-id", sessionKey: "synthetic-control-key" });
});

test("ONE_ACTIVE and BUSY prevent repeated provisioning until an explicit retry after a pause", async () => {
  for (const code of ["ONE_ACTIVE", "BUSY"]) {
    requests = [];
    fetch.mock.mockImplementation(async (url, options) => {
      requests.push({ url, options });
      return new Response(JSON.stringify({ code }), { status: 409 });
    });
    render(React.createElement(VoiceCallControls));
    await click("Talk to me");
    assert.equal(phase(), "error");
    assert.match(screen.getByRole("alert").textContent, code === "ONE_ACTIVE" ? /Another conversation is already active on this network/ : /few conversations/);
    assert.equal(screen.getByRole("button", { name: "Try talking again" }).disabled, true);
    await click("Try talking again");
    assert.equal(requests.length, 1);
    await act(async () => { timeouts.get(15_000)(); });
    assert.equal(screen.getByRole("button", { name: "Try talking again" }).disabled, false);
    assert.equal(requests.length, 1); // No automatic provisioning when the pause expires.
    cleanup();
  }
});

test("ending does not wait indefinitely for a microphone permission prompt", async () => {
  let resolve;
  pendingMicrophone = { promise: new Promise(done => { resolve = done; }) };
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  assert.equal(phase(), "connecting");
  await click("Cancel");
  assert.equal(phase(), "ready");
  assert.equal(rooms[0].disconnected, true);
  assert.equal(requests.filter(({ url }) => url.endsWith("/end")).length, 1);
  await act(async () => { resolve(); await flush(); });
  assert.equal(microphoneStopped, true);
  assert.equal(phase(), "ready");
});

test("a connection completing after cancellation is disconnected again without capturing audio", async () => {
  let resolve;
  pendingConnect = new Promise(done => { resolve = done; });
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  assert.equal(phase(), "connecting");
  await click("Cancel");
  assert.equal(phase(), "ready");
  await act(async () => { resolve(); await flush(); });
  assert.equal(rooms[0].state, "disconnected");
  assert.equal(rooms[0].localParticipant.isMicrophoneEnabled, false);
  assert.equal(requests.filter(({ url }) => url.endsWith("/end")).length, 1);
});

test("the hard deadline is armed before microphone permission and is unchanged by navigation", async () => {
  pendingMicrophone = { promise: new Promise(() => {}) };
  const view = render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  const [delay, expire] = [...timeouts.entries()].find(([delay]) => delay > 290_000 && delay <= 300_000);
  assert.ok(delay <= 300_000);
  await act(async () => { view.rerender(React.createElement("main", null, "Projects")); });
  assert.equal([...timeouts.entries()].find(([delay]) => delay > 290_000 && delay <= 300_000)[1], expire);
  await act(async () => { expire(); await flush(); });
  assert.equal(rooms[0].disconnected, true);
  assert.equal(document.querySelector(".voice-floating"), null);
  assert.equal(requests.filter(({ url }) => url.endsWith("/end")).length, 1);
});

test("Strict Mode effect replay leaves one session, timer set and pagehide handler", async () => {
  const add = mock.method(window, "addEventListener");
  const remove = mock.method(window, "removeEventListener");
  render(React.createElement(VoiceCallControls), {
    wrapper: ({ children }) => React.createElement(StrictMode, null, React.createElement(TestProvider, null, children)),
  });
  await act(async () => { await flush(); });
  await click("Talk to me");
  assert.equal(phase(), "waiting");
  assert.equal(rooms.length, 1);
  assert.equal(intervals.get(30_000), 1);
  const added = add.mock.calls.filter(({ arguments: args }) => args[0] === "pagehide").length;
  const removed = remove.mock.calls.filter(({ arguments: args }) => args[0] === "pagehide").length;
  assert.equal(added - removed, 1);
  await act(async () => { window.dispatchEvent(new window.Event("pagehide")); await flush(); });
  assert.equal(requests.filter(({ url }) => url.endsWith("/end")).length, 1);
});

test("an ambiguous admission failure after cancellation never claims cleanup succeeded or starts another call", async () => {
  let reject;
  pendingCreation = { promise: new Promise((_, fail) => { reject = fail; }) };
  render(React.createElement(VoiceCallControls));
  await click("Talk to me");
  await click("Cancel");
  await act(async () => { reject(new Error("synthetic lost admission response")); await flush(); });
  assert.equal(phase(), "error");
  assert.match(screen.getByRole("alert").textContent, /If a conversation was created, it may still be closing/);
  assert.equal(screen.getByRole("button", { name: "Try talking again" }).disabled, true);
  assert.equal(requests.filter(({ url }) => url === "/api/voice/session").length, 1);
  assert.equal(requests.filter(({ url }) => url.endsWith("/end")).length, 0);
  assert.equal(rooms[0].disconnected, true);
});
