# HABIBA IMRAN — CREATIVE PORTFOLIO REDESIGN
## Implementation brief for Codex | Version 1.0 | 31 October 2026

> **Read this file completely before changing code.** This is an implementation brief for redesigning an EXISTING portfolio repository, not a request to create an unrelated demo or reproduce another brand verbatim.
>
> **Live site for reference:** https://habiba-imran-portfolio.vercel.app/
>
> **Design inspiration:** The user supplied a detailed GetLayers AI prompt for “Lumora — Design & Engineering Studio.” Use its *design language and interaction principles* as inspiration. Do not copy the Lumora studio identity, project names, assets, copy, fake partners or statistics. If the Lumora prompt is also in the workspace, treat this document as the source of truth for how to adapt it.

---

## 0 — THE ASSIGNMENT (non-negotiable)

Transform my current portfolio into an **expressive, premium, mostly-2D, interaction-rich portfolio for a junior software engineer / AI voice agent engineer**. I like the Lumora reference because the surface looks minimal, but the interaction quality is exceptional. I do **not** want: flashy 3D gaming worlds, random 3D spheres everywhere, an overly formal enterprise landing page, neon cyberpunk, generic SaaS cards, or a static resume page.

Desired impression: **clean at first glance, memorable when used**. Strong typography; art-directed layout; cream/white and charcoal; one warm accent; beautiful easing; thoughtful scroll reveal; responsive micro-interactions; immersive but not overwhelming. The work and my personality should be central, with one standout voice AI experience.

**Important:** Work inside my existing repo. Audit it first and preserve functionality, actual content, images, routes, SEO, downloadable CV, and links unless replacing them demonstrably improves the site. Keep the existing framework/toolchain wherever sensible; do NOT rewrite as one HTML file simply because the Lumora reference asked for that. This is a redesign of the real production site.

### Definition of success

1. Visitors immediately understand who I am, what I build, and why my work is interesting.
2. The website feels like one curated visual experience, not a stack of disconnected resume sections.
3. At least 4–6 meaningful interactions are polished and functional, not just decorative animations.
4. Projects are easy to explore and trustworthy, with working links and accurate technology descriptions.
5. The site works exceptionally well on laptop and mobile; interactions don't make it hard to navigate.
6. The repository builds/lints successfully, and the deployed site remains stable on Vercel.
7. The voice AI demo has a highly visible, tasteful entry point, but **never pretends a live demo works if the backend has not been connected**.

---

## 1 — START WITH A REPO AUDIT, NOT A BLIND REBUILD

Before editing, inspect and summarize (briefly in your working response):

- Framework (React/Vite/Next.js etc.), scripts/package manager, deployment setup, styles, fonts, routing, important component files, assets and responsive layout.
- Current page structure and source of truth for portfolio content.
- Existing animation, UI, SEO and accessibility tooling.
- Actual behavior of hero, project cards, menus, CV link, email/social links and any existing voice-agent demo.
- Broken/unused dependencies, unused assets, likely performance bottlenecks, and any confidential material accidentally embedded in frontend code.
- Whether source images/media for the hero and projects exist. Avoid using the GetLayers Lumora demo photos as my production assets.

**Never invent personal achievements, employment dates, salaries, metrics, education facts, deployed products or testimonials.** Existing portfolio content is the starting source of truth. If information is inconsistent, ask me before revising claims.

### Current live-site content to account for (verify against repository)

- Header identity: **Habiba Imran**, software engineer focused on **Full Stack & Voice AI**.
- Current introductory message: builds full-stack web apps and AI voice systems, from dashboards and backend APIs to real-time STT/LLM/TTS pipelines.
- Education: **Bahria University**, BS Computer Science; currently shown **CGPA 3.87**, expected graduation **December 2027**.
- Work showcased: **Awaaz Labs — AI Voice Platform** (private/professional work), **EarthScan AI**, **VertexVoyage Visualizer**, **AIDRA — AI Disaster Response**.
- Experience currently displayed: **Finova Solutions** roles and **SPS-NASTP** internship. Preserve exact dates/title from repo unless I approve changes.
- Current sections: Hero, About, Skills, Selected Work, Experience, Contact.
- Existing CV download and project links must remain functional.
- Voice technologies include LiveKit, Deepgram, STT, LLM and TTS concepts. The planned standalone personal voice demo may use **LiveKit + Deepgram + Groq + Cartesia** but may not yet exist.

