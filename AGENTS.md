# AGENTS.md — MoneySplit Coding Standards

## Project Overview

MoneySplit is a real-time collaborative expense-splitting web app. It uses a shared operation-based model where mutations are defined as named operations in the common package, applied optimistically on the client, and broadcast to all connected clients via WebSocket.

## Repository Structure

This is an **npm workspaces** monorepo with three packages:

```
moneysplit-common/   # Shared types, operations, serialization, utilities
moneysplit-server/   # Node.js WebSocket server (esbuild, better-sqlite3)
moneysplit-web/      # Vue 3 SPA (Vite, PrimeVue, SCSS)
```

- `moneysplit-common` has no build step — it is consumed directly as TypeScript by both the server and web packages via `tsconfig` `include` paths.
- `moneysplit-server` is bundled with `esbuild` into `main.js`. Externals: `better-sqlite3`, `ws`.
- `moneysplit-web` is built with Vite and deployed as a static site (GitHub Pages). It is also a PWA via `vite-plugin-pwa`.

## Language & TypeScript

- **TypeScript everywhere.** All source files are `.ts` or `.vue`. Target is ES2022.
- **Strict mode** is enabled. Do not use `any` unless absolutely necessary.
- Use `type` imports (`import type { ... }`) when importing only types.
- Use `===` and `!==` for all comparisons.
- When catching `undefined` from `Map.get()` or `Array.find()`, use `=== undefined` or `!== undefined` (avoid loose `== null` checks).
- Use `assert()` from `moneysplit-common/util` for runtime invariant checks. It narrows types via `asserts value`.
- Monetary values are always stored and computed in **cents** (integer). Display formatting converts to dollars with `(n / 100).toFixed(2)`.

## Common Package (`moneysplit-common`)

### Model (`model.ts`)

- Core types: `Group`, `Person`, `Transaction`, `Split`, `RatioParticipant`.
- `Group` is the root state object containing `people` and `transactions` arrays plus a `nextId` counter.
- Entity IDs are auto-incrementing integers assigned via `++group.nextId`. New groups start with `nextId: 1`.

### Operations (`operations.ts`)

- All state mutations are defined as **operations** using the `define()` helper and registered in the global `operations` map.
- Operations are pure functions of the form `(group: Group, ...args) => void` — they mutate `group` in place.
- Export each operation as a named constant (e.g., `ADD_PERSON`, `RENAME_GROUP`) using `UPPER_SNAKE_CASE`.
- Always validate inputs with `assert()` at the top of the operation body.
- When adding new operations: define with `define()`, export the constant, and add any associated validation helpers (e.g., `canAddPerson`, `canDeletePerson`).

### Serialization (`serialize.ts`)

- `serialize()` / `deserialize()` handle conversion to/from JSON-safe representations.
- Non-plain types (e.g., `Date`) are encoded as `{ _mfro: 'Date', value: isoString }`.
- `clone()` performs a deep clone via the same recursive structure.
- Always use `serialize`/`deserialize` when sending data over WebSocket or persisting to localStorage/SQLite. Do not use raw `JSON.parse`/`JSON.stringify` on model objects directly.

### Utilities (`util.ts`)

- `assert(condition, message)` — runtime assertion with type narrowing.
- `delay(ms)` — promise-based timeout.
- `map(obj, fn)` — object key-value map.
- `zip(a, b)` — zips two equal-length arrays.
- `dateEquals(a, b)` — compares dates by year/month/day only.

### Barrel export (`index.ts`)

- All common modules are re-exported from `index.ts`. Import from `'moneysplit-common'` in consuming packages, not from individual files.

## Server (`moneysplit-server`)

- Minimal Node.js server using raw `http.createServer` + `ws` WebSocketServer.
- State is managed via `GroupManager` class with in-memory cache backed by SQLite.
- WebSocket protocol uses JSON-serialized `Message` type from common (`'init'` and `'apply'` message types).
- On receiving an `apply` message: validate, apply the operation, persist to SQLite, then broadcast the raw message to all connected clients.
- Build: `npm run build` (esbuild). Deploy: Docker container via `Dockerfile`.

## Web Client (`moneysplit-web`)

### Vue Conventions

