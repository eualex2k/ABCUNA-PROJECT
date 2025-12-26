import React, { useState, useEffect } from 'react';
import { Building2, Save, Upload, MapPin, Phone, Mail, Globe, ShieldCheck, FileCheck } from 'lucide-react';
import { Card, Button, Input, Badge } from '../components/ui';
import { companyService } from '../services/company';
import { CompanyInfo, User, UserRole } from '../types';
import { notificationService } from '../services/notifications';

interface CompanyPageProps {
    user: User;
}

export const CompanyPage: React.FC<CompanyPageProps> = ({ user }) => {
    const isAdmin = user.role === UserRole.ADMIN;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [info, setInfo] = useState<CompanyInfo>({
        id: '',
        name: 'ABCUNA',
        corporateName: '',
        cnpj: '',
        ie: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        logo: '',
        website: ''
    });

    useEffect(() => {
        loadCompanyInfo();
    }, []);

    const loadCompanyInfo = async () => {
        try {
            setLoading(true);
            const data = await companyService.get();
            if (data) setInfo(data);
        } catch (error) {
            console.error('Failed to load company info', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!isAdmin) return;

        try {
            setSaving(true);
            await companyService.update(info);
            notificationService.add({
                title: 'Dados Atualizados',
                message: 'As informações da empresa foram salvas com sucesso.',
                type: 'SYSTEM'
            });
        } catch (error) {
            alert('Erro ao salvar informações.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="py-20 text-center text-slate-400 italic">Carregando dados da instituição...</div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Configurações da Instituição</h2>
                    <p className="text-slate-500 text-sm">Gerencie a identidade, registros fiscais e contatos oficiais da corporação.</p>
                </div>
                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <Button
                            onClick={handleSave}
                            className="flex items-center gap-2"
                            disabled={saving}
                        >
                            {saving ? 'Gravando...' : <><Save size={18} /> Salvar Alterações</>}
                        </Button>
                    )}
                </div>
            </div>

            {/* Card de Visualização da Empresa */}
            <Card className="p-6 bg-gradient-to-br from-white to-slate-50 border-slate-200">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Logo */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-2xl bg-white border-2 border-slate-200 shadow-lg flex items-center justify-center overflow-hidden">
                            {info.logo ? (
                                <img src={info.logo} alt={info.name} className="w-full h-full object-contain p-3" />
                            ) : (
                                <Building2 size={48} className="text-slate-300" />
                            )}
                        </div>
                        {info.cnpj && (
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-lg shadow-lg">
                                <ShieldCheck size={16} />
                            </div>
                        )}
                    </div>

                    {/* Informações Principais */}
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div>
                            <h3 className="text-3xl font-bold text-slate-900 mb-1">{info.name || 'ABCUNA'}</h3>
                            <p className="text-sm text-slate-500 font-medium">{info.corporateName || 'Razão Social não informada'}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* CNPJ */}
                            <div className="p-3 bg-white rounded-lg border border-slate-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileCheck size={14} className="text-brand-600" />
                                    <p className="text-xs font-bold text-slate-400 uppercase">CNPJ</p>
                                </div>
                                <p className="text-sm font-bold text-slate-900 font-mono">{info.cnpj || 'Não informado'}</p>
                            </div>

                            {/* Endereço */}
                            <div className="p-3 bg-white rounded-lg border border-slate-200 md:col-span-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <MapPin size={14} className="text-brand-600" />
                                    <p className="text-xs font-bold text-slate-400 uppercase">Endereço</p>
                                </div>
                                <p className="text-sm font-bold text-slate-900">
                                    {info.address || 'Não informado'}
                                    {info.city && info.state && ` - ${info.city}/${info.state}`}
                                </p>
                            </div>
                        </div>

                        {/* Contatos */}
                        <div className="flex flex-wrap gap-4 text-sm">
                            {info.phone && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Phone size={16} className="text-brand-600" />
                                    <span className="font-medium">{info.phone}</span>
                                </div>
                            )}
                            {info.email && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Mail size={16} className="text-brand-600" />
                                    <span className="font-medium">{info.email}</span>
                                </div>
                            )}
                            {info.website && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Globe size={16} className="text-brand-600" />
                                    <a href={`https://${info.website}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-brand-600 transition-colors">
                                        {info.website}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Content Sections */}
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Registration Data */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-4">
                        <FileCheck size={16} className="text-brand-600" />
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Registro Institucional</h3>
                    </div>
                    <Card className="p-8 space-y-6 border-slate-200/60 shadow-xl shadow-slate-200/10">
                        <Input
                            label="Nome Fantasia"
                            value={info.name}
                            onChange={e => setInfo({ ...info, name: e.target.value })}
                            disabled={!isAdmin}
                            required
                        />
                        <Input
                            label="Razão Social"
                            value={info.corporateName}
                            onChange={e => setInfo({ ...info, corporateName: e.target.value })}
                            disabled={!isAdmin}
                            required
                        />
                        <div className="grid grid-cols-1 gap-6">
                            <Input
                                label="CNPJ"
                                mask="cnpj"
                                value={info.cnpj}
                                onChange={e => setInfo({ ...info, cnpj: e.target.value })}
                                disabled={!isAdmin}
                                className="font-mono"
                            />
                            <Input
                                label="Inscrição Estadual (I.E.)"
                                placeholder="I.E."
                                value={info.ie}
                                onChange={e => setInfo({ ...info, ie: e.target.value })}
                                disabled={!isAdmin}
                            />
                        </div>
                    </Card>
                </div>

                {/* Contacts & Digital Presence */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-4">
                        <Globe size={16} className="text-brand-600" />
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Canais de Atendimento</h3>
                    </div>
                    <Card className="p-8 space-y-6 border-slate-200/60 shadow-xl shadow-slate-200/10">
                        <Input
                            label="Endereço Fiscal"
                            value={info.address}
                            onChange={e => setInfo({ ...info, address: e.target.value })}
                            disabled={!isAdmin}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Cidade"
                                placeholder="Cidade"
                                value={info.city}
                                onChange={e => setInfo({ ...info, city: e.target.value })}
                                disabled={!isAdmin}
                            />
                            <Input
                                label="UF"
                                placeholder="Estado"
                                maxLength={2}
                                value={info.state}
                                onChange={e => setInfo({ ...info, state: e.target.value.toUpperCase() })}
                                disabled={!isAdmin}
                            />
                        </div>
                        <Input
                            label="E-mail Institucional"
                            icon={<Mail size={16} />}
                            value={info.email}
                            onChange={e => setInfo({ ...info, email: e.target.value })}
                            disabled={!isAdmin}
                        />
                        <div className="grid grid-cols-1 gap-6">
                            <Input
                                label="Telefone de Contato"
                                mask="phone"
                                icon={<Phone size={14} />}
                                value={info.phone}
                                onChange={e => setInfo({ ...info, phone: e.target.value })}
                                disabled={!isAdmin}
                            />
                            <Input
                                label="Site Oficial"
                                icon={<Globe size={14} />}
                                placeholder="www.abcuna.org"
                                value={info.website}
                                onChange={e => setInfo({ ...info, website: e.target.value })}
                                disabled={!isAdmin}
                            />
                        </div>
                    </Card>
                </div>

                {!isAdmin && (
                    <div className="md:col-span-2 bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4 text-slate-500 italic text-sm justify-center">
                        <ShieldCheck size={20} /> Acesso restrito. Somente administradores podem modificar estes registros.
                    </div>
                )}
            </form>
        </div>
    );
};
