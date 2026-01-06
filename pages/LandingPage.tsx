import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Flame, ArrowRight, Target, Eye, Heart,
    Users, Award, Shield, Phone, Mail, MapPin,
    Facebook, Instagram, Twitter, Linkedin, Youtube, Star,
    TrendingUp, Activity, CheckCircle, Zap, Clock, Sparkles
} from 'lucide-react';
import { Button } from '../components/ui';
import { landingPageService } from '../services/landingPage';
import { LandingPageConfig } from '../types';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [config, setConfig] = useState<LandingPageConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const data = await landingPageService.get();
            setConfig(data);
        } catch (error) {
            console.error('Failed to load landing page config:', error);
        } finally {
            setLoading(false);
        }
    };

    const defaultConfig: LandingPageConfig = {
        id: '',
        hero_title: 'ABCUNA',
        hero_subtitle: 'Dedicados a salvar vidas e servir a comunidade com excelência, profissionalismo e compromisso social.',
        hero_badge_text: 'Salvando vidas desde sempre',
        hero_image_url: '',
        about_title: 'Sobre Nós',
        about_text: 'A ABCUNA é uma organização sem fins lucrativos dedicada ao atendimento de emergências e urgências médicas. Nossa equipe altamente qualificada trabalha incansavelmente para garantir atendimento rápido e eficiente à comunidade.',
        mission_text: 'Prestar serviços de atendimento pré-hospitalar com excelência, garantindo suporte imediato e qualificado em situações de emergência.',
        vision_text: 'Ser referência nacional em atendimento de urgência e emergência, reconhecida pela qualidade técnica e compromisso com a vida.',
        values_text: 'Ética, Profissionalismo, Compromisso Social, Excelência Técnica, Respeito à Vida',
        gallery_images: [],
        stats: [],
        services: [
            { title: 'Atendimento Pré-Hospitalar', description: 'Equipe especializada em atendimento de urgência e emergência, disponível 24/7.', icon: 'activity' },
            { title: 'Treinamentos e Capacitação', description: 'Cursos e treinamentos para formação de socorristas e profissionais de saúde.', icon: 'award' },
            { title: 'Eventos e Operações', description: 'Cobertura médica para eventos esportivos, culturais e corporativos.', icon: 'calendar' },
            { title: 'Consultoria em Saúde', description: 'Assessoria técnica para empresas e instituições em gestão de emergências.', icon: 'briefcase' }
        ],
        testimonials: [
            { name: 'Maria Silva', role: 'Coordenadora de Eventos', content: 'A ABCUNA prestou um serviço excepcional no nosso evento. Profissionalismo e dedicação incomparáveis!', avatar: '' },
            { name: 'João Santos', role: 'Gestor de RH', content: 'Os treinamentos oferecidos pela ABCUNA transformaram nossa equipe de segurança. Altamente recomendado!', avatar: '' },
            { name: 'Ana Costa', role: 'Diretora Escolar', content: 'Confiamos na ABCUNA para a segurança dos nossos alunos. Equipe sempre pronta e preparada.', avatar: '' }
        ],
        contact: {
            phone: '(11) 1234-5678',
            email: 'contato@abcuna.org.br',
            address: 'Rua Exemplo, 123 - São Paulo, SP',
            workingHours: 'Seg-Sex: 8h-18h | Emergências: 24/7'
        },
        social: {
            facebook: 'https://facebook.com/abcuna',
            instagram: 'https://instagram.com/abcuna',
            linkedin: 'https://linkedin.com/company/abcuna'
        },
        cta_title: 'Pronto para fazer a diferença?',
        cta_subtitle: 'Junte-se à nossa equipe e ajude a salvar vidas.',
        cta_button_text: 'Acessar o Sistema',
        sections_visibility: {
            hero: true,
            about: true,
            stats: false,
            services: true,
            testimonials: true,
            gallery: true,
            contact: true,
            cta: true
        }
    };

    const displayConfig = config || defaultConfig;

    const getIcon = (iconName: string, size: number = 24) => {
        const icons: { [key: string]: any } = {
            users: Users, award: Award, shield: Shield, activity: Activity,
            trending: TrendingUp, check: CheckCircle, zap: Zap, clock: Clock
        };
        const IconComponent = icons[iconName] || Activity;
        return <IconComponent size={size} />;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 to-slate-900">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-white font-medium">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
                                <Flame size={20} className="text-white" fill="currentColor" />
                            </div>
                            <span className="text-lg font-bold text-slate-900">ABCUNA</span>
                        </div>

                        <nav className="hidden md:flex items-center gap-8">
                            {displayConfig.sections_visibility.about && (
                                <button
                                    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
                                >
                                    Sobre
                                </button>
                            )}
                            {displayConfig.sections_visibility.services && (
                                <button
                                    onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
                                >
                                    Serviços
                                </button>
                            )}
                            {displayConfig.sections_visibility.contact && (
                                <button
                                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
                                >
                                    Contato
                                </button>
                            )}
                        </nav>

                        <button
                            onClick={() => navigate('/auth')}
                            className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-brand-600/40 transition-all hover:scale-105"
                        >
                            Entrar
                        </button>
                    </div>
                </div>
            </header>

            {displayConfig.sections_visibility.hero && (
                <section className="relative pt-20 pb-12 px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-red-600 to-slate-900">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]"></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full mb-4">
                                <Sparkles size={12} className="text-white" />
                                <span className="text-[10px] font-semibold text-white">
                                    {displayConfig.hero_badge_text || 'Salvando vidas desde sempre'}
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight">
                                {displayConfig.hero_title}
                            </h1>

                            <p className="text-base md:text-lg text-white/90 mb-6 leading-relaxed max-w-2xl">
                                {displayConfig.hero_subtitle}
                            </p>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => navigate('/auth')}
                                    className="px-6 py-2.5 bg-white text-red-600 font-bold text-sm rounded-xl hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-2"
                                >
                                    Acessar o Sistema
                                    <ArrowRight size={16} />
                                </button>
                                <button
                                    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-6 py-2.5 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold text-sm rounded-xl hover:bg-white/20 transition-all"
                                >
                                    Saiba mais
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {displayConfig.sections_visibility.about && (
                <section id="about" className="relative py-8 px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-white overflow-hidden">
                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 bg-gradient-to-r from-red-600 to-slate-800 bg-clip-text text-transparent">
                                    {displayConfig.about_title || 'Sobre Nós'}
                                </h2>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {displayConfig.about_text}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="relative p-4 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg shadow-red-600/20 text-white">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                            <Target size={16} className="text-white" />
                                        </div>
                                        <h3 className="text-sm font-bold">Missão</h3>
                                    </div>
                                    <p className="text-white/90 text-xs leading-relaxed">
                                        {displayConfig.mission_text}
                                    </p>
                                </div>

                                <div className="relative p-4 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-lg shadow-slate-700/20 text-white">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                            <Eye size={16} className="text-white" />
                                        </div>
                                        <h3 className="text-sm font-bold">Visão</h3>
                                    </div>
                                    <p className="text-white/90 text-xs leading-relaxed">
                                        {displayConfig.vision_text}
                                    </p>
                                </div>

                                <div className="relative p-4 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-lg shadow-slate-700/20 text-white">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                            <Heart size={16} className="text-white" />
                                        </div>
                                        <h3 className="text-sm font-bold">Valores</h3>
                                    </div>
                                    <p className="text-white/90 text-xs leading-relaxed">
                                        {displayConfig.values_text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {displayConfig.sections_visibility.services && displayConfig.services && displayConfig.services.length > 0 && (
                <section id="services" className="relative py-8 px-6 lg:px-8 bg-gradient-to-br from-white to-slate-50">
                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="text-center max-w-2xl mx-auto mb-6">
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 bg-gradient-to-r from-red-600 to-slate-800 bg-clip-text text-transparent">
                                {displayConfig.services_title || 'Nossos Serviços'}
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {displayConfig.services.slice(0, 2).map((service, index) => {
                                const gradients = [
                                    'from-red-600 to-red-700',
                                    'from-slate-700 to-slate-800'
                                ];
                                const shadows = [
                                    'shadow-red-600/20',
                                    'shadow-slate-700/20'
                                ];

                                return (
                                    <div
                                        key={index}
                                        className={`group relative p-4 bg-gradient-to-br ${gradients[index % 2]} rounded-xl shadow-lg ${shadows[index % 2]} hover:shadow-xl hover:scale-105 transition-all text-white`}
                                    >
                                        <h3 className="text-lg font-bold mb-2">
                                            {service.title}
                                        </h3>
                                        <p className="text-white/90 text-xs leading-relaxed">
                                            {service.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}



            {displayConfig.sections_visibility.gallery && displayConfig.gallery_images.length > 0 && (
                <section className="py-24 px-6 lg:px-8 bg-gradient-to-br from-white to-slate-50">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-12 text-center bg-gradient-to-r from-red-600 to-slate-800 bg-clip-text text-transparent">
                            {displayConfig.gallery_title || 'Galeria'}
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {displayConfig.gallery_images.map((image, index) => (
                                <div
                                    key={index}
                                    className="aspect-square rounded-2xl overflow-hidden bg-slate-200 hover:shadow-2xl hover:scale-105 transition-all"
                                >
                                    <img
                                        src={image}
                                        alt={`Galeria ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {displayConfig.sections_visibility.contact && displayConfig.contact && (
                <section id="contact" className="relative py-8 px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-white">
                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 bg-gradient-to-r from-red-600 to-slate-800 bg-clip-text text-transparent">
                                    Entre em Contato
                                </h2>

                                {displayConfig.social && (
                                    <div className="flex items-center gap-2">
                                        {displayConfig.social.facebook && (
                                            <a href={displayConfig.social.facebook} target="_blank" rel="noopener noreferrer"
                                                className="w-9 h-9 bg-gradient-to-br from-slate-700 to-slate-800 hover:scale-110 rounded-lg flex items-center justify-center text-white transition-all shadow-md shadow-slate-700/30">
                                                <Facebook size={16} />
                                            </a>
                                        )}
                                        {displayConfig.social.instagram && (
                                            <a href={displayConfig.social.instagram} target="_blank" rel="noopener noreferrer"
                                                className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-700 hover:scale-110 rounded-lg flex items-center justify-center text-white transition-all shadow-md shadow-red-600/30">
                                                <Instagram size={16} />
                                            </a>
                                        )}
                                        {displayConfig.social.linkedin && (
                                            <a href={displayConfig.social.linkedin} target="_blank" rel="noopener noreferrer"
                                                className="w-9 h-9 bg-gradient-to-br from-slate-700 to-slate-800 hover:scale-110 rounded-lg flex items-center justify-center text-white transition-all shadow-md shadow-slate-700/30">
                                                <Linkedin size={16} />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {displayConfig.contact.phone && (
                                    <div className="flex items-start gap-2 p-3 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-md shadow-red-600/20 text-white">
                                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Phone size={14} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-xs mb-0.5">Telefone</p>
                                            <p className="text-white/90 text-[10px]">{displayConfig.contact.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {displayConfig.contact.email && (
                                    <div className="flex items-start gap-2 p-3 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-md shadow-slate-700/20 text-white">
                                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Mail size={14} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-xs mb-0.5">E-mail</p>
                                            <p className="text-white/90 text-[10px]">{displayConfig.contact.email}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {displayConfig.sections_visibility.cta && (
                <section className="relative py-12 px-6 lg:px-8 bg-gradient-to-br from-slate-900 to-red-900 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]"></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>

                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                            {displayConfig.cta_title || 'Pronto para fazer a diferença?'}
                        </h2>
                        <p className="text-base md:text-lg text-white/80 mb-6 max-w-2xl mx-auto">
                            {displayConfig.cta_subtitle || 'Junte-se à nossa equipe e ajude a salvar vidas.'}
                        </p>
                        <button
                            onClick={() => navigate('/auth')}
                            className="px-6 py-3 bg-white text-slate-900 font-bold text-sm rounded-xl hover:shadow-2xl hover:scale-110 transition-all inline-flex items-center gap-2"
                        >
                            {displayConfig.cta_button_text || 'Acessar o Sistema'}
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </section>
            )}

            <footer className="py-6 px-6 lg:px-8 bg-slate-900 border-t border-slate-800">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-brand-600 to-brand-700 rounded-lg flex items-center justify-center shadow-md shadow-brand-600/20">
                                <Flame size={16} className="text-white" fill="currentColor" />
                            </div>
                            <span className="text-sm font-bold text-white">ABCUNA</span>
                        </div>
                        <p className="text-xs text-slate-400">
                            © {new Date().getFullYear()} ABCUNA. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
