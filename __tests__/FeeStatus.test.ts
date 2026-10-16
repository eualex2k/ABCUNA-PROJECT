import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeFeeStatus, computeAssociateFeeStatus } from '../services/feeStatus';

describe('Fee Status Business Rules', () => {
  beforeEach(() => {
    // Mock today's date as 2026-10-15
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve retornar EM DIA se a mensalidade estiver paga', () => {
    const result = computeFeeStatus('2026-10-01', true);
    expect(result.status).toBe('UP_TO_DATE');
    expect(result.label).toBe('EM DIA');
    expect(result.badgeVariant).toBe('success');
  });

  it('deve retornar A VENCER se faltarem mais de 5 dias para o vencimento', () => {
    // Hoje = 15/10, Vencimento = 25/10 (faltam 10 dias)
    const result = computeFeeStatus('2026-10-25', false);
    expect(result.status).toBe('UP_TO_DATE');
    expect(result.label).toBe('A VENCER');
  });

  it('deve retornar ABERTO quando faltar 5 dias para o vencimento', () => {
    // Hoje = 15/10, Vencimento = 20/10 (faltam exatamente 5 dias)
    const result = computeFeeStatus('2026-10-20', false);
    expect(result.status).toBe('OPEN');
    expect(result.label).toBe('ABERTO');
    expect(result.badgeVariant).toBe('info');
  });

  it('deve retornar ABERTO no dia do vencimento', () => {
    // Hoje = 15/10, Vencimento = 15/10
    const result = computeFeeStatus('2026-10-15', false);
    expect(result.status).toBe('OPEN');
    expect(result.label).toBe('ABERTO');
  });

  it('deve retornar ABERTO até 5 dias após o vencimento', () => {
    // Hoje = 15/10, Vencimento = 10/10 (venceu há 5 dias)
    const result = computeFeeStatus('2026-10-10', false);
    expect(result.status).toBe('OPEN');
    expect(result.label).toBe('ABERTO');
  });

  it('deve retornar PENDENTE após 5 dias após o vencimento (entre 6 e 10 dias)', () => {
    // Hoje = 15/10, Vencimento = 09/10 (venceu há 6 dias)
    const result6 = computeFeeStatus('2026-10-09', false);
    expect(result6.status).toBe('PENDING');
    expect(result6.label).toBe('PENDENTE');
    expect(result6.badgeVariant).toBe('warning');

    // Hoje = 15/10, Vencimento = 05/10 (venceu há 10 dias)
    const result10 = computeFeeStatus('2026-10-05', false);
    expect(result10.status).toBe('PENDING');
    expect(result10.label).toBe('PENDENTE');
  });

  it('deve retornar ATRASADO após 10 dias após o vencimento', () => {
    // Hoje = 15/10, Vencimento = 04/10 (venceu há 11 dias)
    const result = computeFeeStatus('2026-10-04', false);
    expect(result.status).toBe('LATE');
    expect(result.label).toBe('ATRASADO');
    expect(result.badgeVariant).toBe('danger');
  });

  describe('computeAssociateFeeStatus', () => {
    it('deve calcular EM DIA para associado sem pendências', () => {
      const summary = computeAssociateFeeStatus('assoc-1', [
        { category: 'Mensalidade', description: 'Mensalidade Outubro', payer_id: 'assoc-1', status: 'COMPLETED', date: '2026-10-10' }
      ]);
      expect(summary.paymentStatus).toBe('UP_TO_DATE');
      expect(summary.label).toBe('Em Dia');
    });

    it('deve calcular ATRASADO se houver mensalidade vencida há mais de 10 dias', () => {
      const summary = computeAssociateFeeStatus('assoc-2', [
        { category: 'Mensalidade', description: 'Mensalidade Setembro', payer_id: 'assoc-2', status: 'PENDING', date: '2026-09-10' }
      ]);
      expect(summary.paymentStatus).toBe('LATE');
      expect(summary.label).toBe('Atrasado');
      expect(summary.lateCount).toBe(1);
    });

    it('deve calcular PENDENTE se a pior mensalidade estiver entre 6 e 10 dias após vencimento', () => {
      const summary = computeAssociateFeeStatus('assoc-3', [
        { category: 'Mensalidade', description: 'Mensalidade Outubro', payer_id: 'assoc-3', status: 'PENDING', date: '2026-10-07' }
      ]);
      expect(summary.paymentStatus).toBe('PENDING');
      expect(summary.label).toBe('Pendente');
      expect(summary.pendingCount).toBe(1);
    });

    it('deve calcular ABERTO se estiver dentro de 5 dias antes até 5 dias pós vencimento', () => {
      const summary = computeAssociateFeeStatus('assoc-4', [
        { category: 'Mensalidade', description: 'Mensalidade Outubro', payer_id: 'assoc-4', status: 'PENDING', date: '2026-10-18' }
      ]);
      expect(summary.paymentStatus).toBe('OPEN');
      expect(summary.label).toBe('Aberto');
      expect(summary.openCount).toBe(1);
    });
  });
});
