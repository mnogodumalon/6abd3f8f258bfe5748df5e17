import type { EinheitBeta, EinheitAlpha } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface EinheitBetaDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: EinheitBeta;
  /** N:1-Ziel „EinheitAlpha": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  einheitAlphaList: EinheitAlpha[];
  /** Klick auf die EinheitAlpha-Relation → overlay.push auf dessen Detail. */
  onOpenEinheitAlpha?: (record: EinheitAlpha) => void;
  /** 1:N „Einheit Alpha" (beta_eintrag): VOLLE Liste — der Block filtert auf diesen Record. */
  einheitAlphaBetaEintragList: EinheitAlpha[];
  /** Zeilen-Klick → overlay.push auf das EinheitAlpha-Detail (nie der Edit-Dialog). */
  onOpenEinheitAlphaBetaEintrag: (record: EinheitAlpha) => void;
  /** Kontextuelles „+": öffnet den EinheitAlpha-Dialog mit diesem Record vorgesetzt. */
  onAddEinheitAlphaBetaEintrag: () => void;
}

export function EinheitBetaDetails({
  record,
  einheitAlphaList,
  onOpenEinheitAlpha,
  einheitAlphaBetaEintragList,
  onOpenEinheitAlphaBetaEintrag,
  onAddEinheitAlphaBetaEintrag,
}: EinheitBetaDetailsProps) {
  const alpha_eintragTarget = einheitAlphaList.find(r => r.record_id === extractRecordId(record.fields.alpha_eintrag));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('einheit_beta', 'name_beta')} value={record.fields.name_beta} format="text" />
        <RecordField label={fieldLabel('einheit_beta', 'beschreibung_beta')} value={record.fields.beschreibung_beta} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('einheit_beta', 'alpha_eintrag')}
          name={alpha_eintragTarget?.fields.name_alpha ?? '—'}
          meta={undefined}
          onClick={alpha_eintragTarget && onOpenEinheitAlpha ? () => onOpenEinheitAlpha!(alpha_eintragTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={`${appLabel('einheit_alpha')} · ${fieldLabel('einheit_alpha', 'beta_eintrag')}`}
        items={einheitAlphaBetaEintragList.filter(r => extractRecordId(r.fields.beta_eintrag) === record.record_id)}
        map={r => ({ name: r.fields.name_alpha ?? appLabel('einheit_alpha'), meta: undefined })}
        onOpen={onOpenEinheitAlphaBetaEintrag}
        onAdd={onAddEinheitAlphaBetaEintrag}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.EINHEIT_BETA} recordId={record.record_id} />
    </>
  );
}
