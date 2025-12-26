import React, { useState } from 'react';
import { Package, Plus, Search, Trash2, Wrench, Calendar, DollarSign, Truck, Info, AlertCircle } from 'lucide-react';
import { Card, Button, Input, Badge, Modal } from '../components/ui';

// Interface Item removed, using InventoryItem from types


import { InventoryItem, User, UserRole } from '../types';
import { inventoryService } from '../services/inventory';

const INITIAL_ITEMS: InventoryItem[] = [];

interface InventoryPageProps {
  user: User;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ user }) => {
  const canEdit = [UserRole.ADMIN, UserRole.SECRETARY].includes(user.role);
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_ITEMS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const data = await inventoryService.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to load inventory', error);
    }
  };

  // Detalhes / Expandir item
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const initialFormState: Partial<InventoryItem> = {
    name: '',
    quantity: 1,
    category: 'Geral',
    location: 'Sede'
  };

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>(initialFormState);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.name) {
      try {
        const itemData: Omit<InventoryItem, 'id'> = {
          name: newItem.name!,
          quantity: newItem.quantity || 1,
          category: newItem.category || 'Geral',
          condition: (newItem.quantity || 0) < 3 ? 'LOW_STOCK' : 'AVAILABLE',
          location: newItem.location || 'Sede Almoxarifado',
          lastInspection: (newItem as any).entryDate || new Date().toISOString().split('T')[0],
          unit: newItem.unit || 'un',
          price: newItem.price || 0,
          supplier: newItem.supplier || '',
          description: newItem.description || '',
          expirationDate: newItem.expirationDate || undefined
        };

        await inventoryService.create(itemData);
        loadInventory();
        setIsModalOpen(false);
        setNewItem(initialFormState);
      } catch (error) {
        alert('Erro ao salvar item.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remover item do estoque?')) {
      try {
        await inventoryService.delete(id);
        loadInventory();
      } catch (error) {
        console.error('Error deleting', error);
      }
    }
  };

  const toggleStatus = async (item: InventoryItem) => {
    try {
      const newCondition = item.condition === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
      await inventoryService.update(item.id, { condition: newCondition });
      loadInventory();
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Cálculo do Patrimônio Total (Soma de Qtd * Preço de todos itens)
  const totalValue = items.reduce((acc, curr) => acc + (curr.quantity * (curr.price || 0)), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Estoque de Materiais</h2>
          <p className="text-slate-500 text-sm">Gestão de equipamentos, EPIs e suprimentos operacionais.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Patrimony Badge */}
          <div className="h-10 px-4 bg-slate-900 rounded-lg flex items-center gap-3 shadow-sm border border-slate-800 select-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patrimônio</span>
            <div className="h-4 w-px bg-slate-700"></div>
            <span className="text-sm font-bold text-emerald-400">{formatCurrency(totalValue)}</span>
          </div>

          {/* Add Button */}
          {canEdit && (
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 shadow-lg shadow-brand-200">
              <Plus size={18} /> Novo Item
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4 flex gap-4 bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <Input
            placeholder="Buscar equipamento por nome, categoria..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredItems.map(item => {
          const isExpanded = expandedItemId === item.id;
          const totalItemValue = item.quantity * (item.price || 0);
          const isExpired = item.expirationDate ? new Date(item.expirationDate) < new Date() : false;

          return (
            <Card key={item.id} className={`flex flex-col transition-all duration-300 ${isExpanded ? 'border-brand-500 shadow-md row-span-2' : 'border-l-4 border-l-slate-200 hover:border-l-brand-500'}`}>
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600">
                      <Package size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">{item.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{item.category}</p>
                    </div>
                  </div>
                  <Badge variant={
                    item.condition === 'AVAILABLE' ? 'success' :
                      item.condition === 'MAINTENANCE' ? 'warning' : 'danger'
                  }>
                    {item.condition === 'AVAILABLE' ? 'Disponível' :
                      item.condition === 'MAINTENANCE' ? 'Manutenção' : 'Estoque Baixo'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 my-4 py-3 border-y border-slate-50">
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Quantidade</p>
                    <p className="font-bold text-slate-900 text-lg">{item.quantity} <span className="text-xs font-normal text-slate-500">un</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-0.5">Localização</p>
                    <p className="font-semibold text-slate-700">{item.location}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-slate-500" title="Data de Entrada">
                    <Calendar size={14} />
                    <span className="text-xs">{item.lastInspection ? new Date(item.lastInspection).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                  {item.expirationDate && (
                    <div className={`flex items-center gap-1.5 ${isExpired ? 'text-red-600 font-bold' : 'text-slate-500'}`} title="Data de Validade">
                      <AlertCircle size={14} />
                      <span className="text-xs">Val: {new Date(item.expirationDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                    {item.description && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-slate-700 mb-1">Descrição</p>
                        <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">{item.description}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Fornecedor</p>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Truck size={14} /> {item.supplier || 'Não informado'}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-700">Valor em Estoque</p>
                        <p className="text-sm font-bold text-emerald-600">{formatCurrency(totalItemValue)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto bg-slate-50 border-t border-slate-100 p-3 flex justify-between items-center rounded-b-xl">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-500"
                  onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                >
                  {isExpanded ? 'Menos Detalhes' : 'Mais Detalhes'}
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}>
                    <Info size={16} className="text-slate-400 group-hover:text-brand-500" />
                  </Button>
                  {canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => toggleStatus(item)} title="Manutenção">
                      <Wrench size={16} className={item.condition === 'MAINTENANCE' ? 'text-amber-500' : 'text-slate-300'} />
                    </Button>
                  )}
                  {canEdit && (
                    <button onClick={() => handleDelete(item.id)} className="text-slate-200 hover:text-red-500 p-2 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Cadastrar Novo Item" maxWidth="xl">
        <form onSubmit={handleAddItem} className="space-y-4">
          <Input
            label="Nome do Equipamento / Material"
            value={newItem.name}
            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
            placeholder="Ex: Colete Refletivo"
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria</label>
              <select
                className="w-full h-12 px-5 bg-white border border-slate-300 rounded-lg text-base focus:outline-none focus:border-brand-500"
                value={newItem.category}
                onChange={e => setNewItem({ ...newItem, category: e.target.value })}
              >
                <option value="Geral">Geral</option>
                <option value="EPI">EPI</option>
                <option value="Combate a Incêndio">Combate a Incêndio</option>
                <option value="Comunicação">Comunicação</option>
                <option value="APH">APH</option>
                <option value="Veículos">Veículos</option>
                <option value="Uniforme">Uniforme</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Unidade</label>
              <select
                className="w-full h-12 px-5 bg-white border border-slate-300 rounded-lg text-base focus:outline-none focus:border-brand-500"
                value={newItem.unit}
                onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
              >
                <option value="un">Unidade</option>
                <option value="par">Par</option>
                <option value="cx">Caixa</option>
                <option value="kg">Kg</option>
                <option value="lt">Litro</option>
                <option value="kit">Kit</option>
                <option value="mt">Metro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantidade"
              type="number"
              min="0"
              value={newItem.quantity}
              onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
              required
            />
            <div className="relative">
              <Input
                label="Preço Unitário (R$)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={newItem.price}
                onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
              />
              <DollarSign size={14} className="absolute right-3 top-[38px] text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data de Entrada"
              type="date"
              value={(newItem as any).entryDate}
              onChange={e => setNewItem({ ...newItem, entryDate: e.target.value })}
              required
            />
            <Input
              label="Vencimento (Opcional)"
              type="date"
              value={newItem.expirationDate || ''}
              onChange={e => setNewItem({ ...newItem, expirationDate: e.target.value })}
            />
          </div>

          <Input
            label="Fornecedor / Origem"
            placeholder="Ex: Loja do Bombeiro Ltda."
            value={newItem.supplier || ''}
            onChange={e => setNewItem({ ...newItem, supplier: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição Detalhada</label>
            <textarea
              className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-500 resize-none h-24"
              placeholder="Detalhes técnicos, condições de uso, localização no almoxarifado..."
              value={newItem.description || ''}
              onChange={e => setNewItem({ ...newItem, description: e.target.value })}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Salvar no Estoque</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};