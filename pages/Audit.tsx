import React, { useState } from 'react';
import { FileText, Download, Search, Upload, Book, Megaphone, FileSpreadsheet, Scale, Eye, MoreVertical, Trash2 } from 'lucide-react';
import { Card, Button, Input, Badge, Modal } from '../components/ui';
import { notificationService } from '../services/notifications';
import { User, UserRole } from '../types';

type DocCategory = 'ESTATUTO' | 'ATA' | 'EDITAL' | 'FINANCEIRO' | 'REGIMENTO';

interface Document {
    id: string;
    title: string;
    category: DocCategory;
    date: string;
    size: string;
    author: string;
}

interface AuditPageProps {
    user: User;
}

const INITIAL_DOCS: Document[] = [];

export const AuditPage: React.FC<AuditPageProps> = ({ user }) => {
    const isAdminOrSec = [UserRole.ADMIN, UserRole.SECRETARY].includes(user.role);
    const [documents, setDocuments] = useState<Document[]>(INITIAL_DOCS);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<DocCategory | 'ALL'>('ALL');

    // Upload Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDoc, setNewDoc] = useState<{ title: string, category: DocCategory }>({ title: '', category: 'ATA' });

    const handleDownload = (docTitle: string) => {
        alert(`Iniciando download do documento: ${docTitle}`);
    };

    const handleDelete = (id: string) => {
        if (confirm('Deseja remover este documento público?')) {
            setDocuments(documents.filter(d => d.id !== id));
        }
    };

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (newDoc.title) {
            const doc: Document = {
                id: Math.random().toString(36).substr(2, 9),
                title: newDoc.title,
                category: newDoc.category,
                date: new Date().toISOString().split('T')[0],
                size: '1.5 MB', // Mock size
                author: 'Administrador'
            };

            setDocuments([doc, ...documents]);

            notificationService.add({
                title: 'Novo Documento Publicado',
                message: `O documento "${newDoc.title}" foi adicionado à área de transparência.`,
                type: 'AUDIT', // Reusing AUDIT type for system transparency notifications
                link: '/audit'
            });

            setIsModalOpen(false);
            setNewDoc({ title: '', category: 'ATA' });
        }
    };

    const getCategoryIcon = (cat: DocCategory) => {
        switch (cat) {
            case 'ESTATUTO': return <Scale size={18} className="text-indigo-600" />;
            case 'REGIMENTO': return <Book size={18} className="text-blue-600" />;
            case 'ATA': return <FileText size={18} className="text-slate-600" />;
            case 'EDITAL': return <Megaphone size={18} className="text-orange-600" />;
            case 'FINANCEIRO': return <FileSpreadsheet size={18} className="text-emerald-600" />;
            default: return <FileText size={18} />;
        }
    };

    const getCategoryBadge = (cat: DocCategory) => {
        switch (cat) {
            case 'ESTATUTO': return <Badge variant="neutral">Jurídico</Badge>;
            case 'REGIMENTO': return <Badge variant="info">Normativo</Badge>;
            case 'ATA': return <Badge variant="neutral">Registro</Badge>;
            case 'EDITAL': return <Badge variant="warning">Público</Badge>;
            case 'FINANCEIRO': return <Badge variant="success">Contábil</Badge>;
        }
    };

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Transparência e Documentos</h2>
                    <p className="text-slate-500 text-sm">Repositório oficial de estatutos, atas, editais e regimentos da associação.</p>
                </div>
                {isAdminOrSec && (
                    <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 shadow-lg shadow-brand-200">
                        <Upload size={18} /> Publicar Documento
                    </Button>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <Input
                        placeholder="Buscar documento..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                    {(['ALL', 'ESTATUTO', 'REGIMENTO', 'ATA', 'EDITAL', 'FINANCEIRO'] as const).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${selectedCategory === cat
                                ? 'bg-brand-600 text-white border-brand-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {cat === 'ALL' ? 'Todos' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {filteredDocs.map(doc => (
                    <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                    {getCategoryIcon(doc.category)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">{doc.title}</h3>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                        {getCategoryBadge(doc.category)}
                                        <span className="hidden sm:inline">•</span>
                                        <span>Publicado em: {new Date(doc.date).toLocaleDateString('pt-BR')}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span>{doc.size}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={() => handleDownload(doc.title)}>
                                    <Download size={18} className="mr-2" /> Baixar
                                </Button>
                                <Button variant="ghost" size="sm" className="sm:hidden" onClick={() => handleDownload(doc.title)}>
                                    <Download size={18} />
                                </Button>
                                {isAdminOrSec && (
                                    <>
                                        <div className="h-4 w-px bg-slate-200 mx-1"></div>
                                        <button onClick={() => handleDelete(doc.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}

                {filteredDocs.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                        <FileText size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500">Nenhum documento encontrado.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Publicar Documento Oficial">
                <form onSubmit={handleUpload} className="space-y-4">
                    <Input
                        label="Título do Documento"
                        placeholder="Ex: Ata de Reunião Extraordinária"
                        value={newDoc.title}
                        onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria</label>
                        <select
                            className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-500"
                            value={newDoc.category}
                            onChange={e => setNewDoc({ ...newDoc, category: e.target.value as DocCategory })}
                        >
                            <option value="ATA">Ata de Reunião</option>
                            <option value="ESTATUTO">Estatuto / Jurídico</option>
                            <option value="REGIMENTO">Regimento Interno</option>
                            <option value="EDITAL">Edital / Comunicado</option>
                            <option value="FINANCEIRO">Prestação de Contas</option>
                        </select>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer">
                        <Upload className="mx-auto mb-2 text-slate-400" />
                        <p className="text-sm font-medium">Clique para carregar o arquivo (PDF)</p>
                        <p className="text-xs text-slate-400 mt-1">Tamanho máximo: 10MB</p>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Publicar</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};