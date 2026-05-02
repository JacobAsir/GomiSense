# GomiSense

## Overview

GomiSense is a Japan-first waste sorting assistant. Users can upload an image, speak an item name, or type to find out how to correctly sort and dispose of household waste based on their municipality's rules.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + wouter

## Architecture

### Frontend (`artifacts/gomi-sense`)
- **`/`** — Home: municipality selector + input mode selector + demo items
- **`/scan`** — Scan/Search: text search (debounced), image upload, voice input (Web Speech API)
- **`/result`** — Result: disposal category, preparation steps, bilingual explanation, confidence
- **`/how-it-works`** — Educational page on Japan's waste system
- **`/municipalities`** — All supported city profiles

### Backend (`artifacts/api-server`)
Routes under `/api`:
- `GET /api/municipalities` — list all supported municipalities
- `GET /api/municipalities/:id` — full municipality profile
- `POST /api/classify-item` — classify by text (deterministic rules engine)
- `POST /api/classify-image` — classify by image (mock vision + rules engine)
- `GET /api/demo-samples` — sample items for demo
- `GET /api/search-items` — live search by item name

### Rules Engine (`artifacts/api-server/src/rules/`)
- **`municipalities.ts`** — 5 municipality profiles (Shibuya/Tokyo, Osaka, Kyoto, Yokohama, Fukuoka) with categories, collection days, and item rules including synonym lists
- **`engine.ts`** — Deterministic classification using multi-strategy synonym matching (exact match → contains → token F1 overlap). LLM is NOT used for classification decisions. Confidence scoring is built into the synonym matching.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Important Notes

- After running codegen, immediately patch `lib/api-zod/src/index.ts` to only `export * from "./generated/api"` — Orval regenerates the barrel with a conflicting dual export.
- The rules engine is fully deterministic. No LLM is used for disposal category decisions.
- The app runs in mock mode (no API keys required). Image classification uses mock candidates fed into the deterministic rules engine.
- Municipality profiles include: Shibuya (Tokyo), Osaka City, Kyoto City, Yokohama City, Fukuoka City.

## Municipalities Supported
- Tokyo – Shibuya Ward (東京都渋谷区)
- Osaka City (大阪市)
- Kyoto City (京都市)
- Yokohama City (横浜市)
- Fukuoka City (福岡市)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