**Privacy / professional work:** Awaaz Labs/Finova material is private. Preserve high-level, non-confidential descriptions only. Do not copy employer source code, credentials, recordings, internal dashboards, client data, or claim visitors can access a private product.

---

## 2 — ART DIRECTION / DESIGN SYSTEM

Reference the *feel* of Lumora: near-white backgrounds, charcoal contrast, restrained warm accent, Onest, bold typography, roomy grids, dark portfolio blocks, oversized pill motifs, refined reveals and full-screen navigation.

### Palette (recommended starting tokens, can adjust slightly for accessibility)

```css
:root {
  --page: #ffffff;
  --surface: #f5f3ef;
  --surface-strong: #eae7e1;
  --ink: #111110;
  --deep: #0a0a0a;
  --muted: #77746e;
  --line: #e5e2dc;
  --accent: #b15f2c;       /* sophisticated burnt orange */
  --accent-light: #cf8047;
  --accent-dark: #87431e;
  --on-dark: #faf9f6;
  --radius-lg: 28px;
  --radius-md: 18px;
  --radius-pill: 999px;
  --content-max: 1408px;
}
```

Use contrast intentionally: pale hero/about, black feature cards and stats, alternating warm surfaces, and a deep-black footer. Accent should be memorable but sparse. Don't add purple neon or gradient overload. If the actual project previews already have colors, let the artwork add richness.

### Typography

- Primary: **Onest** (Google Font) or close modern sans fallback.
- Huge display headline on desktop with tight leading and carefully set line breaks; responsive `clamp()` sizes, not tiny VW-scaled fonts that harm accessibility.
- Small uppercase/labeled eyebrows, regular-weight body copy, readable line lengths.
- Real hierarchy: one H1, logical H2/H3, consistent type scale.
- Consider an occasional outlined or muted oversized wordmark, but don't obscure content.

### Layout

- Wide editorial grid (max-width approx 88rem); generous but adaptive horizontal margins.
- Full-bleed hero, restrained rounded edges; purposeful asymmetry on desktop.
- 2-column image-led project grid; one column on small screens.
- Large negative space; not every section must be a card.
- Minimal visible dividers; don't retain endless repetitive skill badges/carousels merely because they exist now.

### Brand voice and copy

Smart, welcoming, slightly playful, technically credible, personal (first person), concise. **Not** a marketing agency (“We deliver world-class scalable solutions”), not too quirky, and not exaggerated.

Hero copy suggestion (editable; do not force if existing copy is stronger):

- Eyebrow: `SOFTWARE ENGINEER · VOICE AI & FULL STACK`
- H1 option A: `I build things that talk, think & work.`
- H1 option B: `Making software feel a little more human.`
- Supporting text: `Hey, I'm Habiba. I build real-time voice AI experiences, thoughtful web apps, and the backend systems behind them.`
- CTAs: `Explore my work ↗` and `Talk to my AI ✳` (only label the latter as a live demo if implemented).

Content is important: keep role clarity (AI + backend + full stack), not just a clever phrase.

---

## 3 — USER JOURNEY / INFORMATION ARCHITECTURE

Preferred order, adapt if repo structure suggests a better version:

1. **Intro/preloader** — brief, polished, optional on repeat visits.
2. **Navbar** — lightweight brand, desktop anchor links, strong menu interaction.
3. **Hero** — most visually striking introduction; strong voice demo CTA.
4. **Editorial About** — brief personal story, photo/illustration if available, education as supporting detail.
5. **Signature statement band** — 3–4 giant interactive pills (e.g. `I / BUILD / → / EXPERIENCES` or `VOICE / AI / × / SOFTWARE`). Unique to my identity; don't copy `We Build Better` verbatim.
6. **Selected Work** — four real featured projects, powerful visuals and accessible case-study details.
7. **What I Work With** — four interactive expertise rows instead of long generic skill clouds.
8. **Experience + Highlights** — clean timeline and credible supporting facts/awards, preserving information.
9. **Voice AI showcase** — if integrated in hero, a compact supporting section; otherwise a prominent independent showcase.
10. **Contact/footer** — dark high-impact ending with working email, socials, downloadable CV and oversized personal wordmark.

Do not hide critical links behind an interaction. Recruiters must find CV, projects, contact and experience without searching.

---

## 4 — MOTION PRINCIPLES

**Target feel:** Lumora-inspired soft spring, staggered text, physical hover feedback, sophisticated page pacing. No gratuitous animations solely to show animation skills.

