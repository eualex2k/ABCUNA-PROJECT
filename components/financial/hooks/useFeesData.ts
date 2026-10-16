import { useState, useEffect } from 'react';
import { Transaction, Associate } from '../../../types';
import { financialService } from '../../../services/financial';
import { computeFeeStatus } from '../../../services/feeStatus';

export interface FeeRecord {
  id: string;
  associateId: string;
  associateName: string;
  dueDate: string;
  amount: number;
  status: 'LATE' | 'OPEN' | 'PAID' | 'PENDING' | 'PARTIAL';
  statusLabel?: string;
  badgeVariant?: 'success' | 'info' | 'warning' | 'danger';
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
      .filter(
        (tx) =>
          tx.category === 'Mensalidade' ||
          tx.category === 'Mensalidades' ||
          (tx.category === 'Geral' &&
            tx.description.toLowerCase().includes('mensalidade'))
      )
      .map((tx) => {
        const assoc = associates.find((a) => a.id === tx.payer_id);
        const isPaid = tx.status === 'COMPLETED';
        const statusInfo = computeFeeStatus(tx.date, isPaid);

        let monthRef = 'N/A';
        try {
          const d = new Date(tx.date + 'T12:00:00');
          const m = d.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric',
          });
          monthRef = m.charAt(0).toUpperCase() + m.slice(1);
        } catch (e) {
          monthRef = 'N/A';
        }

        return {
          id: tx.id,
          associateId: tx.payer_id || '',
          associateName: assoc
            ? assoc.name
            : tx.custom_payer ||
              (tx.description.includes('-')
                ? tx.description.split('-')[1].trim()
                : 'Externo'),
          dueDate: tx.date,
          amount: tx.amount,
          status: isPaid ? 'PAID' : (statusInfo.status as 'LATE' | 'OPEN' | 'PENDING'),
          statusLabel: statusInfo.label,
          badgeVariant: statusInfo.badgeVariant,
          monthRef: monthRef,
        };
      });
    setFeesList(derivedFees);
  };

  useEffect(() => {
    deriveFees();
  }, [transactions, associates]);

  const overdueFees = feesList.filter((f) => f.status === 'LATE' || f.status === 'PENDING');
  const overdueCount = overdueFees.length;

  const refreshFees = () => {
    deriveFees();
  };

  return {
    feesList,
    overdueFees,
    overdueCount,
    loading,
    refreshFees,
  };
};
