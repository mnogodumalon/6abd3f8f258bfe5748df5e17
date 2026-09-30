import type { EinheitAlpha, EinheitBeta } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface EinheitAlphaDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: EinheitAlpha;
  /** N:1-Ziel „EinheitBeta": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  einheitBetaList: EinheitBeta[];
  /** Klick auf die EinheitBeta-Relation → overlay.push auf dessen Detail. */
  onOpenEinheitBeta?: (record: EinheitBeta) => void;
  /** 1:N „Einheit Beta" (alpha_eintrag): VOLLE Liste — der Block filtert auf diesen Record. */
  einheitBetaAlphaEintragList: EinheitBeta[];
  /** Zeilen-Klick → overlay.push auf das EinheitBeta-Detail (nie der Edit-Dialog). */
  onOpenEinheitBetaAlphaEintrag: (record: EinheitBeta) => void;
  /** Kontextuelles „+": öffnet den EinheitBeta-Dialog mit diesem Record vorgesetzt. */
  onAddEinheitBetaAlphaEintrag: () => void;
}

export function EinheitAlphaDetails({
  record,
  einheitBetaList,
  onOpenEinheitBeta,
  einheitBetaAlphaEintragList,
  onOpenEinheitBetaAlphaEintrag,
  onAddEinheitBetaAlphaEintrag,
}: EinheitAlphaDetailsProps) {
  const beta_eintragTarget = einheitBetaList.find(r => r.record_id === extractRecordId(record.fields.beta_eintrag));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('einheit_alpha', 'name_alpha')} value={record.fields.name_alpha} format="text" />
        <RecordField label={fieldLabel('einheit_alpha', 'beschreibung_alpha')} value={record.fields.beschreibung_alpha} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('einheit_alpha', 'beta_eintrag')}
          name={beta_eintragTarget?.fields.name_beta ?? '—'}
          meta={undefined}
          onClick={beta_eintragTarget && onOpenEinheitBeta ? () => onOpenEinheitBeta!(beta_eintragTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={`${appLabel('einheit_beta')} · ${fieldLabel('einheit_beta', 'alpha_eintrag')}`}
        items={einheitBetaAlphaEintragList.filter(r => extractRecordId(r.fields.alpha_eintrag) === record.record_id)}
        map={r => ({ name: r.fields.name_beta ?? appLabel('einheit_beta'), meta: undefined })}
        onOpen={onOpenEinheitBetaAlphaEintrag}
        onAdd={onAddEinheitBetaAlphaEintrag}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.EINHEIT_ALPHA} recordId={record.record_id} />
    </>
  );
}
