// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface EinheitAlpha {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    name_alpha?: string;
    beschreibung_alpha?: string;
    beta_eintrag?: RecordUrl; // applookup -> URL zu 'EinheitBeta' Record
  };
}

export interface EinheitBeta {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    name_beta?: string;
    beschreibung_beta?: string;
    alpha_eintrag?: RecordUrl; // applookup -> URL zu 'EinheitAlpha' Record
  };
}

export const APP_IDS = {
  EINHEIT_ALPHA: '6abd3e5f73aefa2de53378f5',
  EINHEIT_BETA: '6abd3e62e41a830f98d5e8b8',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'einheit_alpha': {
    'name_alpha': 'string/text',
    'beschreibung_alpha': 'string/textarea',
    'beta_eintrag': 'applookup/select',
  },
  'einheit_beta': {
    'name_beta': 'string/text',
    'beschreibung_beta': 'string/textarea',
    'alpha_eintrag': 'applookup/select',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateEinheitAlpha = StripLookup<EinheitAlpha['fields']>;
export type CreateEinheitBeta = StripLookup<EinheitBeta['fields']>;