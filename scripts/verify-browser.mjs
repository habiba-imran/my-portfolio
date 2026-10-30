import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";

// Dependency-free Chromium acceptance checks, using the browser's DevTools protocol.
// Override PORTFOLIO_CHROME for your local Chrome/Chromium executable.
const base = process.env.PORTFOLIO_URL || "http://127.0.0.1:3010";
const browserCache = path.join(
  process.env.LOCALAPPDATA || path.join(homedir(), "AppData/Local"),
  "ms-playwright",
);
const cachedChromium = existsSync(browserCache)
  ? readdirSync(browserCache)
      .filter((name) => /^chromium-\d+$/.test(name))
      .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]))
      .map((name) => path.join(browserCache, name, "chrome-win64/chrome.exe"))
  : [];
const candidates = [
  process.env.PORTFOLIO_CHROME,
  ...cachedChromium,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
].filter(Boolean);
const executable = candidates.find(existsSync);
assert.ok(
  executable,
  "Set PORTFOLIO_CHROME to an installed Chrome/Chromium executable.",
);
assert.equal(
  (await fetch(base)).status,
  200,
  `Start the portfolio at ${base} first.`,
);
await mkdir(".qa", { recursive: true });
const browser = spawn(
  executable,
  [
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    `--user-data-dir=${path.resolve(".qa", `chromium-${Date.now()}`)}`,
    "--disable-background-networking",
    "--disable-component-update",
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"], windowsHide: true },
);
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    let stderr = "";
    const timeout = setTimeout(
      () => reject(new Error("Chromium startup timed out.")),
      20000,
    );
    browser.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    browser.stderr.on("data", (data) => {
      stderr += data.toString();
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
    browser.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Chromium exited ${code}: ${stderr.slice(-1000)}`));
    });
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(String(data));
    if (message.id && pending.has(message.id)) {
      const { resolve, reject, timeout } = pending.get(message.id);
      clearTimeout(timeout);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown")
      errors.push(
        message.params.exceptionDetails.exception?.description ||
          message.params.exceptionDetails.text,
      );
    if (
      message.method === "Runtime.consoleAPICalled" &&
      message.params.type === "error"
    )
      errors.push(
        message.params.args
          .map((arg) => arg.value || arg.description)
          .join(" "),
      );
  });
  function send(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const messageId = ++id;
      const timeout = setTimeout(() => {
        pending.delete(messageId);
        reject(new Error(`CDP timed out: ${method}`));
      }, 20000);
      pending.set(messageId, { resolve, reject, timeout });
      socket.send(
        JSON.stringify({
          id: messageId,
          method,
          params,
          ...(sessionId ? { sessionId } : {}),
        }),
      );
    });
  }
  const { targetId } = await send("Target.createTarget", {
    url: "about:blank",
  });
  const { sessionId } = await send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  const cdp = (method, params) => send(method, params, sessionId);
  await send("Target.activateTarget", { targetId });
  await cdp("Page.enable");
  await cdp("Runtime.enable");
  await cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
  async function evaluate(expression) {
    const result = await cdp("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails)
      throw new Error(
        result.exceptionDetails.exception?.description ||
          result.exceptionDetails.text,
      );
    return result.result.value;
  }
  async function waitFor(expression) {
    for (let attempt = 0; attempt < 120; attempt++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Timed out waiting for ${expression}`);
  }
  async function click(selector) {
    await evaluate(
      `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('Missing control'); el.focus(); el.click(); })()`,
    );
  }
  async function press(key, code, virtualKey) {
    await cdp("Input.dispatchKeyEvent", {
      type: "keyDown",
      key,
      code,
      windowsVirtualKeyCode: virtualKey,
    });
    await cdp("Input.dispatchKeyEvent", {
      type: "keyUp",
      key,
      code,
      windowsVirtualKeyCode: virtualKey,
    });
  }
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp("Page.navigate", { url: base });
  await waitFor(
    `document.readyState === 'complete' && document.querySelector('.hero-art')`,
  );
  // A React state update proves hydration is ready before interaction checks.
  await click('[aria-label="Show code artwork"]');
  await waitFor(`document.querySelector('.hero-art--code')`);
  await click('[aria-label="Show voice artwork"]');
  await waitFor(`document.querySelector('.hero-art--voice')`);
  await evaluate(
    `document.fonts.ready.then(() => new Promise(resolve => setTimeout(resolve, 1500)))`,
  );
  await waitFor(
    `getComputedStyle(document.querySelector('.hero-art-wrap')).opacity === '1'`,
  );
  const firstShot = await cdp("Page.captureScreenshot", { format: "png" });
  await writeFile(
    ".qa/portfolio-desktop.png",
    Buffer.from(firstShot.data, "base64"),
  );

  assert.equal(await evaluate(`document.querySelectorAll('h1').length`), 1);
  assert.equal(
    await evaluate(`document.querySelectorAll('.project-card').length`),
    4,
  );
  assert.deepEqual(
    await evaluate(
      `[...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(href => !document.getElementById(href.slice(1)))`,
    ),
    [],
  );
  assert.equal(
    await evaluate(
      `document.querySelector('a[download]').getAttribute('href')`,
    ),
    "/Umm-e-Habiba-Imran-CV.pdf",
  );
  const cv = await fetch(`${base}/Umm-e-Habiba-Imran-CV.pdf`);
  assert.equal(cv.status, 200);
  assert.match(cv.headers.get("content-type"), /pdf/);
  assert.equal((await fetch(`${base}/og-image.png`)).status, 200);
  assert.equal((await fetch(`${base}/favicon.svg`)).status, 200);

  await click(".menu-trigger");
  await waitFor(`document.querySelector('#site-menu')?.open`);
  assert.equal(await evaluate(`document.body.style.overflow`), "hidden");
  for (let i = 0; i < 14; i++) {
    await press("Tab", "Tab", 9);
    assert.equal(
      await evaluate(
        `document.querySelector('#site-menu').contains(document.activeElement)`,
      ),
      true,
      "Menu must contain keyboard focus",
    );
  }
  await press("Escape", "Escape", 27);
  await waitFor(`!document.querySelector('#site-menu')`);
  assert.equal(
    await evaluate(`document.activeElement.className`),
    "menu-trigger",
  );
  assert.equal(await evaluate(`document.body.style.overflow`), "");
  await click(".menu-trigger");
  await waitFor(`document.querySelector('#site-menu')?.open`);
  await click('.overlay-nav a[href="#projects"]');
  await waitFor(
    `!document.querySelector('#site-menu') && location.hash === '#projects'`,
  );

  for (let i = 0; i < 4; i++) {
    await click(`.project-card:nth-child(${i + 1}) .project-preview`);
    await waitFor(`document.querySelector('#project-dialog')?.open`);
    assert.ok(
      await evaluate(
        `document.querySelector('#case-title').textContent.length > 0`,
      ),
    );
    for (let j = 0; j < 4; j++) {
      await press("Tab", "Tab", 9);
      assert.equal(
        await evaluate(
          `document.querySelector('#project-dialog').contains(document.activeElement)`,
        ),
        true,
      );
    }
    await press("Escape", "Escape", 27);
    await waitFor(`!document.querySelector('#project-dialog')`);
    assert.equal(
      await evaluate(`document.activeElement.className`),
      "project-preview",
    );
  }
  await click(".expertise-row summary");
  assert.equal(
    await evaluate(`document.querySelector('.expertise-row').open`),
    true,
  );
  await click(".expertise-row summary");
  assert.equal(
    await evaluate(`document.querySelector('.expertise-row').open`),
    false,
  );
  await click(".voice-stage-tabs button:nth-child(2)");
  await waitFor(
    `document.querySelector('.voice-stage-detail h3').textContent === 'Then, understand.'`,
  );
  await click(".voice-stage-tabs button:nth-child(3)");
  await waitFor(
    `document.querySelector('.voice-stage-detail h3').textContent === 'And, respond.'`,
  );
  assert.match(
    await evaluate(`document.querySelector('.voice-section').textContent`),
    /live demo coming soon/,
  );
  assert.equal(
    await evaluate(
      `document.querySelectorAll('button').length > 0 && ![...document.querySelectorAll('button')].some(b => /start call|start demo/i.test(b.textContent))`,
    ),
    true,
  );

  await send("Browser.grantPermissions", {
    origin: base,
    permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"],
  });
  await click(".copy-button");
  await waitFor(
    `document.querySelector('.copy-status').textContent === 'Email copied'`,
  );
  assert.equal(
    await evaluate(`navigator.clipboard.readText()`),
    "habibaimrannn@gmail.com",
  );
  await click(".theme-toggle");
  await waitFor(`document.documentElement.classList.contains('dark')`);
  await click(".theme-toggle");
  await waitFor(`document.documentElement.classList.contains('light')`);

  const sizes = [360, 390, 430, 768, 1024, 1440, 1920];
  const layouts = [];
  for (const width of sizes) {
    await cdp("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    await cdp("Emulation.setTouchEmulationEnabled", { enabled: width < 768 });
    await evaluate(`window.scrollTo({top: 0, behavior: 'instant'})`);
    await new Promise((resolve) => setTimeout(resolve, 200));
    const layout = await evaluate(
      `({viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth, headline: document.querySelector('h1').getBoundingClientRect().right, titleLines: [...document.querySelectorAll('.headline-line')].map(el => ({box: el.clientWidth, content: el.scrollWidth}))})`,
    );
    assert.ok(
      layout.document <= width + 1,
      `Horizontal overflow at ${width}px: ${JSON.stringify(layout)}`,
    );
    assert.ok(
      layout.titleLines.every((line) => line.content <= line.box + 1),
      `Hero headline clips at ${width}px: ${JSON.stringify(layout)}`,
    );
    assert.ok(
      await evaluate(
        `!document.querySelector('#voice-heading').innerText.includes('withsomething')`,
      ),
      "Voice heading keeps word spacing at every breakpoint",
    );
    assert.ok(
      await evaluate(
        `!document.querySelector('#experience-heading').innerText.includes('Learning.Building')`,
      ),
      "Experience heading keeps word spacing at every breakpoint",
    );
    layouts.push({ width, ...layout });
    if ([390, 1440].includes(width)) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      const shot = await cdp("Page.captureScreenshot", { format: "png" });
      await writeFile(
        `.qa/portfolio-${width}.png`,
        Buffer.from(shot.data, "base64"),
      );
    }
    if (width === 390) {
      await click(".menu-trigger");
      await waitFor(`document.querySelector('#site-menu')?.open`);
      assert.ok(
        await evaluate(
          `document.querySelector('.dialog-close').getBoundingClientRect().right <= innerWidth`,
        ),
      );
      await press("Escape", "Escape", 27);
      await waitFor(`!document.querySelector('#site-menu')`);
    }
  }
  await cdp("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await evaluate(`window.scrollTo({top: 0, behavior: 'instant'})`);
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(
    await evaluate(`getComputedStyle(document.documentElement).scrollBehavior`),
    "auto",
  );
  assert.equal(
    await evaluate(
      `document.getAnimations().filter(a => a.playState === 'running').length`,
    ),
    0,
  );
  assert.equal(
    await evaluate(
      `document.querySelector('h1').innerText.includes('Making software')`,
    ),
    true,
  );

  // Keep visual QA of the lower sections reproducible as well as the hero.
  for (const width of [1440, 390]) {
    await cdp("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    for (const section of [
      "about",
      "projects",
      "experience",
      "voice",
      "contact",
    ]) {
      await evaluate(
        `document.getElementById('${section}').scrollIntoView({behavior: 'instant', block: 'start'})`,
      );
      await new Promise((resolve) => setTimeout(resolve, 250));
      const screenshot = await cdp("Page.captureScreenshot", { format: "png" });
      await writeFile(
        `.qa/${section}-${width}.png`,
        Buffer.from(screenshot.data, "base64"),
      );
    }
  }

  await cdp("Accessibility.enable");
  const accessibility = await cdp("Accessibility.getFullAXTree");
  const unnamed = accessibility.nodes.filter(
    (node) =>
      !node.ignored &&
      ["button", "link"].includes(node.role?.value) &&
      !node.name?.value?.trim(),
  );
  assert.equal(
    unnamed.length,
    0,
    "Interactive controls must have accessible names",
  );

  await cdp("Emulation.setScriptExecutionDisabled", { value: true });
  await cdp("Page.navigate", { url: base });
  await waitFor(
    `document.readyState === 'complete' && document.querySelectorAll('.project-card').length === 4`,
  );
  assert.ok(
    await evaluate(
      `getComputedStyle(document.querySelector('h1')).opacity === '1'`,
    ),
    "Headline stays visible without JavaScript",
  );
  assert.equal(
    await evaluate(`document.querySelectorAll('.expertise-row').length`),
    4,
  );
  assert.deepEqual(errors, [], `Browser errors: ${errors.join("\n")}`);
  await writeFile(
    ".qa/browser-results.json",
    JSON.stringify(
      {
        status: "passed",
        layouts,
        checks: [
          "artwork",
          "links and assets",
          "menu focus trap and restore",
          "case studies",
          "expertise",
          "voice explorer",
          "honest demo status",
          "clipboard",
          "theme",
          "responsive layouts",
          "reduced motion",
          "server-rendered no-JS content",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    `Browser checks passed at ${sizes.join(", ")}px. Screenshots and results: .qa/`,
  );
} finally {
  socket?.close();
  browser.kill();
}
