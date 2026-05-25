import { useState, useEffect } from 'react';
import { Transaction, Associate } from '../../types';
import { financialService } from '../../services/financial';

export interface FeeRecord {
  id: string;
  associateId: string;
  associateName: string;
  dueDate: string;
  amount: number;
  status: 'LATE' | 'OPEN' | 'PAID' | 'PARTIAL';
  monthRef: string;
}

interface UseFeesDataOptions {
  transactions: Transaction[];
  associates: Associate[];
}

interface UseFeesDataReturn {
  feesList: FeeRecord[];
  overdueFees: FeeRecord[];
  overdueCount: number;
  loading: boolean;
  refreshFees: () => void;
}

const INITIAL_FEES: FeeRecord[] = [];

export const useFeesData = (options: UseFeesDataOptions): UseFeesDataReturn => {
  const { transactions, associates } = options;
  const [feesList, setFeesList] = useState<FeeRecord[]>(INITIAL_FEES);
  const [loading, setLoading] = useState(false);

  const deriveFees = () => {
    const derivedFees: FeeRecord[] = transactions
      .filter(tx => 
        tx.category === 'Mensalidade' || 
        tx.category === 'Mensalidades' || 
        tx.category === 'Taxa de Inscrição' ||
        (tx.category === 'Geral' && tx.description.toLowerCase().includes('mensalidade'))
      )
      .map(tx => {
        const assoc = associates.find(a => a.id === tx.payer_id);
        const dObj = new Date(tx.date + 'T12:00:00');
        const isOverdue = tx.status === 'PENDING' && dObj < new Date();

        let monthRef = 'N/A';
        if (tx.category === 'Taxa de Inscrição') {
          monthRef = 'Inscrição';
        } else {
          try {
            const d = new Date(tx.date + 'T12:00:00'); 
            const m = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            monthRef = m.charAt(0).toUpperCase() + m.slice(1);
          } catch (e) { }
        }

        return {
          id: tx.id,
          associateId: tx.payer_id || '',
          associateName: assoc ? assoc.name : (tx.custom_payer || (tx.description.includes('-') ? tx.description.split('-')[1].trim() : 'Externo')),
          dueDate: tx.date,
          amount: tx.amount,
          status: tx.status === 'COMPLETED' ? 'PAID' : (isOverdue ? 'LATE' : 'OPEN'),
          monthRef: monthRef
        };
      });
    setFeesList(derivedFees);
  };

  useEffect(() => {
    deriveFees();
  }, [transactions, associates]);

  const overdueFees = feesList.filter(f => f.status === 'LATE');
  const overdueCount = overdueFees.length;

  const refreshFees = () => {
    deriveFees();
  };

  return {
    feesList,
    overdueFees,
    overdueCount,
    loading,
    refreshFees
  };
};