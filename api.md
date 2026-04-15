# Family Tree API

## Authentication

Kein Session-Auth. Die Identität wird serverseitig über `chayns.person.current.getId()` ermittelt. Vor dem ersten Aufruf muss `POST /auth/register` aufgerufen werden. `POST /auth/register` selbst benötigt keine Parameter.

---

## Shared Types

### FuzzyDate (Input & Response)

```ts
{
  id: string;
  precision: 'exact' | 'month' | 'year' | 'estimated' | 'before' | 'after' | 'between';
  date: string;
  datePrecision?: 'exact' | 'month' | 'year';
  dateTo?: string;
  dateToPrecision?: 'exact' | 'month' | 'year';
  note?: string;
}
```

---

## Routen

### Auth

#### `GET /auth/login`
Prüft, ob der aktuelle chayns-Nutzer registriert ist. Die personId wird automatisch aus dem chayns-Runtime bezogen.

**Response `200`**
```json
{ "id": "<personId>", "firstName": "string", "lastName": "string" }
```

**Response `404`** — User not found

---

#### `POST /auth/register`
Registriert den aktuellen chayns-Nutzer. Kein Request Body erforderlich — personId, firstName und lastName werden automatisch aus dem chayns-Runtime bezogen.

**Response `201`**
```json
{ "id": "<personId>", "firstName": "string", "lastName": "string" }
```

**Response `409`** — Bereits registriert

---

### Persons

#### `GET /persons`
Gibt alle Personen des Users zurück.

**Response `200`** — `PersonDto[]`

#### `POST /persons`
Erstellt eine neue Person.

**Request Body** — `CreatePersonInput`
```ts
{
  firstName: string;
  lastName: string;
  middleNames?: string;
  birthName?: string;
  gender?: 'male' | 'female' | 'diverse';
  birthPlace?: string;
  birthDate?: FuzzyDateInput;
  deathPlace?: string;
  deathDate?: FuzzyDateInput;
  burialPlace?: string;
  title?: string;
  religion?: string;
  notes?: string;
}
```

**Response `201`** — `PersonDto`

#### `PUT /persons/:id`
Ersetzt alle Felder einer Person vollständig.

**Request Body** — identisch mit `CreatePersonInput`

**Response `200`** — `PersonDto`

#### `DELETE /persons/:id`
Löscht eine Person.

**Response `204`**

---

**PersonDto**
```ts
{
  id: string;
  firstName: string;
  lastName: string;
  middleNames?: string;
  birthName?: string;
  gender?: 'male' | 'female' | 'diverse';
  birthPlace?: string;
  birthDate?: FuzzyDate;
  deathPlace?: string;
  deathDate?: FuzzyDate;
  burialPlace?: string;
  title?: string;
  religion?: string;
  notes?: string;
}
```

---

### Relations

Modelliert Beziehungen zwischen zwei Personen. Die Richtung (personA → personB) ist bei `biological_parent`, `adoptive_parent` und `foster_parent` semantisch: personA ist Elternteil von personB.

#### `GET /relations`
Gibt alle Relationen des Users zurück.

**Response `200`** — `RelationDto[]`

#### `POST /relations`
Erstellt eine neue Relation.

**Request Body** — `CreateRelationInput`
```ts
{
  personAId: string;
  personBId: string;
  type: 'biological_parent' | 'adoptive_parent' | 'foster_parent' | 'spouse' | 'partner' | 'engaged';
  startDate?: FuzzyDateInput;
  endDate?: FuzzyDateInput;
  endReason?: string;
  notes: string;
}
```

**Response `201`** — `RelationDto`

#### `PUT /relations/:id`
Aktualisiert eine Relation vollständig.

**Request Body** — identisch mit `CreateRelationInput`

**Response `200`** — `RelationDto`

#### `DELETE /relations/:id`
Löscht eine Relation.

**Response `204`**

---

**RelationDto**
```ts
{
  id: string;
  personAId: string;
  personBId: string;
  type: 'biological_parent' | 'adoptive_parent' | 'foster_parent' | 'spouse' | 'partner' | 'engaged';
  startDate?: FuzzyDate;
  endDate?: FuzzyDate;
  endReason?: string;
  notes: string;
}
```

---

### Residences

Wohnsitze einer Person. Eine Person kann mehrere Wohnsitze haben.

#### `GET /residences`
Gibt alle Wohnsitze des Users zurück.

**Response `200`** — `ResidenceDto[]`

#### `POST /residences`
Erstellt einen neuen Wohnsitz.

**Request Body** — `CreateResidenceInput`
```ts
{
  personId: string;
  city?: string;
  country?: string;
  street?: string;
  notes?: string;
  startDate?: FuzzyDateInput;
  endDate?: FuzzyDateInput;
}
```

**Response `201`** — `ResidenceDto`

#### `PUT /residences/:id`
Aktualisiert einen Wohnsitz vollständig.

**Request Body** — identisch mit `CreateResidenceInput`

**Response `200`** — `ResidenceDto`

#### `DELETE /residences/:id`
Löscht einen Wohnsitz.

**Response `204`**

---

**ResidenceDto**
```ts
{
  id: string;
  personId: string;
  city?: string;
  country?: string;
  street?: string;
  notes?: string;
  startDate?: FuzzyDate;
  endDate?: FuzzyDate;
}
```

---

### Admin

Alle Admin-Routen erfordern `?password=<ADMIN_PASSWORD>` statt Nutzeridentifikation über die Runtime.

#### `GET /admin/storage-data?password=&[userKeys]&[fuzzyDates]&[persons]&[relations]&[residences]`
Gibt rohe Storage-Daten zurück. Jede optionale Flag (als Query-Param, beliebiger Wert) aktiviert die entsprechende Kollektion.

**Response `200`**
```ts
{
  userKeys?: UserKeyResource[];
  fuzzyDates?: FuzzyDateResource[];
  persons?: PersonResource[];
  relations?: RelationshipResource[];
  residences?: ResidenceResource[];
}
```

#### `DELETE /admin/storage-data?password=&[userKeys]&[fuzzyDates]&[persons]&[relations]&[residences]`
Löscht die ausgewählten Kollektionen.

**Response `204`**

#### `PUT /admin/user-key-creation?password=`
Aktiviert oder deaktiviert die Registrierung neuer Nutzer.

**Request Body**
```json
{ "enabled": true }
```

**Response `204`**

---

## Fehlerresponses

| Status | Bedeutung |
|--------|-----------|
| `400` | Pflichtfeld fehlt (id, body) |
| `401` | Nicht registriert oder ungültiges Admin-Passwort |
| `404` | Ressource nicht gefunden |
| `409` | Konflikt (z. B. bereits registriert) |

**Body bei Fehler**
```json
{ "message": "Fehlerbeschreibung" }
```
