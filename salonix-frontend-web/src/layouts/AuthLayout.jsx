import BrandLogo from '../components/ui/BrandLogo';
import { useTenant } from '../hooks/useTenant';
import { resolveTenantAssetUrl } from '../utils/tenant';

export default function AuthLayout({ children }) {
  const { tenant, branding } = useTenant();
  const displayName = tenant?.name || 'TimelyOne';
  const logoUrl = resolveTenantAssetUrl(branding?.logoUrl);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 md:bg-gradient-to-br md:from-brand-100 md:via-brand-50 md:to-white">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <BrandLogo
          className="mb-6"
          name={displayName}
          variant="stacked"
          size={56}
          logoUrl={logoUrl}
        />
        {children}
      </div>
    </div>
  );
}
