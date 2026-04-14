export type PanelAction =
  | { type: 'none' }
  | { type: 'person-detail'; personId: string }
  | { type: 'person-form' }
  | { type: 'person-edit'; personId: string }
  | { type: 'relation-form' }
  | { type: 'relation-detail'; relationId: string }
  | { type: 'relation-edit'; relationId: string };
