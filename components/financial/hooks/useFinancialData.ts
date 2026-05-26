import { useState, useEffect } from 'react';
import { Transaction, Associate } from '../../../types';
import { financialService } from '../../../services/financial';
import { associatesService } from '../../../services/associates';

interface UseFinancialDataOptions {
  user: any;
}

interface UseFinancialDataReturn {
  transactions: Transaction[];
  associates: Associate[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  canEdit: boolean;
  canExport: boolean;
}

export const useFinancialData = (options: UseFinancialDataOptions): UseFinancialDataReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = options;

  const canEdit = [user?.role].includes('ADMIN') || [user?.role].includes('FINANCIAL');
  const canExport = [user?.role].includes('ADMIN') || [user?.role].includes('FINANCIAL');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [transactionsData, associatesData] = await Promise.all([
        financialService.getAll(),
        associatesService.getAll()
      ]);
      
      setTransactions(transactionsData);
      setAssociates(associatesData);
    } catch (err: any) {
      console.error('Failed to load financial data:', err);
      setError(err.message || 'Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    transactions,
    associates,
    loading,
    error,
    refreshData: loadData,
    canEdit,
    canExport
  };
};