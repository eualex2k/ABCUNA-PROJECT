import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { landingPageService } from '../services/landingPage';
import { LandingPageConfig } from '../types';
import {
    Phone, Mail, MapPin, Facebook, Instagram, Linkedin,
    ChevronRight, ArrowRight, Shield, Heart, Activity,
    Users, Clock, CheckCircle2, Award, Calendar,
    FileText, UserPlus, Flame, Target, Eye, Briefcase
} from 'lucide-react';
import { LandingPageCarousel } from '../components/LandingPageCarousel';

type TabType = 'about' | 'services' | 'contact';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [config, setConfig] = useState<LandingPageConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('about');
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isExiting, setIsExiting] = useState(false); // Estado para animação de saída

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

    // Função para lidar com navegação suave
    const handleNavigation = () => {
        setIsExiting(true);
        // Espera a animação terminar (700ms corresponde ao duration-700 do CSS)
        setTimeout(() => {
            navigate('/auth');
        }, 600);
    };

    const defaultConfig: LandingPageConfig = {
        id: '',
        hero_title: 'ABCUNA',
        hero_subtitle: 'Excelência e compromisso em salvar vidas e servir a comunidade.',
        hero_badge_text: 'Desde 2020',
        hero_image_url: '',
        about_title: 'Nossa Essência',
        about_text: 'A ABCUNA é referência especializada em atendimento de emergência. A nossa equipe de elite combina técnica apurada e humanização para agir nos momentos mais críticos, garantindo segurança e suporte vital quando você mais precisa.',
        mission_text: 'Salvar vidas com excelência técnica e rapidez.',
        vision_text: 'Ser a principal referência em APH na região.',
        values_text: 'Ética, Coragem, Disciplina e Humanidade.',
        gallery_images: [
            'https://images.unsplash.com/photo-1587351021759-3e566b9ef922?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1516574187841-69301976e499?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=1000'
        ],
        stats: [],
        services: [
            { title: 'Atendimento APH', description: 'Suporte avançado de vida 24h com UTIs móveis equipadas.', icon: 'activity' },
            { title: 'Formação', description: 'Cursos técnicos certificadores para profissionais e leigos.', icon: 'award' },
            { title: 'Eventos', description: 'Cobertura médica completa e segurança para grandes eventos.', icon: 'calendar' },
            { title: 'Consultoria', description: 'Gestão de riscos, planos de emergência e auditorias.', icon: 'briefcase' }
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
        cta_button_text: 'Área do Cliente',
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
                            <Activity className="text-red-700" size={24} />
                            Nossos Serviços
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-2 pb-4 scrollbar-hide h-full content-start">
                            {displayConfig.services?.map((service, idx) => (
                                <div key={idx} className="group p-5 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md hover:border-red-100 transition-all">
                                    <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                        {idx === 0 && <Activity size={20} />}
                                        {idx === 1 && <Award size={20} />}
                                        {idx === 2 && <Calendar size={20} />}
                                        {idx === 3 && <Briefcase size={20} />}
                                        {idx > 3 && <Target size={20} />}
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
                            <Phone className="text-red-700" size={24} />
                            Fale Conosco
                        </h2>

                        <div className="space-y-4 mb-4 overflow-y-auto pr-2 pb-2 scrollbar-hide">
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

                        <div className="mt-auto pt-4 border-t border-slate-100">
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
                            <Target className="text-red-700" size={24} />
                            {displayConfig.about_title}
                        </h2>

                        <div className="overflow-y-auto pr-2 pb-4 scrollbar-hide flex-1">
                            <p className="text-sm text-slate-600 leading-relaxed mb-6 border-l-4 border-red-500 pl-4 text-justify">
                                {displayConfig.about_text}
                            </p>

                            {/* Carousel Section */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <FileText size={16} className="text-red-600" />
                                    Galeria da Associação
                                </h3>
                                <LandingPageCarousel images={displayConfig.gallery_images || []} />
                            </div>

                            {/* Mission, Vision, Values - Realigned */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-auto">
                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 hover:border-red-100 hover:shadow-sm transition-all flex flex-col h-full">
                                    <div className="flex items-center gap-2 mb-3 text-red-700">
                                        <Target size={20} />
                                        <h3 className="font-bold text-xs uppercase tracking-wider">Missão</h3>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed flex-1">{displayConfig.mission_text}</p>
                                </div>

                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 hover:border-red-100 hover:shadow-sm transition-all flex flex-col h-full">
                                    <div className="flex items-center gap-2 mb-3 text-slate-700">
                                        <Eye size={20} />
                                        <h3 className="font-bold text-xs uppercase tracking-wider">Visão</h3>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed flex-1">{displayConfig.vision_text}</p>
                                </div>

                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 hover:border-red-100 hover:shadow-sm transition-all flex flex-col h-full">
                                    <div className="flex items-center gap-2 mb-3 text-slate-700">
                                        <Heart size={20} />
                                        <h3 className="font-bold text-xs uppercase tracking-wider">Valores</h3>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed flex-1">{displayConfig.values_text}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        // Container Principal com animação de saída condicional
        <div className={`min-h-screen lg:h-screen w-full bg-[#0f172a] text-slate-900 flex items-center justify-center p-0 sm:p-4 lg:p-8 overflow-y-auto lg:overflow-hidden font-sans transition-all duration-700 ease-in-out transform ${isExiting ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100'}`}>
            <div className="w-full max-w-6xl h-auto lg:h-full lg:max-h-[85vh] bg-white lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row ring-1 ring-white/10">

                {/* Left Panel - Hero Identity (40%) */}
                <div className="lg:w-[40%] bg-gradient-to-br from-red-700 to-slate-900 text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
                    {/* Background Pattern */}
                    {displayConfig.hero_image_url ? (
                        <div className="absolute inset-0">
                            <img src={displayConfig.hero_image_url} alt="Hero Background" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-red-900/40 to-slate-900/30"></div>
                        </div>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjFmIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10"></div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
                        </>
                    )}

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
                        <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-4 drop-shadow-lg">
                            {displayConfig.hero_title}
                        </h1>
                        <p className="text-base text-slate-100 font-light leading-relaxed max-w-sm drop-shadow-md">
                            {displayConfig.hero_subtitle}
                        </p>
                    </div>

                    {/* Footer / CTA */}
                    <div className="relative z-10">
                        <button
                            onClick={handleNavigation}
                            className="group w-full sm:w-auto px-6 py-3.5 bg-white text-red-700 font-bold text-sm rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {displayConfig.cta_button_text}
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="mt-6 text-[10px] text-slate-300 opacity-60 uppercase tracking-widest text-center lg:text-left">
                            © {new Date().getFullYear()} ABCUNA • Sistema Integrado
                        </p>
                    </div>
                </div>

                {/* Right Panel - Content Tabs (60%) */}
                <div className="lg:w-[60%] bg-white flex flex-col relative">
                    {/* Tab Navigation */}
                    <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
                            {(['about', 'services', 'contact'] as TabType[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                        px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                                        ${activeTab === tab
                                            ? 'bg-white text-red-700 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}
                                    `}
                                >
                                    {tab === 'about' && 'Sobre'}
                                    {tab === 'services' && 'Serviços'}
                                    {tab === 'contact' && 'Contato'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-8 overflow-hidden relative">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};
