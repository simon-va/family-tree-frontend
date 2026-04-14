# Family Tree API

## Authentication

Kein Session-Auth. Alle Anfragen (außer `POST /auth/user-key`) erfordern `?userKey=<uuid>` als Query-Parameter.

---

## Shared Types

### FuzzyDate (Input & Response)

```ts
{
  id: string;                          // nur in Responses
  precision: 'exact' | 'month' | 'year' | 'about' | 'estimated' | 'before' | 'after' | 'between';
  date: string;                        // ISO-Datumsstring
  dateTo?: string;                     // nur bei precision = 'between'
  note?: string;
}
```

---

## Routen

### Auth

#### `POST /auth/user-key`
Erstellt einen neuen UserKey. Kein Query-Parameter erforderlich.

**Request Body**
```ts
{ userName: string }
```

**Response `201`**
```json
{ "id": "uuid", "userName": "string" }
```

---

### Persons

#### `GET /persons?userKey=`
Gibt alle Personen des Users zurück.

**Response `200`** — `PersonDto[]`

#### `POST /persons?userKey=`
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

#### `PUT /persons/:id?userKey=`
Ersetzt alle Felder einer Person vollständig.

**Request Body** — identisch mit `CreatePersonInput`

**Response `200`** — `PersonDto`

#### `DELETE /persons/:id?userKey=`
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

#### `GET /relations?userKey=`
Gibt alle Relationen des Users zurück.

**Response `200`** — `RelationDto[]`

#### `POST /relations?userKey=`
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

#### `PUT /relations/:id?userKey=`
Aktualisiert eine Relation vollständig.

**Request Body** — identisch mit `CreateRelationInput`

**Response `200`** — `RelationDto`

#### `DELETE /relations/:id?userKey=`
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

#### `GET /residences?userKey=`
Gibt alle Wohnsitze des Users zurück.

**Response `200`** — `ResidenceDto[]`

#### `POST /residences?userKey=`
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

#### `PUT /residences/:id?userKey=`
Aktualisiert einen Wohnsitz vollständig.

**Request Body** — identisch mit `CreateResidenceInput`

**Response `200`** — `ResidenceDto`

#### `DELETE /residences/:id?userKey=`
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