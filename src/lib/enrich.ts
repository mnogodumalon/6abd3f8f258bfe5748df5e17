import type { EnrichedEinheitAlpha, EnrichedEinheitBeta } from '@/types/enriched';
import type { EinheitAlpha, EinheitBeta } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface EinheitAlphaMaps {
  einheitBetaMap: Map<string, EinheitBeta>;
}

export function enrichEinheitAlpha(
  einheitAlpha: EinheitAlpha[],
  maps: EinheitAlphaMaps
): EnrichedEinheitAlpha[] {
  return einheitAlpha.map(r => ({
    ...r,
    beta_eintragName: resolveDisplay(r.fields.beta_eintrag, maps.einheitBetaMap, 'name_beta'),
  }));
}

interface EinheitBetaMaps {
  einheitAlphaMap: Map<string, EinheitAlpha>;
}

export function enrichEinheitBeta(
  einheitBeta: EinheitBeta[],
  maps: EinheitBetaMaps
): EnrichedEinheitBeta[] {
  return einheitBeta.map(r => ({
    ...r,
    alpha_eintragName: resolveDisplay(r.fields.alpha_eintrag, maps.einheitAlphaMap, 'name_alpha'),
  }));
}
