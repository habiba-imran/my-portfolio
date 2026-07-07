# Portfolio Copy and UI Audit

## Quick Priority List

1. Fix visible encoding artifacts such as `Â·`, `â€“`, `â¤ï¸`, and `ï¿½` wherever they appear. These make the site feel broken even if the UI is strong.
2. Make the hero copy more specific to your actual edge: full-stack engineering plus Voice AI / LLM systems.
3. Replace generic phrases like "clean code and creative thinking" and "next-gen AI product" with outcome-focused wording.
4. Add stronger project proof: what you built, which stack, and what problem it solved.
5. Simplify some motion/visual effects so the portfolio feels premium instead of busy.
6. Clean up the duplicate `src/app` Create Next App scaffold, or confirm it is intentionally unused.

## Copy Improvements

### Hero

Current location: `components/Hero.tsx`

Current eyebrow:

```text
Full Stack Developer
```

Better options:

```text
Software Engineer · Full Stack & Voice AI
```

```text
Full-Stack Software Engineer
```

```text
AI Product Engineer
```

Current intro:

```text
Building digital experiences with clean code and creative thinking.
Passionate about full-stack development and emerging technologies.
```

Recommended replacement:

```text
I build full-stack web apps and AI voice systems, from product dashboards and backend APIs to real-time STT, LLM, and TTS pipelines.
```

More polished option:

```text
I design and build production-ready web and AI systems, with a focus on full-stack products, conversational voice agents, and practical LLM workflows.
```

Why: your current copy is pleasant but common. The replacement tells recruiters what you actually do and makes your Voice AI experience memorable immediately.

### About

Current location: `components/About.tsx`

Current paragraph:

```text
I'm a computer science student passionate about building digital experiences
with clean code and creative thinking. My journey into programming started
early, driven by a deep curiosity for how software can shape the real world.
```

Recommended replacement:

```text
I'm a Computer Science student and software engineer focused on full-stack products, backend systems, and applied AI. I like turning complex ideas into usable tools, especially where real-time systems and human interaction meet.
```

Current paragraph:

```text
I specialize in Full-Stack Development and Voice AI,
exploring how intelligent systems can interact seamlessly with everyday users.
Whether it's designing intuitive user interfaces, architecting robust backend APIs,
or deploying LLM pipelines, I'm always excited to push the boundaries of what's possible.
```

Recommended replacement:

```text
My recent work spans React dashboards, FastAPI/NestJS services, Twilio/LiveKit call flows, and LLM-powered evaluation pipelines. I care about systems that are clear to use, reliable in production, and thoughtful in the small details.
```

Why: this sounds more credible because it names the actual systems you have worked with instead of leaning on broad language.

### Education

Current:

```text
Expected Graduation: Dec 2027
```

Suggested:

```text
Expected Graduation: December 2027
```

Small polish: spell out the month in formal profile sections.

### Voice AI Card

Current:

```text
Building conversational AI pipelines using LLMs, STT, and TTS technologies for real-time applications.
```

Suggested:

```text
Building real-time conversational AI pipelines with STT, LLM orchestration, TTS, LiveKit, and Twilio.
```

### Projects

Current location: `lib/data.ts`

#### Awaaz Labs

Current:

```text
A multi-product AI voice platform featuring a voice agent module and a call QA module (QualiCall) for LLM-based call evaluation, scoring, and report generation.
```

Suggested:

```text
Multi-product AI voice platform with real-time voice agents and QualiCall, an LLM-based call QA module for evaluation, scoring, and report generation.
```

If you want it to sound more senior:

```text
Built full-stack features for an AI voice platform, including real-time voice agent workflows, call QA scoring, report generation, backend APIs, and dashboard configuration flows.
```

#### EarthScan AI

Current:

```text
Satellite building damage classifier using hybrid CNN+KNN models trained on xBD dataset. Includes a Flask web app for model inference and visual-change heatmaps.
```

Suggested:

```text
Satellite-image damage classifier trained on xBD/xView2 disaster imagery, with CNN and hybrid CNN+KNN models, Flask inference, confidence output, and visual-change heatmaps.
```

