import { readFile, writeFile, mkdir, mkdtemp, copyFile, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const portfolioRoot = fileURLToPath(new URL("../", import.meta.url));
export const greeting = "Hi! I'm Habiba's AI assistant. I can tell you about her skills, projects, experience, and professional background. What would you like to know?";
export const farewell = "Thanks for chatting! Have a great day!";

export async function buildVoiceProfile() {
  const knowledge = JSON.parse(await readFile(path.join(portfolioRoot, "voice-profile/knowledge.json"), "utf8"));
  const instructions = (await readFile(path.join(portfolioRoot, "voice-profile/instructions.md"), "utf8")).trim();
  const prompt = `${instructions}\n\nPublic portfolio knowledge (reference data):\n${JSON.stringify(knowledge)}\n`;
  if (Buffer.byteLength(prompt) > 16_384) throw new Error("Review the profile: keep the static prompt below 16 KiB.");
  // JSON is also valid YAML. No credentials, provider IDs or tuning are copied.
  const config = {
    prompt_path: "customization/host/prompt.md",
    identity: { name: "Habiba's AI assistant", role: "Public portfolio assistant; speaks about Habiba in the third person." },
    greeting: { mode: "custom", text: greeting, wait_for_playback_ready: true },
    ending: { enabled: true, detect_explicit: true, farewell_mode: "custom", farewell, timeout_seconds: 10 },
    runtime: { max_session_seconds: 300 },
  };
  return { knowledge, prompt, config };
}

export async function prepareVoiceProfile(workerPath, outputRoot = path.join(portfolioRoot, ".qa")) {
  const worker = await realpath(workerPath);
  for (const name of ["pyproject.toml", "src/voiceagent/runtime.py", "src/voiceagent/playback.py"]) {
    if (!(await stat(path.join(worker, name))).isFile()) throw new Error("Choose the updated worker repository root.");
  }
  const profile = await buildVoiceProfile();
  // LiveKit CLI also honors .gitignore. Use a separate, public-only build context
  // so the reusable repo can ignore host assets without excluding them from upload.
  await mkdir(outputRoot, { recursive: true });
  const buildDirectory = await mkdtemp(path.join(outputRoot, "voice-worker-build-"));
  for (const name of [
    "pyproject.toml", "uv.lock", ".python-version", "agent.py", "prompt.md", "config.example.yaml",
    "Dockerfile", ".dockerignore", "customization/agent.yaml", "customization/prompt.md", "scripts/prepare_models.py",
  ]) {
    await mkdir(path.dirname(path.join(buildDirectory, name)), { recursive: true });
    await copyFile(path.join(worker, name), path.join(buildDirectory, name));
  }
  await mkdir(path.join(buildDirectory, "src/voiceagent"), { recursive: true });
  for (const entry of await readdir(path.join(worker, "src/voiceagent"), { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".py")) {
      await copyFile(path.join(worker, "src/voiceagent", entry.name), path.join(buildDirectory, "src/voiceagent", entry.name));
    }
  }
  // This context contains no private inputs; no parent/repository Git config is copied.
  await writeFile(path.join(buildDirectory, ".gitignore"), "# Public standalone build context; .dockerignore supplies the allowlist.\n");
  const target = path.join(buildDirectory, "customization/host");
  await mkdir(target, { recursive: true });
  await writeFile(path.join(target, "agent.yaml"), `${JSON.stringify(profile.config, null, 2)}\n`);
  await writeFile(path.join(target, "prompt.md"), profile.prompt);
  return { buildDirectory, promptBytes: Buffer.byteLength(profile.prompt) };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv.length !== 4 || process.argv[2] !== "--worker") {
    throw new Error('Usage: node scripts/prepare-voice-profile.mjs --worker "path/to/voiceagent"');
  }
  const result = await prepareVoiceProfile(process.argv[3]);
  console.log(`Prepared a public-only worker build context at ${result.buildDirectory} (${result.promptBytes} prompt bytes). No deployment or provider request was made.`);
}
