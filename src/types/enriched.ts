import type { EinheitAlpha, EinheitBeta } from './app';

export type EnrichedEinheitAlpha = EinheitAlpha & {
  beta_eintragName: string;
};

export type EnrichedEinheitBeta = EinheitBeta & {
  alpha_eintragName: string;
};
