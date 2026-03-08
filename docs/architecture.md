# Remark PM — Architecture Overview

## System Design

Remark PM is a **client-side rendered** Next.js application that manages the complete workflow of a marketing agency across four departments.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Marketing  │───▶│  Creative   │───▶│ Production  │───▶│ Publishing  │
│    Board    │    │    Board    │    │    Board    │    │    Board    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       └──────────────────┴──────────────────┴──────────────────┘
                              Shared Client Identity
                            (clientId / campaignId)
```

## Data Flow

### Client Lifecycle

```
Pipeline Client (Marketing)
    ├── Stage 1: Initial Contact
    ├── Stage 2: First Meeting
    ├── Stage 3: Quotation
    ├── Stage 4: Negotiation
    └── Stage 5: Agreement
            │
            ▼
    Converted Client
            │
            ├──▶ Creative Board (creative requests auto-generated)
            │       └──▶ Production Board (on handoff)
            │               └──▶ Publishing Board (on delivery)
            │
            └──▶ Marketing Board (monthly summaries, plan editing)
```

### Singleton Store Pattern

Each board uses a **singleton store** with the observer pattern:

```typescript
class BoardStore {
    private listeners = new Set<() => void>();

    // Observer pattern
    subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    private emit() { this._v++; this._saveToStorage(); this.listeners.forEach(f => f()); }

    // Batching for bulk operations
    batchStart() { this._batching = true; }
    batchEnd() { /* emit once after all mutations */ }

    // localStorage persistence
    private _saveToStorage() { localStorage.setItem(KEY, JSON.stringify(data)); }
    private _loadFromStorage() { /* hydrate on construction */ }
}
```

**Stores:**
| Store | File | Scope |
|-------|------|-------|
| Creative | `src/lib/creativeStore.ts` | Creative requests, profiles, brand assets, inspirations |
| Production | `src/lib/productionStore.ts` | Jobs, storyboards, media files, campaigns |
| Publishing | `src/lib/publishingStore.ts` | Publishing schedules, platform configs |

### Cross-Board Synchronization

When a **Marketing client is converted**, the system:
1. Saves to `pipelineClients` (Marketing state)
2. Creates a `SharedClient` in Creative store via `syncClient()`
3. Auto-generates `CreativeRequest` entries from content types
4. On Creative handoff → creates `ProductionJob` in Production store
5. On Production delivery → updates Publishing store

All stores share the same `clientId` for cohesion.

## Key Design Decisions

### localStorage over Database
Currently, all board data is persisted in `localStorage`. This enables:
- **Zero backend** — runs entirely in the browser
- **Instant loading** — no network latency
- **Offline capability** — works without internet

**Trade-off:** No multi-user collaboration. Future: migrate to Prisma/PostgreSQL.

### Crash-Safe Persistence
The persist effects include guards against data loss:
- Empty arrays don't overwrite saved data
- Conversion saves to localStorage **before** async operations
- `try/catch` wraps all store interactions

### Bilingual Architecture
All user-facing text lives in `src/lib/texts.ts` as a record keyed by `'ar' | 'en'`. Components access text via `const t = texts[lang]`.

### CSS Modules + Glassmorphism
Each page has its own `page.module.css`. The design system uses:
- Semi-transparent backgrounds with `backdrop-filter: blur()`
- CSS custom properties for theming (dark/light)
- RTL-aware layouts via `dir="rtl"` attribute

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.1.6 | Framework (App Router, Turbopack) |
| React | 19.2.3 | UI library |
| TypeScript | 5.x | Type safety |
| Framer Motion | 12.x | Animations |
| Prisma | 7.x | Database ORM (auth) |
| NextAuth.js | 4.x | Authentication |
| Zod | 3.x | Schema validation |
| Tailwind CSS | 3.x | Utility classes (config only) |