#### VertexVoyage

Current:

```text
An interactive C++ desktop app using SFML that visualizes Dijkstra's shortest path algorithm on a real Pakistan map with real-time multi-stop routing rendering.
```

Suggested:

```text
Interactive C++/SFML desktop visualizer for Dijkstra's shortest path algorithm on a Pakistan map, supporting multi-stop routing and real-time path rendering.
```

#### AIDRA

Current:

```text
A fully integrated hybrid AI simulation system for autonomous urban disaster triage, routing, and resource allocation. Features real-time simulation, ML-driven predictions, and dynamic pathfinding.
```

Suggested:

```text
Hybrid AI disaster-response simulator for urban triage, routing, and resource allocation, combining real-time simulation, ML predictions, and dynamic pathfinding.
```

### Experience

Current location: `lib/data.ts`

Current:

```text
Contributed in building full-stack SaaS features across dashboard, backend APIs, and configuration flows for AI-powered voice and call evaluation products.
```

Suggested:

```text
Built full-stack SaaS features across dashboards, backend APIs, and configuration workflows for AI-powered voice and call evaluation products.
```

Current:

```text
Developed a production voice AI agent pipeline handling call input, LLM processing, and TTS output for real-world phone-call automation workflows.
```

Suggested:

```text
Developed a production voice AI pipeline for phone-call automation, connecting call input, LLM processing, and TTS output.
```

Current:

```text
Built GreenKeyper, a conversational AI app using IBM Watsonx AI Assistant, covering chatbot logic and assistant configuration for real-world interaction design.
```

Suggested:

```text
Built GreenKeyper, a conversational AI app using IBM watsonx Assistant, with chatbot logic, assistant configuration, and interaction-flow design.
```

### Contact

Current location: `components/Contact.tsx`

Current headline:

```text
Let's Build Something Together
```

Suggested:

```text
Let's Build Something Useful
```

or:

```text
Open to Software and AI Roles
```

Current paragraph:

```text
I'm always exploring exciting new opportunities and creative collaborations. Whether you're building a next-gen AI product, an innovative web application, or just want to say hi, my inbox is always open.
```

Recommended replacement:

```text
I'm open to software engineering, full-stack, and AI product opportunities. If you're working on voice AI, developer tools, SaaS dashboards, or practical web products, I'd be happy to connect.
```

Why: this is more direct for recruiters and founders. "next-gen" is a bit vague and overused.

### Footer

Current location: `components/Footer.tsx`

Current:

```text
Designed & Built with ❤️
```

Suggested:

```text
Designed and built by Habiba Imran
```

This is cleaner and avoids possible emoji/encoding issues.

## UI and UX Fixes

### 1. Reduce Rounded Bento Corners

Location: `components/About.tsx`

The About cards use `rounded-3xl`, while project cards use `rounded-lg`. This creates two different design languages. Use `rounded-xl` or `rounded-lg` consistently.

Suggested:

```text
rounded-xl
```

### 2. Avoid Justified Paragraph Text

Location: `components/About.tsx`

The bio uses `text-justify`. Justified text often creates awkward spacing, especially on mobile. Use normal left alignment.

Suggested:

```text
remove text-justify
```

### 3. Tone Down Hover Effects on Headings

Locations: `Hero.tsx`, `About.tsx`, `Skills.tsx`, `Projects.tsx`, `Experience.tsx`, `Contact.tsx`

Most section headings scale and glow on hover. Since headings are not clickable, the interaction can feel slightly misleading. Keep the accent color change or subtle glow, but remove `hover:scale-[1.02]`.

Suggested direction:

```text
Keep: hover:text-accent
Remove: hover:scale-[1.02]
```

### 4. Reconsider Ambient Blobs

Locations: `app/page.tsx`, `app/globals.css`

The background has multiple fixed ambient blobs plus a noise overlay, holographic code, cursor effects, marquee, tilt cards, hover sounds, and image glow. Individually these are nice, but together they risk competing with the content.

Suggested simplification:

```text
Keep the noise overlay and one subtle accent glow.
Remove or heavily reduce the extra ambient blobs.
```