- Prefer existing animation tools if already installed; otherwise **Motion/Framer Motion** for component motion, **GSAP + ScrollTrigger** only where needed, **Lenis** for smooth scrolling if it doesn't interfere with native accessibility. Avoid three competing animation engines for the same tasks.
- Use transforms and opacity, favor compositor-friendly animation; avoid scroll event DOM reads on every frame.
- Set `prefers-reduced-motion` support globally and provide simplified alternatives.
- Mobile/touch: no dependence on hover; provide tap alternatives and do not render a giant cursor effect.
- Preserve native anchor behaviors and browser back/forward where possible.
- Disable scroll smoothing during modal/menu overlays; avoid nested scroll lock bugs.

### Signature interactions (build with actual state and graceful fallback)

#### A. Intro loader

- Full-screen charcoal panel with tiny warm logo/initials and a slim progress track.
- Visual count `000 → 100`, approximately 1.0–1.5 seconds **maximum**, only if it has purpose. Smooth upward sheet exit revealing hero.
- Don't fake asset download progress; describe this as an intro animation rather than actual load status.
- On refresh/repeat visit consider skip/reduce via session persistence. Skip for reduced-motion, never delay vital content or cause CLS.
- Hero text begins its reveal after loader exits.

#### B. Hero image interaction — inspired by Lumora's liquid reveal, but PERSONALIZED

Ideal: full-bleed editorial photo or two layered visuals, with a **soft paintbrush cursor trail** that reveals the secondary image underneath the primary image and slowly fades (Canvas 2D is sufficient). Examples: portrait ↔ AI/abstract portrait, workspace ↔ process visualization, two original abstract compositions.

**Do not blindly use Lumora's before/after image links.** Those are design-reference assets, not established as licensed personal portfolio media.

If user supplies TWO images, implement effect as follows:
- Base image covers entire hero; secondary layer is painted into a 2D canvas using a soft alpha radial brush following pointer movement.
- Brush radius ~120–150 CSS px; interpolate points for continuous strokes; fade gradually; cap DPR at 2; use `requestAnimationFrame` judiciously.
- Use proper `object-fit: cover` geometry and responsive resizing; don't obscure hero copy. Overlay a readable vignette.
- Disable/reduce on small/touch screens and when reduced motion is requested; display tasteful static hero image.

If there are NO appropriate images, **do not insert generic stock photography without asking**. Propose an alternative that delivers the same interactivity: a typography-driven hero with a masked dual-layer editorial graphic, subtle cursor-following spotlight, or original SVG/CSS abstract artwork. Ask which assets I can provide.

#### C. Hero reveal timeline

- Header gentle fade/slide from top.
- H1 lines reveal upward from clipped wrappers, 90–140ms stagger, 700–950ms duration.
- Intro descriptor, CTAs and floating signature card reveal in sequence.
- No flash of invisible text when JS fails: progressive enhancement recommended.

#### D. Fullscreen menu

- `Menu` opens a dark, full-screen overlay with oversize numbered links (`01 Work`, `02 About`, `03 Experience`, `04 Contact`), staggered entry, tasteful hover reveal.
- Close via close control, Escape, and navigation; focus management, focus trap, `aria-expanded`, keyboard support and scroll lock.
- Normal desktop links may remain visible; overlay gives a memorable secondary interaction.

#### E. Hover-lively projects

- Projects lift `~6–10px` and scale `~1.01` on hover, with subtle shadow and arrow badge rotating/moving.
- Card previews use REAL project screenshots/illustrations if available; original abstract hero images only if needed.
- Where feasible, hovering reveals a brief app screen transition or animated diagram; don't load massive video assets by default.
- Link whole card only when it has a meaningful destination. For private work, use a clear `Private work — case study` modal/details section rather than a fake link.

#### F. Editorial skill / expertise rows

- Four wide rows, e.g. `01 Real-Time Voice AI`, `02 Backend & APIs`, `03 Full-Stack Applications`, `04 Applied ML & Automation`.
- On pointer hover, row background fills from pale gray, text nudges and arrow glides; on focus/tap, equivalent accessible behavior.
- Each row displays a concise stack summary and can expand to show more examples/skills if it provides value.

#### G. Count-up metrics (only real ones)

- Compact deep-black highlight panel with an editorial statement.
- Include ONLY verified numbers from my codebase and achievements (e.g., CGPA if I still want it, actual project counts, validated voice latency if user approves). No fake client counts, retention percentages, years, revenue, team size or unverified performance figures.
- Count up only when visible; no overengineered scroll syncing. If there aren't enough meaningful numbers, use accomplishment labels instead.

