# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Techstack

- Angular 21, standalone components, no NgModules
- Signal-based state management (no RxJS for state)
- PrimeNG 21 (Aura theme) for UI components
- Vitest for tests
- SCSS

## Templates

- Use `@if`, `@for`, `@switch` control flow syntax (not `*ngIf`, `*ngFor`)
- Access signals directly in templates: `store.persons()` not async pipe
- Two-way binding with `[(ngModel)]` or signal-based forms

## Commands

```bash
npm start        # dev server
npm run build    # production build
npm test         # Vitest unit tests
```

No dedicated lint command. Format with Prettier.

## Architecture

### Data flow

```
REST API (https://run.chayns.codes/dd996dd6)
  → Services (HTTP layer only)
  → Stores (signal state + orchestration)
  → Components (inject stores, read signals)
```

### Core entities

- **Person** — family member with fuzzy dates (year/month/exact/estimated/range), gender, religion, notes
- **Relation** — typed link between two persons (biological parent, spouse, partner, etc.)
- **Residence** — where a person lived, with coordinates for map view

Each entity has: `Model interface`, `Service` (HTTP), `Store` (signals + CRUD), and `Pipe` (display formatting).

### Stores pattern

Stores are `@Injectable({ providedIn: 'root' })` singletons combining state and mutations:

```typescript
readonly persons = signal<Person[]>([]);
readonly loading = signal(false);

async create(person: Person) {
  this.loading.set(true);
  await this.personsService.create(person);
  this.persons.update(list => [...list, person]);
  this.loading.set(false);
}
```

### Side panel state

`SidePanelService` controls the right-side detail/edit panel via a discriminated union signal:

```typescript
type PanelAction =
  | { type: 'none' }
  | { type: 'person-detail'; personId: string }
  | { type: 'person-edit'; personId: string }
  | { type: 'relation-form' }
  // ...
```

### Auth

- Bearer token stored in memory (signal), refresh token in `refreshToken` cookie (SameSite=Strict, 90d)
- `userKeyInterceptor` (functional interceptor) auto-attaches token to all non-auth requests
- Token refreshed on app init via `provideAppInitializer`

### Feature areas

- `core/auth` — AuthService, authGuard, interceptor
- `features/editor` — main layout; child routes: `list`, `tree`, `timeline`, `map`
- `shared/` — persons, relations, residences (model + service + store + pipes)
- Editor side panel — detail/edit components for all three entities

## Styles

### CSS custom properties

| Use case | Properties |
|---|---|
| Hover animation background | `background-color: var(--p-surface-100)` |
| Highlight element | `background-color: var(--p-primary-50)` + `color: var(--p-highlight-color)` |

## Response and Planning

Barebone language, no filler words. Technical details preserved.