### 5. Make the Skills Marquee Less Mysterious

Location: `components/Skills.tsx`

The marquee is clickable and reverses direction, but there is no visible reason to click it. Either make it purely decorative or add a clear affordance elsewhere. For a portfolio, decorative is probably better.

Suggested:

```text
remove cursor-pointer and click-to-reverse behavior
```

### 6. Contact Phone Number Privacy

Location: `components/Contact.tsx`

Showing a phone number publicly can invite spam. If this portfolio is for job applications, email and LinkedIn are enough. If phone contact is important, keep it, but consider moving it to the CV only.

Suggested button set:

```text
Email Me
LinkedIn
Download CV
```

### 7. Add Project Screenshots or Visual Proof

Location: `components/Projects.tsx`

The project cards are text-only. Even one thumbnail per project would make the portfolio feel more real and easier to scan. For AI/ML projects, screenshots of dashboards, maps, output heatmaps, or call QA reports would help.

Suggested card structure:

```text
thumbnail
title
one-sentence result
tags
View project
```

### 8. Add Clear CTAs in the Hero

Location: `components/Hero.tsx`

The hero currently has no direct action. Add two buttons below the intro:

```text
View Projects
Download CV
```

Optional third link:

```text
Contact
```

This helps visitors act without reaching the navbar.

## Technical Cleanup

### 1. Fix Encoding at the Source

Files affected from inspection:

```text
app/layout.tsx
components/Footer.tsx
lib/data.ts
HABIBA_CV (2).md
src/app/page.tsx
src/app/layout.tsx
```

Replace corrupted characters with plain ASCII or valid Unicode. Safest replacements:

```text
Â· -> · or -
â€“ -> -
â€™ -> '
â¤ï¸ -> heart or remove it
ï¿½ -> remove or replace with the intended icon/text
```

For maximum safety, use ASCII in code strings:

```text
Habiba Imran | Software Engineer - AI & Full Stack
Awaaz Labs - AI Voice Platform
April 2026 - Ongoing
Designed and built by Habiba Imran
```

### 2. Remove or Align `src/app`

There is an active-looking `app` directory and an unused-looking `src/app` directory with default Create Next App content. Tailwind only scans `app`, `components`, `context`, and `hooks`, not `src/app`.

Suggested:

```text
Delete src/app if unused.
```

or:

```text
Move everything into src/app and update Tailwind content paths.
```

Do one or the other so future edits do not happen in the wrong tree.

### 3. Update README

Current README is still the default Next.js template. Replace it with a short project README:

```text
# Habiba Imran Portfolio

Personal portfolio built with Next.js, Tailwind CSS, GSAP, and React.

## Run locally
npm install
npm run dev

## Build
npm run build
```

### 4. Font Loading

Location: `app/globals.css`, `app/layout.tsx`

The app imports Google Fonts in CSS and also uses `next/font/google` for Inter in layout. Prefer `next/font` for both Inter and Plus Jakarta Sans to avoid render-blocking CSS imports and improve Next.js font optimization.

### 5. Tailwind Letter Spacing

Location: `tailwind.config.ts`

The display font sizes use negative letter spacing. It can look elegant, but on small screens and animated text it may reduce readability. Consider setting display letter spacing to `0` or only using slight tightening on the hero name.

## Suggested New Site Voice

Use this as a consistent direction across the whole portfolio:

```text
Specific, technical, and human.
Less "passionate about emerging technologies."
More "I build full-stack products and real-time AI voice systems."
```

Good keywords to use naturally:

```text
full-stack products
backend APIs
real-time voice agents
LLM workflows
call QA
dashboard configuration
production AI systems
human-centered interfaces
```

Words to reduce:

```text
next-gen
innovative
creative thinking
push the boundaries
digital experiences
exciting opportunities
```

## Best Next Pass

After the wording changes, the highest-impact UI pass would be:

1. Add hero CTAs.
2. Add project thumbnails/screenshots.
3. Simplify motion and background effects.
4. Make card radius and spacing consistent.
5. Remove public phone number from the main page if privacy matters.