- **Use `<script setup lang="ts">` for all new components.** This is the standard. (`Flex.vue` uses Options API for legacy reasons — do not follow that pattern.)
- Place `<script setup>` block **above** `<template>` when the script is short/logically primary; otherwise follow the file's existing order. The existing codebase has some components with `<template>` first and some with `<script setup>` first — either order is acceptable, but be consistent within a single file.
- Use `defineProps<{ ... }>()` and `defineEmits<{ ... }>()` with TypeScript generics (not runtime declaration).
- Use `shallowRef` for primitive/simple state. Use `ref` for objects that need deep reactivity. Use `computed` for derived values.
- Use `reactive()` sparingly — it is used in the `Driver` state object but `ref`/`shallowRef` is preferred for component-level state.

### Component Organization

```
src/
  components/    # Feature/page-level components (LandingPage, GroupView, GroupEditor, etc.)
  ui/            # Reusable presentational components (Flex, Icon, Balance, TransactionItem)
  assets/symbols/  # SVG symbols imported as raw strings via ?raw
```

- **Feature components** go in `src/components/`.
- **Reusable UI primitives** go in `src/ui/`.
- Symbols are SVG files in `src/assets/symbols/`, exported from `index.ts` using Vite's `?raw` import. Icon names use `icon_` prefix with snake_case (e.g., `icon_chevron_left`).

### Styling

- **SCSS** with `<style scoped lang="scss">` in components.
- Use PrimeVue CSS variables (`--p-*`) for theming. Custom semantic variables are defined in `style.scss`:
  - `--text-primary`, `--text-secondary`, `--text-muted`
  - `--positive-color`, `--negative-color`
  - `--accent-color`, `--danger-color`
- Dark mode is handled via `@media (prefers-color-scheme: dark)` with adjusted CSS variable values.
- Spacing utility classes are available globally (defined in `style.scss`):
  - `ma-N` / `pa-N` — margin-all / padding-all
  - `mx-N`, `my-N`, `ml-N`, `mr-N`, `mt-N`, `mb-N` — directional margin
  - `px-N`, `py-N`, `pl-N`, `pr-N`, `pt-N`, `pb-N` — directional padding
  - `gap-N` — flex gap
  - Where `N` is 0–6, and the unit is `0.25rem`.
- Interactive list items (transactions, people, known groups) use a consistent hover/active pattern via the `interactive-list-item` mixin in `@/common.scss`:
  ```scss
  @use "@/common.scss" as *;

  .item {
    @include interactive-list-item;
    // other styles
  }
  ```
- Max app width is `40rem`, centered on wider screens with a highlight background.

### UI Library

- **PrimeVue 4** with the Aura theme (customized to a "Noir" slate-based preset).
- Import PrimeVue components individually: `import { Button, Dialog, Drawer } from 'primevue'`.
- Use the custom `<Flex>` component for flex layouts instead of raw divs. It accepts boolean props: `row`, `column`, `grow`, `wrap`, `align-center`, `justify-center`, `align-stretch`, etc.
- Use the custom `<Icon>` component to render SVG Symbols: `<Icon :src="icon_name" />`.

### Driver / State Management

- No Vuex/Pinia — state is managed via the `Driver` interface and `WebSocketDriver` class.
- `Driver` exposes reactive `state` (token, group, connection status) and an `apply()` method for dispatching operations.
- Operations are applied **optimistically** on the client, then sent to the server. A rollback queue handles desync detection.
- Offline support: operations are queued in `OfflineGroup.queue` (persisted to localStorage) and replayed on reconnection.
- localStorage persistence uses the custom `serialize`/`deserialize` pipeline via the `persist()` helper and `appState`.

### Path Aliases

- `@/` maps to `src/` in the web package (configured in both `vite.config.js` and `tsconfig.json`).
- Prefer using `@/` alias for imports in `moneysplit-web/src` when a relative import would require `..` to go outside the current directory. Local relative imports (e.g., `./LocalComponent.vue`) are acceptable and preferred for siblings.

## Build & Development

```bash
# Install all workspace dependencies
npm install

# Web client dev server
cd moneysplit-web && npm run dev

# Server build
cd moneysplit-server && npm run build

# Server watch mode
cd moneysplit-server && npm run watch

# Web type-check + build
cd moneysplit-web && npm run build
```

## General Practices

- No test framework is set up. Validate changes manually.
- Keep the common package dependency-free (no npm dependencies).
- Prefer functional patterns: small pure functions, explicit data flow, no classes in common (operations are plain objects).
- The server uses classes (`GroupManager`) for state encapsulation — this is acceptable for server-side code.
- Commented-out code (e.g., camera OCR feature in `App.vue`, delete button in `LandingPage.vue`) represents planned/experimental features. Leave it in place; do not remove it.
