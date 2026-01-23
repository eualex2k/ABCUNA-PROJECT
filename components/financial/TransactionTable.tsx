import React, { useState } from 'react';
import { Search, Filter, ArrowUpCircle, ArrowDownCircle, AlertCircle, Edit3, Trash2, Download } from 'lucide-react';
import { Card, Button, Badge, Skeleton, Input } from '../ui';
import { Transaction, translateTransactionType } from '../../types';

interface TransactionTableProps {
    transactions: Transaction[];
    onEdit: (tx: Transaction) => void;
    onDelete: (tx: Transaction) => void;
    onExport?: () => void;
    loading?: boolean;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
    transactions,
    onEdit,
    onDelete,
    onExport,
    loading = false
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'ALL' || tx.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <Card className="overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        Histórico Financeiro
                        <Badge variant="neutral" className="ml-2">{filteredTransactions.length}</Badge>
                    </h3>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 font-bold text-xs uppercase tracking-wider"
                        onClick={onExport}
                    >
                        <Download size={14} className="mr-2" /> Exportar PDF
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por descrição ou categoria..."
                            className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                        >
                            <option value="ALL">Todos os Tipos</option>
                            <option value="INCOME">Entradas</option>
                            <option value="EXPENSE">Saídas</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4">Descrição</th>
                            <th className="px-6 py-4">Categoria</th>
                            <th className="px-6 py-4">Valor</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <tr key={i}>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 mx-auto" /></td>
                                </tr>
                            ))
                        ) : filteredTransactions.length > 0 ? (
                            filteredTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-700">
                                            {(() => {
                                                const [y, m, d] = tx.date.split('-');
                                                return `${d}/${m}/${y}`;
                                            })()}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                                {tx.type === 'INCOME' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                                            </div>
                                            <p className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{tx.description}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{tx.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className={`text-sm font-black ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                            {tx.type === 'EXPENSE' ? '- ' : ''}{formatCurrency(tx.amount)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={tx.status === 'COMPLETED' ? 'success' : 'warning'}>
                                            {tx.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onEdit(tx)}
                                                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                                                title="Editar"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(tx)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                                    <AlertCircle size={32} className="mx-auto mb-3 opacity-20" />
                                    Nenhuma transação encontrada com os filtros atuais.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
