# Habiba Imran Portfolio

Habiba Imran’s warm editorial portfolio, built with Next.js 14 App Router, React 18, TypeScript, Tailwind, GSAP, and Onest. It uses original 2D artwork and retains the actual projects, employment history, education, recognition, CV, and public links.

## Run Locally

```bash
npm ci
npm run dev
```

Open `http://localhost:3000` in your browser.

On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm`.

## Build

```bash
npm run build
npm run start
```

## Content

Validation:

```bash
npm run lint
npm run typecheck
npm run test:voice
npm run build
```

Run lint separately. The build checks TypeScript and generates the production sitemap/robots files. The standard Next.js Vercel deployment remains unchanged. Google Fonts is needed at build time; Next.js self-hosts the selected Onest font for visitors.

## Browser acceptance checks

Run the production server in one terminal:

```bash
npm run start -- --hostname 127.0.0.1 --port 3010
```

Then run:

```bash
npm run test:browser
```

The dependency-free Node script uses an installed Chrome/Chromium/Edge via its DevTools protocol. It detects standard Windows Chrome/Edge paths, cached Windows Playwright Chromium, or common Linux Chromium paths. Set `PORTFOLIO_CHROME` to override the executable and `PORTFOLIO_URL` to override the server URL. It launches an isolated, hidden headless browser and does not use your personal browser profile. Outputs go to ignored `.qa/`.

Checks cover all four case studies, menu/keyboard focus and restoration, scroll lock, expertise disclosure, the hero voice interface, privacy disclosure, clipboard, light/dark theme, anchors, CV/assets, widths from 360 to 1920px including 375px and landscape, reduced motion, and readable server-rendered content without JavaScript. The script requires a local server URL. These checks do not establish real-device performance or live voice quality.

## Content

Main portfolio content and presentation live in:

- `components/`
- `lib/data.ts`
- `app/layout.tsx`

`lib/data.ts` is the source of truth for the profile, projects, expertise, experience, and recognition. `app/globals.css` contains shared design tokens and responsive styles. `components/Dialog.tsx` provides accessible menu/case-study behavior; `MotionController.tsx` handles progressive motion enhancement.

## Project media and voice

The portrait, CV, and social preview are preserved. Original project artwork is visibly labeled **Concept illustration**. Add authorized screenshots in `public/projects/` and assign each project’s `image` path in `lib/data.ts` to replace card artwork. Do not publish employer UI, client data, source code, or recordings without authorization.

The hero “hi” panel connects to the existing LiveKit Cloud `voiceagent` through protected server-issued scoped tokens. The lower voice section remains an architecture explorer. Turnstile verifies each start; Redis and signed QStash callbacks protect session cleanup. Per-visitor attempt quotas have been replaced by a configurable shared maximum-session-time allowance (60 minutes per UTC day by default), alongside one active session per network and five globally. Failed provisioning refunds its allocation. The worker is not hosted or changed here. See [voice experience operations](docs/VOICE_EXPERIENCE.md) for Invisible Turnstile dashboard setup, privacy disclosure, cost safeguards and verification limits.

Current website employment titles and all dates remain intact pending the owner's updated titles. See `REDESIGN_NOTES.md` for the audit, design decisions, and outstanding inputs.
