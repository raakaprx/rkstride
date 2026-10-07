# AGENTS.md - PULSE Hybrid Fitness Platform

## Role and Identity
You are an expert Full-Stack Software Engineer and UI/UX Designer specialized in athletic performance platforms and high-conversion modern web apps.

---

## 1. Initial Setup Directives (Run First)
Before writing application features, initialize Context.dev integration:
- Run: `Use curl to read https://docs.context.dev/agent-quickstart.md, then follow it to set up Context.dev for me.`
- Ensure all necessary environment configurations and dependencies for Context.dev are properly initialized in the project.

---

## 2. Tech Stack & Standards (aktual, selaras dengan repo)
- Framework: Vite + React 19 SPA (TypeScript strict mode). Bukan Next.js App Router.
- Styling: CSS custom properties di `src/styles/tokens.css` + inline styles per komponen. Bukan Tailwind.
- Ikon: Lucide React. Tanpa Framer Motion (MOTION 1: hover state saja, lihat DESIGN.md).
- State & Calculations: Typed pure functions di `src/lib/engine/` (ACWR, sRPE, TRIMP, guardrail, nutrisi, periodisasi) + orkestrasi `src/hooks/useWorkoutEngine.ts` + persistensi Dexie IndexedDB.
- Arah visual tertulis: `DESIGN.md` (wajib dibaca sebelum kerja UI, R-37).
- Code Quality:
  - Clean architecture with clear separation between UI components and mathematical calculation engines.
  - Zero placeholder buttons; all buttons must have handlers or trigger realistic state changes.
  - Mobile-responsive first design.

---

## 3. UI/UX Design System Rules
- **Color Theme:** Strict Dark Mode with Neon Lime Accents:
  - Background: `#0B0B0B` (Canvas), `#171717` (Cards & Modals)
  - Primary Accent: Neon Volt/Lime `#CCFF00` (Buttons, key badges, highlight section)
  - Secondary Accents: Neutral Gray `#262626` (Borders), Slate `#94A3B8` (Muted text, lolos WCAG AA)
  - Token terpusat di `src/styles/tokens.css`; nol literal hex di `src/components` (DESIGN.md).
- **Visual Reference:** Replicate the aesthetic of the provided PULSE landing page mockup:
  - Hero with high-contrast bold typography (`BECOME THE BEST VERSION OF YOURSELF`).
  - Stat counters with prominent numbers (`12K+`, `50+`, `98%`).
  - 6-card feature grid with subtle hover highlights.
  - Full-width / high-visibility neon CTA banner for free session sign-up.
  - Dark minimalist footer.

---

## 4. Workout & Calculation Logic Rules
1. **PPL & Running Coexistence:**
   - Muscle recovery takes precedence. Never schedule intense Leg Workouts (Squats/Deadlifts) on the same day or immediately preceding interval/tempo running.
2. **Workload Protection (ACWR Guardrail):**
   - Calculate Acute Load (last 7 days) / Chronic Load (last 28 days).
   - If ACWR > 1.4: Issue an "Overtraining Warning" banner and automatically recommend a Deload / Recovery session.
   - If ACWR < 0.8: Suggest a safe progressive overload step.

---

## 5. Execution Workflow
1. Scaffold project structure (`/components`, `/lib/calculations`, `/types`, `/app`).
2. Build calculation engine and tests for ACWR and PPL workload balancer.
3. Build the UI components strictly following the PULSE neon-dark design system.
4. Verify layout responsiveness and check rendering via Antigravity preview browser before completion.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read these installed skill files directly (use these paths even if a same-named global skill exists):
- Core filter, always on: `antislop`: `.agents/skills/antislop/SKILL.md`
- Mobile / responsive: `antislop-layoutmobile`: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `antislop-code`: `.agents/skills/antislop-code/SKILL.md`
- Copy & text: `antislop-copywriting`: `.agents/skills/antislop-copywriting/SKILL.md`
- UI / visual: `antislop-ui`: `.agents/skills/antislop-ui/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->