#### H. Pills, links, text, scroll details

- Large horizontal statement pills with subtle spring scaling; responsive stack on narrow screens.
- Magnetic-like CTA movement should be very subtle (max a few px) or skipped; ensure cursor and focus clarity.
- About statement reveals by word or sentence when scrolled into view.
- Smooth in-page navigation with offsets and no awkward overscroll.
- Footer headline reveals on approach; links gently move on hover.

---

## 5 — PAGE SECTIONS: SPECIFIC DESIGN / CONTENT

### Header

- Personal logotype: `habiba.` / `habiba imran` with one warm-colored spark-like mark.
- Navigation: `Home`, `Work`, `About`, `Experience`, `Contact`; optional `Voice AI` or `Talk to AI` anchor.
- Top-right compact `Menu` button; optional live Islamabad local time chip if it fits without clutter (not essential). Any clock must use correct timezone (Asia/Karachi) and must not imply visitor-local time.
- Stickiness: prefer slightly transparent background after scrolling, with contrast and no content obstruction.

### Hero

- Large editorial grid with dominant first-person H1, short role introduction, clear CTA pair.
- One original interactive visual, not stock-heavy layers.
- Small floating card can describe `Real-time voice agent`, with `STT → LLM → TTS`, but avoid reusing the current noisy architecture flow in the center of the hero.
- Side labels like `Based in Pakistan · Open to remote roles` only if user agrees / current facts support them.
- Bottom border bar: `Scroll to explore ↓`, selected specialties, small status indicator.

### About

