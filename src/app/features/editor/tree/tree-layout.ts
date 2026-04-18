import { Person } from '../../../shared/persons/person.model';
import { Relation, RelationType } from '../../../shared/relations/relation.model';
import { PARENT_TYPES } from '../../../shared/relations/relation-type.pipe';

export const BOX_W = 140;
export const BOX_H = 60;
export const H_GAP = 24;
export const V_GAP = 80;
const PADDING = 48;
const SPOUSE_GAP = 48;

// personAId = parent, personBId = child for all PARENT_TYPES relations
const PARTNER_TYPES: RelationType[] = ['spouse', 'partner', 'engaged'];

export interface PersonBox {
  personId: string;
  row: 0 | 1 | 2 | 3;
  x: number;
  y: number;
  isFocus: boolean;
  isDeceased: boolean;
  firstName: string;
  lastName: string;
  subLabel: string;
}

export interface TreeLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface TreeLayout {
  boxes: PersonBox[];
  lines: TreeLine[];
  svgWidth: number;
  svgHeight: number;
}

interface CoupleBlock {
  partnerId: string;
  sharedChildIds: string[];
  relationType: RelationType;
}

function makeBox(
  personId: string,
  row: 0 | 1 | 2 | 3,
  x: number,
  y: number,
  person: Person | undefined,
  focusId: string,
  parentMap: Map<string, string[]>,
): PersonBox {
  if (!person) {
    return {
      personId,
      row,
      x,
      y,
      isFocus: false,
      isDeceased: false,
      firstName: '?',
      lastName: '',
      subLabel: '',
    };
  }

  const birthYear = person.birthDate?.date?.slice(0, 4);
  const deathYear = person.deathDate?.date?.slice(0, 4);
  let subLabel = '';
  if (birthYear && deathYear) subLabel = `* ${birthYear} – † ${deathYear}`;
  else if (birthYear) subLabel = `* ${birthYear}`;
  else if (deathYear) subLabel = `† ${deathYear}`;

  const parents = parentMap.get(personId);

  return {
    personId,
    row,
    x,
    y,
    isFocus: personId === focusId,
    isDeceased: !!person.deathDate,
    firstName: person.firstName,
    lastName: person.lastName,
    subLabel,
  };
}

function collisionSweep(boxes: PersonBox[]): void {
  if (boxes.length < 2) return;
  boxes.sort((a, b) => a.x - b.x);
  for (let i = 1; i < boxes.length; i++) {
    if (boxes[i].x < boxes[i - 1].x + BOX_W + H_GAP) {
      boxes[i].x = boxes[i - 1].x + BOX_W + H_GAP;
    }
  }
}

// Draws: vertical from (sourceMidX, sourceY) → knotY, horizontal bar, verticals to each child.
// sourceY is the mid-height of the source box — the portion hidden inside the box rect is fine
// because boxes are rendered on top of lines.
function addConnector(
  lines: TreeLine[],
  sourceMidX: number,
  sourceY: number,
  childBoxes: PersonBox[],
): void {
  if (childBoxes.length === 0) return;
  const knotY = childBoxes[0].y - V_GAP / 2;
  const childMidXs = childBoxes.map((b) => b.x + BOX_W / 2);
  const barLeft = Math.min(...childMidXs, sourceMidX);
  const barRight = Math.max(...childMidXs, sourceMidX);
  lines.push({ x1: sourceMidX, y1: sourceY, x2: sourceMidX, y2: knotY, style: 'solid' });
  lines.push({ x1: barLeft, y1: knotY, x2: barRight, y2: knotY, style: 'solid' });
  for (const midX of childMidXs) {
    lines.push({ x1: midX, y1: knotY, x2: midX, y2: childBoxes[0].y, style: 'solid' });
  }
}

