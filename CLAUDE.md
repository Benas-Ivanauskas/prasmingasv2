# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

Two independent halves, not a shared workspace/monorepo tooling:

- `FE/` — the live, deployed React app (Vercel). All current product functionality lives here.
- `BE/` — **not yet implemented, and not tracked by git** (`git ls-files BE/` is empty — commits never include it, so `git log`/diffs won't show schema history). Contains only `schema.prisma` (the target Postgres schema for the real backend), `BACKEND_IMPLEMENTATION_PLAN.md` (phased build checklist), `docker-compose.yml` (local Postgres+Redis), and `.env.example`.

## Commands (FE)

Run from `FE/`:

- `npm run dev` — Vite dev server.
- `npm run build` — **`tsc -b && vite build`**. Use `npx tsc -b` for type-checking too — **`npx tsc --noEmit` is a silent no-op** here: the root `tsconfig.json` has `files: []` with only `references` to `tsconfig.app.json`/`tsconfig.node.json`, so a bare `tsc --noEmit` checks nothing and will falsely report success. This has caused a real failed Vercel deploy before; always verify with `npx tsc -b`.
- `npm run lint` — ESLint.
- No test runner is configured (no test script, no testing library installed).

## Commands (BE, once building it)

Run from `BE/`:

- `docker compose up -d` — local Postgres (5432) + Redis (6379), credentials in `.env.example`.
- `DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx --yes prisma@5 validate --schema=./schema.prisma` — validates schema syntax without a real DB connection. Pin to `prisma@5`; a bare `npx prisma` pulls the latest major and returns a different (JSON-only) output format.
- Follow `BE/BACKEND_IMPLEMENTATION_PLAN.md` phase by phase — it's the authoritative, actively-maintained build checklist (check off `- [x]` as phases complete) and encodes real decisions made along the way (hosting is a traditional always-on Node server, not serverless, so cron jobs use `node-cron` in-process; Paysera integration mechanics confirmed against a working prior implementation; AuditLog is mandatory — not optional — for trip/discount create+update).

## Architecture

### FE is mock-data-as-backend, with a strict API boundary

There is no real backend yet. `FE/trip.ts`, `FE/discounts.ts`, `FE/orders.ts` (repo root, not under `src/`) export hardcoded arrays that stand in for database tables. The rule: **these mock arrays may only be imported inside `FE/src/api/*.ts`** (`trips.ts`, `adminTrips.ts`, `adminOrders.ts`, `adminDiscounts.ts`). Every page/component goes through those functions, which are already `async`/return `Promise`s specifically so a function body can later be swapped for a real `fetch(...)` call without touching any caller. When adding a new data-backed feature, follow this pattern — add the mock array access inside `api/`, not in a component.

Consequence: nothing persists across a page reload. Admin edits (trips, discounts, orders) mutate the in-memory array for the lifetime of that browser tab/session only.

`BE/schema.prisma` is meant to exactly mirror what the FE mock data/types actually need — field names, nullability, and shape should match `FE/src/types/*.ts` and the mock data in `FE/trip.ts`/`discounts.ts`/`orders.ts`. There's no codegen link between them; keeping them in sync is a manual discipline. When changing one, check the other.

### Trip types drive conditional logic throughout

`Trip.tripType` is `BUS | FLIGHT | CRUISE`. This branches UI and logic repeatedly across the booking flow: BUS/CRUISE use a seat map (`BusSeatMap`), FLIGHT uses a plain traveller-count stepper, CRUISE additionally uses a cabin picker (`CruiseCabinPicker`) capped by however many bus seats were picked. `tripHelpers.ts` and the BuySession pages all switch on this field — check all three branches when touching shared booking logic.

### Booking flow (`/buy/:slug/:departureId/...`)

Four steps, each its own route, in order:

1. `BuyTripDetails.tsx` at `/buy/:slug/:departureId` ("Kelionė") — date, traveller count, discount code, deposit opt-in, invoice opt-in. This is the entry point every "Pirkti"/ticket-card click lands on.
2. `BuyOneSession.tsx` at `.../seats` ("Vietos") — seat/cabin/flight-count picker. Must select *exactly* the traveller count decided in step 1.
3. `BuyTravellerInfo.tsx` at `.../travellers` ("Keleiviai") — per-traveller details, extras, consents.
4. `BuyPayment.tsx` at `.../payment` ("Mokėjimas") — review + pay. Discount/deposit/invoice are read-only here (decided in step 1, not re-editable).

State is threaded forward via React Router `location.state` between steps (`buySessionTypes.ts`: `SeatSelectionState` → `BookingState`), not a global store. Pricing/discount/deposit math is centralized in `tripHelpers.ts`'s `getCheckoutTotals()` — every step calls this one function rather than recomputing; extend it rather than duplicating its logic elsewhere. A capacity "hold" (`holdSeats`/`holdFlightSeats`/`confirmHold`/`releaseHold` in `api/trips.ts`) has a TTL shown by `ReservationTimerBanner`; when it expires, every step past step 1 must block continuing and point back to step 1's URL (not step 2 — step 1's own discount/deposit choices may be stale too by then).

### Admin (`/admin/*`) is currently fully unprotected

No login/session check exists yet — `Login.tsx`'s submit is a no-op and `AdminLayout.tsx` has no guard. This is a known, explicit gap tracked as Fazė 1 in `BE/BACKEND_IMPLEMENTATION_PLAN.md`, not an oversight to "fix" casually.

Admin list-editing forms (trips, departures, discounts, reviews, etc.) share one pattern: `patchAt`/`removeAt` helpers (`pages/Admin/adminFormHelpers.ts`) plus `.admin-row`/`.admin-add`/`.admin-card`/`.admin-field` CSS classes. Follow this pattern for new admin CRUD UI rather than inventing a new one.

### Rich text and images

- Admin rich-text fields (descriptions, inclusions/exclusions, etc.) go through a Tiptap editor (`components/RichText/RichTextEditor.tsx`) producing HTML, displayed via `RichText.tsx`. `richTextUtils.ts`'s `toRichHtml`/`isHtml` transparently handle legacy plain-text or `string[]` content alongside new HTML so old mock data doesn't need migrating.
- `AdminImageUpload.tsx` reads a picked file straight into a `data:` base64 URL client-side — a deliberate mock stand-in for real server-side upload (no backend storage exists yet). The swap point is isolated to its internal `handleFiles`; the component's own `images`/`onChange` contract won't need to change when a real upload endpoint exists.

### Lithuanian grammar helper

`tripHelpers.ts`'s `pluralizeLt(count, singular, pluralNominative, pluralGenitive)` picks the grammatically correct noun ending for a count (Lithuanian numeral-noun agreement rules differ from English pluralization). Use it anywhere a count prefixes a Lithuanian noun instead of hardcoding one plural form.
