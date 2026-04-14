# Stammbaum-App — Projektplan & Architekturentscheidungen

## Projektübersicht

Angular-App zur Verwaltung und Visualisierung eines Stammbaums. Daten werden über einen REST-Server gespeichert. Zugang erfolgt über einen selbst generierten UUID-Schlüssel, der als einfaches Passwort dient.

---

## Backend (REST-Server)

Authentifizierung per Query-Parameter `?userKey=<uuid>` — kein Session-Auth, kein Header.

| Ressource | Routen |
|---|---|
| `POST /auth/user-key` | Neuen Schlüssel generieren (kein userKey nötig) |
| `/persons` | CRUD — GET, POST, PUT /:id, DELETE /:id |
| `/relations` | CRUD — GET, POST, PUT /:id, DELETE /:id |
| `/residences` | CRUD — GET, POST, PUT /:id, DELETE /:id |

### Wichtige Typen

**FuzzyDate** — kein einfaches Datumsfeld, sondern ein eigener Typ:
```ts
{
  precision: 'exact' | 'month' | 'year' | 'about' | 'estimated' | 'before' | 'after' | 'between';
  date: string;       // ISO-Datumsstring
  dateTo?: string;    // nur bei precision = 'between'
  note?: string;
}
```

**Relations** — Richtung ist bei Eltern-Typen semantisch: personA ist Elternteil von personB.
Typen: `biological_parent | adoptive_parent | foster_parent | spouse | partner | engaged`

**Residences** — Wohnsitze einer Person, mit optionalen Start-/Enddaten.

---

## Routing

```
/                 → WelcomePage (Schlüssel eingeben oder generieren)
/editor           → EditorPage (geschützt durch AuthGuard)
/editor/tree      → Tab: Stammbaum
/editor/list      → Tab: Personenliste & Beziehungsliste
/editor/timeline  → Tab: Zeitstrahl
/editor/map       → Tab: Weltkarte
```

---

## Projektstruktur

```
stammbaum/
├── AGENTS.md              ← Anweisungen für KI-Agenten (siehe unten)
├── CLAUDE.md              ← Alias für Claude Code, gleicher Inhalt
└── src/app/

    ├── core/              ← Nur Infrastruktur — keine Domänenlogik
    │   ├── auth/
    │   │   └── key.service.ts          ← Schlüssel in LocalStorage lesen/setzen/löschen
    │   ├── guards/
    │   │   └── auth.guard.ts           ← Weiterleitung zu / wenn kein Schlüssel gesetzt
    │   ├── interceptors/
    │   │   └── user-key.interceptor.ts ← Hängt ?userKey= automatisch an jeden Request
    │   └── app.routes.ts               ← / → welcome, /editor → editor (lazy + guard)

    ├── shared/            ← Domänen + UI-Bausteine — von mehreren Features genutzt
    │   │
    │   ├── persons/       ← Alles zur Personen-Domäne an einem Ort
    │   │   ├── person.model.ts
    │   │   ├── persons.service.ts      ← HTTP CRUD für /persons
    │   │   └── persons.store.ts        ← Alle Tabs lesen Personen
    │   │
    │   ├── relations/
    │   │   ├── relation.model.ts
    │   │   ├── relations.service.ts    ← HTTP CRUD für /relations
    │   │   └── relations.store.ts      ← Alle Tabs lesen Beziehungen
    │   │
    │   ├── residences/
    │   │   ├── residence.model.ts
    │   │   ├── residences.service.ts   ← HTTP CRUD für /residences
    │   │   └── residences.store.ts     ← map/, timeline/, person-detail/ lesen Wohnsitze
    │   │
    │   ├── fuzzy-date/    ← Eigener Ordner: Typ + Pipe + Hilfsfunktion gehören zusammen
    │   │   ├── fuzzy-date.model.ts
    │   │   ├── fuzzy-date.pipe.ts      ← "ca. 1880", "zwischen 1880 und 1885" etc.
    │   │   └── fuzzy-date.util.ts      ← Hilfsfunktionen für Vergleich, Sortierung
    │   │
    │   ├── ui/
    │   │   └── button/, badge/, modal/, card/
    │   ├── pipes/
    │   │   └── full-name.pipe.ts       ← Domänenunabhängige Pipes
    │   └── directives/
    │       ├── tooltip.directive.ts
    │       └── drag-handle.directive.ts

    └── features/

        ├── welcome/
        │   └── welcome.component.ts/html/scss
        │       ← POST /auth/user-key zum Generieren, dann → /editor
        │
        └── editor/
            ├── editor.component.ts/html/scss
            │   ← Shell: Header + Router-Outlet (Tabs) + <app-sidebar>
            ├── editor.routes.ts        ← Lazy-Routen für alle vier Tabs
            │
            ├── header/
            │   └── header.component.ts/html/scss
            │       ← Tab-Navigation, Schlüssel anzeigen, Logout
            │
            ├── tree/
            │   ├── tree.component.ts/html/scss/spec.ts
            │   ├── layout.store.ts     ← Knotenpositionen; nur tree/ relevant
            │   ├── tree-node.model.ts  ← tree-spezifisches Modell
            │   ├── node/               ← Unterordner erst wenn > 3 Dateien entstehen
            │   └── edge/
            │
            ├── list/
            │   └── list.component.ts/html/scss
            │       ← Liest aus shared/persons, relations, residences
            │
            ├── timeline/
            │   └── timeline.component.ts/html/scss
            │       ← Liest persons + residences für Lebensdaten-Zeitstrahl
            │
            ├── map/
            │   └── map.component.ts/html/scss
            │       ← Liest residences für Geo-Pins auf der Weltkarte
            │
            └── sidebar/
                ├── sidebar.component.ts/html/scss
                │   ← Wrapper: animiertes Ein-/Ausfahren, rendert Kind per @switch
                ├── sidebar.store.ts
                │   ← activeAction: SidebarAction | null
                ├── sidebar.actions.ts
                │   ← Union-Typ (siehe unten)
                │
                ├── person-form/        ← Input: person? (null = Create, gesetzt = Edit)
                ├── person-detail/      ← Zeigt auch Wohnsitze & Beziehungen
                ├── relation-form/      ← Input: relation?
                ├── relation-detail/
                ├── residence-form/     ← Input: residence?
                └── residence-detail/
```

