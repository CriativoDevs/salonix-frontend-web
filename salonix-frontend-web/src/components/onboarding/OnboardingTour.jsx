import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { updateCurrentUser } from '../../api/auth';

const TOUR_VERSION = 'v1';

function isMobileViewport() {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }
  return window.matchMedia('(max-width: 767px)').matches;
}

function buildTourStorageKey(user, tenantSlug) {
  const userId = user?.id || user?.pk || user?.email || 'anonymous';
  const slug = tenantSlug || 'global';
  return `onboarding_tour_completed:${TOUR_VERSION}:${slug}:${userId}`;
}

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
  const { slug } = useTenant();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);
  const [isMobile, setIsMobile] = useState(isMobileViewport);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const mobileTourSteps = [
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
          'Este e o seu painel principal. Aqui voce acompanha o que ja foi configurado e o que falta ativar.'
        ),
      },
      {
        target: '[data-tour="nav-slots"]',
        content: t(
          'tour.setup_slots',
          'Proximo passo: defina horarios disponiveis para abrir a agenda ao publico.'
        ),
      },
      {
        target: '[data-tour="nav-bookings"]',
        content: t(
          'tour.first_booking',
          'Depois dos horarios, crie o primeiro agendamento para validar o fluxo completo.'
        ),
      },
      {
        target: '[data-tour="nav-more"]',
        content: t(
          'tour.more_setup',
          'No menu Mais voce acessa Servicos, Equipe, Configuracoes e Planos para concluir a configuracao inicial.'
        ),
      },
    ];

    const desktopTourSteps = [
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
          'Este e o seu painel principal. Aqui voce acompanha o que ja foi configurado e o que falta ativar.'
        ),
      },
      {
        target: '[data-tour="nav-services"]',
        content: t(
          'tour.setup_service',
          'Primeiro passo: cadastre pelo menos um servico com preco e duracao.'
        ),
      },
      {
        target: '[data-tour="nav-slots"]',
        content: t(
          'tour.setup_slots',
          'Segundo passo: defina horarios disponiveis para abrir a agenda ao publico.'
        ),
      },
      {
        target: '[data-tour="nav-bookings"]',
        content: t(
          'tour.first_booking',
          'Terceiro passo: crie o primeiro agendamento para validar o fluxo completo.'
        ),
      },
      {
        target: '[data-tour="nav-team"]',
        content: t(
          'tour.invite_team',
          'Se houver equipe, convide os profissionais e ajuste as permissoes de acesso.'
        ),
      },
      {
        target: '[data-tour="nav-more"]',
        content: t(
          'tour.more_setup',
          'No menu Mais voce acessa Configuracoes, Relatorios e Planos para concluir a configuracao inicial.'
        ),
      },
    ];

    const rawSteps = isMobile ? mobileTourSteps : desktopTourSteps;
    const filteredSteps = rawSteps.filter((step) => {
      if (step.target === 'body') {
        return true;
      }
      if (typeof document === 'undefined') {
        return false;
      }
      return Boolean(document.querySelector(step.target));
    });

    setSteps(filteredSteps);
  }, [isMobile, t]);

  useEffect(() => {
    if (!user || typeof window === 'undefined') {
      setRun(false);
      return;
    }

    if (window.location.pathname !== '/dashboard') {
      setRun(false);
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(user, 'onboarding_status')) {
      setRun(false);
      return;
    }

    const storageKey = buildTourStorageKey(user, slug);
    const localCompleted = window.localStorage.getItem(storageKey) === 'true';
    const status = user.onboarding_status || {};

    if (status.tour_completed && !localCompleted) {
      window.localStorage.setItem(storageKey, 'true');
    }

    const canRun =
      !status.tour_completed && !localCompleted && steps.length > 0;

    if (!canRun) {
      setRun(false);
      return;
    }

    const timer = setTimeout(() => setRun(true), 1200);
    return () => clearTimeout(timer);
  }, [user, slug, steps]);

  const handleJoyrideCallback = async (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);

      if (typeof window !== 'undefined' && user) {
        const storageKey = buildTourStorageKey(user, slug);
        window.localStorage.setItem(storageKey, 'true');
      }

      try {
        await updateCurrentUser({
          onboarding_status: { tour_completed: true },
        });

        if (refreshUser) {
          await refreshUser();
        }
      } catch (error) {
        console.error('Failed to update onboarding status', error);
      }
    }
  };

  if (!run || steps.length === 0) return null;

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
