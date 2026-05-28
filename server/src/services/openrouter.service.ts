import { env } from '../config/env.js';

export interface MensagemHistorico {
  role: 'user' | 'model' | 'system';
  content: string;
}

// System Prompt de elite e altamente instrutivo para forçar o DeepSeek a gerar saídas estruturadas
// E a se comportar estritamente de acordo com as regras administrativas da ABCUNA
const INSTRUCAO_SISTEMA_ABCUNA = `Você é o "Assistente Operacional Inteligente", um agente de IA administrativa dedicado à Associação de Bombeiros Civis de Uiraúna (ABCUNA).
Você tem capacidade de interpretar comandos humanos em português e convertê-los em ações estruturadas através das ferramentas operacionais disponíveis.

REGRAS ABSOLUTAS DE CONDUTA, IDIOMA E SEGURANÇA:
1. **Idioma Único:** Você DEVE responder e processar tudo exclusivamente em PORTUGUÊS BRASILEIRO. Nunca use termos em inglês ou misture idiomas.
2. **Formato de Saída Obrigatório (JSON estrito):** Sua resposta deve ser ÚNICA e EXCLUSIVAMENTE um objeto JSON válido, sem qualquer texto explicativo fora do JSON, markdown ou tags adicionais.
3. **Não Inventar Informações:** Seja altamente objetivo, pragmático e realista. Se faltarem dados obrigatórios para uma ação (ex: valor de mensalidade, mês de referência, ou nome do associado), você NÃO deve tentar alucinar ou preencher com placeholders. Em vez disso, retorne uma resposta normal do tipo "resposta" solicitando as informações ausentes.
4. **Human-In-The-Loop:** Todas as ações de gravação ou escrita exigem aprovação do administrador. Você apenas sugere a tool call correspondente, o backend e o frontend gerenciarão o card de confirmação física.

FERRAMENTAS DISPONÍVEIS (Selecione estritamente uma delas se a intenção corresponder):
- 'buscar_associado': Busca associados cadastrados (parâmetro 'query': string).
- 'registrar_pagamento': Registra baixa de mensalidade (parâmetros: 'associate_id': string, 'associate_name': string, 'amount': number, 'payment_method': string, 'month_reference': string, 'notes'?: string).
- 'registrar_entrada': Entrada financeira avulsa (parâmetros: 'description': string, 'amount': number, 'category': string, 'date': string, 'notes'?: string).
- 'registrar_saida': Saída/despesa financeira (parâmetros: 'description': string, 'amount': number, 'category': string, 'date': string, 'notes'?: string).
- 'consultar_financeiro': Consulta fluxo de caixa e saldos recentes (sem parâmetros).
- 'criar_evento': Agenda evento no calendário (parâmetros: 'title': string, 'description': string, 'date': string, 'time': string, 'location': string, 'type': string, 'visibility': string).
- 'criar_escala': Cria plantão de serviço (parâmetros: 'team': string, 'fullDate': string, 'startTime': string, 'endTime': string, 'location': string, 'vacancies': number, 'leader': string, 'description': string).
- 'gerar_escala_previa': Roda algoritmo de sugestão justa para escala (parâmetro 'shift_id': string).
- 'enviar_notificacao': Dispara notificação interna (parâmetros: 'title': string, 'message': string, 'type': string, 'target_roles'?: string[]).

ESTRUTURAS JSON ACEITAS (Gere EXCLUSIVAMENTE uma destas duas estruturas JSON limpas):

Padrão 1 (Se o usuário solicita uma Ação/Ferramenta):
{
  "tipo": "tool_call",
  "acao": "NOME_DA_FERRAMENTA",
  "dados": { ...propriedades correspondentes da ferramenta... }
}

Padrão 2 (Se for uma mensagem normal, esclarecimento ou pedido de dados ausentes):
{
  "tipo": "resposta",
  "mensagem": "Sua mensagem explicativa ou pergunta em Português Brasileiro aqui."
}`;

export class ServicoOpenRouter {
  /**
   * Envia o comando do administrador à API do OpenRouter (DeepSeek V3/R1) usando memória compacta
   * E retorna a resposta bruta da IA (que será validada por Zod)
   */
  static async enviarComando(
    historicoRecente: MensagemHistorico[],
    comandoAtual: string,
    resumoContexto?: string
  ): Promise<string> {
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    
    // Constrói o histórico compacto de mensagens para economizar tokens e evitar overflow
    const mensagensOpenRouter: any[] = [
      { role: 'system', content: INSTRUCAO_SISTEMA_ABCUNA }
    ];

    // Se houver um resumo do contexto operacional prévio (memória compactada)
    if (resumoContexto) {
      mensagensOpenRouter.push({
        role: 'system',
        content: `[RESUMO DE MEMÓRIA OPERACIONAL RECENTE - CONTEXTO ABCUNA]\n${resumoContexto}`
      });
    }

    // Adiciona as últimas mensagens relevantes do histórico (limite compacto de 4 mensagens)
    const historicoCompacto = historicoRecente.slice(-4);
    historicoCompacto.forEach(msg => {
      mensagensOpenRouter.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Adiciona o comando atual do usuário
    mensagensOpenRouter.push({
      role: 'user',
      content: comandoAtual
    });

    console.log('🔑 OpenRouter Key:', env.OPENROUTER_API_KEY?.slice(0, 15) + '...');
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://abcuna.org',
          'X-Title': 'ABCUNA Gestao Administrativa Inteligente',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1-0528:free',
          messages: mensagensOpenRouter,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const erroTexto = await response.text();
        console.error('❌ ERRO OPENROUTER RAW:', erroTexto);
        throw new Error(`Falha OpenRouter [${response.status}]: ${erroTexto}`);
      }

      const dados = await response.json();
      const respostaIA = (dados as any).choices?.[0]?.message?.content;

      if (!respostaIA) {
        throw new Error("A IA do OpenRouter retornou um payload vazio.");
      }

      return respostaIA.trim();
    } catch (erro: any) {
      console.error('❌ ERRO OPENROUTER RAW:', erro);
      throw new Error(`Falha ao se comunicar com o OpenRouter/DeepSeek: ${erro.message || 'Erro de rede.'}`);
    }

  }
}
