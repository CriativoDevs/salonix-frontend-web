import { useCallback } from 'react';
import useCreditBalance from './useCreditBalance';

const ACTION_COSTS = {
  sms: 1,
  whatsapp: 1,
  marketing: 5,
  default: 1
};

/**
 * Hook to check if the user has enough credits for specific actions.
 * Centralizes the logic for "Credit Gating".
 */
export default function useCreditGate() {
  const { balance, loading, refresh } = useCreditBalance();

  /**
   * Checks if there are enough credits for a given action.
   * @param {string} action - The action type (sms, whatsapp, marketing, etc.)
   * @param {number} [customCost] - Optional custom cost
   * @returns {boolean} - True if allowed (or loading), false if insufficient funds
   */
  const checkCredits = useCallback((action = 'default', customCost) => {
    // If we don't have balance data yet, we treat it as 0
    const currentBalance = balance?.current_balance || 0;
    const cost = customCost ?? (ACTION_COSTS[action] || ACTION_COSTS.default);
    
    return currentBalance >= cost;
  }, [balance]);

  /**
   * Returns the cost for a given action
   */
  const getCost = useCallback((action = 'default') => {
    return ACTION_COSTS[action] || ACTION_COSTS.default;
  }, []);

  return {
    balance: balance?.current_balance || 0,
    loading,
    checkCredits,
    getCost,
    refresh
  };
}
