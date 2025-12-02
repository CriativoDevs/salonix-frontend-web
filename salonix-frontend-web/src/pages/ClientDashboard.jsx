import ClientLayout from '../layouts/ClientLayout';
import PageHeader from '../components/ui/PageHeader';

export default function ClientDashboard() {
  return (
    <ClientLayout>
      <PageHeader title="Área do Cliente" subtitle="Sessão ativa" />
      <div className="mt-6 text-sm text-brand-surfaceForeground">
        Bem-vindo! Sua sessão de cliente está ativa.
      </div>
    </ClientLayout>
  );
}