export function buildTreeLayout(
  focusId: string,
  persons: Person[],
  relations: Relation[],
): TreeLayout {
  const personMap = new Map(persons.map((p) => [p.id, p]));

  const parentMap = new Map<string, string[]>();
  const childMap = new Map<string, string[]>();
  for (const rel of relations) {
    if (PARENT_TYPES.includes(rel.type)) {
      const parents = parentMap.get(rel.personBId) ?? [];
      parents.push(rel.personAId);
      parentMap.set(rel.personBId, parents);

      const children = childMap.get(rel.personAId) ?? [];
      children.push(rel.personBId);
      childMap.set(rel.personAId, children);
    }
  }

  const coupleBlocks: CoupleBlock[] = [];
  for (const rel of relations) {
    if (!PARTNER_TYPES.includes(rel.type)) continue;
    const isFocusA = rel.personAId === focusId;
    const isFocusB = rel.personBId === focusId;
    if (!isFocusA && !isFocusB) continue;

    const partnerId = isFocusA ? rel.personBId : rel.personAId;
    const focusChildren = new Set(childMap.get(focusId) ?? []);
    const partnerChildren = new Set(childMap.get(partnerId) ?? []);
    const sharedChildIds = [...focusChildren].filter((id) => partnerChildren.has(id));
    coupleBlocks.push({ partnerId, sharedChildIds, relationType: rel.type });
  }

  const focusParentIds = parentMap.get(focusId) ?? [];

  const siblingSet = new Set<string>();
  for (const pid of focusParentIds) {
    for (const childId of childMap.get(pid) ?? []) {
      if (childId !== focusId) siblingSet.add(childId);
    }
  }
  const siblings = [...siblingSet].sort((a, b) => {
    const da = personMap.get(a)?.birthDate?.date;
    const db = personMap.get(b)?.birthDate?.date;
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da.localeCompare(db);
  });

  const partnerIds = coupleBlocks.map((b) => b.partnerId);
  const coupleChildSet = new Set(coupleBlocks.flatMap((b) => b.sharedChildIds));
  const soloChildIds = (childMap.get(focusId) ?? []).filter((id) => !coupleChildSet.has(id));

  const rowY = [0, 1, 2, 3].map((r) => PADDING + r * (BOX_H + V_GAP));

  // Row 2: siblings (oldest left), focus, partners (right)
  // SPOUSE_GAP is used after focus to give couple lines enough space to be visible
  const row2Ids = [...siblings, focusId, ...partnerIds];
  const row2Boxes: PersonBox[] = [];
  let row2X = PADDING;
  for (let i = 0; i < row2Ids.length; i++) {
    if (i > 0) {
      const gap = row2Ids[i - 1] === focusId ? SPOUSE_GAP : H_GAP;
      row2X += BOX_W + gap;
    }
    row2Boxes.push(makeBox(row2Ids[i], 2, row2X, rowY[2], personMap.get(row2Ids[i]), focusId, parentMap));
  }

  const focusBoxInitial = row2Boxes.find((b) => b.personId === focusId)!;
  const focusCenterX = focusBoxInitial.x + BOX_W / 2;

  // Row 1: parents centered above focus
  const row1Boxes: PersonBox[] = [];
  if (focusParentIds.length > 0) {
    const totalWidth = focusParentIds.length * BOX_W + (focusParentIds.length - 1) * H_GAP;
    const startX = focusCenterX - totalWidth / 2;
    focusParentIds.forEach((id, i) =>
      row1Boxes.push(
        makeBox(
          id,
          1,
          startX + i * (BOX_W + H_GAP),
          rowY[1],
          personMap.get(id),
          focusId,
          parentMap,
        ),
      ),
    );
    collisionSweep(row1Boxes);
  }

  // Row 0: grandparents centered above each parent
  const row0Boxes: PersonBox[] = [];
  for (const parentBox of row1Boxes) {
    const gpIds = parentMap.get(parentBox.personId) ?? [];
    if (gpIds.length === 0) continue;
    const totalWidth = gpIds.length * BOX_W + (gpIds.length - 1) * H_GAP;
    const startX = parentBox.x + BOX_W / 2 - totalWidth / 2;
    gpIds.forEach((id, i) => {
      if (!row0Boxes.find((b) => b.personId === id)) {
        row0Boxes.push(
          makeBox(
            id,
            0,
            startX + i * (BOX_W + H_GAP),
            rowY[0],
            personMap.get(id),
            focusId,
            parentMap,
          ),
        );
      }
    });
  }
  collisionSweep(row0Boxes);

  // Row 3: children below couple mid-points, then solo children below focus
  const row3Boxes: PersonBox[] = [];
  for (const block of coupleBlocks) {
    if (block.sharedChildIds.length === 0) continue;
    const partnerBox = row2Boxes.find((b) => b.personId === block.partnerId);
    if (!partnerBox) continue;
    const midX = (focusCenterX + partnerBox.x + BOX_W / 2) / 2;
    const totalWidth =
      block.sharedChildIds.length * BOX_W + (block.sharedChildIds.length - 1) * H_GAP;
    const startX = midX - totalWidth / 2;
    block.sharedChildIds.forEach((id, i) => {
      if (!row3Boxes.find((b) => b.personId === id)) {
        row3Boxes.push(
          makeBox(
            id,
            3,
            startX + i * (BOX_W + H_GAP),
            rowY[3],
            personMap.get(id),
            focusId,
            parentMap,
          ),
        );
      }
    });
  }
  if (soloChildIds.length > 0) {
    const totalWidth = soloChildIds.length * BOX_W + (soloChildIds.length - 1) * H_GAP;
    const startX = focusCenterX - totalWidth / 2;
    soloChildIds.forEach((id, i) => {
      if (!row3Boxes.find((b) => b.personId === id)) {
        row3Boxes.push(
          makeBox(
            id,
            3,
            startX + i * (BOX_W + H_GAP),
            rowY[3],
            personMap.get(id),
            focusId,
            parentMap,
          ),
        );
      }
    });
  }
  collisionSweep(row3Boxes);

  // Shift all boxes so min x >= PADDING
  const allBoxes: PersonBox[] = [...row0Boxes, ...row1Boxes, ...row2Boxes, ...row3Boxes];
  if (allBoxes.length > 0) {
    const minX = Math.min(...allBoxes.map((b) => b.x));
    if (minX < PADDING) {
      const shift = PADDING - minX;
      for (const box of allBoxes) box.x += shift;
    }
  }

  const maxX = allBoxes.length > 0 ? Math.max(...allBoxes.map((b) => b.x + BOX_W)) : PADDING;
  const maxY = allBoxes.length > 0 ? Math.max(...allBoxes.map((b) => b.y + BOX_H)) : PADDING;
  const svgWidth = maxX + PADDING;
  const svgHeight = maxY + PADDING;

  // Build lines using final (normalized) positions
  const boxMap = new Map(allBoxes.map((b) => [b.personId, b]));
  const lines: TreeLine[] = [];

  // 1. Grandparent marriages + grandparents → each parent
  for (const parentBox of row1Boxes) {
    const gpIds = parentMap.get(parentBox.personId) ?? [];
    const gpBoxes = gpIds
      .map((id) => boxMap.get(id))
      .filter((b): b is PersonBox => !!b)
      .sort((a, b) => a.x - b.x);
    if (gpBoxes.length === 0) continue;

    const gpMidY = gpBoxes[0].y + BOX_H / 2;
    let sourceMidX: number;

    if (gpBoxes.length >= 2) {
      const gp0 = gpBoxes[0], gp1 = gpBoxes[gpBoxes.length - 1];
      lines.push({ x1: gp0.x + BOX_W, y1: gpMidY, x2: gp1.x, y2: gpMidY, style: 'dashed' });
      sourceMidX = (gp0.x + BOX_W + gp1.x) / 2;
    } else {
      sourceMidX = gpBoxes[0].x + BOX_W / 2;
    }

    addConnector(lines, sourceMidX, gpMidY, [parentBox]);
  }

  // 2. Parent marriage + parents → focus + siblings
  if (row1Boxes.length > 0) {
    const sortedParents = [...row1Boxes].sort((a, b) => a.x - b.x);
    const parMidY = sortedParents[0].y + BOX_H / 2;
    let sourceMidX: number;

    if (sortedParents.length >= 2) {
      const p0 = sortedParents[0], p1 = sortedParents[sortedParents.length - 1];
      lines.push({ x1: p0.x + BOX_W, y1: parMidY, x2: p1.x, y2: parMidY, style: 'dashed' });
      sourceMidX = (p0.x + BOX_W + p1.x) / 2;
    } else {
      sourceMidX = sortedParents[0].x + BOX_W / 2;
    }

    const focusAndSiblingBoxes = [...siblings, focusId]
      .map((id) => boxMap.get(id))
      .filter((b): b is PersonBox => !!b);
    if (focusAndSiblingBoxes.length > 0) {
      addConnector(lines, sourceMidX, parMidY, focusAndSiblingBoxes);
    }
  }

  // 3. Focus–partner marriages + children connectors
  const focusBoxFinal = boxMap.get(focusId)!;
  const focusMidY = focusBoxFinal.y + BOX_H / 2;

  for (const block of coupleBlocks) {
    const partnerBox = boxMap.get(block.partnerId);
    if (!partnerBox) continue;

    const leftBox = focusBoxFinal.x < partnerBox.x ? focusBoxFinal : partnerBox;
    const rightBox = focusBoxFinal.x < partnerBox.x ? partnerBox : focusBoxFinal;
    const lineStyle: 'dashed' | 'dotted' = block.relationType === 'spouse' ? 'dashed' : 'dotted';
    lines.push({ x1: leftBox.x + BOX_W, y1: focusMidY, x2: rightBox.x, y2: focusMidY, style: lineStyle });

    if (block.sharedChildIds.length > 0) {
      const eheMidX = (leftBox.x + BOX_W + rightBox.x) / 2;
      const childBoxes = block.sharedChildIds
        .map((id) => boxMap.get(id))
        .filter((b): b is PersonBox => !!b);
      if (childBoxes.length > 0) {
        addConnector(lines, eheMidX, focusMidY, childBoxes);
      }
    }
  }

  // 4. Solo children of focus (no registered partner)
  if (soloChildIds.length > 0) {
    const soloBoxes = soloChildIds
      .map((id) => boxMap.get(id))
      .filter((b): b is PersonBox => !!b);
    if (soloBoxes.length > 0) {
      addConnector(lines, focusBoxFinal.x + BOX_W / 2, focusMidY, soloBoxes);
    }
  }

  return { boxes: allBoxes, lines, svgWidth, svgHeight };
}
