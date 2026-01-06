import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Flame, ArrowRight, Target, Eye, Heart,
    Users, Award, Shield, Phone, Mail, MapPin,
    Facebook, Instagram, Twitter, Linkedin, Youtube, Star,
    TrendingUp, Activity, CheckCircle, Zap, Clock
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
        cta_subtitle: 'Junte-se à nossa equipe e ajude a salvar vidas.',
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
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-600">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Minimalist Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Simple Logo */}
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                                <Flame size={18} className="text-white" fill="currentColor" />
                            </div>
                            <span className="text-lg font-bold text-slate-900">ABCUNA</span>
                        </div>

                        {/* Clean Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            {displayConfig.sections_visibility.about && (
                                <button
                                    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    Sobre
                                </button>
                            )}
                            {displayConfig.sections_visibility.services && (
                                <button
                                    onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    Serviços
                                </button>
                            )}
                            {displayConfig.sections_visibility.contact && (
                                <button
                                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    Contato
                                </button>
                            )}
                        </nav>

                        {/* Simple CTA */}
                        <button
                            onClick={() => navigate('/auth')}
                            className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
                        >
                            Entrar
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section - Minimalist */}
            {displayConfig.sections_visibility.hero && (
                <section className="pt-32 pb-20 px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="max-w-3xl">
                            {/* Small badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full mb-8">
                                <div className="w-2 h-2 bg-brand-600 rounded-full"></div>
                                <span className="text-xs font-medium text-slate-700">
                                    {displayConfig.hero_badge_text || 'Salvando vidas desde sempre'}
                                </span>
                            </div>

                            {/* Large, clean title */}
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                                {displayConfig.hero_title}
                            </h1>

                            {/* Subtitle */}
                            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
                                {displayConfig.hero_subtitle}
                            </p>

                            {/* Simple CTAs */}
                            <div className="flex flex-wrap items-center gap-4">
                                <button
                                    onClick={() => navigate('/auth')}
                                    className="px-6 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors inline-flex items-center gap-2"
                                >
                                    Acessar o Sistema
                                    <ArrowRight size={18} />
                                </button>
                                <button
                                    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-6 py-3 text-slate-700 font-medium hover:text-slate-900 transition-colors"
                                >
                                    Saiba mais
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Stats - Minimal */}
            {displayConfig.sections_visibility.stats && displayConfig.stats && displayConfig.stats.length > 0 && (
                <section className="py-16 px-6 lg:px-8 border-y border-slate-100">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {displayConfig.stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <p className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">
                                        {stat.value}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* About - Clean */}
            {displayConfig.sections_visibility.about && (
                <section id="about" className="py-24 px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-16 items-start">
                            {/* Left - Title */}
                            <div>
                                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                                    {displayConfig.about_title || 'Sobre Nós'}
                                </h2>
                                <p className="text-lg text-slate-600 leading-relaxed">
                                    {displayConfig.about_text}
                                </p>
                            </div>

                            {/* Right - MVV */}
                            <div className="space-y-8">
                                {/* Mission */}
                                <div className="border-l-2 border-brand-600 pl-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Target size={20} className="text-brand-600" />
                                        <h3 className="text-lg font-bold text-slate-900">Missão</h3>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed">
                                        {displayConfig.mission_text}
                                    </p>
                                </div>

                                {/* Vision */}
                                <div className="border-l-2 border-slate-200 pl-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Eye size={20} className="text-slate-700" />
                                        <h3 className="text-lg font-bold text-slate-900">Visão</h3>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed">
                                        {displayConfig.vision_text}
                                    </p>
                                </div>

                                {/* Values */}
                                <div className="border-l-2 border-slate-200 pl-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Heart size={20} className="text-slate-700" />
                                        <h3 className="text-lg font-bold text-slate-900">Valores</h3>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed">
                                        {displayConfig.values_text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Services - Grid */}
            {displayConfig.sections_visibility.services && displayConfig.services && displayConfig.services.length > 0 && (
                <section id="services" className="py-24 px-6 lg:px-8 bg-slate-50">
                    <div className="max-w-6xl mx-auto">
                        <div className="max-w-2xl mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                                {displayConfig.services_title || 'Nossos Serviços'}
                            </h2>
                            <p className="text-lg text-slate-600">
                                {displayConfig.services_subtitle || 'Soluções completas para atendimento de emergências'}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {displayConfig.services.map((service, index) => (
                                <div
                                    key={index}
                                    className="bg-white p-8 rounded-xl border border-slate-200 hover:border-brand-600 transition-colors"
                                >
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                                        {service.title}
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        {service.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials - Minimal */}
            {displayConfig.sections_visibility.testimonials && displayConfig.testimonials && displayConfig.testimonials.length > 0 && (
                <section className="py-24 px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="max-w-2xl mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                                {displayConfig.testimonials_title || 'Depoimentos'}
                            </h2>
                            <p className="text-lg text-slate-600">
                                {displayConfig.testimonials_subtitle || 'O que nossos parceiros dizem'}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {displayConfig.testimonials.map((testimonial, index) => (
                                <div key={index} className="border-l-2 border-slate-200 pl-6">
                                    <p className="text-slate-700 leading-relaxed mb-6 italic">
                                        "{testimonial.content}"
                                    </p>
                                    <div>
                                        <p className="font-bold text-slate-900">{testimonial.name}</p>
                                        <p className="text-sm text-slate-600">{testimonial.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Gallery - Simple Grid */}
            {displayConfig.sections_visibility.gallery && displayConfig.gallery_images.length > 0 && (
                <section className="py-24 px-6 lg:px-8 bg-slate-50">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-12">
                            {displayConfig.gallery_title || 'Galeria'}
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {displayConfig.gallery_images.map((image, index) => (
                                <div
                                    key={index}
                                    className="aspect-square rounded-lg overflow-hidden bg-slate-200"
                                >
                                    <img
                                        src={image}
                                        alt={`Galeria ${index + 1}`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Contact - Two Column */}
            {displayConfig.sections_visibility.contact && displayConfig.contact && (
                <section id="contact" className="py-24 px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-16">
                            {/* Left */}
                            <div>
                                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                                    Entre em Contato
                                </h2>
                                <p className="text-lg text-slate-600 mb-8">
                                    Estamos aqui para ajudar. Entre em contato conosco.
                                </p>

                                {/* Social */}
                                {displayConfig.social && (
                                    <div className="flex items-center gap-4">
                                        {displayConfig.social.facebook && (
                                            <a
                                                href={displayConfig.social.facebook}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 bg-slate-100 hover:bg-brand-600 rounded-lg flex items-center justify-center text-slate-600 hover:text-white transition-colors"
                                            >
                                                <Facebook size={18} />
                                            </a>
                                        )}
                                        {displayConfig.social.instagram && (
                                            <a
                                                href={displayConfig.social.instagram}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 bg-slate-100 hover:bg-brand-600 rounded-lg flex items-center justify-center text-slate-600 hover:text-white transition-colors"
                                            >
                                                <Instagram size={18} />
                                            </a>
                                        )}
                                        {displayConfig.social.linkedin && (
                                            <a
                                                href={displayConfig.social.linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 bg-slate-100 hover:bg-brand-600 rounded-lg flex items-center justify-center text-slate-600 hover:text-white transition-colors"
                                            >
                                                <Linkedin size={18} />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right - Contact Info */}
                            <div className="space-y-6">
                                {displayConfig.contact.phone && (
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Phone size={18} className="text-slate-700" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 mb-1">Telefone</p>
                                            <p className="text-slate-600">{displayConfig.contact.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {displayConfig.contact.email && (
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Mail size={18} className="text-slate-700" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 mb-1">E-mail</p>
                                            <p className="text-slate-600">{displayConfig.contact.email}</p>
                                        </div>
                                    </div>
                                )}

                                {displayConfig.contact.address && (
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <MapPin size={18} className="text-slate-700" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 mb-1">Endereço</p>
                                            <p className="text-slate-600">{displayConfig.contact.address}</p>
                                        </div>
                                    </div>
                                )}

                                {displayConfig.contact.workingHours && (
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Clock size={18} className="text-slate-700" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 mb-1">Horário</p>
                                            <p className="text-slate-600">{displayConfig.contact.workingHours}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* CTA - Minimal */}
            {displayConfig.sections_visibility.cta && (
                <section className="py-24 px-6 lg:px-8 bg-slate-900">
                    <div className="max-w-6xl mx-auto text-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            {displayConfig.cta_title || 'Pronto para fazer a diferença?'}
                        </h2>
                        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                            {displayConfig.cta_subtitle || 'Junte-se à nossa equipe e ajude a salvar vidas.'}
                        </p>
                        <button
                            onClick={() => navigate('/auth')}
                            className="px-8 py-4 bg-white text-slate-900 font-medium rounded-lg hover:bg-slate-100 transition-colors inline-flex items-center gap-2"
                        >
                            {displayConfig.cta_button_text || 'Acessar o Sistema'}
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </section>
            )}

            {/* Footer - Minimal */}
            <footer className="py-12 px-6 lg:px-8 border-t border-slate-100">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                                <Flame size={18} className="text-white" fill="currentColor" />
                            </div>
                            <span className="text-lg font-bold text-slate-900">ABCUNA</span>
                        </div>

                        {/* Copyright */}
                        <p className="text-sm text-slate-600">
                            © {new Date().getFullYear()} ABCUNA. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
