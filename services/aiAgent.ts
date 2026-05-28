import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface ChatMessage {
    id?: string;
    role: 'user' | 'model';
    content: string;
    file_url?: string;
    file_type?: string;
    created_at?: string;
}

export interface AgentPendingAction {
    id: string; // ID gerado para renderização visual
    functionName: string;
    args: any;
    label: string; // Descrição em português para o Administrador aprovar
}

const BACKEND_URL = 'http://localhost:3001/api/ai';

export const aiAgentService = {
    /**
     * Carrega o histórico de mensagens salvas diretamente do Supabase RLS
     */
    async loadMessages(): Promise<ChatMessage[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('ai_chat_messages')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (erro) {
            console.error('Erro ao carregar histórico de mensagens:', erro);
            return [];
        }
    },

    /**
     * Persiste uma mensagem no Supabase para manter o histórico de chat do usuário
     */
    async saveMessage(role: 'user' | 'model', content: string, fileUrl?: string, fileType?: string): Promise<ChatMessage | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('ai_chat_messages')
                .insert({
                    user_id: user.id,
                    role,
                    content,
                    file_url: fileUrl || null,
                    file_type: fileType || null
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (erro) {
            console.error('Erro ao gravar mensagem de chat:', erro);
            return null;
        }
    },

    /**
     * Limpa o histórico de chat do usuário atual
     */
    async clearHistory(): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('ai_chat_messages')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;
        } catch (erro) {
            console.error('Erro ao limpar histórico de conversas:', erro);
            throw erro;
        }
    },

    /**
     * Grava o log de auditoria no frontend (opcional, visto que o backend já faz isso no executor físico)
     */
    async logAgentAction(action: string, details: any, confirmed: boolean): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('ai_agent_logs').insert({
                user_id: user.id,
                action,
                details,
                confirmed,
                success: null
            });
        } catch (erro) {
            console.error('Erro ao salvar log de cancelamento da ação:', erro);
        }
    },

    /**
     * Envia a mensagem do usuário + histórico para o novo backend Node.js seguro
     * E retorna a resposta explicativa ou a ferramenta (Tool Call) estruturada
     */
    async sendMessage(
        history: ChatMessage[],
        newMessageContent: string
    ): Promise<{ text: string; pendingAction: AgentPendingAction | null }> {
        try {
            // Busca a sessão ativa do Supabase para obter o JWT assinado
            const { data: { session }, error: erroSessao } = await supabase.auth.getSession();

            if (erroSessao || !session?.access_token) {
                return {
                    text: '⚠️ Usuário não autenticado ou sessão expirada no sistema da ABCUNA.',
                    pendingAction: null
                };
            }

            const response = await fetch(`${BACKEND_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    mensagem: newMessageContent,
                    historico: history
                })
            });

            if (!response.ok) {
                const erroJson = await response.json().catch(() => ({}));
                const msgErro = erroJson?.mensagem || `Erro HTTP ${response.status}`;
                return {
                    text: `❌ Falha ao processar com a IA: ${msgErro}`,
                    pendingAction: null
                };
            }

            const dados = await response.json();

            if (dados.tipo === 'tool_call') {
                return {
                    text: `Sugeri a seguinte ação: **${obterDescricaoAmigavelAcao(dados.acao, dados.dados)}**. Por favor, confira os dados abaixo e confirme para salvar no sistema.`,
                    pendingAction: {
                        id: Math.random().toString(36).substring(2, 9),
                        functionName: dados.acao,
                        args: dados.dados,
                        label: obterDescricaoAmigavelAcao(dados.acao, dados.dados)
                    }
                };
            }

            if (dados.tipo === 'resposta') {
                return {
                    text: dados.mensagem,
                    pendingAction: null
                };
            }

            return {
                text: 'IA respondeu em formato desconhecido pelo validador.',
                pendingAction: null
            };

        } catch (erro: any) {
            console.error('Falha de rede ao se comunicar com o backend de IA:', erro);
            return {
                text: `❌ Não foi possível se conectar ao Servidor Administrativo de IA ABCUNA local. Verifique se o servidor backend Express na porta 3001 está ativo. Erro: ${erro.message || 'Sem conexão.'}`,
                pendingAction: null
            };
        }
    },

    /**
     * Executa a gravação REAL no banco enviando a aprovação humana ao backend Express
     */
    async executeConfirmedAction(actionName: string, args: any): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                return { success: false, error: 'Sessão de usuário expirada ou inválida.' };
            }

            const response = await fetch(`${BACKEND_URL}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    acao: actionName,
                    dados: args
                })
            });

            const resultado = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: resultado?.mensagem || 'Falha ao executar alteração física no backend.'
                };
            }

            return {
                success: true,
                data: resultado.dados
            };

        } catch (erro: any) {
            console.error('Erro de conexão ao enviar confirmação de ação física:', erro);
            return {
                success: false,
                error: `Erro ao enviar aprovação para o servidor: ${erro.message || 'Falha de rede.'}`
            };
        }
    },

    /**
     * Mantemos a assinatura da função executeReadQuery antiga para evitar qualquer tipo de quebra
     * embora o backend agora faça a leitura imediata e retorne o resultado de forma transparente!
     */
    async executeReadQuery(functionName: string, args: any): Promise<any> {
        logger.info('IA', `Consulta antiga de leitura ignorada. O backend agora lida de forma unificada para ${functionName}`);
        return { info: 'Executado automaticamente pelo servidor backend.' };
    }
};

/**
 * Retorna uma descrição em português humanizada e profissional para a aprovação visual
 */
function obterDescricaoAmigavelAcao(nomeAcao: string, args: any): string {
    switch (nomeAcao) {
        case 'registrar_pagamento':
            return `Registrar recebimento de mensalidade de ${args.associate_name} no valor de R$ ${Number(args.amount).toFixed(2)} (${args.month_reference})`;
        case 'registrar_entrada':
            return `Lançar receita de caixa no valor de R$ ${Number(args.amount).toFixed(2)}: "${args.description}"`;
        case 'registrar_saida':
            return `Lançar despesa de caixa no valor de R$ ${Number(args.amount).toFixed(2)}: "${args.description}"`;
        case 'criar_evento':
            return `Criar novo evento/treinamento: "${args.title}" no dia ${args.date} às ${args.time}`;
        case 'criar_escala':
            return `Montar plantão da escala "${args.team}" no dia ${args.fullDate} das ${args.startTime} às ${args.endTime}`;
        case 'gerar_escala_previa':
            return `Gerar sugestão automatizada de plantonistas (rodízio)`;
        case 'enviar_notificacao':
            return `Disparar notificação aos associados: "${args.title}"`;
        default:
            return `Executar ação operacional ${nomeAcao}`;
    }
}
