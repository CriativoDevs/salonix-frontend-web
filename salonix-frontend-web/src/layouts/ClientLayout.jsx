import ClientHeaderNav from '../components/ui/ClientHeaderNav';
import ClientMobileNav from '../components/ui/ClientMobileNav';
import Container from '../components/ui/Container';

export default function ClientLayout({ children }) {
  return (
    <div className="min-h-screen theme-bg-primary theme-text-primary">
      <ClientHeaderNav />
      <main className="py-6 pb-24 overflow-y-auto no-scrollbar">
        <Container>{children}</Container>
      </main>
      <div className="sm:hidden">
        <Container className="px-0">
          <ClientMobileNav />
        </Container>
      </div>
    </div>
  );
}