---

## Store-Scope-Prinzip

| Store | Ort | Begründung |
|---|---|---|
| `persons.store.ts` | `shared/persons/` | Alle vier Tabs lesen Personen |
| `relations.store.ts` | `shared/relations/` | Alle vier Tabs lesen Beziehungen |
| `residences.store.ts` | `shared/residences/` | map/, timeline/, person-detail/ brauchen Wohnsitze |
| `layout.store.ts` | `features/editor/tree/` | Nur der Stammbaum-Tab braucht Knotenpositionen |
| `sidebar.store.ts` | `features/editor/sidebar/` | Nur der Editor kennt die Sidebar |

**Faustregel:** Wird ein Store von mehr als einem Feature gelesen oder geschrieben → `shared/`. Sonst lebt er neben der Komponente, die ihn besitzt.

---

## Sidebar-Mechanismus

Die Sidebar fährt aus, sobald `sidebarStore.activeAction()` einen Wert hat, und ein, sobald er `null` ist. Tab-Komponenten injecten den Store und rufen `setAction(...)` auf.

### sidebar.actions.ts — vollständige Union

```ts
export type SidebarAction =
  | { type: 'PersonCreate' }
  | { type: 'PersonEdit';       person: PersonDto }
  | { type: 'PersonDetail';     person: PersonDto }
  | { type: 'RelationCreate' }
  | { type: 'RelationEdit';     relation: RelationDto }
  | { type: 'RelationDetail';   relation: RelationDto }
  | { type: 'ResidenceCreate';  personId: string }
  | { type: 'ResidenceEdit';    residence: ResidenceDto }
  | { type: 'ResidenceDetail';  residence: ResidenceDto };
```

### sidebar.component.html — @switch-Prinzip

```html
@switch (sidebarStore.activeAction()?.type) {
  @case ('PersonCreate')    { <app-person-form /> }
  @case ('PersonEdit')      { <app-person-form [person]="action.person" /> }
  @case ('PersonDetail')    { <app-person-detail [person]="action.person" /> }
  @case ('RelationCreate')  { <app-relation-form /> }
  @case ('RelationEdit')    { <app-relation-form [relation]="action.relation" /> }
  @case ('RelationDetail')  { <app-relation-detail [relation]="action.relation" /> }
  @case ('ResidenceCreate') { <app-residence-form [personId]="action.personId" /> }
  @case ('ResidenceEdit')   { <app-residence-form [residence]="action.residence" /> }
  @case ('ResidenceDetail') { <app-residence-detail [residence]="action.residence" /> }
}
```

### Neue Action hinzufügen — immer drei Stellen:
1. `sidebar.actions.ts` — Union-Typ erweitern
2. `sidebar.component.html` — neuen `@case` eintragen
3. `sidebar/` — neuen Unterordner mit Komponente anlegen

---

## Unterordner-Regel innerhalb eines Features

Unterordner entstehen **nicht** nach technischer Schicht (`store/`, `models/`), sondern nach logischer Einheit, wenn diese mehr als drei zusammengehörige Dateien erzeugt.

```
tree/
├── tree.component.ts       ← flach solange überschaubar
├── layout.store.ts
├── tree-node.model.ts
├── node/                   ← Unterordner erst wenn node/ > 3 Dateien hat
└── edge/
```

---

## AGENTS.md — Inhalt

```markdown
## Setup
- Install:     npm install
- Dev server:  ng serve
- Build:       ng build
- Tests:       ng test

## API
- Base URL:    http://localhost:3000
- Auth:        Query-Parameter ?userKey=<uuid> wird per Interceptor automatisch angehängt
- Ressourcen:  /persons, /relations, /residences
- Schlüssel generieren: POST /auth/user-key (kein userKey nötig)

## Architektur
- Angular 17+, Standalone Components, Signals
- State: NgRx Signal Store
- Kein NgModule

## Domänenstruktur (shared/)
- shared/persons/    → person.model.ts, persons.service.ts, persons.store.ts
- shared/relations/  → relation.model.ts, relations.service.ts, relations.store.ts
- shared/residences/ → residence.model.ts, residences.service.ts, residences.store.ts
- shared/fuzzy-date/ → fuzzy-date.model.ts, fuzzy-date.pipe.ts, fuzzy-date.util.ts

## Neue Sidebar-Action hinzufügen
Immer drei Stellen anpassen:
1. sidebar.actions.ts  — Union-Typ erweitern
2. sidebar.component.html — neuen @case eintragen
3. sidebar/            — neuen Unterordner mit Komponente anlegen

## Konventionen
- Unterordner in einem Feature nur wenn eine logische Einheit > 3 Dateien erzeugt
- Kein Import zwischen Feature-Ordnern (z.B. tree/ importiert nichts aus list/)
- shared/ darf von überall importiert werden
- core/ darf von überall importiert werden
```

---

## Technologie-Stack

| Bereich | Technologie |
|---|---|
| Framework | Angular 17+ (Standalone Components, Signals) |
| State | NgRx Signal Store |
| HTTP | Angular HttpClient + Interceptor für ?userKey= |
| Styling | SCSS per Komponente |
| Tests | Angular Testing Library / Jest |