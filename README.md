# Eren Kaan Çakır — Portfolio

Personal portfolio of a software engineer, navigated through an interactive 3D mechanical keyboard: press or type a word to open that section.

**Live:** https://kaancakr.github.io/portfolio/

## Features

- **3D keyboard navigation.** A React Three Fiber scene renders a keyboard whose keys spell `ABOUT`, `EXPERIENCE`, `PROJECTS` and `CONTACT`. Hover a word and click it, or type the word on your own keyboard, to open that section.
- **Desktop on a 3D monitor.** On wide landscape screens (900px and up), sections open as windows on a monitor showing a small "kaan.os" desktop with a menu bar, section icons and a clock. On smaller screens they open in a bottom panel instead.
- **2D fallback.** If WebGL is unavailable, the 3D scene fails to load or the WebGL context is lost, the page switches to a flat 2D keyboard. A plain button nav stays available for keyboard and screen-reader users.
- **Key sounds.** "Thock" sounds are played through the Web Audio API with stereo panning per key, and a mute toggle turns them off.
- **Deep links and history.** Each section has a URL hash (`#about`, `#experience`, `#projects`, `#contact`). Back/Forward open and close sections, and Esc closes the open one.
- **Reduced motion.** Animations are shortened or skipped when `prefers-reduced-motion` is set.
- **Quick actions.** Download the CV (PDF), open GitHub, or send an email.

### Sections

| Section | Content |
| --- | --- |
| About | Short bio and skill groups (Frontend, Backend, Platform & Security) |
| Experience | Timeline of roles: ApyGuard, Ankara Science University, ASELSAN, Optima Soft |
| Projects | Six project cards with custom artwork and tags, plus an education row |
| Contact | Contact call-to-action and footer links |

## Tech stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **3D:** three.js and `@react-three/fiber`
- **Animation:** Framer Motion
- **Styling:** Tailwind CSS 3 and hand-written CSS in `src/app/globals.css`
- **Icons:** react-icons
- **Tests:** Node.js built-in test runner (`node:test`)
- **Hosting:** GitHub Pages via GitHub Actions

## Project structure

```
src/
├── app/                    # layout.tsx (page metadata), page.tsx (wires the sections), globals.css
├── components/
│   ├── Portfolio.tsx       # Stage: keyboard, nav, typing, section open/close, URL hash and history
│   ├── Desktop.tsx         # "kaan.os" desktop shown on the 3D monitor, plus the intro heading
│   ├── SectionPanel.tsx    # Bottom panel used on small screens and in 2D mode
│   ├── AboutSection.tsx    # Section content (see "Updating content")
│   ├── ExperiencesSection.tsx
│   ├── ProjectsSection.tsx
│   ├── ContactSection.tsx
│   ├── Footer.tsx
│   └── keyboard/           # 3D scene, keycaps, monitor, camera, layout, typing, sound, and their tests
└── lib/base-path.ts        # withBasePath() helper for files in public/
public/                     # Resume PDF and project images
.github/workflows/nextjs.yml
```

## Updating content

All content is plain TypeScript data inside the components. There is no CMS or JSON file.

| What | Where |
| --- | --- |
| Bio and skills | `src/components/AboutSection.tsx` (the `skillGroups` array and the paragraphs) |
| Work experience | `src/components/ExperiencesSection.tsx` (the `experiences` array: company, role, duration, points) |
| Projects | `src/components/ProjectsSection.tsx` (the `projects` array). Each project's `visual` key picks its artwork in `ProjectArtwork`, so a new project needs a new `ProjectVisual` value and a matching branch there. The education row is at the bottom of this file. |
| Contact copy and footer | `src/components/ContactSection.tsx`, `src/components/Footer.tsx` |
| Greeting and location | `IntroHeading` in `src/components/Desktop.tsx` |
| Section names, keyboard words, CV/GitHub/Mail links | `SECTIONS` and `ACTIONS` in `src/components/keyboard/layout.ts` |
| Page title and description | `metadata` in `src/app/layout.tsx` |
| Resume PDF and project images | `public/` (`Eren_Kaan_Cakir_Resume.pdf`, `public/projects/`) |

Always reference files from `public/` through `withBasePath("/...")`. The site is served under `/portfolio` on GitHub Pages, so a bare `"/projects/abu-app.png"` would 404 there. `src/lib/base-path.test.ts` fails if a public asset is referenced without the helper.

## Getting started

Requires Node.js and npm. The tests run `.ts` files directly, so they need a Node.js version with built-in TypeScript support (22.18+ or 23.6+).

```bash
npm install
npm run dev        # http://localhost:3000 (Turbopack)
```

Other scripts:

```bash
npm run build      # production build
npm start          # serve the production build
npm run lint       # ESLint (next/core-web-vitals + next/typescript)
npm test           # node --test "src/**/*.test.ts"
```

No environment variables are needed.

## Deployment

The site deploys to GitHub Pages through `.github/workflows/nextjs.yml`:

1. It runs on every push to `main`, or manually from the Actions tab (`workflow_dispatch`).
2. It installs dependencies with `npm ci` on Node 20.
3. `actions/configure-pages` with `static_site_generator: next` generates the Next.js config for Pages. It sets the `/portfolio` basePath and turns off server-side image optimization. That generated config takes precedence over `next.config.ts`, which is why `next.config.ts` is empty.
4. `next build` writes the static site to `out/`, which is uploaded and published with `actions/deploy-pages`.

The basePath only exists in CI. Locally the site runs at `/`, and `withBasePath()` reads the configured basePath at build time, so the same code works in both places. The workflow only builds and deploys; it does not run lint or tests.

## Links

- Live site: https://kaancakr.github.io/portfolio/
- GitHub: https://github.com/kaancakr
