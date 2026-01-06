import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Flame, ArrowRight, Target, Eye, Heart,
    Phone, Mail, MapPin,
    Facebook, Instagram, Linkedin,
    Activity, Award, Calendar, Briefcase
} from 'lucide-react';
import { landingPageService } from '../services/landingPage';
import { LandingPageConfig } from '../types';

type TabType = 'about' | 'services' | 'contact';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [config, setConfig] = useState<LandingPageConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('about');

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
        hero_subtitle: 'Excelência e compromisso em salvar vidas e servir a comunidade.',
        hero_badge_text: 'Desde 2020',
        hero_image_url: '',
        about_title: 'Nossa Essência',
        about_text: 'A ABCUNA é referência especializada em atendimento de emergência. Nossa equipe de elite combina técnica apurada e humanização para agir nos momentos mais críticos.',
        mission_text: 'Salvar vidas com excelência técnica e rapidez.',
        vision_text: 'Ser a principal referência em APH na região.',
        values_text: 'Ética, Coragem, Disciplina e Humanidade.',
        gallery_images: [],
        stats: [],
        services: [
            { title: 'Atendimento APH', description: 'Suporte avançado de vida 24h.', icon: 'activity' },
            { title: 'Formação', description: 'Cursos técnicos certificadores.', icon: 'award' },
            { title: 'Cobertura', description: 'Segurança médica para eventos.', icon: 'calendar' },
            { title: 'Consultoria', description: 'Gestão de riscos e emergências.', icon: 'briefcase' }
        ],
        testimonials: [],
        contact: {
            phone: '(32) 99888-7766',
            email: 'contato@abcuna.org.br',
            address: 'Centro, Ubá - MG',
            workingHours: '24 Horas / 7 Dias'
        },
        social: {
            facebook: '#',
            instagram: '#',
            linkedin: '#'
        },
        cta_title: 'Junte-se a Nós',
        cta_subtitle: '',
        cta_button_text: 'Área do Associado',
        sections_visibility: {
            hero: true,
            about: true,
            stats: false,
            services: true,
            testimonials: false,
            gallery: false,
            contact: true,
            cta: true
        }
    };

    const displayConfig = config || defaultConfig;

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-900">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'services':
                return (
                    <div className="h-full flex flex-col animate-fadeIn">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Activity className="text-red-600" size={24} />
                            Nossos Serviços
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-2 pb-4 scrollbar-hide">
                            {displayConfig.services?.map((service, idx) => (
                                <div key={idx} className="group p-5 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md hover:border-red-100 transition-all">
                                    <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                        {idx === 0 && <Activity size={20} />}
                                        {idx === 1 && <Award size={20} />}
                                        {idx === 2 && <Calendar size={20} />}
                                        {idx === 3 && <Briefcase size={20} />}
                                    </div>
                                    <h3 className="font-bold text-slate-800 mb-1">{service.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">{service.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'contact':
                return (
                    <div className="h-full flex flex-col animate-fadeIn">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Phone className="text-red-600" size={24} />
                            Fale Conosco
                        </h2>

                        <div className="space-y-4 mb-8">
                            {displayConfig.contact?.phone && (
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-red-200 transition-colors">
                                    <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center text-red-600">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefone</p>
                                        <p className="text-slate-800 font-medium text-sm">{displayConfig.contact.phone}</p>
                                    </div>
                                </div>
                            )}

                            {displayConfig.contact?.email && (
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-red-200 transition-colors">
                                    <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center text-red-600">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mail</p>
                                        <p className="text-slate-800 font-medium text-sm">{displayConfig.contact.email}</p>
                                    </div>
                                </div>
                            )}

                            {displayConfig.contact?.address && (
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-red-200 transition-colors">
                                    <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center text-red-600">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Localização</p>
                                        <p className="text-slate-800 font-medium text-sm">{displayConfig.contact.address}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto">
                            <p className="text-xs font-semibold text-slate-600 mb-4 uppercase tracking-wider">Redes Sociais</p>
                            <div className="flex gap-3">
                                {displayConfig.social?.facebook && (
                                    <a href={displayConfig.social.facebook} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-[#1877F2] text-white rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm">
                                        <Facebook size={18} /> <span className="text-sm font-medium">Facebook</span>
                                    </a>
                                )}
                                {displayConfig.social?.instagram && (
                                    <a href={displayConfig.social.instagram} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm">
                                        <Instagram size={18} /> <span className="text-sm font-medium">Instagram</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'about':
            default:
                return (
                    <div className="h-full flex flex-col animate-fadeIn">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Target className="text-red-600" size={24} />
                            {displayConfig.about_title}
                        </h2>

                        <p className="text-sm text-slate-600 leading-relaxed mb-8 border-l-4 border-red-500 pl-4">
                            {displayConfig.about_text}
                        </p>

                        <div className="grid gap-4 mt-auto">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-red-100 transition-colors">
                                <div className="flex items-center gap-2 mb-2 text-red-700">
                                    <Target size={18} />
                                    <h3 className="font-bold text-xs uppercase tracking-wider">Missão</h3>
                                </div>
                                <p className="text-xs text-slate-600">{displayConfig.mission_text}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-red-100 transition-colors">
                                    <div className="flex items-center gap-2 mb-2 text-slate-700">
                                        <Eye size={18} />
                                        <h3 className="font-bold text-xs uppercase tracking-wider">Visão</h3>
                                    </div>
                                    <p className="text-[10px] text-slate-600 leading-snug">{displayConfig.vision_text}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-red-100 transition-colors">
                                    <div className="flex items-center gap-2 mb-2 text-slate-700">
                                        <Heart size={18} />
                                        <h3 className="font-bold text-xs uppercase tracking-wider">Valores</h3>
                                    </div>
                                    <p className="text-[10px] text-slate-600 leading-snug">{displayConfig.values_text}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="h-screen w-full bg-[#0f172a] text-slate-900 flex items-center justify-center p-4 lg:p-8 overflow-hidden font-sans">
            <div className="w-full max-w-6xl h-full max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row ring-1 ring-white/10">

                {/* Left Panel - Hero Identity (40%) */}
                <div className="lg:w-[40%] bg-gradient-to-br from-red-700 to-slate-900 text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjFmIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>

                    {/* Header Logo */}
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
                            <Flame size={20} className="text-white" fill="currentColor" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">ABCUNA</span>
                    </div>

                    {/* Main Hero Content */}
                    <div className="relative z-10 my-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-[10px] font-medium mb-6 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            {displayConfig.hero_badge_text}
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
                            {displayConfig.hero_title}
                        </h1>
                        <p className="text-base text-slate-300 leading-relaxed max-w-sm">
                            {displayConfig.hero_subtitle}
                        </p>
                    </div>

                    {/* Footer / CTA */}
                    <div className="relative z-10">
                        <button
                            onClick={() => navigate('/auth')}
                            className="group w-full sm:w-auto px-6 py-3.5 bg-white text-red-700 font-bold text-sm rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {displayConfig.cta_button_text}
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="mt-6 text-[10px] text-slate-400 opacity-60 uppercase tracking-widest text-center lg:text-left">
                            © {new Date().getFullYear()} ABCUNA • Sistema Integrado
                        </p>
                    </div>
                </div>

                {/* Right Panel - Interactive Content (60%) */}
                <div className="lg:w-[60%] bg-white flex flex-col relative z-20">
                    {/* Navigation Tabs */}
                    <div className="flex border-b border-slate-100 px-8 pt-8 bg-white sticky top-0 z-30">
                        <button
                            onClick={() => setActiveTab('about')}
                            className={`pb-4 px-4 text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === 'about'
                                    ? 'text-red-700'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Sobre
                            {activeTab === 'about' && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-700 rounded-t-full transition-all"></span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('services')}
                            className={`pb-4 px-4 text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === 'services'
                                    ? 'text-red-700'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Serviços
                            {activeTab === 'services' && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-700 rounded-t-full transition-all"></span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('contact')}
                            className={`pb-4 px-4 text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === 'contact'
                                    ? 'text-red-700'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            Contato
                            {activeTab === 'contact' && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-700 rounded-t-full transition-all"></span>
                            )}
                        </button>
                    </div>

                    {/* Dynamic Content Area */}
                    <div className="flex-1 p-8 overflow-hidden relative">
                        {renderContent()}
                    </div>
                </div>
            </div>

            {/* Global Style for fades */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};
