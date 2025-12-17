import React from 'react';
import HeaderNav from '../components/ui/HeaderNav';
import MobileNav from '../components/ui/MobileNav';
import Container from '../components/ui/Container';
import OnboardingTour from '../components/onboarding/OnboardingTour';

export default function FullPageLayout({ children }) {
  return (
    <div className="min-h-screen theme-bg-primary theme-text-primary">
      <OnboardingTour />
      <HeaderNav />
      <main className="py-6 pb-24 overflow-y-auto no-scrollbar">
        <Container>{children}</Container>
      </main>

      {/* MobileNav segue a MESMA régua em mobile */}
      <div className="sm:hidden">
        <Container className="px-0">
          <MobileNav />
        </Container>
      </div>
    </div>
  );
}
