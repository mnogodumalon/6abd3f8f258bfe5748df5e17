/**
 * Beta mit Alpha verknüpfen — 3-Schritt-Wizard.
 * Steps: 1) Alpha-Eintrag wählen → 2) Beta-Details eingeben → 3) Prüfen & anlegen.
 * Reads: einheit_alpha. Writes: einheit_beta (mit Verknüpfung auf einheit_alpha).
 * Composes: IntentWizardShell, WizardStep, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { useRecordSearch, useStepForm, useJourneySubmit, fieldText } from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';

export default function BetaMitAlphaVerknuepfenPage() {
  const [step, setStep] = useState(1);

  const alphaSearch = useRecordSearch(servicePort, 'einheit_alpha', {
    searchFields: ['name_alpha'],
    toItem: a => ({
      id: a.id,
      title: fieldText(a, 'name_alpha'),
      subtitle: fieldText(a, 'beschreibung_alpha') || undefined,
    }),
  });

  const betaForm = useStepForm('einheit_beta', {
    fields: ['name_beta', 'beschreibung_beta'],
    steps: { name_beta: 2, beschreibung_beta: 2 },
    messages: {
      name_beta: tx('Bitte einen Namen eingeben.'),
    },
  });

  const submit = useJourneySubmit(servicePort, [
    {
      key: 'beta',
      entity: 'einheit_beta',
      form: betaForm,
      primary: true,
      values: (_ctx) => ({
        alpha_eintrag: betaForm.get('alpha_eintrag') as string ?? undefined,
      }),
    },
  ], { draftKey: 'beta-mit-alpha' });

  return (
    <IntentWizardShell
      title={tx('Beta mit Alpha verknüpfen')}
      subtitle={tx('Neuen Beta-Eintrag anlegen und einen Alpha-Eintrag verknüpfen.')}
      currentStep={step}
      onStepChange={setStep}
      forms={[betaForm]}
      draftKey="beta-mit-alpha"
      intro={{
        description: tx('Einen neuen Einheit-Beta-Eintrag anlegen und dabei einen vorhandenen Einheit-Alpha-Eintrag verknüpfen.'),
        needs: [tx('Einen vorhandenen Alpha-Eintrag'), tx('Name für den neuen Beta-Eintrag')],
      }}
    >
      <WizardStep
        label={tx('Alpha-Eintrag wählen')}
        description={tx('Wähle den Alpha-Eintrag aus, der mit dem neuen Beta-Eintrag verknüpft werden soll.')}
      >
        <EntitySelectStep
          {...alphaSearch.select}
          selectedId={betaForm.get('alpha_eintrag') as string | null}
          onSelect={id => {
            betaForm.set('alpha_eintrag', id, alphaSearch.labelOf(id));
            setStep(2);
          }}
          searchPlaceholder={tx('Alpha-Einträge suchen ...')}
          avatar="none"
        />
      </WizardStep>

      <WizardStep
        label={tx('Beta-Details')}
        description={tx('Name und Beschreibung für den neuen Beta-Eintrag eingeben.')}
        needs={['alpha_eintrag']}
      >
        <div className="space-y-4">
          <Bound form={betaForm} name="name_beta" label={tx('Name')} />
          <Bound form={betaForm} name="beschreibung_beta" label={tx('Beschreibung')} rows={3} />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => betaForm.validate(['name_beta'])}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>

      <WizardStep label={tx('Prüfen & Anlegen')}>
        {!submit.done && (
          <SummaryStep
            forms={[betaForm]}
            submit={submit}
            items={[
              {
                key: 'alpha_eintrag',
                label: tx('Verknüpfter Alpha-Eintrag'),
                value: alphaSearch.labelOf(betaForm.get('alpha_eintrag') as string) ?? '—',
                step: 1,
              },
            ]}
            whatHappensNext={tx('Der neue Beta-Eintrag wird angelegt und mit dem gewählten Alpha-Eintrag verknüpft.')}
          />
        )}
        {submit.result && (
          <SuccessStep
            result={submit.result}
            forms={[betaForm]}
            submit={submit}
            whatHappensNext={tx('Der Beta-Eintrag ist jetzt mit dem Alpha-Eintrag verknüpft.')}
            next={[
              { label: tx('Alpha verknüpfen'), href: '#/intents/alpha-mit-beta' },
              { label: tx('Zum Dashboard'), href: '#/' },
            ]}
          />
        )}
      </WizardStep>
    </IntentWizardShell>
  );
}
