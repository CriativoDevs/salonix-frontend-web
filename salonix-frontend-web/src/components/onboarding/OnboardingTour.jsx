import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { updateCurrentUser } from '../../api/auth';

function CustomTooltip({
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  isLastStep,
}) {
  const { t } = useTranslation();
  return (
    <div className="bg-brand-surface p-6 rounded-xl shadow-2xl max-w-md border border-brand-border relative">
      {step.title && (
        <h3 className="text-lg font-bold text-brand-foreground mb-2">
          {step.title}
        </h3>
      )}
      <div className="text-brand-foreground mb-6 leading-relaxed">
        {step.content}
      </div>
      <div className="flex items-center justify-between mt-4">
        <button
          {...skipProps}
          className="text-brand-foreground/60 hover:text-brand-foreground text-sm font-medium transition-colors"
        >
          {t('common.skip', 'Pular')}
        </button>
        <div className="flex items-center gap-4">
          {index > 0 && (
            <button
              {...backProps}
              className="text-brand-primary hover:text-brand-primary/80 text-sm font-medium transition-colors"
            >
              {t('common.back', 'Voltar')}
            </button>
          )}
          <button
            {...primaryProps}
            className="text-brand-primary font-bold text-sm hover:underline transition-all"
          >
            {isLastStep
              ? t('common.finish', 'Concluir')
              : t('common.next', 'Próximo')}
          </button>
        </div>
      </div>
      <div className="absolute top-4 right-4 text-xs text-brand-foreground/30 font-mono">
        {index + 1}
      </div>
    </div>
  );
}

export default function OnboardingTour() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    // Definir passos
    const tourSteps = [
      {
        target: 'body',
        content: t(
          'tour.welcome',
          'Bem-vindo ao TimelyOne! Vamos fazer um tour rápido pela plataforma.'
        ),
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '[data-tour="nav-dashboard"]',
        content: t(
          'tour.dashboard',
          'Esta é a sua Dashboard. Aqui você terá uma visão geral do seu negócio.'
        ),
      },
      {
        target: '[data-tour="nav-slots"]',
        content: t(
          'tour.slots',
          'Gerencie seus horários disponíveis e bloqueios aqui.'
        ),
      },
      {
        target: '[data-tour="nav-bookings"]',
        content: t(
          'tour.bookings',
          'Acompanhe e gerencie todos os agendamentos.'
        ),
      },
      {
        target: '[data-tour="nav-customers"]',
        content: t('tour.customers', 'Cadastre e fidelize seus clientes aqui.'),
      },
      {
        target: '[data-tour="nav-more"]',
        content: t(
          'tour.more',
          'Acesse Configurações, Relatórios e Planos neste menu.'
        ),
      },
    ];

    setSteps(tourSteps);
  }, [t]);

  useEffect(() => {
    // Se o usuário não tiver status de onboarding ou não tiver completado o tour
    if (user) {
      const status = user.onboarding_status || {};
      if (!status.tour_completed) {
        // Pequeno delay para garantir renderização do DOM
        const timer = setTimeout(() => setRun(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleJoyrideCallback = async (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      // Persistir conclusão
      try {
        await updateCurrentUser({
          onboarding_status: { tour_completed: true },
        });
        // Atualizar contexto local para evitar reaparecimento
        if (refreshUser) {
          await refreshUser();
        }
      } catch (error) {
        console.error('Failed to update onboarding status', error);
      }
    }
  };

  if (!run) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
      floaterProps={{
        hideArrow: true,
      }}
    />
  );
}
