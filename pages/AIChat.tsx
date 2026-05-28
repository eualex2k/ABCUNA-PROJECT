import React, { useState, useEffect, useRef } from 'react';
import {
    Send,
    Sparkles,
    Bot,
    User as UserIcon,
    Image as ImageIcon,
    FileText,
    Trash2,
    Key,
    Check,
    X,
    Loader2,
    Paperclip,
    AlertCircle,
    Calendar,
    DollarSign,
    Clock,
    Bell,
    ArrowRight
} from 'lucide-react';
import { aiAgentService, ChatMessage, AgentPendingAction } from '../services/aiAgent';
import { processPixReceipt } from '../utils/ocrProcessor';
import { User, UserRole } from '../types';
import { Avatar, Button } from '../components/ui';

interface AIChatProps {
    user: User | null;
}

export const AIChatPage: React.FC<AIChatProps> = ({ user }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
    const [pendingAction, setPendingAction] = useState<AgentPendingAction | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionResult, setActionResult] = useState<{ success: boolean; msg: string } | null>(null);
    
    // Estados do OCR
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrError, setOcrError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Carrega histórico de mensagens e valida conexão com o servidor seguro
    useEffect(() => {
        const initChat = async () => {
            const history = await aiAgentService.loadMessages();
            setMessages(history);
            
            // Healthcheck do backend local Express
            try {
                const res = await fetch('http://localhost:3001/status');
                if (res.ok) {
                    setIsBackendOnline(true);
                } else {
                    setIsBackendOnline(false);
                }
            } catch {
                setIsBackendOnline(false);
            }
        };
        initChat();
    }, []);

    // Scroll automático para a última mensagem
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Configurações de credenciais centralizadas de forma segura no backend.

    const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
        e?.preventDefault();
        const textToSend = customText || input;
        if (!textToSend.trim() && !ocrLoading) return;

        if (!customText) setInput('');
        setIsLoading(true);
        setPendingAction(null);
        setActionResult(null);

        // 1. Salvar mensagem do usuário no banco
        const userMsg = await aiAgentService.saveMessage('user', textToSend);
        if (userMsg) {
            setMessages(prev => [...prev, userMsg]);
        } else {
            // Fallback local se falhar gravação do Supabase
            setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
        }

        // 2. Enviar para a IA
        const currentHistory = [...messages];

        const response = await aiAgentService.sendMessage(currentHistory, textToSend);

        // 3. Salvar resposta da IA no banco
        const aiMsg = await aiAgentService.saveMessage('model', response.text);
        if (aiMsg) {
            setMessages(prev => [...prev, aiMsg]);
        } else {
            setMessages(prev => [...prev, { role: 'model', content: response.text }]);
        }

        // Se a IA disparou um pedido de ferramenta
        if (response.pendingAction) {
            // Se for uma ferramenta de LEITURA (ex: buscar associado ou inadimplentes), executa direto!
            const readTools = ['buscar_associado', 'listar_inadimplentes', 'consultar_financeiro'];
            if (readTools.includes(response.pendingAction.functionName)) {
                setIsLoading(true);
                const queryResult = await aiAgentService.executeReadQuery(
                    response.pendingAction.functionName,
                    response.pendingAction.args
                );
                
                // Formata o resultado da leitura em string amigável e envia de volta à IA para sintetizar a resposta
                const formattedResult = JSON.stringify(queryResult, null, 2);
                const followUpPrompt = `O sistema executou a ferramenta '${response.pendingAction.functionName}' com sucesso. Resultados:\n${formattedResult}\nPor favor, formate e explique estes resultados em português para o usuário.`;
                
                // A local state array with the newly added messages since `messages` isn't updated yet.
                const updatedHistory = [...messages, { role: 'user' as const, content: textToSend }];
                if (response.text) {
                    updatedHistory.push({ role: 'model' as const, content: response.text });
                }

                const synthResponse = await aiAgentService.sendMessage(
                    updatedHistory,
                    followUpPrompt
                );

                const finalAiMsg = await aiAgentService.saveMessage('model', synthResponse.text);
                if (finalAiMsg) {
                    setMessages(prev => [...prev, finalAiMsg]);
                } else {
                    setMessages(prev => [...prev, { role: 'model', content: synthResponse.text }]);
                }
            } else {
                // Ferramentas de ESCRITA (pagamentos, eventos, etc.) exigem confirmação do usuário
                setPendingAction(response.pendingAction);
            }
        }

        setIsLoading(false);
    };

    // Executa a ação da IA após aprovação do usuário
    const handleConfirmAction = async () => {
        if (!pendingAction) return;
        setActionLoading(true);
        setActionResult(null);

        const result = await aiAgentService.executeConfirmedAction(
            pendingAction.functionName,
            pendingAction.args
        );

        setActionLoading(false);

        if (result.success) {
            setActionResult({ success: true, msg: 'Operação salva no banco de dados com sucesso!' });
            
            // Informa a IA que a ação foi confirmada para que ela agradeça/finalize
            const feedbackText = `O usuário CONFIRMOU e executou a ação: ${pendingAction.label}. Os dados foram persistidos no banco de dados.`;
            
            // Adiciona mensagem sistêmica no histórico e chama Gemini
            const synthResponse = await aiAgentService.sendMessage([...messages], feedbackText);
            
            const aiMsg = await aiAgentService.saveMessage('model', synthResponse.text);
            if (aiMsg) {
                setMessages(prev => [...prev, aiMsg]);
            } else {
                setMessages(prev => [...prev, { role: 'model', content: synthResponse.text }]);
            }
            
            // Limpa o card pendente após alguns segundos
            setTimeout(() => {
                setPendingAction(null);
                setActionResult(null);
            }, 3000);
        } else {
            setActionResult({
                success: false,
                msg: `Erro ao executar ação: ${result.error || 'Verifique as permissões de acesso.'}`
            });
        }
    };

    // Cancela a ação proposta pela IA
    const handleCancelAction = async () => {
        if (!pendingAction) return;
        
        // Salva auditoria como recusado
        await aiAgentService.logAgentAction(pendingAction.functionName, pendingAction.args, false);
        
        setPendingAction(null);
        setActionResult(null);

        const feedbackText = `O usuário REJEITOU e cancelou a ação proposta: ${pendingAction.label}. Nenhuma alteração foi feita no banco.`;
        
        // Notifica a IA que o usuário cancelou para que ela reconheça
        const synthResponse = await aiAgentService.sendMessage(
            [...messages],
            feedbackText
        );

        const aiMsg = await aiAgentService.saveMessage('model', synthResponse.text);
        if (aiMsg) {
            setMessages(prev => [...prev, aiMsg]);
        } else {
            setMessages(prev => [...prev, { role: 'model', content: synthResponse.text }]);
        }
    };

    // Limpa histórico
    const handleClearHistory = async () => {
        if (window.confirm('Tem certeza de que deseja apagar o histórico de conversas com a IA?')) {
            await aiAgentService.clearHistory();
            setMessages([]);
            setPendingAction(null);
            setActionResult(null);
        }
    };

    // Lida com upload de arquivos e OCR
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Se for imagem, dispara OCR local
        if (file.type.startsWith('image/')) {
            setOcrLoading(true);
            setOcrProgress(0);
            setOcrError(null);

            try {
                // Executa o processador Tesseract OCR local
                const result = await processPixReceipt(file, (progress) => {
                    setOcrProgress(progress);
                });

                const data = result.extractedData;
                
                // Formata o prompt estruturado de comprovante
                const formattedPrompt = `[ENVIADO COMPROVANTE PIX]
Lido via OCR local com os seguintes dados encontrados:
- Valor: ${data.amount ? `R$ ${data.amount.toFixed(2)}` : 'Não identificado'}
- Data: ${data.date || 'Não identificado'}
- Banco: ${data.bank || 'Não identificado'}
- Pagador/Nome: ${data.name || 'Não identificado'}
- Chave PIX: ${data.key || 'Não identificado'}

Texto Bruto do OCR:
"""
${result.text}
"""

Por favor, analise esses dados. Se houver um nome de associado ou valor legível, busque esse associado no sistema e pergunte se devo registrar a baixa do pagamento dele.`;

                // Envia a mensagem automaticamente no chat
                await handleSendMessage(undefined, formattedPrompt);

            } catch (err: any) {
                console.error(err);
                setOcrError('Falha ao rodar o OCR na imagem: ' + err.message);
            } finally {
                setOcrLoading(false);
            }
        } else {
            // Outros tipos de arquivos (PDF/Doc)
            alert('Atualmente o processamento inteligente via OCR suporta leitura de comprovantes em formato de Imagem (.png, .jpg). Para PDFs, digite as informações textualmente no chat.');
        }

        // Limpa o input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Renderiza o ícone apropriado para cada ação pendente no card
    const getActionIcon = (funcName: string) => {
        switch (funcName) {
            case 'registrar_pagamento':
            case 'registrar_entrada':
                return <DollarSign className="text-emerald-500" size={24} />;
            case 'registrar_saida':
                return <DollarSign className="text-red-500" size={24} />;
            case 'criar_evento':
                return <Calendar className="text-blue-500" size={24} />;
            case 'criar_escala':
            case 'gerar_escala_previa':
                return <Clock className="text-amber-500" size={24} />;
            case 'enviar_notificacao':
                return <Bell className="text-indigo-500" size={24} />;
            default:
                return <Sparkles className="text-brand-500" size={24} />;
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-300">
            {/* Sidebar Esquerda - Configurações e Controles */}
            <div className="w-full lg:w-72 bg-slate-900 border border-white/5 rounded-2xl p-5 flex flex-col justify-between text-white shadow-premium">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                        <div className="p-2 bg-brand-600 rounded-lg">
                            <Bot size={20} className="text-white animate-pulse" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm leading-tight">Secretária IA</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ABCUNA Virtual</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Converse por texto em português ou envie comprovantes em formato de imagem para dar baixas automáticas e gerenciar a associação.
                        </p>
                        
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                                <span>Servidor de IA ABCUNA</span>
                                <span className={`flex items-center gap-1 ${isBackendOnline === true ? 'text-emerald-400' : isBackendOnline === false ? 'text-rose-400' : 'text-slate-400'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isBackendOnline === true ? 'bg-emerald-400 animate-pulse' : isBackendOnline === false ? 'bg-rose-400' : 'bg-slate-400'}`} />
                                    {isBackendOnline === true ? 'Conectado' : isBackendOnline === false ? 'Desconectado' : 'Checando...'}
                                </span>
                            </div>
                            <div className="text-[9px] text-slate-400 text-center leading-relaxed">
                                {isBackendOnline === true 
                                  ? 'Comunicação ativa via OpenRouter.' 
                                  : isBackendOnline === false 
                                    ? 'Aviso: Inicie o servidor Express local na porta 3001.' 
                                    : 'Aguardando validação do túnel de rede...'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold"
                        onClick={handleClearHistory}
                        disabled={messages.length === 0}
                    >
                        <Trash2 size={16} className="mr-2" /> Limpar Histórico
                    </Button>
                    <div className="text-[9px] text-slate-500 font-bold tracking-widest text-center uppercase">
                        ABCUNA IA v1.0.0
                    </div>
                </div>
            </div>

            {/* Painel Central - Chat e Prompt */}
            <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-premium-sm relative h-full">
                
                {/* Cabeçalho do Chat */}
                <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white border border-slate-700">
                                <Bot size={22} />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-800">Assistente Operacional IA</h3>
                            <p className="text-[10px] text-slate-400 font-bold">Online • Pronto para receber comandos</p>
                        </div>
                    </div>
                </div>

                {/* Histórico de Mensagens */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto space-y-6">
                            <div className="p-4 bg-brand-50 rounded-2xl text-brand-600 animate-bounce">
                                <Sparkles size={36} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-lg text-slate-800">Bem-vindo à Central de IA da ABCUNA</h4>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Eu posso ajudar você com tarefas operacionais e administrativas. Experimente digitar comandos como:
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                                {[
                                    '“Dê baixa no pagamento de João”',
                                    '“Criar evento para sábado”',
                                    '“Mostrar inadimplentes”',
                                    '“Gerar relatório financeiro do mês”'
                                ].map((cmd, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleSendMessage(undefined, cmd.replace(/[“”]/g, ''))}
                                        className="p-3 bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between group shadow-sm transition-all"
                                    >
                                        <span>{cmd}</span>
                                        <ArrowRight size={12} className="text-slate-400 group-hover:text-brand-600 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messages.map((msg, idx) => {
                                const isAi = msg.role === 'model';
                                return (
                                    <div 
                                        key={idx} 
                                        className={`flex gap-4 ${isAi ? '' : 'flex-row-reverse'}`}
                                    >
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            {isAi ? (
                                                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white border border-slate-700 shadow-sm">
                                                    <Bot size={18} />
                                                </div>
                                            ) : (
                                                <Avatar 
                                                    src={user?.avatar} 
                                                    alt={user?.name || ''} 
                                                    fallback={(user?.name || 'U').substring(0, 2)} 
                                                    size="sm"
                                                    className="ring-2 ring-brand-100" 
                                                />
                                            )}
                                        </div>

                                        {/* Balão de Mensagem */}
                                        <div className={`max-w-[75%] space-y-2`}>
                                            <div className="flex items-center gap-2 px-1">
                                                <span className="text-xs font-bold text-slate-700">
                                                    {isAi ? 'IA ABCUNA' : (user?.name || 'Você')}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400">
                                                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                            
                                            <div 
                                                className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                                                    isAi 
                                                    ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' 
                                                    : 'bg-brand-600 text-white rounded-tr-none'
                                                }`}
                                            >
                                                {msg.content.includes('[ENVIADO COMPROVANTE PIX]') ? (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2 text-brand-200 border-b border-brand-500 pb-2 mb-2">
                                                            <ImageIcon size={16} />
                                                            <span className="font-bold text-xs uppercase tracking-wider">Comprovante Lido via OCR local</span>
                                                        </div>
                                                        <p className="text-xs font-medium opacity-90">
                                                            {msg.content.split('Texto Bruto do OCR:')[0]}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    msg.content
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Indicador de Digitação da IA */}
                            {isLoading && (
                                <div className="flex gap-4">
                                    <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white border border-slate-700 shadow-sm animate-pulse">
                                        <Bot size={18} />
                                    </div>
                                    <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-tl-none max-w-xs shadow-sm flex items-center gap-2">
                                        <Loader2 size={16} className="text-brand-600 animate-spin" />
                                        <span className="text-xs font-bold text-slate-500">IA pensando nas ferramentas...</span>
                                    </div>
                                </div>
                            )}

                            {/* Card de Confirmação Interativo - SINAL VERDE HUMANO */}
                            {pendingAction && (
                                <div className="max-w-md mx-auto p-5 glass shadow-premium border border-slate-200 rounded-2xl animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-4">
                                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                            {getActionIcon(pendingAction.functionName)}
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-sm text-slate-800">Aprovação Necessária</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Segurança Operacional • RLS Ativo</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                                            A IA propôs a seguinte ação estruturada: <br />
                                            <span className="text-brand-600 font-extrabold text-sm block mt-1">
                                                {pendingAction.label}
                                            </span>
                                        </p>

                                        <div className="text-xs text-slate-500 border border-slate-100 rounded-xl p-3 bg-white space-y-1">
                                            <div className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">Parâmetros Mapeados</div>
                                            {Object.entries(pendingAction.args).map(([key, val]) => (
                                                <div key={key} className="flex justify-between py-0.5 border-b border-slate-50 last:border-0">
                                                    <span className="font-medium text-slate-400">{key}:</span>
                                                    <span className="font-extrabold text-slate-700 truncate max-w-[200px]">
                                                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {actionResult && (
                                            <div className={`p-3 rounded-xl text-xs flex items-start gap-2 border font-medium ${
                                                actionResult.success 
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                                : 'bg-red-50 text-red-800 border-red-200'
                                            }`}>
                                                {actionResult.success ? <Check size={14} className="mt-0.5" /> : <AlertCircle size={14} className="mt-0.5" />}
                                                <span>{actionResult.msg}</span>
                                            </div>
                                        )}

                                        <div className="flex gap-3 pt-2">
                                            <Button 
                                                onClick={handleConfirmAction}
                                                className="flex-1 justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold"
                                                disabled={actionLoading || !!actionResult?.success}
                                            >
                                                {actionLoading ? (
                                                    <Loader2 size={16} className="animate-spin mr-2" />
                                                ) : (
                                                    <Check size={16} className="mr-2" />
                                                )}
                                                Confirmar Salvar
                                            </Button>
                                            <Button 
                                                onClick={handleCancelAction}
                                                variant="outline"
                                                className="flex-1 justify-center border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold"
                                                disabled={actionLoading || !!actionResult?.success}
                                            >
                                                <X size={16} className="mr-2" />
                                                Cancelar Ação
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Feedback do OCR */}
                            {ocrLoading && (
                                <div className="max-w-md mx-auto p-4 bg-slate-900 border border-white/5 rounded-2xl text-white space-y-3 shadow-premium animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="text-brand-500 animate-spin" size={20} />
                                        <div>
                                            <h5 className="text-xs font-bold">Processando Comprovante por OCR Local</h5>
                                            <p className="text-[9px] text-slate-400">Tesseract.js • Seguro & Gratuito</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="bg-brand-600 h-full transition-all duration-300"
                                            style={{ width: `${ocrProgress * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                        <span>Lendo dados da imagem...</span>
                                        <span>{Math.round(ocrProgress * 100)}%</span>
                                    </div>
                                </div>
                            )}

                            {ocrError && (
                                <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 space-y-2 flex items-start gap-3 shadow-premium-sm">
                                    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h5 className="text-xs font-bold">Falha no Leitor OCR</h5>
                                        <p className="text-xs leading-relaxed opacity-95">{ocrError}</p>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Formulário de Input / Envio */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex items-center gap-3">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />
                    
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={ocrLoading || isLoading}
                        className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex-shrink-0 relative group"
                        title="Anexar Comprovante PIX (Imagem)"
                    >
                        <Paperclip size={20} />
                        {ocrLoading && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-600 rounded-full animate-ping" />
                        )}
                    </button>

                    <input
                        type="text"
                        placeholder={ocrLoading ? 'Leitor OCR rodando localmente...' : 'Digite seu comando para a secretária...'}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading || ocrLoading}
                        className="flex-1 h-11 px-4 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white rounded-xl text-sm outline-none focus:ring-4 focus:ring-brand-500/10 placeholder:text-slate-400 transition-all"
                    />

                    <button
                        type="submit"
                        disabled={(!input.trim() && !ocrLoading) || isLoading}
                        className="h-11 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors font-extrabold gap-1.5 shadow-sm"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        <span className="hidden sm:inline text-xs">Enviar</span>
                    </button>
                </form>
            </div>

            {/* O modal de credenciais do Gemini local foi removido de forma definitiva.
                As credenciais da IA administrativa da ABCUNA agora são gerenciadas e armazenadas de forma 100% segura no backend Node.js. */}
        </div>
    );
};
