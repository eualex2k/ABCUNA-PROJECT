import React from 'react';
import { Filter, CheckCircle2, Calendar, Edit3, Trash2, X, AlertTriangle, CreditCard } from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../ui';
import { Associate, translateStatus } from '../../types';

interface FeeRecord {
    id: string;
    associateId: string;
    associateName: string;
    dueDate: string;
    amount: number;
    status: 'LATE' | 'OPEN' | 'PAID' | 'PARTIAL';
    monthRef: string;
}

interface FeesManagerProps {
    fees: FeeRecord[];
    associates: Associate[];
    filterAssociateId: string;
    setFilterAssociateId: (id: string) => void;
    isSelectionMode: boolean;
    setIsSelectionMode: (mode: boolean) => void;
    selectedFeeIds: string[];
    toggleFeeSelection: (id: string) => void;
    selectAll: () => void;
    deselectAll: () => void;
    onDeleteBulk: () => void;
    onEdit: (fee: FeeRecord) => void;
    onPay: (fee: FeeRecord) => void;
    canEdit: boolean;
    loading?: boolean;
}

export const FeesManager: React.FC<FeesManagerProps> = ({
    fees,
    associates,
    filterAssociateId,
    setFilterAssociateId,
    isSelectionMode,
    setIsSelectionMode,
    selectedFeeIds,
    toggleFeeSelection,
    selectAll,
    deselectAll,
    onDeleteBulk,
    onEdit,
    onPay,
    canEdit,
    loading = false
}) => {
    const sortedFees = [...fees].sort((a, b) => {
        if (a.status === 'LATE' && b.status !== 'LATE') return -1;
        if (a.status !== 'LATE' && b.status === 'LATE') return 1;
        return a.dueDate.localeCompare(b.dueDate);
    });

    const unpaidFees = sortedFees.filter(f => f.status !== 'PAID');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                     <CreditCard size={22} className="text-brand-600" />
                     Controle de Mensalidades
                   </h3>
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Gestão de pendências e recebimentos</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {canEdit && (
                        <Button
                            variant={isSelectionMode ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                if (!isSelectionMode) deselectAll();
                            }}
                            className="h-10 text-[10px] font-black uppercase tracking-wider px-4 rounded-xl shadow-sm border-slate-200"
                        >
                            {isSelectionMode ? (
                                <><X size={14} className="mr-2" /> Sair da Seleção</>
                            ) : (
                                <><CheckCircle2 size={14} className="mr-2" /> Seleção em Massa</>
                            )}
                        </Button>
                    )}

                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 h-10 ring-offset-bg focus-within:ring-4 focus-within:ring-brand-500/10 transition-all shadow-sm flex-1 sm:flex-none">
                        <Filter size={14} className="text-slate-400" />
                        <select
                            className="text-[11px] font-black text-slate-700 bg-transparent border-none focus:ring-0 outline-none pr-8 cursor-pointer uppercase tracking-wider"
                            value={filterAssociateId}
                            onChange={(e) => setFilterAssociateId(e.target.value)}
                        >
                            <option value="ALL">TODOS OS ASSOCIADOS</option>
                            <optgroup label="Associados Individuais">
                                {associates
                                  .sort((a, b) => a.name.localeCompare(b.name))
                                  .map(a => (
                                    <option key={a.id} value={a.id}>{a.name.toUpperCase()}</option>
                                  ))}
                            </optgroup>
                        </select>
                    </div>
                </div>
            </div>

            {isSelectionMode && canEdit && unpaidFees.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-brand-50/50 rounded-xl border border-brand-100 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                            checked={selectedFeeIds.length > 0 && selectedFeeIds.length === unpaidFees.length}
                            onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                            id="select-all"
                        />
                        <label htmlFor="select-all" className="text-[11px] font-black text-brand-900 uppercase tracking-wider cursor-pointer">
                            Selecionar Todas ({unpaidFees.length})
                        </label>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 mr-2">{selectedFeeIds.length} selecionadas</span>
                        <Button
                            size="sm"
                            onClick={onDeleteBulk}
                            disabled={selectedFeeIds.length === 0}
                            className="h-8 text-[10px] font-black uppercase bg-red-600 hover:bg-red-700 text-white border-none shadow-[0_4px_12px_rgba(220,38,38,0.2)] disabled:bg-slate-300"
                        >
                            <Trash2 size={12} className="mr-1.5" /> Excluir Seleção
                        </Button>
                    </div>
                </div>
            )}

            <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {loading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
                ) : unpaidFees.length > 0 ? (
                    unpaidFees.map(fee => (
                                <div
                                    key={fee.id}
                                    className={`group p-5 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 ${selectedFeeIds.includes(fee.id)
                                        ? 'bg-brand-50/80 border-brand-200 shadow-xl scale-[1.01]'
                                        : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
                                        }`}
                                >
                                    <div className="flex items-start gap-5 flex-1">
                                        {isSelectionMode && (
                                            <div className="pt-2">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded-md border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer transition-all"
                                                    checked={selectedFeeIds.includes(fee.id)}
                                                    onChange={() => toggleFeeSelection(fee.id)}
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <span className="text-lg font-black text-slate-900 truncate tracking-tight">{fee.associateName}</span>
                                                <Badge variant={fee.status === 'LATE' ? 'danger' : 'warning'} className="text-[10px] font-black px-3 py-1 uppercase tracking-wider">
                                                    {translateStatus(fee.status)}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-5 text-[10px] font-black text-slate-500 uppercase tracking-widest pt-1">
                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                    <Calendar size={13} className="text-brand-500" strokeWidth={2.5} /> 
                                                    VENC. {new Date(fee.dueDate + "T12:00:00").toLocaleDateString('pt-BR')}
                                                </span>
                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                    <AlertTriangle size={13} className="text-amber-500" strokeWidth={2.5} /> 
                                                    {fee.monthRef}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-row items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Valor da Parcela</p>
                                            <span className="font-black text-slate-900 text-2xl tracking-tighter">R$ {fee.amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {canEdit && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => onEdit(fee)}
                                                    className="h-11 w-11 p-0 border-slate-200 bg-white hover:bg-slate-50 hover:text-brand-600 transition-all shadow-sm rounded-xl"
                                                    title="Editar"
                                                >
                                                    <Edit3 size={18} />
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                onClick={() => onPay(fee)}
                                                className="h-11 px-6 text-xs font-black uppercase tracking-[0.1em] shadow-md shadow-brand-600/20 active:scale-95 transition-all rounded-xl"
                                            >
                                                Receber
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                        <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-100" strokeWidth={1} />
                        <h4 className="text-slate-900 font-bold">Tudo em dia!</h4>
                        <p className="text-slate-500 text-sm">Nenhuma mensalidade pendente encontrada.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
