# Portfolio redesign

The supplied `Habiba_Portfolio_Redesign_Brief_for_Codex.md` was read in full before source changes.

## Source audit

- Next.js 14.2.35 App Router, React 18, TypeScript, Tailwind, GSAP, Lucide, npm lockfile. The root `app/` directory is the active route tree. The duplicate `src/app` starter was unused.
- Standard Vercel/Next deployment; no custom server, API route, voice token service, or LiveKit client existed. `next-sitemap` generates the existing production-domain sitemap and robots file after the build.
- Content came from `lib/data.ts` and the old About, Hero, Contact, and Experience components. The CV markdown was checked for consistency. Website titles differ from the CV; the website titles and all dates are preserved pending the owner's corrections.
- Assets: `pfp.jpeg` (960 × 1280 portrait), the downloadable CV PDF, favicon, existing social preview, and unused starter fonts. No project screenshots or hero image pair existed.
- The old voice art showed `online`, `Live Agent`, and an unmeasured latency without an actual backend. Those components are removed. Project case studies also contained editorial instructions presented as outcomes; those instructions are removed.
- Performance concerns included duplicate animation responsibilities, 3D tilt/scroll effects, continuous cursor and decorative animation loops, and unused Three.js packages. The redesign uses GSAP for one-time reveals and CSS for micro-interactions, without scroll hijacking or WebGL.
- Existing contact behavior was mailto, social links, and PDF navigation. These remain real links; CV controls now explicitly download the file. Theme switching and opt-in UI sound remain available.
- No embedded provider credentials or frontend backend integration were found in tracked application source.

## Direction and architecture

Warm near-white, charcoal, restrained terracotta, self-hosted Onest through `next/font`, generous typography, and original 2D artwork. Existing portrait is retained in About. The owner approved the typography/graphic hero and confirmed that the LiveKit worker will be connected after UI work.

`lib/data.ts` holds profile, navigation, projects, expertise, employment, and recognition. Section components render that content. `Dialog` uses the browser's modal dialog for focus containment, Escape handling, background inertness, scroll locking, and focus restoration. `MotionController` enhances visible server-rendered content, respects reduced motion, and cleans up its observer. Expertise uses native `details` elements, so it works without JavaScript.

Interactions include fullscreen navigation, artwork modes, project case studies, expertise disclosure, voice pipeline exploration, email copying with truthful error feedback, theme switching, and optional sound. Native anchor history and scrolling are preserved. There is no blocking intro loader: the brief makes it optional, and the immediate hero reveal keeps the content available from first paint.

## Assets and voice demo

Project artwork is original SVG/CSS and visibly labeled **Concept illustration**. It is not represented as a product screenshot or confidential employer UI. The public project URLs and CV are unchanged. To add authorized screenshots, put optimized images in `public/projects/` and set each project's `image` in `lib/data.ts`.

The personal demo is explicitly **coming soon**. Its three selectable stages explain STT, LLM, and TTS; they do not simulate a call, request microphone access, or claim connectivity. Connecting a live demo later requires a deployed independent worker and a secure ephemeral-token endpoint, its request/response contract, permitted portfolio origins, and actual connection/audio/cancellation/error validation. No provider secret belongs in the frontend or public environment variables. Planned providers are not shown as already integrated.

## Preserved content

All four projects, three employment entries and exact periods, education (CGPA 3.87, expected December 2027), four awards/certificates, legitimate existing skills, portrait, CV, email, GitHub, LinkedIn, and social preview remain discoverable. No new employment, performance, product-usage, or client claims were introduced.

## Validation

Verified on 31 October 2026:

- `npm.cmd run lint`: no warnings or errors.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run build`: passed, including prerender, lint/type checks, and sitemap generation. Next.js reports approximately 132 kB first-load JavaScript for `/`; this is a bundle measurement, not a mobile LCP claim.
- `npm.cmd run test:browser`: passed in Chromium at 360, 390, 430, 768, 1024, 1440, and 1920 px. No horizontal overflow or captured JavaScript errors. Checks include focus containment/restoration, Escape, body scroll locking, four case studies, anchor targets, PDF/assets, artwork state, expertise disclosure, voice stages, clipboard readback, light/dark themes, accessible control names, reduced motion, no-JavaScript content, and breakpoint-specific heading spacing.
- Desktop and mobile screenshots of the hero, About, selected work, experience, voice, and contact were visually reviewed. The review caught and fixed small-screen heading word spacing and artwork/label crowding.
- The existing production portfolio, both public project repositories, GitHub profile, and AIDRA demo returned HTTP 200. LinkedIn returned HTTP 999 to the automated request; its existing URL is retained and requires a normal-browser check.
- `git diff --check`: passed. Portrait, CV PDF, and social-preview binaries are unchanged.

Browser outputs are in ignored `.qa/`. These are local Chromium checks, not a formal WCAG certification, real-device test, hosted performance measurement, or live voice acceptance. This work changes local source; it does not deploy or change the current public Vercel site.
