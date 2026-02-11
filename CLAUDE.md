# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

소개퐝 (Sogae-Pohang) — a dating/introduction matching platform for university students in the Pohang region (POSTECH and Handong University). Early-stage MVP built with React + Supabase.

## Commands

```bash
npm run dev        # Start Vite dev server (localhost:5173)
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint (v9 flat config)
```

No test framework is configured.

## Environment Setup

Requires a `.env.local` file with Supabase credentials:
```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

## Architecture

- **Framework**: React 19 + Vite 7, JavaScript (JSX, no TypeScript)
- **Routing**: React Router DOM v7 (BrowserRouter in App.jsx)
- **Backend**: Supabase (auth + database, no custom server)
- **Styling**: Tailwind CSS via CDN with custom theme in index.html (primary color `#007AFF`, Pretendard Korean font)
- **State**: React hooks only (useState), no global state library

### Source Layout

- `src/App.jsx` — Root component, defines all routes
- `src/pages/` — Page components (LandingPage, LoginPage, SignUpPage)
- `src/lib/supabase.js` — Supabase client init (reads env vars via `import.meta.env`)
- `src/assets/images/` — Static images

### Auth Flow

Supabase Auth SDK handles email/password and Google OAuth. SignUpPage validates that the email domain is in `ALLOWED_DOMAINS` (`postech.ac.kr`, `handong.edu`).

## Conventions

- All UI text is in Korean
- ESLint rule: unused vars starting with uppercase or `_` are allowed (`varsIgnorePattern: '^[A-Z_]'`)
- PascalCase for components, camelCase for variables/functions
- Tailwind utility classes for styling (mobile-first responsive with `md:`, `lg:` breakpoints)
