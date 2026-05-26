import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { financialService } from './financial';
import { associatesService } from './associates';
import { eventsService } from './events';
import { scheduleService } from './schedule';
import { notificationService } from './notifications';

export interface ChatMessage {
    id?: string;
    role: 'user' | 'model';
    content: string;
    file_url?: string;
    file_type?: string;
    created_at?: string;
}

export interface AgentPendingAction {
    id: string; // ID temporário para identificação no frontend
    functionName: string;
    args: any;
    label: string; // Descrição legível para o usuário
}

/**
 * Recupera a chave API do Gemini configurada no .env ou local storage
 */
export function getGeminiApiKey(): string {
    const localKey = localStorage.getItem('gemini_api_key');
    if (localKey && localKey.trim()) return localKey.trim();
    
    // Fallback para variável de ambiente
    const envKey = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY) as string;
    if (envKey && envKey !== 'PLACEHOLDER_API_KEY') return envKey;
    
    logger.warn('IA', 'Chave da API Gemini não encontrada');
    return '';
}

/**
 * Verifica se a chave do Gemini está configurada
 */
export function hasApiKey(): boolean {
    return getGeminiApiKey() !== '';
}

// System Instruction para dar personalidade e regras estritas à IA
const SYSTEM_INSTRUCTION = `Você é a "Secretária IA", uma assistente e secretária virtual operacional dedicada à Associação de Bombeiros Civis de Uiraúna (ABCUNA).
Você tem a capacidade de interpretar comandos humanos em português e convertê-los em ações do sistema através das ferramentas disponíveis.

REGRAS DE CONDUTA E SEGURANÇA CRÍTICAS:
1. **Confirmação Obrigatória:** Para QUALQUER ação de gravação, alteração ou exclusão de dados (como registrar pagamentos, entradas, saídas, eventos, escalas ou notificações), você DEVE acionar a ferramenta correspondente. O sistema irá interceptar e exigir que o usuário confirme visualmente clicando em um botão antes de executar no banco. Deixe claro que a ação está aguardando confirmação.
2. **Níveis de Acesso e RLS:** Você roda diretamente no navegador do usuário conectado. A segurança RLS do Supabase é implícita e protege o banco com base no perfil dele. Portanto, execute as ferramentas normalmente e deixe que o banco valide as permissões.
3. **Erros no Banco:** Se uma ferramenta retornar um erro de permissão ou falha de banco, avise o usuário educadamente em português.
4. **Respostas em Português do Brasil:** Sempre fale em português amigável, prestativo e profissional de bombeiro operacional. Use termos de respeito se apropriado, mas mantenha uma comunicação moderna.
5. **OCR de Comprovantes:** Se o usuário enviar uma leitura de comprovante PIX extraída via OCR, analise os dados fornecidos no prompt (valor, data, pagador, chave, banco) e responda de forma estruturada, oferecendo-se para registrar o pagamento do associado.

FERRAMENTAS DISPONÍVEIS:
Você pode chamar ferramentas para buscar associados, ver inadimplentes, ver finanças, criar eventos, criar escalas, disparar escalas prévias ou enviar notificações. Sempre chame a ferramenta certa quando o usuário solicitar uma operação compatível.`;

