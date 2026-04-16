export type PanelAction =
  | { type: 'none' }
  | { type: 'person-detail'; personId: string; residenceId?: string }
  | { type: 'person-form' }
  | { type: 'person-edit'; personId: string }
  | { type: 'relation-form' }
  | { type: 'relation-detail'; relationId: string }
  | { type: 'relation-edit'; relationId: string }
  | { type: 'residence-form'; personId: string }
  | { type: 'residence-edit'; residenceId: string; personId: string }
  | { type: 'residence-location'; lat: number; lng: number };
