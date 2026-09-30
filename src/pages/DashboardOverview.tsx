import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { useState, useMemo } from 'react';
import { tx, appLabel } from '@/i18n';
import { gruss, useClock, namen, undoToast } from '@/lib/polish';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { ChartWidget } from '@/components/widgets/ChartWidget';
import type { ChartRow } from '@/components/widgets/ChartWidget';
import {
  IconLink,
  IconLinkOff,
  IconCirclePlus,
  IconAlertTriangle,
  IconRefresh,
} from '@tabler/icons-react';
import { extractRecordId } from '@/services/livingAppsService';
import type { EnrichedEinheitAlpha, EnrichedEinheitBeta } from '@/types/enriched';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { einheitAlpha, einheitBeta, einheitAlphaMap, einheitBetaMap } = data;

  const crud = useEntityCrud(data);
  const enrichedEinheitAlpha = crud.enriched.einheitAlpha;
  const enrichedEinheitBeta = crud.enriched.einheitBeta;

  const clock = useClock();

  // --- Filter state ---
  const [filterLinked, setFilterLinked] = useState<'all' | 'linked' | 'unlinked'>('all');

  // --- Derived stats ---
  const alphaLinked = useMemo(
    () => enrichedEinheitAlpha.filter(r => !!r.fields.beta_eintrag),
    [enrichedEinheitAlpha]
  );
  const alphaUnlinked = useMemo(
    () => enrichedEinheitAlpha.filter(r => !r.fields.beta_eintrag),
    [enrichedEinheitAlpha]
  );
  const betaLinked = useMemo(
    () => enrichedEinheitBeta.filter(r => !!r.fields.alpha_eintrag),
    [enrichedEinheitBeta]
  );
  const betaUnlinked = useMemo(
    () => enrichedEinheitBeta.filter(r => !r.fields.alpha_eintrag),
    [enrichedEinheitBeta]
  );

  // Unlinked records that need attention (neither side linked)
  const fullyOrphaned = useMemo(() => {
    const orphanedAlphaNames = alphaUnlinked.map(r => r.fields.name_alpha ?? '').filter(Boolean);
    const orphanedBetaNames = betaUnlinked.map(r => r.fields.name_beta ?? '').filter(Boolean);
    return { alpha: alphaUnlinked, beta: betaUnlinked, alphaNames: orphanedAlphaNames, betaNames: orphanedBetaNames };
  }, [alphaUnlinked, betaUnlinked]);

  // Total unlinked for hero signal
  const totalUnlinked = fullyOrphaned.alpha.length + fullyOrphaned.beta.length;

  // --- Filtered lists ---
  const filteredAlpha = useMemo((): EnrichedEinheitAlpha[] => {
    if (filterLinked === 'linked') return alphaLinked;
    if (filterLinked === 'unlinked') return alphaUnlinked;
    return enrichedEinheitAlpha;
  }, [filterLinked, enrichedEinheitAlpha, alphaLinked, alphaUnlinked]);

  const filteredBeta = useMemo((): EnrichedEinheitBeta[] => {
    if (filterLinked === 'linked') return betaLinked;
    if (filterLinked === 'unlinked') return betaUnlinked;
    return enrichedEinheitBeta;
  }, [filterLinked, enrichedEinheitBeta, betaLinked, betaUnlinked]);

  // --- Context line ---
  const contextLine = useMemo(() => {
    const totalAlpha = enrichedEinheitAlpha.length;
    const totalBeta = enrichedEinheitBeta.length;
    if (totalAlpha === 0 && totalBeta === 0) {
      return tx('Noch keine Einträge vorhanden — lege die ersten Einheiten an.');
    }
    const linkedCount = alphaLinked.length;
    const unlinkedAlphaNames = fullyOrphaned.alphaNames.slice(0, 2);
    const unlinkedBetaNames = fullyOrphaned.betaNames.slice(0, 2);
    const allUnlinkedNames = [...unlinkedAlphaNames, ...unlinkedBetaNames];
    if (allUnlinkedNames.length > 0) {
      return tx`${namen(allUnlinkedNames)} noch nicht verknüpft — ${linkedCount} von ${totalAlpha} Alpha-Einheiten verbunden.`;
    }
    return tx`Alle ${linkedCount} Alpha-Einheiten sind verknüpft — ${totalBeta} Beta-Einheiten im System.`;
  }, [enrichedEinheitAlpha, enrichedEinheitBeta, alphaLinked, fullyOrphaned]);

  // --- Chart rows: linked status of Alpha ---
  type AlphaChartData = { linked: string };
  const alphaChartRows: ChartRow<AlphaChartData>[] = useMemo(
    () =>
      enrichedEinheitAlpha.map(r => ({
        id: `einheit_alpha:${r.record_id}`,
        data: { linked: r.fields.beta_eintrag ? tx('Verknüpft') : tx('Nicht verknüpft') },
      })),
    [enrichedEinheitAlpha]
  );

  // --- Hero action: link first orphaned alpha to first orphaned beta ---
  const heroAction = useMemo(() => {
    if (fullyOrphaned.alpha.length === 0 || fullyOrphaned.beta.length === 0) return undefined;
    const alphaRec = fullyOrphaned.alpha[0];
    const betaRec = fullyOrphaned.beta[0];
    return {
      label: tx('Verknüpfung herstellen'),
      onClick: () => crud.einheitAlpha.openEdit(alphaRec),
    };
  }, [fullyOrphaned, crud]);

  // Empty state for when there are no records at all
  const isEmpty = enrichedEinheitAlpha.length === 0 && enrichedEinheitBeta.length === 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground truncate">
            {gruss(clock)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{contextLine}</p>
        </div>
        <button
          onClick={() => crud.einheitAlpha.openCreate({})}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <IconCirclePlus size={16} className="shrink-0" />
          {tx('Neue Alpha')}
        </button>
      </div>

      {isEmpty ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 gap-4 text-center px-4">
          <IconLink size={48} className="text-muted-foreground" stroke={1.5} />
          <div>
            <h2 className="text-lg font-semibold text-foreground">{tx('Zyklische Verknüpfungen einrichten')}</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              {tx('Erstelle Alpha- und Beta-Einheiten und verknüpfe sie gegenseitig miteinander.')}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => crud.einheitAlpha.openCreate({})}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <IconCirclePlus size={16} className="shrink-0" />
              {tx('Erste Alpha anlegen')}
            </button>
            <button
              onClick={() => crud.einheitBeta.openCreate({})}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <IconCirclePlus size={16} className="shrink-0" />
              {tx('Erste Beta anlegen')}
            </button>
          </div>
        </div>
      ) : (
        <DashboardGrid
          variant="wide"
          hero={
            totalUnlinked > 0 && heroAction ? (
              <HeroBanner
                icon={<IconAlertTriangle size={18} />}
                action={heroAction}
              >
                {tx`${namen([...fullyOrphaned.alphaNames, ...fullyOrphaned.betaNames])} noch nicht verknüpft — ${totalUnlinked} Einheit${totalUnlinked === 1 ? '' : 'en'} ohne Gegenstück.`}
              </HeroBanner>
            ) : undefined
          }
          kpis={
            <StatStrip>
              <StatStripItem
                title={tx('Alpha gesamt')}
                value={enrichedEinheitAlpha.length}
                icon={<IconLink size={16} />}
              />
              <StatStripItem
                title={tx('Alpha verknüpft')}
                value={alphaLinked.length}
                tone={alphaLinked.length === enrichedEinheitAlpha.length && enrichedEinheitAlpha.length > 0 ? 'success' : 'default'}
                icon={<IconLink size={16} />}
                onClick={() => setFilterLinked(f => f === 'linked' ? 'all' : 'linked')}
                active={filterLinked === 'linked'}
              />
              <StatStripItem
                title={tx('Ohne Verknüpfung')}
                value={alphaUnlinked.length + betaUnlinked.length}
                tone={alphaUnlinked.length + betaUnlinked.length > 0 ? 'warning' : 'default'}
                icon={<IconLinkOff size={16} />}
                onClick={() => setFilterLinked(f => f === 'unlinked' ? 'all' : 'unlinked')}
                active={filterLinked === 'unlinked'}
              />
              <StatStripItem
                title={tx('Beta gesamt')}
                value={enrichedEinheitBeta.length}
                icon={<IconLink size={16} />}
              />
            </StatStrip>
          }
          primary={
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Alpha list */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <h2 className="text-base font-semibold text-foreground">{appLabel('einheit_alpha')}</h2>
                  <button
                    onClick={() => crud.einheitAlpha.openCreate({})}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    <IconCirclePlus size={14} className="shrink-0" />
                    {tx('Neu')}
                  </button>
                </div>
                {filteredAlpha.length === 0 ? (
                  <div className="px-4 pb-6 pt-2 text-sm text-muted-foreground text-center">
                    {filterLinked === 'unlinked'
                      ? tx('Alle Alpha-Einheiten sind verknüpft.')
                      : tx('Noch keine Alpha-Einheiten vorhanden.')}
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {filteredAlpha.map(r => {
                      const isLinked = !!r.fields.beta_eintrag;
                      return (
                        <li
                          key={r.record_id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => crud.einheitAlpha.openDetail(r)}
                        >
                          <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isLinked ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                            {isLinked
                              ? <IconLink size={14} className="text-emerald-600" />
                              : <IconLinkOff size={14} className="text-amber-600" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-foreground">
                              {r.fields.name_alpha ?? tx('Ohne Namen')}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {isLinked
                                ? tx`→ ${r.beta_eintragName || tx('Beta-Eintrag')}`
                                : <span className="text-amber-600">{tx('Nicht verknüpft')}</span>}
                            </div>
                          </div>
                          {!isLinked && (
                            <span
                              role="button"
                              className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                              onClick={e => { e.stopPropagation(); crud.einheitAlpha.openEdit(r); }}
                            >
                              <IconLink size={12} />
                              {tx('Verknüpfen')}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Beta list */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <h2 className="text-base font-semibold text-foreground">{appLabel('einheit_beta')}</h2>
                  <button
                    onClick={() => crud.einheitBeta.openCreate({})}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    <IconCirclePlus size={14} className="shrink-0" />
                    {tx('Neu')}
                  </button>
                </div>
                {filteredBeta.length === 0 ? (
                  <div className="px-4 pb-6 pt-2 text-sm text-muted-foreground text-center">
                    {filterLinked === 'unlinked'
                      ? tx('Alle Beta-Einheiten sind verknüpft.')
                      : tx('Noch keine Beta-Einheiten vorhanden.')}
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {filteredBeta.map(r => {
                      const isLinked = !!r.fields.alpha_eintrag;
                      return (
                        <li
                          key={r.record_id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => crud.einheitBeta.openDetail(r)}
                        >
                          <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isLinked ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                            {isLinked
                              ? <IconLink size={14} className="text-emerald-600" />
                              : <IconLinkOff size={14} className="text-amber-600" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-foreground">
                              {r.fields.name_beta ?? tx('Ohne Namen')}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {isLinked
                                ? tx`→ ${r.alpha_eintragName || tx('Alpha-Eintrag')}`
                                : <span className="text-amber-600">{tx('Nicht verknüpft')}</span>}
                            </div>
                          </div>
                          {!isLinked && (
                            <span
                              role="button"
                              className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                              onClick={e => { e.stopPropagation(); crud.einheitBeta.openEdit(r); }}
                            >
                              <IconLink size={12} />
                              {tx('Verknüpfen')}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          }
          aside={
            <>
              <WorkList
                title={tx('Unverknüpfte Alpha')}
                items={alphaUnlinked.map(r => ({
                  id: r.record_id,
                  title: r.fields.name_alpha ?? tx('Ohne Namen'),
                  secondLine: (
                    <span className="font-medium text-amber-600">{tx('Kein Beta-Eintrag')}</span>
                  ),
                  action: {
                    label: tx('Verknüpfen'),
                    onClick: () => crud.einheitAlpha.openEdit(r),
                  },
                }))}
                onItemClick={id => {
                  const rec = enrichedEinheitAlpha.find(r => r.record_id === id);
                  if (rec) crud.einheitAlpha.openDetail(rec);
                }}
                empty={{
                  text: tx('Alle Alpha-Einheiten sind verknüpft.'),
                  action: { label: tx('Neue Alpha anlegen'), onClick: () => crud.einheitAlpha.openCreate({}) },
                }}
              />
              <ChartWidget
                title={tx('Verknüpfungsstatus Alpha')}
                rows={alphaChartRows}
                dimension={{
                  kind: 'category',
                  accessor: (row: ChartRow<AlphaChartData>) => row.data.linked,
                  mark: 'donut',
                }}
              />
            </>
          }
        />
      )}

      {crud.surfaces}
    </div>
  );
}
