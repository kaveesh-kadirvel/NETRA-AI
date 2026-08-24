# Project Plan: COSMEON Blueprint Refactor

## Scope
Refactor the entire Next.js project to match the COSMEON Climate Risk Intelligence Engine blueprint. Establish Next.js 14 App Router layout, MongoDB schema structure, Python ML scaffolding, and redesign a highly detailed, climate-risk-themed UI.

## Project Type
WEB

## Success Criteria
- The folder structure strictly matches the blueprint exactly (`/app`, `/components`, `/lib`, `/python`).
- The UI is entirely redesigned specifically for a Climate Risk Intelligence Dashboard (crisp, informative, professional, avoiding basic generic templates).
- MongoDB models are fully implemented using TypeScript and Mongoose.
- The Next.js API endpoints (`/api/pipeline/ingest` etc.) outline the expected integration schema.
- The project becomes production-ready to serve as a hackathon showcase.

## Tech Stack
- **Frontend/Backend:** Next.js 14 (App Router), TypeScript
- **Styling UI:** Tailwind CSS, shadcn/ui, Lucide React
- **Maps & Formatting:** react-leaflet, Recharts
- **Database:** MongoDB Atlas, Mongoose
- **Pipeline:** Python, Google Earth Engine API (scaffolded)

## File Structure
```text
cosmeon/
├── app/                          # Main Application Pages & UI
├── components/                   # UI Elements (dashboard, map, shared)
├── lib/                          # MongoDB bindings & Type Safety APIs
├── public/                       # Assets & Static Data
├── python/                       # ML Pipeline Integration Components
└── docs/                         # Project Documentation
```

## Task Breakdown

### Task 1: TypeScript Integration & Environment Setup
- **Agent:** `backend-specialist`
- **Skills:** `clean-code`
- **Priority:** P0
- **Dependencies:** None
- **INPUT:** Current JavaScript-based Next.js starter structure.
- **OUTPUT:** Conversion of the project to TypeScript (`tsconfig.json`), installation of shadcn/ui, Recharts, and react-leaflet.
- **VERIFY:** Running `npx tsc --noEmit` returns no errors and dependencies install seamlessly.

### Task 2: MongoDB Foundations & Mongoose Models
- **Agent:** `database-architect`
- **Skills:** `database-design`
- **Priority:** P1
- **Dependencies:** Task 1
- **INPUT:** MongoDB Schema Design from the COSMEON blueprint.
- **OUTPUT:** Fully detailed Mongoose schemas (`RiskEvent`, `District`, `SatelliteScene`, `ProcessingLog`) within `lib/models/` and the connection singleton `lib/mongodb.ts`.
- **VERIFY:** Models are correctly exported and typings are enforced securely.

### Task 3: Core API Routing
- **Agent:** `backend-specialist`
- **Skills:** `api-patterns`
- **Priority:** P1
- **Dependencies:** Task 2
- **INPUT:** Next.js API Routes specifications.
- **OUTPUT:** Create POST endpoints for ML pipeline sync and GET endpoints for data presentation (`/api/pipeline/*`, `/api/insights/*`).
- **VERIFY:** Ensure `x-pipeline-secret` headers evaluate correctly in the HTTP mock.

### Task 4: Base UI Components & Shared Layout (Dashboard)
- **Agent:** `frontend-specialist`
- **Skills:** `frontend-design`
- **Priority:** P2
- **Dependencies:** Task 1
- **INPUT:** Requirement for Professional Climate UI (Risk Badges, Confidence Bars, Sidebars).
- **OUTPUT:** Custom `components/dashboard`, `components/shared`, and standard layout elements implementing high-contrast visual cues (without using standard templates or forbidden colors).
- **VERIFY:** Components render independently in an abstract Next.js root.

### Task 5: Dynamic Map Integrations & Advanced Pages
- **Agent:** `frontend-specialist`
- **Skills:** `frontend-design`
- **Priority:** P2
- **Dependencies:** Task 3, Task 4
- **INPUT:** Recharts stats widgets & interactive `react-leaflet` maps.
- **OUTPUT:** Construct the precise layout for `page.tsx` (Dashboard), `/map`, and `/districts` ensuring responsive grids and high-fidelity mapping components.
- **VERIFY:** Test window resize and confirm map component dynamically scales.

### Task 6: Python Orchestration Scaffold
- **Agent:** `backend-specialist`
- **Skills:** `python-patterns`
- **Priority:** P3
- **Dependencies:** None
- **INPUT:** Project architecture regarding `python/` directory.
- **OUTPUT:** Skeleton implementation for Python jobs, module initialization (e.g., `orchestrator.py`, `ingestion/`), and documentation in a `requirements.txt`.
- **VERIFY:** Directory aligns perfectly with the architectural diagram setup block.

## ✅ PHASE X: VERIFICATION
- [ ] No purple/violet hex codes
- [ ] No standard template layouts
- [ ] Socratic Gate was respected
- [ ] Scripts: `npm run lint`, `npx tsc --noEmit` pass flawlessly
- [ ] Security Scan passed
- [ ] UX/Lighthouse audit verified
- [ ] Test Build succeeds
