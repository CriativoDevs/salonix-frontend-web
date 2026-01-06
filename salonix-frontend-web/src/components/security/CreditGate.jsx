import React from 'react';
import useCreditGate from '../../hooks/useCreditGate';

/**
 * Component to conditionally render children based on credit availability.
 * Usage:
 * <CreditGate action="sms" fallback={<p>Not enough credits</p>}>
 *   <SendSmsButton />
 * </CreditGate>
 */
export function CreditGate({ action, cost, children, fallback }) {
  const { checkCredits } = useCreditGate();
  const allowed = checkCredits(action, cost);

  if (!allowed) {
    return fallback || null;
  }

  return children;
}

export default CreditGate;
