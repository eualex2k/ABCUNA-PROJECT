import React from 'react';
import { Card, Button, Badge } from '../ui';
import { Transaction } from '../../types';
import { Download, Trash2, FileText } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction?: Transaction) => void;
  onViewComprovantes: (transaction: Transaction) => void;
  onPayPending?: (transaction: Transaction) => void;
  onExport?: () => void;
  loading: boolean;
  canEdit: boolean;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  COMPLETED: { color: 'bg-emerald-500', label: 'Confirmado' },
  PENDING:   { color: 'bg-amber-400',   label: 'Pendente'   },
  FAILED:    { color: 'bg-rose-500',    label: 'Falhou'     },
  CANCELLED: { color: 'bg-slate-400',   label: 'Cancelado'  },
};

const StatusDot: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? { color: 'bg-slate-300', label: status };
  return (
    <span className="relative inline-flex items-center group">
      <span
        className={`w-3 h-3 rounded-full inline-block ring-2 ring-white shadow-sm ${cfg.color}`}
      />
      {/* Tooltip */}
      <span className="
        pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2
        bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider
        whitespace-nowrap rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100
        transition-opacity duration-150 shadow-lg z-10
      ">
        {cfg.label}
      </span>
    </span>
  );
};

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEdit,
  onDelete,
  onViewComprovantes,
  onPayPending,
  onExport,
  loading,
  canEdit,
}) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="h-3 bg-slate-200 rounded w-20 shrink-0" />
              <div className="h-3 bg-slate-200 rounded flex-1" />
              <div className="h-3 bg-slate-200 rounded w-24 shrink-0" />
              <div className="h-3 bg-slate-200 rounded w-16 shrink-0" />
              <div className="h-3 bg-slate-200 rounded w-20 shrink-0" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-slate-400">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-bold uppercase tracking-widest text-sm">
            Nenhuma movimentação encontrada
          </p>
          <p className="text-xs mt-1">Registre sua primeira entrada ou saída</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-900">Movimentações Financeiras</h3>
        {onExport && (
          <Button variant="outline" onClick={onExport} className="flex items-center gap-2">
            <Download size={16} /> Exportar PDF
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          {/* Column widths */}
          <colgroup>
            <col className="w-[100px]" />   {/* Data */}
            <col />                          {/* Descrição — flex */}
            <col className="w-[140px]" />   {/* Categoria */}
            <col className="w-[80px]" />    {/* Tipo */}
            <col className="w-[110px]" />   {/* Valor */}
            <col className="w-[44px]" />    {/* Status (dot) */}
            {canEdit && <col className="w-[160px]" />}  {/* Ações */}
          </colgroup>

          <thead>
            <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 pr-4">Data</th>
              <th className="pb-3 pr-4">Descrição</th>
              <th className="pb-3 pr-4">Categoria</th>
              <th className="pb-3 pr-4">Tipo</th>
              <th className="pb-3 pr-4 text-right">Valor</th>
              <th className="pb-3 pr-4 text-center">St.</th>
              {canEdit && <th className="pb-3 text-center">Ações</th>}
            </tr>
            <tr>
              <td colSpan={canEdit ? 7 : 6}>
                <div className="border-b border-slate-100 mb-1" />
              </td>
            </tr>
          </thead>

          <tbody>
            {transactions.map((tx, idx) => (
              <tr
                key={tx.id}
                className={`transition-colors hover:bg-slate-50/80 ${
                  idx !== transactions.length - 1 ? 'border-b border-slate-50' : ''
                }`}
              >
                {/* Data */}
                <td className="py-3.5 pr-4 align-middle">
                  <span className="text-[13px] font-medium text-slate-500 whitespace-nowrap">
                    {formatDate(tx.date)}
                  </span>
                </td>

                {/* Descrição */}
                <td className="py-3.5 pr-4 align-middle">
                  <p className="text-[13px] font-semibold text-slate-800 leading-snug">
                    {tx.description}
                  </p>
                  {tx.notes && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{tx.notes}</p>
                  )}
                </td>

                {/* Categoria */}
                <td className="py-3.5 pr-4 align-middle">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        tx.type === 'INCOME' ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    <span className="text-[13px] text-slate-600">{tx.category || 'Geral'}</span>
                  </div>
                </td>

                {/* Tipo */}
                <td className="py-3.5 pr-4 align-middle">
                  <Badge
                    variant={tx.type === 'INCOME' ? 'success' : 'danger'}
                    className="font-bold py-0.5 px-2 text-[10px] uppercase"
                  >
                    {tx.type === 'INCOME' ? 'Entrada' : 'Saída'}
                  </Badge>
                </td>

                {/* Valor */}
                <td className="py-3.5 pr-4 align-middle text-right">
                  <span
                    className={`text-[13px] font-bold tabular-nums ${
                      tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '−'}&nbsp;{formatCurrency(tx.amount)}
                  </span>
                </td>

                {/* Status — dot */}
                <td className="py-3.5 pr-4 align-middle text-center">
                  <StatusDot status={tx.status} />
                </td>

                {/* Ações */}
                {canEdit && (
                  <td className="py-3.5 align-middle">
                    <div className="flex items-center justify-center gap-1">
                      {tx.status === 'PENDING' && onPayPending && (
                        <Button
                          variant="ghost"
                          onClick={() => onPayPending(tx)}
                          className="!h-8 px-3 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-black uppercase tracking-wider shadow-sm"
                          title="Liquidar"
                        >
                          Liquidar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => onViewComprovantes(tx)}
                        className="!h-9 !w-9 !p-0 shrink-0 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors"
                        title="Ver detalhes"
                      >
                        <FileText size={17} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => onDelete(tx)}
                        className="!h-9 !w-9 !p-0 shrink-0 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={17} />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
