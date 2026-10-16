export type FeeStatusType = 'UP_TO_DATE' | 'OPEN' | 'PENDING' | 'LATE';

export interface FeeStatusResult {
  status: FeeStatusType;
  label: string;
  badgeVariant: 'success' | 'info' | 'warning' | 'danger';
  diffDays: number;
}

/**
 * Calcula o status de uma mensalidade de acordo com as regras de negócio:
 * 1. "EM DIA": se o associado fez o pagamento daquele mês (isPaid = true).
 * 2. "A VENCER" / "EM DIA": se ainda faltam mais de 5 dias para o vencimento.
 * 3. "ABERTO": quando faltar 5 dias para o vencimento (até 5 dias após o vencimento).
 * 4. "PENDENTE": após 5 dias após o vencimento (entre 6 e 10 dias após o vencimento).
 * 5. "ATRASADO": após 10 dias após o vencimento (mais de 10 dias após o vencimento).
 */
export function computeFeeStatus(dueDateStr: string, isPaid: boolean): FeeStatusResult {
  if (isPaid) {
    return {
      status: 'UP_TO_DATE',
      label: 'EM DIA',
      badgeVariant: 'success',
      diffDays: 0,
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);

  const cleanDateStr = dueDateStr ? dueDateStr.split('T')[0] : '';
  if (!cleanDateStr) {
    return {
      status: 'OPEN',
      label: 'ABERTO',
      badgeVariant: 'info',
      diffDays: 0,
    };
  }

  const [y, m, d] = cleanDateStr.split('-').map(Number);
  const due = new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);

  // diffDays > 0: já passou da data de vencimento (dias após vencimento)
  // diffDays < 0: antes da data de vencimento (faltam |diffDays| dias)
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Mais de 5 dias antes do vencimento
  if (diffDays < -5) {
    return {
      status: 'UP_TO_DATE',
      label: 'A VENCER',
      badgeVariant: 'info',
      diffDays,
    };
  }

  // Faltando 5 dias para o vencimento até 5 dias após o vencimento
  if (diffDays <= 5) {
    return {
      status: 'OPEN',
      label: 'ABERTO',
      badgeVariant: 'info',
      diffDays,
    };
  }

  // Após 5 dias após o vencimento (6 a 10 dias após o vencimento)
  if (diffDays <= 10) {
    return {
      status: 'PENDING',
      label: 'PENDENTE',
      badgeVariant: 'warning',
      diffDays,
    };
  }

  // Após 10 dias após o vencimento
  return {
    status: 'LATE',
    label: 'ATRASADO',
    badgeVariant: 'danger',
    diffDays,
  };
}

export interface AssociateFeeStatusSummary {
  paymentStatus: FeeStatusType;
  label: string;
  badgeVariant: 'success' | 'info' | 'warning' | 'danger';
  lateCount: number;
  pendingCount: number;
  openCount: number;
}

/**
 * Calcula a situação geral de mensalidade de um associado a partir das suas transações.
 */
export function computeAssociateFeeStatus(
  associateId: string,
  transactions: Array<{ category: string; description: string; payer_id?: string; status: string; date: string }>
): AssociateFeeStatusSummary {
  const fees = transactions.filter(
    (tx) =>
      (tx.category === 'Mensalidade' ||
        tx.category === 'Mensalidades' ||
        (tx.category === 'Geral' && tx.description.toLowerCase().includes('mensalidade'))) &&
      tx.payer_id === associateId
  );

  if (fees.length === 0) {
    return {
      paymentStatus: 'UP_TO_DATE',
      label: 'Em Dia',
      badgeVariant: 'success',
      lateCount: 0,
      pendingCount: 0,
      openCount: 0,
    };
  }

  let lateCount = 0;
  let pendingCount = 0;
  let openCount = 0;

  for (const fee of fees) {
    if (fee.status === 'COMPLETED') continue;

    const res = computeFeeStatus(fee.date, false);
    if (res.status === 'LATE') {
      lateCount++;
    } else if (res.status === 'PENDING') {
      pendingCount++;
    } else if (res.status === 'OPEN') {
      openCount++;
    }
  }

  if (lateCount > 0) {
    return {
      paymentStatus: 'LATE',
      label: 'Atrasado',
      badgeVariant: 'danger',
      lateCount,
      pendingCount,
      openCount,
    };
  }

  if (pendingCount > 0) {
    return {
      paymentStatus: 'PENDING',
      label: 'Pendente',
      badgeVariant: 'warning',
      lateCount,
      pendingCount,
      openCount,
    };
  }

  if (openCount > 0) {
    return {
      paymentStatus: 'OPEN',
      label: 'Aberto',
      badgeVariant: 'info',
      lateCount,
      pendingCount,
      openCount,
    };
  }

  return {
    paymentStatus: 'UP_TO_DATE',
    label: 'Em Dia',
    badgeVariant: 'success',
    lateCount,
    pendingCount,
    openCount,
  };
}