- Main statement with animated words and optional portrait/avatar or line illustration.
- Summarize background, engineering focus and what makes me interested in voice systems.
- Preserve Bahria University degree and education details in an elegant mini-card/row; awards/certifications can be grouped compactly (don't delete them silently).

### Signature pill band

- Four oversize capsule elements; warm accent on one, charcoal on arrow, pale others. Hover spring. Keep text authentic, not agency copy. Example content: `I` / `BUILD` / `↗` / `HUMAN TECH`.

### Selected Work — most important section

Show actual work and accurate role/context:

1. **Awaaz Labs — AI Voice Platform** — professional/private work. Voice agents, real-time STT/LLM/TTS and call intelligence/QA. No unauthorized confidential screenshots, repositories or recordings. Feature a *new independent personal demo* separately if available.
2. **EarthScan AI** — satellite disaster-image damage classification; CNN and CNN+KNN, inference UI and heatmaps. Keep source links.
3. **VertexVoyage Visualizer** — C++/SFML map-based Dijkstra routing. Keep source links.
4. **AIDRA — AI Disaster Response** — React/TypeScript disaster response and routing/simulation. Keep available live demo link.

- Two-column rich cards on desktop; full-width stacked on mobile.
- Each card: category/year (only if verified), powerful project name, one or two concise sentences, up to 3 concise technology chips, real image or purposeful graphic, clear action.
- Offer expandable lightweight case-study details with *Problem / My role / Approach / Tech / Outcome* where true information is available.
- Don't replace real projects with generic fictional agency projects from Lumora.

### Expertise

Replace crowded skill badges and repeated marquee with designed rows and purposeful details:

- **Real-Time Voice AI** — LiveKit, streaming STT, LLM orchestration, Cartesia/other TTS providers when accurate.
- **Backend & Realtime APIs** — Python/FastAPI, WebSockets, REST, databases.
- **Full-Stack Products** — React, frontend systems, dashboards, product workflows.
- **Applied AI / ML** — selected projects and relevant model/data work.

Preserve other legitimate technologies somewhere discoverable without overwhelming the main visual layout.

### Experience / highlights

- Beautiful minimal timeline with existing real positions and date ranges, drawn from repository.
- Give Finova work appropriate significance but do not overexpose private implementation details.
- A compact recognition strip can include awards/scholarship/certificates already present.
- Avoid implying seniority or employment statuses not supported by existing content.

### Voice AI demo

This should be a standout *personal project*, either a hero CTA leading to a section or an accessible slide-over/modal.

Visual: elegant voice-reactive **2D** ripple/particle rings or tasteful canvas waveform (no giant 3D model). Show clear states: `Idle`, `Connecting`, `Listening`, `Thinking`, `Speaking`, `Error`.

- If an independent LiveKit agent and token endpoint already exist in repository, integrate properly and validate connection / mic permissions / cancellation / transcript behavior.
- Otherwise build a beautifully styled **non-deceptive preview** and clearly mark `Demo coming soon` / `See architecture`; ask me for backend URL, token-server contract, and deployment readiness before enabling a live Start button.
- LiveKit agent worker is deployed separately from the static portfolio; don't pretend frontend deploy hosts Python agent process.
- Never store LiveKit secret, Deepgram, Cartesia or Groq API keys in frontend/public env variables. Browser obtains ephemeral access token from a secure endpoint only.
- Include a graceful fallback: short screen recording, diagrams, or read-only case study if microphone isn't allowed, once supplied.

### Footer / contact

- Strong dark closing section with a large friendly statement (e.g. `Have something interesting in mind? Let's talk.`).
- Working `mailto:` (current site displays `habibaimrannn@gmail.com`, but verify from repo), CV download, GitHub, LinkedIn, and verified social links.
- Optional modal for contact details; if adding a form, it **must actually submit** via a configured backend/provider or clearly open the user's email app. NEVER show fake `Request received` success after a no-op.
- Large faint `HABIBA` watermark with tasteful contrast.

---

## 6 — EXACT DESIGN DIRECTION, NOT EXACT COPYING

**Borrow from Lumora:**
- The white/cream/charcoal/burnt-orange hierarchy.
- Onest + oversized editorial headlines.
- A polished 000–100 intro (optional under accessibility/performance constraints).
- Staggered spring/text reveals, satisfying interactive pills.
- Full-screen numbered dark nav overlay.
- Dark feature/project cards with lively hover details.
- Large expertise/service rows that gain background on hover.
- A dark stats/achievement section and high-impact dark footer.
- A liquid pointer reveal if suitable original media is available.

**Do not borrow:**
- Lumora brand, logo, slogans, project/partner/client names, services agency positioning, generated agency copy, fake numbers, studio photos, or externally hosted GetLayers hero asset URLs.
- Its requirement for single-file plain HTML, if incompatible with our current React project.
- No-op contact form success or broken anchor links.
- Extremely aggressive root `vw` font sizing on small/mobile devices.

Make the layout recognizable as **Habiba's personal engineering portfolio**, not a near-perfect Lumora clone.

---

## 7 — DESIGN STATES AND RESPONSIVENESS

Design and implement these deliberately:

- **Desktop** 1440px and 1920px: editorial grid, immersive hero, 2-column projects, rich hover.
- **Laptop** 1024–1366px: no overflow, readable type, reasonable hero height.
- **Tablet** 768px: balanced stack, nav adaptation, accessible interactions.
- **Mobile** 360–430px: no sideways scrolling; readable type; reduced canvas; clear CTA; project screenshots remain visible; overlays fit screen with body scroll locked.
- Keyboard-only visitors, screen readers and reduced-motion visitors must access every destination.
- Loading/empty/error states for images, hero art, modal and voice demo.

Technical quality targets (aspirational, measure realistically):

- LCP under 2.5s on a reasonable mobile connection where achievable; avoid large hero image/canvas blocking paint.
- CLS under 0.1; image dimensions/aspect ratio reserved.
- Responsiveness and interaction remain smooth (~60fps where practical) with reduced JS on touch.
- Images optimized through existing framework or modern formats; load below-fold media lazily; no dozens of fonts or heavy animation libraries.
- Semantic HTML, focus-visible, `aria-label` where appropriate, good contrast, WCAG AA-aligned text controls, proper dialog focus, no auto-playing audio.
- Don't use scroll hijacking that makes trackpads or touch awkward.
- Respect Vercel deployment requirements and preserve existing SEO metadata/social preview.

---

## 8 — IMPLEMENTATION / REPOSITORY RULES

1. **Inspect before editing.** Identify minimal set of files/components to change; present a short plan.
2. **Re-use the existing framework.** Prefer structured components such as `Loader`, `Header`, `Hero`, `LiquidReveal`, `AnimatedHeadline`, `StatementBand`, `ProjectCard`, `ExpertiseRows`, `ExperienceTimeline`, `VoiceDemo`, `Footer`, `MenuOverlay`.
3. **Content in data models:** Use centralized arrays/constants for projects, skills and work history rather than duplicating copy across components.
4. **Dependency discipline:** Check current dependencies; use installed libraries first; add only necessary packages. Don't add WebGL/Three.js just for decoration.
5. **Avoid CSS regressions:** Establish shared tokens, responsive type/spacing, and override strategy; remove conflicting old styles only as part of a tested migration.
6. **Animation states:** Robust initial/exit states; listeners and observers cleaned up; no memory leaks; safe on route changes/unmounts.
7. **Feature detection:** Canvas interactions must have fallback if pointer/canvas unavailable. Disable expensive effects on coarse pointer/mobile as needed.
8. **Do not lose links/assets:** Ensure PDF CV path and all existing project links still work; if missing, report which ones require assets/fixes.
9. **Confidentiality:** Do not introduce private company source/assets or expose provider secrets.
10. **Production quality:** No placeholder content pretending to be factual, no dead buttons, no hidden pseudo-interaction, no console errors.

If design assets are missing, use clearly marked placeholders for internal work **only** and request real media before calling the visual production-ready. Make a reasonable CSS/SVG fallback when a missing asset is not blocking.

---

## 9 — QUESTIONS TO ASK ME (ONLY IF NEEDED)

You are explicitly allowed — and requested — to ask for missing information before implementing a feature that depends on it. Keep questions **specific and grouped**, explaining your recommended default. Do not ask me to repeat facts already visible in the repo, this brief or existing assets. Proceed with safe default assumptions on non-blocking visual choices.

Ask if needed about:

1. **Hero imagery:** Do I have a portrait, custom graphics, or a pair of images for the Lumora-style liquid reveal? If not, recommend the typography/graphic alternative and get a choice.
2. **Voice demo readiness:** Is my independent LiveKit worker deployed? Do I have a token-server endpoint? Should you implement the live integration now or just a clearly labeled preview? Never request API keys in chat or put secrets in the frontend; explain secure configuration.
3. **Project media:** Do I have screenshots/video for Awaaz Labs (only sanitized/authorized), EarthScan, VertexVoyage and AIDRA? Which ones are safe to publish?
4. **Contact destination:** Confirm target email/social links if missing or conflicting; ask whether I prefer mailto vs functional contact form.
5. **Positioning/copy:** Confirm any updated role, employment status, dates, CGPA, graduation date, or claims if they differ from the repo.
6. **Hero visual style:** Confirm whether to use warm burnt orange + white (default) or propose a closely related alternative only if absolutely needed.

If more than one question is essential, ask them in a single concise message and continue on unblocked work. Do not silently fabricate the answers.

---

## 10 — DELIVERY PROCESS / ACCEPTANCE CHECKLIST

### Suggested sequence

**Phase A — Audit and direction:** inspect repo and existing visuals; identify content to preserve; present implementation plan and concise questions about missing images/voice-agent readiness.

**Phase B — Visual foundations:** tokens, typography, responsive layout, nav, hero, loader (when appropriate), background and motion primitives.

**Phase C — Main sections:** about, signature pills, project cards/case studies, expertise rows, experience, footer/contact.

**Phase D — Interactive polish:** cursor reveal or approved fallback, scroll animations, hover micro-interactions, fullscreen menu, voice demo preview/integration as actually possible.

**Phase E — QA:** run format/lint/typecheck/build/tests as supported; inspect accessibility, mobile, link destinations, performance, keyboard interactions, reduced-motion, and secrets. Fix issues rather than simply listing them.

### Done means

- [ ] Existing framework and Vercel configuration preserved or intentionally improved.
- [ ] Warm editorial design and motion have coherent visual quality.
- [ ] Intro, hero, nav, pills, projects, expertise, experience, contact are functional on desktop and mobile.
- [ ] All factual work, educational details and public project links preserved/verified.
- [ ] Voice demo correctly indicates whether it is truly connected.
- [ ] Private employer code/assets/keys not exposed.
- [ ] No broken links / bogus success state / inaccessible hover-only content.
- [ ] No excessive animations on reduced motion or touch.
- [ ] Production build passes; changed files and commands documented.
- [ ] Summarize key design decisions, unresolved asset/voice dependencies and exact next steps.

---

## 11 — IMPORTANT INSTRUCTIONS FOR CODEX

**Do not hand me a plan only.** After inspecting the repo and asking necessary blocking questions, perform the implementation, validate it and report concrete results. If I have not provided assets and a feature cannot be completed responsibly, implement the polished fallback and clearly identify what is pending. Be opinionated about design, but faithful to my content and technical constraints.

**One-sentence creative direction:** *A warm editorial 2D portfolio for a real-time voice AI engineer: minimal when still, delightful when touched, and unmistakably personal.*
