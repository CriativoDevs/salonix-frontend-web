import React from 'react';
import PullToRefresh from 'react-simple-pull-to-refresh';
import HeaderNav from '../components/ui/HeaderNav';
import MobileNav from '../components/ui/MobileNav';
import Container from '../components/ui/Container';
import OnboardingTour from '../components/onboarding/OnboardingTour';
import CreditAlerts from '../components/credits/CreditAlerts';

export default function FullPageLayout({ children }) {
  const handleRefresh = async () => {
    // Recarrega a página atual de forma suave
    // Páginas individuais podem escutar o evento 'app-refresh' para refetch customizado
    return new Promise((resolve) => {
      window.dispatchEvent(new CustomEvent('app-refresh'));
      // Dar tempo para as páginas reagirem ao evento
      setTimeout(() => {
        resolve();
      }, 500);
    });
  };

  return (
    <div className="min-h-screen min-h-[100dvh] theme-bg-primary theme-text-primary flex flex-col pt-[env(safe-area-inset-top)]">
      <OnboardingTour />
      <HeaderNav />
      <CreditAlerts />
      <PullToRefresh
        onRefresh={handleRefresh}
        pullingContent=""
        refreshingContent={
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
        }
      >
        <main className="py-6 pb-24 overflow-y-auto no-scrollbar">
          <Container>{children}</Container>
        </main>
      </PullToRefresh>

      {/* MobileNav segue a MESMA régua em mobile */}
      <div className="sm:hidden">
        <Container className="px-0">
          <MobileNav />
        </Container>
      </div>
    </div>
  );
}
