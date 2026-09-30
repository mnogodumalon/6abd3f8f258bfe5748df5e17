/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'einheitAlpha'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.einheitAlpha.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.einheitAlpha.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.einheitAlpha.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.einheitAlpha              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled; list-field back-references additionally get a
 * "choose existing" picker that links an EXISTING record — built in, do not
 * re-roll). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   einheit_alpha: name_alpha, beschreibung_alpha, beta_eintrag  ·  → einheit_beta · ← einheit_beta (list + contextual +)
 *   einheit_beta: name_beta, beschreibung_beta, alpha_eintrag  ·  → einheit_alpha · ← einheit_alpha (list + contextual +)
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { EinheitAlpha, EinheitBeta } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichEinheitAlpha, enrichEinheitBeta } from '@/lib/enrich';
import type { EnrichedEinheitAlpha, EnrichedEinheitBeta } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { EinheitAlphaDialog, type EinheitAlphaDialogDefaults } from '@/components/dialogs/EinheitAlphaDialog';
import { EinheitAlphaDetails } from '@/components/details/EinheitAlphaDetails';
import { EinheitBetaDialog, type EinheitBetaDialogDefaults } from '@/components/dialogs/EinheitBetaDialog';
import { EinheitBetaDetails } from '@/components/details/EinheitBetaDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'einheitAlpha'; record: EnrichedEinheitAlpha }
  | { type: 'einheitBeta'; record: EnrichedEinheitBeta };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  einheitAlpha: EntityCrudApi<EinheitAlpha, EinheitAlphaDialogDefaults>;
  einheitBeta: EntityCrudApi<EinheitBeta, EinheitBetaDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { einheitAlpha: EnrichedEinheitAlpha[]; einheitBeta: EnrichedEinheitBeta[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  const [einheitAlphaDialog, setEinheitAlphaDialog] = useState<{ defaults?: EinheitAlphaDialogDefaults; editing?: EinheitAlpha } | null>(null);
  const [einheitBetaDialog, setEinheitBetaDialog] = useState<{ defaults?: EinheitBetaDialogDefaults; editing?: EinheitBeta } | null>(null);
  const enrichedEinheitAlpha = useMemo(() => enrichEinheitAlpha(data.einheitAlpha, { einheitBetaMap: data.einheitBetaMap }), [data.einheitAlpha, data.einheitBetaMap]);
  const enrichedEinheitBeta = useMemo(() => enrichEinheitBeta(data.einheitBeta, { einheitAlphaMap: data.einheitAlphaMap }), [data.einheitBeta, data.einheitAlphaMap]);

  function detailEinheitAlpha(record: EinheitAlpha, push = false) {
    const rec = enrichedEinheitAlpha.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'einheitAlpha', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitEinheitAlpha(fields: EinheitAlpha['fields']) {
    const editing = einheitAlphaDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setEinheitAlpha(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateEinheitAlphaEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('einheit_alpha')} — ${t('crud_updated')}`, async () => {
        data.setEinheitAlpha(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateEinheitAlphaEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createEinheitAlphaEntry(fields);
      undoToast(`${appLabel('einheit_alpha')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailEinheitBeta(record: EinheitBeta, push = false) {
    const rec = enrichedEinheitBeta.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'einheitBeta', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitEinheitBeta(fields: EinheitBeta['fields']) {
    const editing = einheitBetaDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setEinheitBeta(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateEinheitBetaEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('einheit_beta')} — ${t('crud_updated')}`, async () => {
        data.setEinheitBeta(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateEinheitBetaEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createEinheitBetaEntry(fields);
      undoToast(`${appLabel('einheit_beta')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <EinheitAlphaDialog
        open={einheitAlphaDialog !== null}
        onClose={() => setEinheitAlphaDialog(null)}
        onSubmit={submitEinheitAlpha}
        defaultValues={einheitAlphaDialog?.defaults}
        recordId={einheitAlphaDialog?.editing?.record_id}
        einheitBetaList={data.einheitBeta}
        enablePhotoScan={AI_PHOTO_SCAN['EinheitAlpha']}
        enablePhotoLocation={AI_PHOTO_LOCATION['EinheitAlpha']}
      />
      <EinheitBetaDialog
        open={einheitBetaDialog !== null}
        onClose={() => setEinheitBetaDialog(null)}
        onSubmit={submitEinheitBeta}
        defaultValues={einheitBetaDialog?.defaults}
        recordId={einheitBetaDialog?.editing?.record_id}
        einheitAlphaList={data.einheitAlpha}
        enablePhotoScan={AI_PHOTO_SCAN['EinheitBeta']}
        enablePhotoLocation={AI_PHOTO_LOCATION['EinheitBeta']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'einheitAlpha') {
            return (
              <>
                <RecordHeader title={top.record.fields.name_alpha ?? appLabel('einheit_alpha')} subtitle={undefined} />
                <EinheitAlphaDetails
                  record={top.record}
                  einheitBetaList={data.einheitBeta}
                  onOpenEinheitBeta={(r) => detailEinheitBeta(r, true)}
                  einheitBetaAlphaEintragList={data.einheitBeta}
                  onOpenEinheitBetaAlphaEintrag={(r) => detailEinheitBeta(r, true)}
                  onAddEinheitBetaAlphaEintrag={() => setEinheitBetaDialog({ defaults: { alpha_eintrag: createRecordUrl(APP_IDS.EINHEIT_ALPHA, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'einheitBeta') {
            return (
              <>
                <RecordHeader title={top.record.fields.name_beta ?? appLabel('einheit_beta')} subtitle={undefined} />
                <EinheitBetaDetails
                  record={top.record}
                  einheitAlphaList={data.einheitAlpha}
                  onOpenEinheitAlpha={(r) => detailEinheitAlpha(r, true)}
                  einheitAlphaBetaEintragList={data.einheitAlpha}
                  onOpenEinheitAlphaBetaEintrag={(r) => detailEinheitAlpha(r, true)}
                  onAddEinheitAlphaBetaEintrag={() => setEinheitAlphaDialog({ defaults: { beta_eintrag: createRecordUrl(APP_IDS.EINHEIT_BETA, top.record.record_id) } })}
                />
              </>
            );
          }
          return null;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'einheitAlpha') setEinheitAlphaDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'einheitBeta') setEinheitBetaDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    einheitAlpha: {
      openCreate: (defaults?: EinheitAlphaDialogDefaults) => setEinheitAlphaDialog({ defaults }),
      openEdit: (record: EinheitAlpha) => setEinheitAlphaDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: EinheitAlpha) => detailEinheitAlpha(record, false),
    },
    einheitBeta: {
      openCreate: (defaults?: EinheitBetaDialogDefaults) => setEinheitBetaDialog({ defaults }),
      openEdit: (record: EinheitBeta) => setEinheitBetaDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: EinheitBeta) => detailEinheitBeta(record, false),
    },
    enriched: { einheitAlpha: enrichedEinheitAlpha, einheitBeta: enrichedEinheitBeta },
  };
}
