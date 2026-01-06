import React, { useState, useEffect } from 'react';
import {
    Save, Upload, Eye, EyeOff, Trash2, Plus, Image as ImageIcon,
    Loader2, HelpCircle, Info, Palette, Phone, Mail, MapPin,
    Clock, Facebook, Instagram, Twitter, Linkedin, Youtube,
    TrendingUp, Award, Users, Activity, Star, MessageSquare,
    Settings as SettingsIcon, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card, Button, Input, Textarea, Modal } from '../components/ui';
import { landingPageService } from '../services/landingPage';
import { LandingPageConfig, User } from '../types';
import { notificationService } from '../services/notifications';

interface LandingPageSettingsProps {
    user: User;
}

export const LandingPageSettings: React.FC<LandingPageSettingsProps> = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        hero: true,
        about: false,
        stats: false,
        services: false,
        testimonials: false,
        gallery: false,
        contact: false,
        cta: false,
        theme: false
    });

    const [config, setConfig] = useState<LandingPageConfig>({
        id: '',
        hero_title: '',
        hero_subtitle: '',
        hero_image_url: '',
        hero_badge_text: '',
        about_title: '',
        about_text: '',
        mission_text: '',
        vision_text: '',
        values_text: '',
        stats: [],
        services_title: '',
        services_subtitle: '',
        services: [],
        testimonials_title: '',
        testimonials_subtitle: '',
        testimonials: [],
        gallery_title: '',
        gallery_subtitle: '',
        gallery_images: [],
        contact: {
            phone: '',
            email: '',
            address: '',
            workingHours: ''
        },
        social: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: '',
            youtube: ''
        },
        cta_title: '',
        cta_subtitle: '',
        cta_button_text: '',
        theme: {
            primaryColor: '#dc2626',
            secondaryColor: '#1e293b',
            accentColor: '#f59e0b'
        },
        sections_visibility: {
            hero: true,
            about: true,
            stats: true,
            services: true,
            testimonials: true,
            gallery: true,
            contact: true,
            cta: true
        }
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const data = await landingPageService.get();
            if (data) {
                setConfig({
                    ...data,
                    stats: data.stats || [],
                    services: data.services || [],
                    testimonials: data.testimonials || [],
                    contact: data.contact || { phone: '', email: '', address: '', workingHours: '' },
                    social: data.social || { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' },
                    theme: data.theme || { primaryColor: '#dc2626', secondaryColor: '#1e293b', accentColor: '#f59e0b' }
                });
            }
        } catch (error) {
            console.error('Failed to load landing page config:', error);
            notificationService.add({
                title: 'Erro ao Carregar',
                message: 'Não foi possível carregar as configurações da página inicial.',
                type: 'SYSTEM'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await landingPageService.update(config);
            notificationService.add({
                title: 'Configurações Salvas',
                message: 'As configurações da página inicial foram atualizadas com sucesso.',
                type: 'SYSTEM'
            });
        } catch (error) {
            console.error('Failed to save config:', error);
            notificationService.add({
                title: 'Erro ao Salvar',
                message: 'Não foi possível salvar as configurações.',
                type: 'SYSTEM'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'gallery') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem válida.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 5MB.');
            return;
        }

        try {
            setUploading(true);
            const url = await landingPageService.uploadImage(file);

            if (type === 'hero') {
                setConfig({ ...config, hero_image_url: url });
            } else {
                setConfig({
                    ...config,
                    gallery_images: [...config.gallery_images, url]
                });
            }

            notificationService.add({
                title: 'Imagem Enviada',
                message: 'A imagem foi enviada com sucesso.',
                type: 'SYSTEM'
            });
        } catch (error) {
            console.error('Failed to upload image:', error);
            notificationService.add({
                title: 'Erro no Upload',
                message: 'Não foi possível enviar a imagem.',
                type: 'SYSTEM'
            });
        } finally {
            setUploading(false);
        }
    };

    const removeGalleryImage = (index: number) => {
        const newImages = config.gallery_images.filter((_, i) => i !== index);
        setConfig({ ...config, gallery_images: newImages });
    };

    const toggleSection = (section: keyof LandingPageConfig['sections_visibility']) => {
        setConfig({
            ...config,
            sections_visibility: {
                ...config.sections_visibility,
                [section]: !config.sections_visibility[section]
            }
        });
    };

    const toggleExpanded = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Stats Management
    const addStat = () => {
        setConfig({
            ...config,
            stats: [...(config.stats || []), { label: '', value: '', icon: 'activity' }]
        });
    };

    const updateStat = (index: number, field: string, value: string) => {
        const newStats = [...(config.stats || [])];
        newStats[index] = { ...newStats[index], [field]: value };
        setConfig({ ...config, stats: newStats });
    };

    const removeStat = (index: number) => {
        const newStats = (config.stats || []).filter((_, i) => i !== index);
        setConfig({ ...config, stats: newStats });
    };

    // Services Management
    const addService = () => {
        setConfig({
            ...config,
            services: [...(config.services || []), { title: '', description: '', icon: 'activity' }]
        });
    };

    const updateService = (index: number, field: string, value: string) => {
        const newServices = [...(config.services || [])];
        newServices[index] = { ...newServices[index], [field]: value };
        setConfig({ ...config, services: newServices });
    };

    const removeService = (index: number) => {
        const newServices = (config.services || []).filter((_, i) => i !== index);
        setConfig({ ...config, services: newServices });
    };

    // Testimonials Management
    const addTestimonial = () => {
        setConfig({
            ...config,
            testimonials: [...(config.testimonials || []), { name: '', role: '', content: '', avatar: '' }]
        });
    };

    const updateTestimonial = (index: number, field: string, value: string) => {
        const newTestimonials = [...(config.testimonials || [])];
        newTestimonials[index] = { ...newTestimonials[index], [field]: value };
        setConfig({ ...config, testimonials: newTestimonials });
    };

    const removeTestimonial = (index: number) => {
        const newTestimonials = (config.testimonials || []).filter((_, i) => i !== index);
        setConfig({ ...config, testimonials: newTestimonials });
    };

    const Tooltip = ({ text }: { text: string }) => (
        <div className="group relative inline-block ml-2">
            <HelpCircle size={16} className="text-slate-400 hover:text-brand-600 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {text}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
            </div>
        </div>
    );

    const SectionCard = ({
        title,
        description,
        icon: Icon,
        sectionKey,
        children
    }: {
        title: string;
        description: string;
        icon: any;
        sectionKey: string;
        children: React.ReactNode;
    }) => (
        <Card className="overflow-hidden">
            <div
                className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleExpanded(sectionKey)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Icon size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">{title}</h3>
                            <p className="text-sm text-slate-500">{description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleSection(sectionKey as keyof LandingPageConfig['sections_visibility']);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${config.sections_visibility[sectionKey as keyof LandingPageConfig['sections_visibility']]
                                    ? 'bg-brand-600 text-white'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                        >
                            {config.sections_visibility[sectionKey as keyof LandingPageConfig['sections_visibility']] ? (
                                <><Eye size={16} className="inline mr-2" />Visível</>
                            ) : (
                                <><EyeOff size={16} className="inline mr-2" />Oculto</>
                            )}
                        </button>
                        {expandedSections[sectionKey] ? (
                            <ChevronUp size={20} className="text-slate-400" />
                        ) : (
                            <ChevronDown size={20} className="text-slate-400" />
                        )}
                    </div>
                </div>
            </div>
            {expandedSections[sectionKey] && (
                <div className="p-6 space-y-6">
                    {children}
                </div>
            )}
        </Card>
    );

    if (loading) {
        return (
            <div className="py-20 text-center">
                <Loader2 size={40} className="animate-spin text-brand-600 mx-auto mb-4" />
                <p className="text-slate-400 italic">Carregando configurações...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white p-8 rounded-2xl shadow-xl">
                <div>
                    <h2 className="text-3xl font-black mb-2">Configurações da Página Inicial</h2>
                    <p className="text-brand-100">Personalize completamente o conteúdo e aparência da landing page pública</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                        <Eye size={18} />
                        Pré-visualizar
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-white text-brand-600 hover:bg-slate-50"
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Salvar Alterações
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                    <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-blue-900 mb-1">Dica de Uso</p>
                        <p className="text-sm text-blue-700">
                            Clique em cada seção para expandir e editar. Use os botões "Visível/Oculto" para controlar quais seções aparecem na página.
                            Não esqueça de salvar suas alterações ao finalizar!
                        </p>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <SectionCard
                title="Seção Hero (Principal)"
                description="A primeira impressão - título, subtítulo e imagem de destaque"
                icon={Star}
                sectionKey="hero"
            >
                <Input
                    label={
                        <span className="flex items-center">
                            Título Principal
                            <Tooltip text="O título principal que aparece no topo da página" />
                        </span>
                    }
                    value={config.hero_title}
                    onChange={(e) => setConfig({ ...config, hero_title: e.target.value })}
                    placeholder="Ex: ABCUNA - Associação Brasileira..."
                />

                <Textarea
                    label={
                        <span className="flex items-center">
                            Subtítulo
                            <Tooltip text="Descrição breve que complementa o título principal" />
                        </span>
                    }
                    value={config.hero_subtitle}
                    onChange={(e) => setConfig({ ...config, hero_subtitle: e.target.value })}
                    placeholder="Descrição breve do propósito da associação"
                    rows={3}
                />

                <Input
                    label={
                        <span className="flex items-center">
                            Texto do Badge
                            <Tooltip text="Pequeno texto que aparece acima do título (ex: 'Salvando vidas desde sempre')" />
                        </span>
                    }
                    value={config.hero_badge_text || ''}
                    onChange={(e) => setConfig({ ...config, hero_badge_text: e.target.value })}
                    placeholder="Ex: Salvando vidas desde sempre"
                />

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Imagem Hero
                        <Tooltip text="Imagem principal que aparece ao lado do título (recomendado: 800x800px)" />
                    </label>
                    <div className="flex items-center gap-4">
                        {config.hero_image_url && (
                            <div className="w-32 h-32 rounded-lg overflow-hidden border border-slate-200">
                                <img
                                    src={config.hero_image_url}
                                    alt="Hero"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1">
                            <label className="cursor-pointer">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700">
                                    <Upload size={16} />
                                    {uploading ? 'Enviando...' : 'Escolher Imagem'}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'hero')}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                            <p className="text-xs text-slate-500 mt-2">Máximo 5MB. Formatos: JPG, PNG, WebP</p>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* About Section */}
            <SectionCard
                title="Sobre a Associação"
                description="Missão, visão, valores e texto institucional"
                icon={Info}
                sectionKey="about"
            >
                <Input
                    label="Título da Seção"
                    value={config.about_title || ''}
                    onChange={(e) => setConfig({ ...config, about_title: e.target.value })}
                    placeholder="Ex: Sobre a Associação"
                />

                <Textarea
                    label="Texto Institucional"
                    value={config.about_text}
                    onChange={(e) => setConfig({ ...config, about_text: e.target.value })}
                    placeholder="Descrição completa sobre a associação"
                    rows={4}
                />

                <div className="grid md:grid-cols-3 gap-6">
                    <Textarea
                        label="Missão"
                        value={config.mission_text}
                        onChange={(e) => setConfig({ ...config, mission_text: e.target.value })}
                        placeholder="Nossa missão..."
                        rows={4}
                    />

                    <Textarea
                        label="Visão"
                        value={config.vision_text}
                        onChange={(e) => setConfig({ ...config, vision_text: e.target.value })}
                        placeholder="Nossa visão..."
                        rows={4}
                    />

                    <Textarea
                        label="Valores"
                        value={config.values_text}
                        onChange={(e) => setConfig({ ...config, values_text: e.target.value })}
                        placeholder="Nossos valores..."
                        rows={4}
                    />
                </div>
            </SectionCard>

            {/* Statistics Section */}
            <SectionCard
                title="Estatísticas"
                description="Números e conquistas da organização"
                icon={TrendingUp}
                sectionKey="stats"
            >
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-600">Adicione estatísticas para destacar conquistas</p>
                    <Button
                        onClick={addStat}
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Adicionar Estatística
                    </Button>
                </div>

                {config.stats && config.stats.length > 0 ? (
                    <div className="space-y-4">
                        {config.stats.map((stat, index) => (
                            <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="flex items-start justify-between mb-3">
                                    <p className="text-sm font-semibold text-slate-700">Estatística #{index + 1}</p>
                                    <button
                                        onClick={() => removeStat(index)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="grid md:grid-cols-3 gap-3">
                                    <Input
                                        label="Valor"
                                        value={stat.value}
                                        onChange={(e) => updateStat(index, 'value', e.target.value)}
                                        placeholder="Ex: 10.000+"
                                    />
                                    <Input
                                        label="Rótulo"
                                        value={stat.label}
                                        onChange={(e) => updateStat(index, 'label', e.target.value)}
                                        placeholder="Ex: Vidas Salvas"
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Ícone</label>
                                        <select
                                            value={stat.icon || 'activity'}
                                            onChange={(e) => updateStat(index, 'icon', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                        >
                                            <option value="users">Usuários</option>
                                            <option value="award">Prêmio</option>
                                            <option value="shield">Escudo</option>
                                            <option value="activity">Atividade</option>
                                            <option value="trending">Tendência</option>
                                            <option value="check">Check</option>
                                            <option value="zap">Raio</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                        <TrendingUp size={40} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-500 font-medium">Nenhuma estatística adicionada</p>
                        <p className="text-sm text-slate-400 mt-1">Clique em "Adicionar Estatística" para começar</p>
                    </div>
                )}
            </SectionCard>

            {/* Services Section */}
            <SectionCard
                title="Serviços"
                description="Serviços e soluções oferecidas"
                icon={Award}
                sectionKey="services"
            >
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <Input
                        label="Título da Seção"
                        value={config.services_title || ''}
                        onChange={(e) => setConfig({ ...config, services_title: e.target.value })}
                        placeholder="Ex: O que Oferecemos"
                    />
                    <Input
                        label="Subtítulo da Seção"
                        value={config.services_subtitle || ''}
                        onChange={(e) => setConfig({ ...config, services_subtitle: e.target.value })}
                        placeholder="Ex: Soluções completas para..."
                    />
                </div>

                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-600">Adicione os serviços oferecidos</p>
                    <Button
                        onClick={addService}
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Adicionar Serviço
                    </Button>
                </div>

                {config.services && config.services.length > 0 ? (
                    <div className="space-y-4">
                        {config.services.map((service, index) => (
                            <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="flex items-start justify-between mb-3">
                                    <p className="text-sm font-semibold text-slate-700">Serviço #{index + 1}</p>
                                    <button
                                        onClick={() => removeService(index)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <Input
                                        label="Título"
                                        value={service.title}
                                        onChange={(e) => updateService(index, 'title', e.target.value)}
                                        placeholder="Ex: Atendimento Pré-Hospitalar"
                                    />
                                    <Textarea
                                        label="Descrição"
                                        value={service.description}
                                        onChange={(e) => updateService(index, 'description', e.target.value)}
                                        placeholder="Descrição do serviço..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                        <Award size={40} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-500 font-medium">Nenhum serviço adicionado</p>
                        <p className="text-sm text-slate-400 mt-1">Clique em "Adicionar Serviço" para começar</p>
                    </div>
                )}
            </SectionCard>

            {/* Testimonials Section */}
            <SectionCard
                title="Depoimentos"
                description="Avaliações e feedbacks de clientes"
                icon={MessageSquare}
                sectionKey="testimonials"
            >
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <Input
                        label="Título da Seção"
                        value={config.testimonials_title || ''}
                        onChange={(e) => setConfig({ ...config, testimonials_title: e.target.value })}
                        placeholder="Ex: O que dizem sobre nós"
                    />
                    <Input
                        label="Subtítulo da Seção"
                        value={config.testimonials_subtitle || ''}
                        onChange={(e) => setConfig({ ...config, testimonials_subtitle: e.target.value })}
                        placeholder="Ex: Veja o que nossos parceiros..."
                    />
                </div>

                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-600">Adicione depoimentos de clientes e parceiros</p>
                    <Button
                        onClick={addTestimonial}
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Adicionar Depoimento
                    </Button>
                </div>

                {config.testimonials && config.testimonials.length > 0 ? (
                    <div className="space-y-4">
                        {config.testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="flex items-start justify-between mb-3">
                                    <p className="text-sm font-semibold text-slate-700">Depoimento #{index + 1}</p>
                                    <button
                                        onClick={() => removeTestimonial(index)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="grid md:grid-cols-2 gap-3 mb-3">
                                    <Input
                                        label="Nome"
                                        value={testimonial.name}
                                        onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                                        placeholder="Ex: Maria Silva"
                                    />
                                    <Input
                                        label="Cargo/Função"
                                        value={testimonial.role}
                                        onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                                        placeholder="Ex: Coordenadora de Eventos"
                                    />
                                </div>
                                <Textarea
                                    label="Depoimento"
                                    value={testimonial.content}
                                    onChange={(e) => updateTestimonial(index, 'content', e.target.value)}
                                    placeholder="O depoimento completo..."
                                    rows={3}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                        <MessageSquare size={40} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-500 font-medium">Nenhum depoimento adicionado</p>
                        <p className="text-sm text-slate-400 mt-1">Clique em "Adicionar Depoimento" para começar</p>
                    </div>
                )}
            </SectionCard>

            {/* Gallery Section */}
            <SectionCard
                title="Galeria de Imagens"
                description="Fotos e imagens da organização"
                icon={ImageIcon}
                sectionKey="gallery"
            >
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <Input
                        label="Título da Seção"
                        value={config.gallery_title || ''}
                        onChange={(e) => setConfig({ ...config, gallery_title: e.target.value })}
                        placeholder="Ex: Nossa Galeria"
                    />
                    <Input
                        label="Subtítulo da Seção"
                        value={config.gallery_subtitle || ''}
                        onChange={(e) => setConfig({ ...config, gallery_subtitle: e.target.value })}
                        placeholder="Ex: Conheça um pouco mais..."
                    />
                </div>

                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-600">Adicione imagens para a galeria</p>
                    <label className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors text-sm font-medium">
                            <Plus size={16} />
                            Adicionar Imagem
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'gallery')}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                </div>

                {config.gallery_images.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                        <ImageIcon size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500 font-medium">Nenhuma imagem na galeria</p>
                        <p className="text-sm text-slate-400 mt-1">Adicione imagens para exibir na página inicial</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {config.gallery_images.map((image, index) => (
                            <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border border-slate-200">
                                <img
                                    src={image}
                                    alt={`Galeria ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => removeGalleryImage(index)}
                                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>

            {/* Contact Section */}
            <SectionCard
                title="Informações de Contato"
                description="Telefone, e-mail, endereço e redes sociais"
                icon={Phone}
                sectionKey="contact"
            >
                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Phone size={16} />
                            Informações de Contato
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input
                                label="Telefone"
                                value={config.contact?.phone || ''}
                                onChange={(e) => setConfig({
                                    ...config,
                                    contact: { ...config.contact, phone: e.target.value }
                                })}
                                placeholder="(11) 1234-5678"
                            />
                            <Input
                                label="E-mail"
                                value={config.contact?.email || ''}
                                onChange={(e) => setConfig({
                                    ...config,
                                    contact: { ...config.contact, email: e.target.value }
                                })}
                                placeholder="contato@abcuna.org.br"
                            />
                            <Input
                                label="Endereço"
                                value={config.contact?.address || ''}
                                onChange={(e) => setConfig({
                                    ...config,
                                    contact: { ...config.contact, address: e.target.value }
                                })}
                                placeholder="Rua Exemplo, 123 - São Paulo, SP"
                            />
                            <Input
                                label="Horário de Atendimento"
                                value={config.contact?.workingHours || ''}
                                onChange={(e) => setConfig({
                                    ...config,
                                    contact: { ...config.contact, workingHours: e.target.value }
                                })}
                                placeholder="Seg-Sex: 8h-18h"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200">
                        <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Instagram size={16} />
                            Redes Sociais
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input
                                label={<span className="flex items-center gap-2"><Facebook size={14} /> Facebook</span>}
                                value={config.social?.facebook || ''}
                                onChange={(e) => setConfig({
                                    ...config,
                                    social: { ...config.social, facebook: e.target.value }
                                })}
                                placeholder="https://facebook.com/abcuna"
                            />
                            <Input
                                label={<span className="flex items-center gap-2"><Instagram size={14} /> Instagram</span>}
                                value={config.social?.instagram || ''}
                                onChange={(e) => setConfig({
                                    ...config,
                                    social: { ...config.social, instagram: e.target.value }
                                })}
                                placeholder="https://instagram.com/abcuna"
                            />
                            <Input
                                label={<span className="flex items-center gap-2"><Twitter size={14} /> Twitter</span>}
                                value={config.social?.twitter || ''}
                                onChange={(e) => setConfig({
                                    ...config,
                                    social: { ...config.social, twitter: e.target.value }
                                })}
                                placeholder="https://twitter.com/abcuna"
                            />
                            <Input
                                label={<span className="flex items-center gap-2"><Linkedin size={14} /> LinkedIn</span>}
                                value={config.social?.linkedin || ''}
                                onChange={(e) => setConfig({
                                    ...config,
                                    social: { ...config.social, linkedin: e.target.value }
                                })}
                                placeholder="https://linkedin.com/company/abcuna"
                            />
                            <Input
                                label={<span className="flex items-center gap-2"><Youtube size={14} /> YouTube</span>}
                                value={config.social?.youtube || ''}
                                onChange={(e) => setConfig({
                                    ...config,
                                    social: { ...config.social, youtube: e.target.value }
                                })}
                                placeholder="https://youtube.com/@abcuna"
                            />
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* CTA Section */}
            <SectionCard
                title="Call-to-Action (CTA)"
                description="Chamada final para ação"
                icon={Star}
                sectionKey="cta"
            >
                <div className="space-y-4">
                    <Input
                        label="Título do CTA"
                        value={config.cta_title || ''}
                        onChange={(e) => setConfig({ ...config, cta_title: e.target.value })}
                        placeholder="Ex: Pronto para fazer a diferença?"
                    />
                    <Textarea
                        label="Subtítulo do CTA"
                        value={config.cta_subtitle || ''}
                        onChange={(e) => setConfig({ ...config, cta_subtitle: e.target.value })}
                        placeholder="Ex: Junte-se à nossa equipe..."
                        rows={3}
                    />
                    <Input
                        label="Texto do Botão"
                        value={config.cta_button_text || ''}
                        onChange={(e) => setConfig({ ...config, cta_button_text: e.target.value })}
                        placeholder="Ex: Acessar o Sistema"
                    />
                </div>
            </SectionCard>

            {/* Theme Customization */}
            <SectionCard
                title="Personalização de Cores"
                description="Customize as cores do tema da página"
                icon={Palette}
                sectionKey="theme"
            >
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg mb-6">
                    <div className="flex items-start gap-3">
                        <Info size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-amber-900 mb-1">Recurso Avançado</p>
                            <p className="text-sm text-amber-700">
                                As cores personalizadas serão aplicadas em breve. Por enquanto, a página usa as cores padrão do sistema.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Cor Primária</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={config.theme?.primaryColor || '#dc2626'}
                                onChange={(e) => setConfig({
                                    ...config,
                                    theme: { ...config.theme, primaryColor: e.target.value }
                                })}
                                className="w-16 h-16 rounded-lg border-2 border-slate-300 cursor-pointer"
                            />
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{config.theme?.primaryColor || '#dc2626'}</p>
                                <p className="text-xs text-slate-500">Cor principal do tema</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Cor Secundária</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={config.theme?.secondaryColor || '#1e293b'}
                                onChange={(e) => setConfig({
                                    ...config,
                                    theme: { ...config.theme, secondaryColor: e.target.value }
                                })}
                                className="w-16 h-16 rounded-lg border-2 border-slate-300 cursor-pointer"
                            />
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{config.theme?.secondaryColor || '#1e293b'}</p>
                                <p className="text-xs text-slate-500">Cor secundária</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Cor de Destaque</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={config.theme?.accentColor || '#f59e0b'}
                                onChange={(e) => setConfig({
                                    ...config,
                                    theme: { ...config.theme, accentColor: e.target.value }
                                })}
                                className="w-16 h-16 rounded-lg border-2 border-slate-300 cursor-pointer"
                            />
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{config.theme?.accentColor || '#f59e0b'}</p>
                                <p className="text-xs text-slate-500">Cor de destaque</p>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Save Button (Bottom) */}
            <div className="flex justify-end pt-6 border-t border-slate-200">
                <Button
                    onClick={handleSave}
                    size="lg"
                    className="flex items-center gap-2"
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Salvando Alterações...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Salvar Todas as Alterações
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
