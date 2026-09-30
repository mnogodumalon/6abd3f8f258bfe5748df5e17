/**
 * Alpha mit Beta verknüpfen — 3-Schritt-Wizard.
 * Steps: 1) Beta-Eintrag wählen → 2) Alpha-Details eingeben → 3) Prüfen & anlegen.
 * Reads: einheit_beta. Writes: einheit_alpha (mit beta_eintrag-Verknüpfung).
 * Composes: IntentWizardShell, WizardStep, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { useStepForm, useJourneySubmit, useRecordSearch, fieldText } from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';

export default function AlphaMitBetaVerknuepfenPage() {
  const [step, setStep] = useState(1);

  const beta = useRecordSearch(servicePort, 'einheit_beta', {
    searchFields: ['name_beta'],
    toItem: b => ({
      id: b.id,
      title: fieldText(b, 'name_beta'),
      subtitle: fieldText(b, 'beschreibung_beta') || undefined,
    }),
  });

  const alpha = useStepForm('einheit_alpha', {
    fields: ['name_alpha', 'beschreibung_alpha', 'beta_eintrag'],
    steps: { beta_eintrag: 1, name_alpha: 2, beschreibung_alpha: 2 },
    messages: { name_alpha: tx('Bitte einen Namen eingeben.') },
  });

  const submit = useJourneySubmit(servicePort, [
    { key: 'alpha', entity: 'einheit_alpha', form: alpha, primary: true },
  ], { draftKey: 'alpha-mit-beta' });

  return (
    <IntentWizardShell
      title={tx('Alpha mit Beta verknüpfen')}
      currentStep={step}
      onStepChange={setStep}
      forms={[alpha]}
      draftKey="alpha-mit-beta"
      intro={{
        description: tx('Einen neuen Alpha-Eintrag anlegen und mit einem vorhandenen Beta-Eintrag verknüpfen.'),
        needs: [tx('Vorhandener Beta-Eintrag'), tx('Name für den neuen Alpha-Eintrag')],
      }}
    >
      <WizardStep
        label={tx('Beta-Eintrag wählen')}
        description={tx('Wähle den Beta-Eintrag aus, der mit dem neuen Alpha-Eintrag verknüpft werden soll.')}
      >
        <EntitySelectStep
          {...beta.select}
          selectedId={alpha.get('beta_eintrag') as string}
          onSelect={id => {
            alpha.set('beta_eintrag', id, beta.labelOf(id));
            setStep(2);
          }}
          searchPlaceholder={tx('Beta-Eintrag suchen …')}
          avatar="none"
        />
      </WizardStep>

      <WizardStep
        label={tx('Alpha-Details')}
        description={tx('Gib die Details für den neuen Alpha-Eintrag ein.')}
        needs={['beta_eintrag']}
      >
        <div className="space-y-4">
          <Bound form={alpha} name="name_alpha" label={tx('Name')} />
          <Bound form={alpha} name="beschreibung_alpha" label={tx('Beschreibung')} rows={3} />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => alpha.validate(['name_alpha'])}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen & Anlegen')}>
        {!submit.done && (
          <SummaryStep
            forms={[alpha]}
            submit={submit}
            whatHappensNext={tx('Der neue Alpha-Eintrag wird angelegt und mit dem gewählten Beta-Eintrag verknüpft.')}
          />
        )}
      </WizardStep>

      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[alpha]}
          submit={submit}
          next={[
            { label: tx('Beta verknüpfen'), href: '#/intents/beta-mit-alpha' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Der Alpha-Eintrag ist jetzt mit dem Beta-Eintrag verknüpft.')}
        />
      )}
    </IntentWizardShell>
  );
}