// Declarações de ferramentas (tools) estruturadas para o Gemini
const GEMINI_TOOLS = [
    {
        functionDeclarations: [
            {
                name: 'buscar_associado',
                description: 'Busca associados cadastrados no sistema pelo nome, e-mail ou CPF.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        query: {
                            type: 'STRING',
                            description: 'Termo de busca (nome, e-mail ou CPF do associado)'
                        }
                    },
                    required: ['query']
                }
            },
            {
                name: 'listar_inadimplentes',
                description: 'Lista todos os associados que estão com mensalidades em atraso (status LATE).',
                parameters: {
                    type: 'OBJECT',
                    properties: {}
                }
            },
            {
                name: 'registrar_pagamento',
                description: 'Registra a baixa de pagamento de mensalidade de um associado. Roda após confirmação visual do usuário.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        associate_id: {
                            type: 'STRING',
                            description: 'ID único do associado no sistema'
                        },
                        associate_name: {
                            type: 'STRING',
                            description: 'Nome completo do associado para exibição visual'
                        },
                        amount: {
                            type: 'NUMBER',
                            description: 'Valor pago em reais'
                        },
                        payment_method: {
                            type: 'STRING',
                            description: 'Método de pagamento (ex: PIX, Dinheiro, Cartão)',
                            enum: ['PIX', 'Dinheiro', 'Cartão', 'Transferência']
                        },
                        month_reference: {
                            type: 'STRING',
                            description: 'Mês de referência (ex: Maio/2026, Junho/2026)'
                        },
                        notes: {
                            type: 'STRING',
                            description: 'Observações adicionais (ex: banco de origem, ID de transação)'
                        }
                    },
                    required: ['associate_id', 'associate_name', 'amount', 'payment_method', 'month_reference']
                }
            },
            {
                name: 'registrar_entrada',
                description: 'Registra uma entrada/receita financeira avulsa no caixa (ex: doações, prefeitura, taxas). Roda após confirmação.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        description: {
                            type: 'STRING',
                            description: 'Descrição detalhada do recebimento'
                        },
                        amount: {
                            type: 'NUMBER',
                            description: 'Valor em reais da entrada'
                        },
                        category: {
                            type: 'STRING',
                            description: 'Categoria da receita',
                            enum: ['Donation', 'Membership', 'Taxa de Inscrição', 'Other']
                        },
                        date: {
                            type: 'STRING',
                            description: 'Data do recebimento no formato AAAA-MM-DD'
                        },
                        notes: {
                            type: 'STRING',
                            description: 'Notas adicionais sobre o pagamento'
                        }
                    },
                    required: ['description', 'amount', 'category', 'date']
                }
            },
            {
                name: 'registrar_saida',
                description: 'Registra uma saída/despesa financeira no caixa (ex: EPIs, manutenção, lanches). Roda após confirmação.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        description: {
                            type: 'STRING',
                            description: 'Descrição detalhada do gasto'
                        },
                        amount: {
                            type: 'NUMBER',
                            description: 'Valor em reais da saída'
                        },
                        category: {
                            type: 'STRING',
                            description: 'Categoria da despesa',
                            enum: ['Maintenance', 'Equipment', 'Other']
                        },
                        date: {
                            type: 'STRING',
                            description: 'Data do pagamento no formato AAAA-MM-DD'
                        },
                        notes: {
                            type: 'STRING',
                            description: 'Notas adicionais (ex: fornecedor, NF)'
                        }
                    },
                    required: ['description', 'amount', 'category', 'date']
                }
            },
            {
                name: 'consultar_financeiro',
                description: 'Consulta movimentações financeiras recentes ou exibe o resumo financeiro atual de saldos.',
                parameters: {
                    type: 'OBJECT',
                    properties: {}
                }
            },
            {
                name: 'criar_evento',
                description: 'Agenda um novo evento, reunião ou instrução operacional no calendário da ABCUNA. Roda após confirmação.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        title: {
                            type: 'STRING',
                            description: 'Título do evento ou instrução'
                        },
                        description: {
                            type: 'STRING',
                            description: 'Descrição detalhada do evento'
                        },
                        date: {
                            type: 'STRING',
                            description: 'Data do evento no formato AAAA-MM-DD'
                        },
                        time: {
                            type: 'STRING',
                            description: 'Horário do evento (HH:MM)'
                        },
                        location: {
                            type: 'STRING',
                            description: 'Local do evento'
                        },
                        type: {
                            type: 'STRING',
                            description: 'Tipo do evento',
                            enum: ['TRAINING', 'MEETING', 'OPERATION', 'EVENT']
                        },
                        visibility: {
                            type: 'STRING',
                            description: 'Visibilidade',
                            enum: ['PUBLIC', 'BOARD']
                        }
                    },
                    required: ['title', 'date', 'time', 'location', 'type']
                }
            },
            {
                name: 'criar_escala',
                description: 'Cria uma nova escala de plantão/esboço de serviço para os bombeiros civis. Roda após confirmação.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        team: {
                            type: 'STRING',
                            description: 'Nome da equipe ou plantão (ex: Equipe Alfa, Plantão Cobertura)'
                        },
                        fullDate: {
                            type: 'STRING',
                            description: 'Data no formato AAAA-MM-DD'
                        },
                        startTime: {
                            type: 'STRING',
                            description: 'Horário de início (HH:MM)'
                        },
                        endTime: {
                            type: 'STRING',
                            description: 'Horário de término (HH:MM)'
                        },
                        location: {
                            type: 'STRING',
                            description: 'Local de atuação'
                        },
                        vacancies: {
                            type: 'NUMBER',
                            description: 'Número de vagas para plantonistas'
                        },
                        leader: {
                            type: 'STRING',
                            description: 'Nome do líder da escala'
                        },
                        description: {
                            type: 'STRING',
                            description: 'Notas e descrição do plantão'
                        }
                    },
                    required: ['team', 'fullDate', 'startTime', 'endTime', 'vacancies']
                }
            },
            {
                name: 'gerar_escala_previa',
                description: 'Chama o algoritmo inteligente do sistema para sugerir a melhor equipe para um plantão específico baseada em regras de rodízio justo.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        shift_id: {
                            type: 'STRING',
                            description: 'ID da escala de plantão criada'
                        }
                    },
                    required: ['shift_id']
                }
            },
            {
                name: 'enviar_notificacao',
                description: 'Dispara uma notificação interna para usuários logados. Roda após confirmação.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        title: {
                            type: 'STRING',
                            description: 'Título da notificação'
                        },
                        message: {
                            type: 'STRING',
                            description: 'Mensagem da notificação'
                        },
                        type: {
                            type: 'STRING',
                            description: 'Tipo de notificação',
                            enum: ['FINANCIAL', 'EVENT', 'SCHEDULE', 'CLASSROOM', 'SYSTEM']
                        },
                        target_roles: {
                          type: 'ARRAY',
                          items: {
                            type: 'STRING'
                          },
                          description: "Funções dos usuários que devem receber (ex: ['ADMIN', 'ASSOCIATE'])"
                        }
                    },
                    required: ['title', 'message', 'type']
                }
            }
        ]
    }
];

