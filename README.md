# RealEstateBroker — Admin Dashboard (لوحة التحكم)

A React + shadcn/ui single-page admin dashboard for the RealEstateBroker
backend. Bilingual (Arabic-first RTL / English LTR), light/dark themed with the
"3qarat / عقارات" indigo brand.

## Stack

- **Vite + React 19 + TypeScript**
- **shadcn/ui** (Radix + Tailwind CSS) — primitives live in `src/components/ui`
- **TanStack Query** for server state
- **React Router v7** for routing + protected routes
- **Axios** client with bearer + rotating-refresh interceptors (`src/api`)
- **i18next** (ar/en) with `<html lang/dir>` flip
- **react-hook-form + zod** for forms
- **Zustand** for auth state
- Types generated from the backend OpenAPI contract via `openapi-typescript`

## Getting started

```bash
cd admin
npm install
cp .env.example .env        # then edit VITE_API_BASE_URL if needed
npm run dev                 # http://localhost:5173
```

By default `VITE_API_BASE_URL=/api/v1` and the Vite dev server proxies `/api`
to `http://localhost:3000` (see `vite.config.ts`). To point at a remote API set
`VITE_API_BASE_URL` to its full base URL (e.g. `https://api2.senam.tech/api/v1`).

Only accounts with the `Admin` role can sign in; other roles are rejected with
an "admins only" message and never persisted.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run api:generate` | Regenerate `src/api/schema.d.ts` from `../specs/001-realestate-backend-api/contracts/openapi.yaml` |

## Features

Overview/stats, Users (list/filter + enable/disable), Properties moderation
(approve/reject), Property requests (browse), Reports (resolve/dismiss),
Locations CRUD (cities + areas), and Broadcast notifications — one screen per
admin API resource.

> **Note:** the Locations screen lists cities/areas via the public
> `/locations/cities` endpoints, which return **active** locations only. A
> location toggled inactive will disappear from these lists.

## Backend dependency

The dashboard is a thin client over the NestJS backend in `../backend`. Run the
backend (Mongo replica set + MinIO via `backend/docker/docker-compose.dev.yml`,
then `npm run start:dev`) and seed an admin with `backend/scripts/make-admin.ts`
for full end-to-end use.
