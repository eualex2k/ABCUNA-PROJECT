import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Flame, ArrowRight, Target, Eye, Heart, ChevronRight,
    Users, Award, Clock, Shield, Phone, Mail, MapPin,
    Facebook, Instagram, Twitter, Linkedin, Youtube, Star,
    TrendingUp, Activity, CheckCircle, Zap
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

    // Default content if no config is available
    const defaultConfig: LandingPageConfig = {
        id: '',
        hero_title: 'ABCUNA - Associação Brasileira de Combate a Urgências e Necessidades Assistenciais',
        hero_subtitle: 'Dedicados a salvar vidas e servir a comunidade com excelência, profissionalismo e compromisso social.',
        hero_badge_text: 'Salvando vidas desde sempre',
        hero_image_url: '',
        about_title: 'Sobre a Associação',
        about_text: 'A ABCUNA é uma organização sem fins lucrativos dedicada ao atendimento de emergências e urgências médicas. Nossa equipe altamente qualificada trabalha incansavelmente para garantir atendimento rápido e eficiente à comunidade.',
        mission_text: 'Prestar serviços de atendimento pré-hospitalar com excelência, garantindo suporte imediato e qualificado em situações de emergência.',
        vision_text: 'Ser referência nacional em atendimento de urgência e emergência, reconhecida pela qualidade técnica e compromisso com a vida.',
        values_text: 'Ética, Profissionalismo, Compromisso Social, Excelência Técnica, Respeito à Vida',
        gallery_images: [],
        stats: [
            { label: 'Vidas Salvas', value: '10.000+', icon: 'users' },
            { label: 'Anos de Experiência', value: '15+', icon: 'award' },
            { label: 'Profissionais', value: '200+', icon: 'shield' },
            { label: 'Atendimentos/Ano', value: '50.000+', icon: 'activity' }
        ],
        services: [
            {
                title: 'Atendimento Pré-Hospitalar',
                description: 'Equipe especializada em atendimento de urgência e emergência, disponível 24/7.',
                icon: 'activity'
            },
            {
                title: 'Treinamentos e Capacitação',
                description: 'Cursos e treinamentos para formação de socorristas e profissionais de saúde.',
                icon: 'award'
            },
            {
                title: 'Eventos e Operações',
                description: 'Cobertura médica para eventos esportivos, culturais e corporativos.',
                icon: 'calendar'
            },
            {
                title: 'Consultoria em Saúde',
                description: 'Assessoria técnica para empresas e instituições em gestão de emergências.',
                icon: 'briefcase'
            }
        ],
        testimonials: [
            {
                name: 'Maria Silva',
                role: 'Coordenadora de Eventos',
                content: 'A ABCUNA prestou um serviço excepcional no nosso evento. Profissionalismo e dedicação incomparáveis!',
                avatar: ''
            },
            {
                name: 'João Santos',
                role: 'Gestor de RH',
                content: 'Os treinamentos oferecidos pela ABCUNA transformaram nossa equipe de segurança. Altamente recomendado!',
                avatar: ''
            },
            {
                name: 'Ana Costa',
                role: 'Diretora Escolar',
                content: 'Confiamos na ABCUNA para a segurança dos nossos alunos. Equipe sempre pronta e preparada.',
                avatar: ''
            }
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
            twitter: 'https://twitter.com/abcuna',
            linkedin: 'https://linkedin.com/company/abcuna'
        },
        cta_title: 'Pronto para fazer a diferença?',
        cta_subtitle: 'Junte-se à nossa equipe e ajude a salvar vidas. Acesse nosso sistema de gestão integrada.',
        cta_button_text: 'Acessar o Sistema',
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
    };

    const displayConfig = config || defaultConfig;

    // Helper function to get icon component
    const getIcon = (iconName: string, size: number = 24) => {
        const icons: { [key: string]: any } = {
            users: Users,
            award: Award,
            shield: Shield,
            activity: Activity,
            trending: TrendingUp,
            check: CheckCircle,
            zap: Zap,
            clock: Clock
        };
        const IconComponent = icons[iconName] || Activity;
        return <IconComponent size={size} />;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-brand-200 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm font-semibold text-slate-600">Carregando...</p>
                </div>
            </div>
        );
    }

    const primaryColor = displayConfig.theme?.primaryColor || '#dc2626';
    const secondaryColor = displayConfig.theme?.secondaryColor || '#1e293b';

    return (
        <div className="min-h-screen bg-white">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="relative">
                                <div className="absolute inset-0 bg-brand-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                <div className="relative p-2.5 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl text-white shadow-lg">
                                    <Flame size={24} fill="currentColor" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight drop-shadow-sm">ABCUNA</h1>
                                <p className="text-[9px] font-bold text-slate-500 tracking-[0.15em] uppercase">Sistema de Gestão Integrada</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            {displayConfig.sections_visibility.about && (
                                <button
                                    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="text-sm font-bold text-slate-700 hover:text-brand-600 transition-colors"
                                >
                                    Sobre
                                </button>
                            )}
                            {displayConfig.sections_visibility.services && (
                                <button
                                    onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors"
                                >
                                    Serviços
                                </button>
                            )}
                            {displayConfig.sections_visibility.contact && (
                                <button
                                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors"
                                >
                                    Contato
                                </button>
                            )}
                        </nav>

                        {/* CTA Button */}
                        <Button
                            onClick={() => navigate('/auth')}
                            className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all group"
                        >
                            Entrar
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            {displayConfig.sections_visibility.hero && (
                <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-600/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            {/* Text Content */}
                            <div className="space-y-8 text-white">
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-semibold shadow-lg">
                                    <Flame size={16} className="text-brand-400" />
                                    <span>{displayConfig.hero_badge_text || 'Salvando vidas desde sempre'}</span>
                                </div>

                                {/* Title */}
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight">
                                    {displayConfig.hero_title}
                                </h1>

                                {/* Subtitle */}
                                <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl">
                                    {displayConfig.hero_subtitle}
                                </p>

                                {/* CTA Buttons */}
                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Button
                                        onClick={() => navigate('/auth')}
                                        size="lg"
                                        className="flex items-center justify-center gap-2 text-base shadow-2xl hover:shadow-brand-600/50 transition-all group px-8 py-6"
                                    >
                                        Acessar o Sistema
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="flex items-center justify-center gap-2 text-base bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 px-8 py-6"
                                        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        Saiba Mais
                                        <ChevronRight size={18} />
                                    </Button>
                                </div>
                            </div>

                            {/* Hero Image/Visual */}
                            <div className="relative">
                                <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
                                    {displayConfig.hero_image_url ? (
                                        <img
                                            src={displayConfig.hero_image_url}
                                            alt="ABCUNA"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-brand-600/30 to-brand-800/30 backdrop-blur-sm border border-brand-500/30 flex items-center justify-center">
                                            <Flame size={160} className="text-brand-600/40" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Statistics Section */}
            {displayConfig.sections_visibility.stats && displayConfig.stats && displayConfig.stats.length > 0 && (
                <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-y border-slate-200">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            {displayConfig.stats.map((stat, index) => (
                                <div
                                    key={index}
                                    className="text-center group"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-50 rounded-2xl mb-4 group-hover:bg-brand-600 transition-all">
                                        <div className="text-brand-600 group-hover:text-white transition-colors">
                                            {getIcon(stat.icon || 'activity', 28)}
                                        </div>
                                    </div>
                                    <p className="text-4xl font-black text-slate-900 mb-2">{stat.value}</p>
                                    <p className="text-sm font-semibold text-slate-600">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* About Section */}
            {displayConfig.sections_visibility.about && (
                <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50">
                    <div className="max-w-7xl mx-auto">
                        {/* Section Header */}
                        <div className="text-center mb-16 max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 border border-brand-100 rounded-full text-sm font-bold text-brand-700 mb-6">
                                <Target size={16} />
                                <span>Quem Somos</span>
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6">
                                {displayConfig.about_title || 'Sobre a Associação'}
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                {displayConfig.about_text}
                            </p>
                        </div>

                        {/* Mission, Vision, Values Cards */}
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Mission */}
                            <div className="group relative bg-white rounded-3xl border-2 border-slate-200 p-8 hover:border-brand-500 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="relative">
                                    <div className="w-16 h-16 bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                        <Target size={28} className="text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-4">Missão</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        {displayConfig.mission_text}
                                    </p>
                                </div>
                            </div>

                            {/* Vision */}
                            <div className="group relative bg-white rounded-3xl border-2 border-slate-200 p-8 hover:border-brand-500 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="relative">
                                    <div className="w-16 h-16 bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                        <Eye size={28} className="text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-4">Visão</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        {displayConfig.vision_text}
                                    </p>
                                </div>
                            </div>

                            {/* Values */}
                            <div className="group relative bg-white rounded-3xl border-2 border-slate-200 p-8 hover:border-brand-500 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="relative">
                                    <div className="w-16 h-16 bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                        <Heart size={28} className="text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-4">Valores</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        {displayConfig.values_text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Services Section */}
            {displayConfig.sections_visibility.services && displayConfig.services && displayConfig.services.length > 0 && (
                <section id="services" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
                    <div className="max-w-7xl mx-auto">
                        {/* Section Header */}
                        <div className="text-center mb-16 max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 border border-brand-100 rounded-full text-sm font-bold text-brand-700 mb-6">
                                <Zap size={16} />
                                <span>Nossos Serviços</span>
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6">
                                {displayConfig.services_title || 'O que Oferecemos'}
                            </h2>
                            <p className="text-lg text-slate-600">
                                {displayConfig.services_subtitle || 'Soluções completas para atendimento de emergências e capacitação profissional'}
                            </p>
                        </div>

                        {/* Services Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {displayConfig.services.map((service, index) => (
                                <div
                                    key={index}
                                    className="group bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-slate-200 p-6 hover:border-brand-500 hover:shadow-xl transition-all duration-300"
                                >
                                    <div className="w-14 h-14 bg-brand-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                                        <Activity size={24} className="text-white" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-3">{service.title}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">{service.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials Section */}
            {displayConfig.sections_visibility.testimonials && displayConfig.testimonials && displayConfig.testimonials.length > 0 && (
                <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                    <div className="max-w-7xl mx-auto">
                        {/* Section Header */}
                        <div className="text-center mb-16 max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-bold mb-6">
                                <Star size={16} className="text-brand-400" />
                                <span>Depoimentos</span>
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black mb-6">
                                {displayConfig.testimonials_title || 'O que dizem sobre nós'}
                            </h2>
                            <p className="text-lg text-slate-300">
                                {displayConfig.testimonials_subtitle || 'Veja o que nossos parceiros e clientes têm a dizer'}
                            </p>
                        </div>

                        {/* Testimonials Grid */}
                        <div className="grid md:grid-cols-3 gap-8">
                            {displayConfig.testimonials.map((testimonial, index) => (
                                <div
                                    key={index}
                                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all"
                                >
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-slate-200 leading-relaxed mb-6 italic">
                                        "{testimonial.content}"
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold">
                                            {testimonial.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{testimonial.name}</p>
                                            <p className="text-sm text-slate-400">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Gallery Section */}
            {displayConfig.sections_visibility.gallery && displayConfig.gallery_images.length > 0 && (
                <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
                    <div className="max-w-7xl mx-auto">
                        {/* Section Header */}
                        <div className="text-center mb-16">
                            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">
                                {displayConfig.gallery_title || 'Nossa Galeria'}
                            </h2>
                            <p className="text-lg text-slate-600">
                                {displayConfig.gallery_subtitle || 'Conheça um pouco mais sobre nosso trabalho'}
                            </p>
                        </div>

                        {/* Gallery Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayConfig.gallery_images.map((image, index) => (
                                <div
                                    key={index}
                                    className="group relative aspect-video rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                                >
                                    <img
                                        src={image}
                                        alt={`Galeria ${index + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Contact Section */}
            {displayConfig.sections_visibility.contact && displayConfig.contact && (
                <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            {/* Contact Info */}
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 border border-brand-100 rounded-full text-sm font-bold text-brand-700 mb-6">
                                    <Phone size={16} />
                                    <span>Entre em Contato</span>
                                </div>
                                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6">
                                    Estamos Aqui Para Ajudar
                                </h2>
                                <p className="text-lg text-slate-600 mb-8">
                                    Entre em contato conosco para mais informações sobre nossos serviços.
                                </p>

                                <div className="space-y-6">
                                    {displayConfig.contact.phone && (
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Phone size={20} className="text-brand-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 mb-1">Telefone</p>
                                                <p className="text-slate-600">{displayConfig.contact.phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    {displayConfig.contact.email && (
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Mail size={20} className="text-brand-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 mb-1">E-mail</p>
                                                <p className="text-slate-600">{displayConfig.contact.email}</p>
                                            </div>
                                        </div>
                                    )}

                                    {displayConfig.contact.address && (
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <MapPin size={20} className="text-brand-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 mb-1">Endereço</p>
                                                <p className="text-slate-600">{displayConfig.contact.address}</p>
                                            </div>
                                        </div>
                                    )}

                                    {displayConfig.contact.workingHours && (
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Clock size={20} className="text-brand-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 mb-1">Horário de Atendimento</p>
                                                <p className="text-slate-600">{displayConfig.contact.workingHours}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Social Media */}
                                {displayConfig.social && (
                                    <div className="mt-8 pt-8 border-t border-slate-200">
                                        <p className="font-bold text-slate-900 mb-4">Siga-nos nas redes sociais</p>
                                        <div className="flex items-center gap-3">
                                            {displayConfig.social.facebook && (
                                                <a
                                                    href={displayConfig.social.facebook}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-12 h-12 bg-slate-100 hover:bg-brand-600 rounded-xl flex items-center justify-center text-slate-600 hover:text-white transition-all"
                                                >
                                                    <Facebook size={20} />
                                                </a>
                                            )}
                                            {displayConfig.social.instagram && (
                                                <a
                                                    href={displayConfig.social.instagram}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-12 h-12 bg-slate-100 hover:bg-brand-600 rounded-xl flex items-center justify-center text-slate-600 hover:text-white transition-all"
                                                >
                                                    <Instagram size={20} />
                                                </a>
                                            )}
                                            {displayConfig.social.twitter && (
                                                <a
                                                    href={displayConfig.social.twitter}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-12 h-12 bg-slate-100 hover:bg-brand-600 rounded-xl flex items-center justify-center text-slate-600 hover:text-white transition-all"
                                                >
                                                    <Twitter size={20} />
                                                </a>
                                            )}
                                            {displayConfig.social.linkedin && (
                                                <a
                                                    href={displayConfig.social.linkedin}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-12 h-12 bg-slate-100 hover:bg-brand-600 rounded-xl flex items-center justify-center text-slate-600 hover:text-white transition-all"
                                                >
                                                    <Linkedin size={20} />
                                                </a>
                                            )}
                                            {displayConfig.social.youtube && (
                                                <a
                                                    href={displayConfig.social.youtube}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-12 h-12 bg-slate-100 hover:bg-brand-600 rounded-xl flex items-center justify-center text-slate-600 hover:text-white transition-all"
                                                >
                                                    <Youtube size={20} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Contact Visual */}
                            <div className="relative">
                                <div className="aspect-square bg-gradient-to-br from-brand-50 to-brand-100 rounded-3xl flex items-center justify-center">
                                    <div className="text-center p-8">
                                        <div className="w-32 h-32 bg-brand-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                            <Phone size={64} className="text-white" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 mb-2">Atendimento 24/7</h3>
                                        <p className="text-slate-600">Estamos sempre prontos para atender você</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            {displayConfig.sections_visibility.cta && (
                <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white relative overflow-hidden">
                    {/* Background Decorations */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>

                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <h2 className="text-4xl sm:text-5xl font-black mb-6">
                            {displayConfig.cta_title || 'Pronto para fazer a diferença?'}
                        </h2>
                        <p className="text-lg sm:text-xl text-brand-100 leading-relaxed mb-8">
                            {displayConfig.cta_subtitle || 'Junte-se à nossa equipe e ajude a salvar vidas. Acesse nosso sistema de gestão integrada.'}
                        </p>
                        <Button
                            onClick={() => navigate('/auth')}
                            size="lg"
                            className="flex items-center gap-2 text-base font-bold shadow-2xl hover:shadow-3xl transition-all bg-white text-brand-600 hover:bg-brand-50 hover:scale-105 px-8 py-6 mx-auto group"
                        >
                            {displayConfig.cta_button_text || 'Acessar o Sistema'}
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 text-slate-400 border-t border-slate-800">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-600 rounded-lg">
                                <Flame size={20} fill="currentColor" className="text-white" />
                            </div>
                            <div>
                                <span className="font-black text-white text-lg">ABCUNA</span>
                                <p className="text-xs text-slate-500">Sistema de Gestão Integrada</p>
                            </div>
                        </div>

                        {/* Copyright */}
                        <div className="text-center md:text-right">
                            <p className="text-sm">
                                © {new Date().getFullYear()} ABCUNA - Associação Brasileira de Combate a Urgências e Necessidades Assistenciais
                            </p>
                            <p className="text-xs mt-1">Todos os direitos reservados.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