export const aiAgentService = {
    /**
     * Carrega as mensagens salvas do banco de dados do usuário atual
     */
    async loadMessages(): Promise<ChatMessage[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('ai_chat_messages')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error loading chat history:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Salva uma mensagem no banco de dados para manter o histórico
     */
    async saveMessage(role: 'user' | 'model', content: string, fileUrl?: string, fileType?: string): Promise<ChatMessage | null> {
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

        if (error) {
            console.error('Error saving chat message:', error);
            return null;
        }

        return data;
    },

    /**
     * Limpa o histórico de chat do banco de dados para o usuário atual
     */
    async clearHistory(): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('ai_chat_messages')
            .delete()
            .eq('user_id', user.id);

        if (error) {
            console.error('Error clearing chat history:', error);
            throw error;
        }
    },

    /**
     * Envia o prompt para a API do Gemini e interpreta respostas ou Function Calls
     */
    async sendMessage(
        history: ChatMessage[],
        newMessageContent: string,
        attachedFileData?: { base64Data: string; mimeType: string }
    ): Promise<{ text: string; pendingAction: AgentPendingAction | null }> {
        const apiKey = getGeminiApiKey();
        if (!apiKey) {
            return {
                text: '⚠️ A chave da API do Gemini não está configurada! Por favor, vá até Configurações > Chave Gemini e insira uma chave válida para poder conversar.',
                pendingAction: null
            };
        }

        // Formata o histórico no padrão aceito pela API do Gemini
        const formattedContents: any[] = [];
        
        // Adiciona as mensagens anteriores
        history.forEach(msg => {
            formattedContents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            });
        });

        // Adiciona o novo prompt do usuário
        const newParts: any[] = [{ text: newMessageContent }];
        
        // Se houver anexo inline (imagem/comprovante)
        if (attachedFileData) {
            newParts.unshift({
                inlineData: {
                    data: attachedFileData.base64Data,
                    mimeType: attachedFileData.mimeType
                }
            });
        }

        formattedContents.push({
            role: 'user',
            parts: newParts
        });

        // Definir modelo padrão compatível com plano gratuito
        const PRIMARY_MODEL = 'gemini-1.5-flash-latest';
        const FALLBACK_MODEL = 'gemini-1.5-pro-latest';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${PRIMARY_MODEL}:generateContent?key=${apiKey}`;

        try {
            // Tentativa com modelo primário
            let response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: formattedContents,
                    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                    tools: GEMINI_TOOLS,
                    toolConfig: { functionCallingConfig: { mode: 'AUTO' } }
                })
            });

            // Se falhar por quota, modelo não encontrado ou indisponibilidade, tenta fallback
            if (!response.ok) {
                const errData = await response.json();
                const errMsg = errData.error?.message?.toLowerCase() || '';
                const shouldFallback = errMsg.includes('quota') || errMsg.includes('model') || errMsg.includes('unavailable');
                if (shouldFallback) {
                    console.warn('Fallback Gemini model triggered due to error:', errMsg);
                    const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${FALLBACK_MODEL}:generateContent?key=${apiKey}`;
                    response = await fetch(fallbackUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: formattedContents,
                            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                            tools: GEMINI_TOOLS,
                            toolConfig: { functionCallingConfig: { mode: 'AUTO' } }
                        })
                    });
                } else {
                    console.error('Gemini API Error details:', errData);
                    throw new Error(errData.error?.message || 'Falha na resposta do Gemini.');
                }
            }

            const data = await response.json();
            const candidate = data.candidates?.[0];
            const content = candidate?.content;
            const parts = content?.parts || [];

            let textResponse = '';
            let pendingAction: AgentPendingAction | null = null;
            for (const part of parts) {
                if (part.text) textResponse += part.text;
                if (part.functionCall) {
                    const fc = part.functionCall;
                    pendingAction = {
                        id: Math.random().toString(36).substring(2, 9),
                        functionName: fc.name,
                        args: fc.args,
                        label: getFriendlyActionLabel(fc.name, fc.args)
                    };
                }
            }
            if (!textResponse && pendingAction) {
                textResponse = `Agendando ação: **${pendingAction.label}**. Aguardando sua confirmação para executar no sistema...`;
            }
            return { text: textResponse || 'Não consegui processar a resposta.', pendingAction };
        } catch (error: any) {
            console.error('Error communicating with Gemini API:', error);
            return { text: `❌ Ocorreu um erro ao comunicar com a inteligência artificial: ${error.message || 'Verifique sua conexão e chave de API.'}`, pendingAction: null };
        }
    },

    /**
     * Executa consultas imediatas de leitura (sem gravação) para alimentar a IA
     */
    async executeReadQuery(functionName: string, args: any): Promise<any> {
        try {
            switch (functionName) {
                case 'buscar_associado':
                    const query = (args.query || '').trim();
                    const { data: associates, error: assocErr } = await supabase
                        .from('profiles')
                        .select('id, full_name, email, phone, cpf, role, status')
                        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,cpf.ilike.%${query}%`)
                        .limit(5);
                    
                    if (assocErr) throw assocErr;
                    return associates || [];

                case 'listar_inadimplentes':
                    const associatesList = await associatesService.getAll();
                    return associatesList.filter(a => a.paymentStatus === 'LATE');

                case 'consultar_financeiro':
                    const summary = await financialService.getSummary();
                    const transactions = await financialService.getAll(0, 10);
                    return {
                        summary,
                        recentTransactions: transactions.slice(0, 5)
                    };

                default:
                    return { error: 'Ferramenta de leitura não mapeada.' };
            }
        } catch (err: any) {
            console.error(`Error executing read query for ${functionName}:`, err);
            return { error: err.message || 'Falha ao buscar dados.' };
        }
    },

    /**
     * Grava o log de auditoria do Agente de IA no banco de dados
     */
    async logAgentAction(action: string, details: any, confirmed: boolean, success?: boolean, errorMessage?: string): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('ai_agent_logs').insert({
                user_id: user?.id || null,
                action,
                details,
                confirmed,
                success: success ?? null,
                error_message: errorMessage || null
            });
        } catch (err) {
            console.error('Failed to save AI log audit:', err);
        }
    },

    /**
     * Executa a gravação REAL no banco de dados APÓS a aprovação do usuário na tela
     */
    async executeConfirmedAction(actionName: string, args: any): Promise<{ success: boolean; data?: any; error?: string }> {
        // Registra o log inicial de confirmação do usuário
        await this.logAgentAction(actionName, args, true);

        try {
            let result: any;
            switch (actionName) {
                case 'registrar_pagamento':
                    // Registra a receita de Mensalidade vinculada ao associado
                    result = await financialService.create({
                        description: `Mensalidade - ${args.associate_name} (${args.month_reference})`,
                        amount: Number(args.amount),
                        type: 'INCOME',
                        category: 'Membership',
                        date: new Date().toISOString().split('T')[0],
                        status: 'COMPLETED',
                        payer_id: args.associate_id,
                        notes: args.notes || `Registrado por IA. Método: ${args.payment_method}`
                    });
                    
                    // Atualiza o status do associado para ATIVO (e em dia é computado pela view)
                    await supabase
                        .from('profiles')
                        .update({ status: 'ACTIVE' })
                        .eq('id', args.associate_id);
                    
                    break;

                case 'registrar_entrada':
                    result = await financialService.create({
                        description: args.description,
                        amount: Number(args.amount),
                        type: 'INCOME',
                        category: args.category || 'Other',
                        date: args.date,
                        status: 'COMPLETED',
                        notes: args.notes || 'Registrado via comando de IA'
                    });
                    break;

                case 'registrar_saida':
                    result = await financialService.create({
                        description: args.description,
                        amount: Number(args.amount),
                        type: 'EXPENSE',
                        category: args.category || 'Other',
                        date: args.date,
                        status: 'COMPLETED',
                        notes: args.notes || 'Registrado via comando de IA'
                    });
                    break;

                case 'criar_evento':
                    result = await eventsService.create({
                        title: args.title,
                        description: args.description || '',
                        date: args.date,
                        time: args.time || '08:00',
                        location: args.location || 'Sede',
                        type: args.type || 'EVENT',
                        status: 'ACTIVE',
                        visibility: args.visibility || 'PUBLIC'
                    });
                    break;

                case 'criar_escala':
                    result = await scheduleService.create({
                        team: args.team,
                        fullDate: args.fullDate,
                        startTime: args.startTime,
                        endTime: args.endTime,
                        location: args.location || 'Sede',
                        vacancies: Number(args.vacancies || 1),
                        leader: args.leader || 'A definir',
                        description: args.description || '',
                        status: 'PENDING',
                        members: [],
                        organizer: 'Sistema IA',
                        amount: 0
                    });
                    break;

                case 'gerar_escala_previa':
                    // Roda a sugestão de plantão e salva a prévia
                    const proposedMembers = await scheduleService.generatePreview(args.shift_id);
                    await scheduleService.updateMembers(args.shift_id, proposedMembers);
                    result = {
                        message: 'Escala prévia gerada com sucesso!',
                        members: proposedMembers
                    };
                    break;

                case 'enviar_notificacao':
                    // Dispara a notificação para os papéis de destino
                    const targetUserIds = await associatesService.getNotificationTargets(args.target_roles || []);
                    
                    result = await notificationService.add({
                        title: args.title,
                        message: args.message,
                        type: args.type || 'SYSTEM',
                        link: '/events',
                        targetUserIds: targetUserIds.length > 0 ? targetUserIds : undefined,
                        broadcast: targetUserIds.length === 0
                    });
                    break;

                default:
                    throw new Error(`Ação '${actionName}' não possui um executor associado.`);
            }

            // Atualiza o log marcando o sucesso
            await supabase.from('ai_agent_logs')
                .update({ success: true })
                .eq('action', actionName)
                .order('created_at', { ascending: false })
                .limit(1);

            return { success: true, data: result };

        } catch (err: any) {
            console.error(`Error executing action ${actionName}:`, err);
            
            // Atualiza o log salvando o erro
            await supabase.from('ai_agent_logs')
                .update({ success: false, error_message: err.message || 'Erro desconhecido.' })
                .eq('action', actionName)
                .order('created_at', { ascending: false })
                .limit(1);

            return { success: false, error: err.message || 'Falha ao salvar alteração.' };
        }
    }
};

/**
 * Retorna uma descrição amigável em português para cada função da IA
 */
function getFriendlyActionLabel(functionName: string, args: any): string {
    switch (functionName) {
        case 'registrar_pagamento':
            return `Dar baixa na mensalidade de ${args.associate_name} - Valor R$ ${Number(args.amount).toFixed(2)} (${args.month_reference})`;
        case 'registrar_entrada':
            return `Registrar entrada de R$ ${Number(args.amount).toFixed(2)}: "${args.description}"`;
        case 'registrar_saida':
            return `Registrar saída de R$ ${Number(args.amount).toFixed(2)}: "${args.description}"`;
        case 'criar_evento':
            return `Criar evento "${args.title}" no dia ${args.date} às ${args.time}`;
        case 'criar_escala':
            return `Criar escala de plantão "${args.team}" no dia ${args.fullDate} das ${args.startTime} às ${args.endTime}`;
        case 'gerar_escala_previa':
            return `Gerar escala prévia inteligente (rodízio) para o plantão`;
        case 'enviar_notificacao':
            return `Disparar notificação em massa: "${args.title}"`;
        default:
            return `Executar função ${functionName}`;
    }
}
