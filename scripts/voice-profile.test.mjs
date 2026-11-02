import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { buildVoiceProfile, prepareVoiceProfile, greeting, farewell } from "./prepare-voice-profile.mjs";

test("worker profile uses fixed text, opt-in readiness/ending and the existing five-minute bound", async () => {
  const { config, prompt } = await buildVoiceProfile();
  assert.equal(greeting, "Hi! I'm Habiba's AI assistant. I can tell you about her skills, projects, experience, and professional background. What would you like to know?");
  assert.equal(farewell, "Thanks for chatting! Have a great day!");
  assert.equal(config.greeting.text, greeting);
  assert.equal(config.greeting.mode, "custom");
  assert.equal(config.greeting.wait_for_playback_ready, true);
  assert.equal(config.ending.farewell, farewell);
  assert.equal(config.ending.farewell_mode, "custom");
  assert.equal(config.ending.detect_explicit, true);
  assert.equal(config.ending.timeout_seconds, 10);
  assert.equal(config.runtime.max_session_seconds, 300);
  assert.equal(config.prompt_path, "customization/host/prompt.md");
  assert.equal(config.credentials, undefined);
  for (const name of ["tts", "stt", "llm", "limits", "interruption", "latency"]) assert.equal(config[name], undefined);
  assert.ok(Buffer.byteLength(prompt) < 16_384);
});

test("profile grounds biography, skills, projects, experience and education in reviewed sources", async () => {
  const { knowledge, prompt } = await buildVoiceProfile();
  assert.deepEqual(knowledge.sources, ["public/Umm-e-Habiba-Imran-CV.pdf", "lib/data.ts"]);
  assert.equal(knowledge.education.cgpa, "3.87");
  assert.equal(knowledge.education.expectedGraduation, "December 2027");
  for (const topic of ["Who is Habiba?", "What are her skills?", "What projects has she built?", "Tell me about her experience."]) {
    assert.ok(knowledge.frequentlyAsked[topic]);
  }
  for (const project of ["QualiCall", "Telephony SDK", "Awaaz Voice Agent", "AIDRA", "EarthScan AI", "VertexVoyage"]) {
    assert.ok(knowledge.projects.find(({ name }) => name === project), project);
  }
  assert.match(prompt, /You are not Habiba/);
  assert.match(prompt, /third person/);
  assert.match(prompt, /Use conversation history/);
  assert.match(prompt, /do not have that specific detail/);
  assert.match(knowledge.frequentlyAsked["What's her favorite movie?"], /not documented/);
  assert.equal(knowledge.sourceConflicts.length, 3);
  assert.match(prompt, /explicitly explain which source says what/);
  assert.doesNotMatch(prompt, /\+92[\d -]{8,}|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\b(?:gsk_|sk_live_)[A-Za-z0-9]{12,}/);
});

test("profile preparation produces a public-only standalone build context without private worker files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "portfolio-voice-profile-"));
  // This exact test-created temporary root is the only recursive removal target.
  try {
    await mkdir(path.join(root, "src/voiceagent"), { recursive: true });
    for (const name of ["pyproject.toml", "uv.lock", ".python-version", "agent.py", "prompt.md", "config.example.yaml", "Dockerfile", ".dockerignore", "customization/agent.yaml", "customization/prompt.md", "scripts/prepare_models.py", "src/voiceagent/runtime.py", "src/voiceagent/playback.py"]) {
      await mkdir(path.dirname(path.join(root, name)), { recursive: true });
      await writeFile(path.join(root, name), "synthetic worker source");
    }
    await writeFile(path.join(root, ".env.local"), "synthetic-local-only\n");
    await writeFile(path.join(root, "livekit.toml"), "synthetic-private-binding\n");
    await writeFile(path.join(root, ".gitignore"), "/customization/host/\n");
    await writeFile(path.join(root, "src/voiceagent/private.json"), "synthetic-private-data\n");
    const { buildDirectory } = await prepareVoiceProfile(root, path.join(root, "builds"));
    const { prompt, config } = await buildVoiceProfile();
    assert.equal(await readFile(path.join(buildDirectory, "customization/host/prompt.md"), "utf8"), prompt);
    assert.deepEqual(JSON.parse(await readFile(path.join(buildDirectory, "customization/host/agent.yaml"), "utf8")), config);
    assert.equal(await readFile(path.join(root, ".env.local"), "utf8"), "synthetic-local-only\n");
    assert.equal(await readFile(path.join(root, "src/voiceagent/runtime.py"), "utf8"), "synthetic worker source");
    assert.doesNotMatch(await readFile(path.join(buildDirectory, ".gitignore"), "utf8"), /customization\/host/);
    const files = await readdir(buildDirectory, { recursive: true });
    for (const name of files) assert.doesNotMatch(name, /\.env|livekit\.toml|private\.json|\.git[/\\]/);
    const regenerated = await prepareVoiceProfile(root, path.join(root, "builds"));
    assert.notEqual(regenerated.buildDirectory, buildDirectory); // Never overwrite an existing build.
  } finally {
    assert.equal(path.dirname(root), os.tmpdir());
    assert.ok(path.basename(root).startsWith("portfolio-voice-profile-"));
    await rm(root, { recursive: true, force: true });
  }
});
