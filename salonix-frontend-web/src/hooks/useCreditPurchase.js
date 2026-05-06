import { useState, useEffect, useCallback } from 'react';
import {
  fetchCreditPackages,
  createCreditCheckoutSession,
} from '../api/credits';
import { useTenant } from './useTenant';
import { isRedirectValidationError, safeRedirect } from '../utils/safeRedirect';

/**
 * Hook para gerenciar compra de créditos.
 */
export default function useCreditPurchase() {
  const { slug } = useTenant();
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPackages = useCallback(async () => {
    if (!slug) return;
    setLoadingPackages(true);
    setError(null);
    try {
      const data = await fetchCreditPackages({ slug });
      setPackages(data);
    } catch (err) {
      console.error('Failed to load credit packages', err);
      setError(err);
    } finally {
      setLoadingPackages(false);
    }
  }, [slug]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const buyPackage = async (amountEur) => {
    if (!slug) return;
    setPurchaseLoading(true);
    setError(null);
    try {
      const { checkout_url } = await createCreditCheckoutSession(amountEur, {
        slug,
      });
      if (checkout_url) {
        safeRedirect(checkout_url);
      } else {
        console.error('[CreditPurchase] No checkout URL returned');
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Failed to start purchase', err);
      if (isRedirectValidationError(err)) {
        setError({
          message:
            'Não foi possível abrir o checkout de créditos com segurança. Tente novamente em instantes.',
          code: err.code,
        });
      } else {
        setError(err);
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

  return {
    packages,
    loadingPackages,
    purchaseLoading,
    error,
    buyPackage,
    refreshPackages: loadPackages,
  };
}
