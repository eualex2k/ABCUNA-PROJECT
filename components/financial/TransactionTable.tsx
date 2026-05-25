import React from 'react';
import { Card, Button, Badge } from '../ui';
import { Transaction } from '../../types';
import { Download, Edit3, Trash2, FileText } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction?: Transaction) => void;
  onViewComprovantes: (transaction: Transaction) => void;
  onExport?: () => void;
  loading: boolean;
  canEdit: boolean;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEdit,
  onDelete,
  onViewComprovantes,
  onExport,
  loading,
  canEdit
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      'COMPLETED': 'success',
      'PENDING': 'warning',
      'FAILED': 'danger',
      'CANCELLED': 'info'
    };
    
    return (
      <Badge variant={variants[status] || 'info'} className="font-bold py-0.5 px-2 text-[10px] uppercase">
        {status === 'COMPLETED' ? 'Confirmado' : status === 'PENDING' ? 'Pendente' : status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/6"></div>
              <div className="h-4 bg-slate-200 rounded w-1/6"></div>
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
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
          <p className="font-bold uppercase tracking-widest text-sm">Nenhuma movimentação encontrada</p>
          <p className="text-xs mt-1">Registre sua primeira entrada ou saída</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-900">Movimentações Financeiras</h3>
        {onExport && (
          <Button variant="outline" onClick={onExport} className="flex items-center gap-2">
            <Download size={16} /> Exportar PDF
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="pb-3">Data</th>
              <th className="pb-3">Descrição</th>
              <th className="pb-3">Categoria</th>
              <th className="pb-3">Tipo</th>
              <th className="pb-3 text-right">Valor</th>
              <th className="pb-3">Status</th>
              {canEdit && <th className="pb-3 w-24">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 text-sm font-medium text-slate-900">
                  {formatDate(transaction.date)}
                </td>
                <td className="py-4">
                  <div className="text-sm font-medium text-slate-900">
                    {transaction.description}
                  </div>
                  {transaction.notes && (
                    <div className="text-xs text-slate-500 mt-1">
                      {transaction.notes}
                    </div>
                  )}
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      transaction.type === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                    <span className="text-sm text-slate-700">
                      {transaction.category || 'Geral'}
                    </span>
                  </div>
                </td>
                <td className="py-4">
                  <Badge 
                    variant={transaction.type === 'INCOME' ? 'success' : 'danger'} 
                    className="font-bold py-0.5 px-2 text-[10px] uppercase"
                  >
                    {transaction.type === 'INCOME' ? 'Entrada' : 'Saída'}
                  </Badge>
                </td>
                <td className={`py-4 text-sm font-bold text-right ${
                  transaction.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {transaction.type === 'INCOME' ? '+' : '-'} {formatCurrency(transaction.amount)}
                </td>
                <td className="py-4">
                  {getStatusBadge(transaction.status)}
                </td>
                {canEdit && (
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewComprovantes(transaction)}
                        className="p-1.5 h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        title="Ver comprovantes"
                      >
                        <FileText size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(transaction)}
                        className="p-1.5 h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Editar"
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(transaction)}
                        className="p-1.5 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
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