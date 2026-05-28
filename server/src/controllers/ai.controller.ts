import { Response } from 'express';
import { z } from 'zod';
import { RequisicaoAutenticada } from '../middleware/auth.middleware.js';
import { ServicoOpenRouter, MensagemHistorico } from '../services/openrouter.service.js';
import { ServicoFerramentas } from '../services/tool.service.js';

// Schemas Zod obrigatórios para validação estrita das saídas da IA

const EsquemaToolCall = z.object({
  tipo: z.literal("tool_call"),
  acao: z.enum([
    "buscar_associado",
    "registrar_pagamento",
    "registrar_entrada",
    "registrar_saida",
    "consultar_financeiro",
    "criar_evento",
    "criar_escala",
    "gerar_escala_previa",
    "enviar_notificacao"
  ]),
  dados: z.record(z.any())
});

const EsquemaRespostaNormal = z.object({
  tipo: z.literal("resposta"),
  mensagem: z.string().min(1, "A mensagem de resposta não pode estar vazia.")
});

// Union schema que valida se a saída é exclusivamente um dos dois formatos
const EsquemaSaidaIA = z.union([EsquemaToolCall, EsquemaRespostaNormal]);

export class ControllerIA {
  /**
   * Endpoint de chat principal (POST /api/ai/chat)
   * Responsável por triagem, classificação de intenção, geração no DeepSeek, validação Zod e execução de leituras
   */
  static async processarChat(req: RequisicaoAutenticada, res: Response): Promise<void> {
    try {
      const { mensagem, historico } = req.body;
      const usuarioLogado = req.usuario;

      if (!mensagem || typeof mensagem !== 'string') {
        res.status(400).json({
          sucesso: false,
          mensagem: "O parâmetro 'mensagem' é obrigatório e precisa ser um texto."
        });
        return;
      }

      if (!usuarioLogado) {
        res.status(401).json({
          sucesso: false,
          mensagem: "Usuário não autenticado."
        });
        return;
      }

      const historicoFormatado: MensagemHistorico[] = (historico || []).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content
      }));

      // --- CAMADA 1: INTENT CLASSIFIER (CLASSIFICADOR DE INTENÇÃO DE BAIXO CUSTO) ---
      // Analisamos palavras-chave cruciais para modularizar e blindar quais ferramentas expor à IA
      const textoNormalizado = mensagem.toLowerCase();
      let resumoContexto = "O administrador está no painel de controle operacional da ABCUNA.";

      if (textoNormalizado.includes('mensalidade') || textoNormalizado.includes('pagar') || textoNormalizado.includes('inadimplente') || textoNormalizado.includes('financeiro') || textoNormalizado.includes('caixa') || textoNormalizado.includes('entrada') || textoNormalizado.includes('saída') || textoNormalizado.includes('despesa') || textoNormalizado.includes('receita')) {
        resumoContexto += " O foco desta solicitação é FINANCEIRO. Mantenha as ferramentas financeiras prontas para uso. Evite agendar plantões ou escalas neste comando.";
      } else if (textoNormalizado.includes('escala') || textoNormalizado.includes('plantão') || textoNormalizado.includes('plantonista') || textoNormalizado.includes('serviço') || textoNormalizado.includes('equipe')) {
        resumoContexto += " O foco desta solicitação é a ESCALA DE PLANTÕES. Ajude a criar ou distribuir equipes operacionais.";
      } else if (textoNormalizado.includes('evento') || textoNormalizado.includes('reunião') || textoNormalizado.includes('treinamento') || textoNormalizado.includes('calendário')) {
        resumoContexto += " O foco desta solicitação é o CALENDÁRIO de Eventos ou Instruções operacionais da associação.";
      }

      // --- CAMADA 2: GERAÇÃO E VALIDAÇÃO COM REGENERAÇÃO AUTOMÁTICA (RETRY) ---
      let respostaBruta = "";
      let dadosValidados: any = null;
      let tentativas = 0;
      const MAX_TENTATIVAS = 2;
      let promptAdicionalFeedback = "";

      while (tentativas <= MAX_TENTATIVAS) {
        try {
          respostaBruta = await ServicoOpenRouter.enviarComando(
            historicoFormatado,
            promptAdicionalFeedback ? `${mensagem}\n\n[AVISO DO PARSER DO BACKEND]: ${promptAdicionalFeedback}` : mensagem,
            resumoContexto
          );

          // Tenta fazer o parse do JSON retornado pela IA
          const objetoResposta = JSON.parse(respostaBruta);
          
          // Validação estrita do schema usando Zod
          const resultadoZod = EsquemaSaidaIA.safeParse(objetoResposta);

          if (resultadoZod.success) {
            dadosValidados = resultadoZod.data;
            break; // Sucesso absoluto na validação, quebra o laço de retry!
          } else {
            // Se falhar a validação Zod, formata o feedback de erro para re-instruir a IA no próximo loop
            const erros = resultadoZod.error.format();
            console.warn(`⚠️ [Zod Validation Fail] Tentativa ${tentativas + 1} falhou. Estrutura inválida gerada pela IA:`, erros);
            promptAdicionalFeedback = `Sua resposta anterior em formato JSON falhou na validação de tipos de dados Zod. Por favor, corrija o formato imediatamente. Erro: ${JSON.stringify(erros)}. Retorne EXCLUSIVAMENTE o JSON corrigido de acordo com os schemas definidos.`;
          }
        } catch (erroParse: any) {
          console.warn(`⚠️ [JSON Parser Fail] Tentativa ${tentativas + 1} falhou. A IA não retornou um JSON de completions válido:`, erroParse.message);
          promptAdicionalFeedback = `Sua resposta anterior não foi um objeto JSON válido ou continha caracteres incorretos. Por favor, re-estruture sua resposta em formato JSON estrito válido imediatamente.`;
        }

        tentativas++;
      }

      // Se estourar o limite de tentativas e a IA persistir no formato inválido
      if (!dadosValidados) {
        // Grava log de falha de IA para auditoria de segurança
        await ServicoFerramentas.registrarLogAuditoria({
          usuarioId: usuarioLogado.id,
          acao: "IA_PARSER_ERROR",
          detalhes: { mensagem, respostaBruta },
          confirmado: false,
          sucesso: false,
          mensagemErro: "Falha estrita de validação do Zod após múltiplos retries automáticos."
        });

        res.status(422).json({
          sucesso: false,
          mensagem: "Desculpe, a inteligência artificial não conseguiu estruturar a resposta no formato operacional da ABCUNA após várias tentativas automáticas de regeneração. Por favor, reformule seu comando com termos mais objetivos."
        });
        return;
      }

      // --- CAMADA 3: INTERCEPTAÇÃO E EXECUÇÃO DE LEITURAS IMEDIATAS ---
      // Se for uma ferramenta de LEITURA (buscar, inadimplentes, financeiro), executa agora de forma segura no backend!
      const acoesLeitura = ['buscar_associado', 'listar_inadimplentes', 'consultar_financeiro'];

      if (dadosValidados.tipo === 'tool_call' && acoesLeitura.includes(dadosValidados.acao)) {
        console.log(`⚡ Executando ferramenta de leitura direta: '${dadosValidados.acao}' para o usuário ${usuarioLogado.nome}`);
        
        const resultadoLeitura = await ServicoFerramentas.executarFerramenta(
          dadosValidados.acao,
          dadosValidados.dados,
          usuarioLogado
        );

        if (resultadoLeitura.sucesso) {
          // Formata os dados de leitura em formato de texto estruturado
          const dadosFormatadosTextualmente = JSON.stringify(resultadoLeitura.dados, null, 2);
          
          // Cria um prompt de síntese para a IA explicar amigavelmente em português os dados buscados do Supabase
          const promptSintese = `O sistema da ABCUNA executou com sucesso a busca '${dadosValidados.acao}'. Resultados brutos do banco de dados:\n${dadosFormatadosTextualmente}\n\nPor favor, formate de forma limpa, organizada e amigável em português esses dados para exibição final ao administrador. Não invente nada fora desse resultado.`;

          const respostaSintetizadaBruta = await ServicoOpenRouter.enviarComando(
            [...historicoFormatado, { role: 'user', content: mensagem }],
            promptSintese,
            "Sintetizador operacional de dados reais buscados no Supabase."
          );

          try {
            const jsonSintetizado = JSON.parse(respostaSintetizadaBruta);
            const resultadoSinteseZod = EsquemaSaidaIA.safeParse(jsonSintetizado);

            if (resultadoSinteseZod.success) {
              res.status(200).json({
                sucesso: true,
                tipo: "resposta",
                mensagem: resultadoSinteseZod.data.tipo === 'resposta' ? (resultadoSinteseZod.data as any).mensagem : "Resultado consultado com sucesso!"
              });
              return;
            }
          } catch (e) {}

          // Fallback se a síntese JSON falhar: Envia resposta básica
          res.status(200).json({
            sucesso: true,
            tipo: "resposta",
            mensagem: `Aqui estão os resultados da busca no sistema:\n\n${dadosFormatadosTextualmente}`
          });
          return;
        } else {
          res.status(400).json({
            sucesso: false,
            mensagem: resultadoLeitura.erro || "Falha ao realizar busca de informações."
          });
          return;
        }
      }

      // Se for Tool Call de Escrita (pagamentos, escalas, etc.), retorna o JSON limpo
      // para que o frontend intercepte e exiba o card de confirmação humano (Human-In-The-Loop)
      res.status(200).json({
        sucesso: true,
        ...dadosValidados
      });

    } catch (erro: any) {
      console.error("❌ Erro interno no Controller do Chat de IA:", erro);
      res.status(500).json({
        sucesso: false,
        mensagem: "Ocorreu um erro interno ao processar a comunicação com a inteligência artificial da ABCUNA."
      });
    }
  }

  /**
   * Endpoint de execução física (POST /api/ai/execute)
   * Disparado pelo frontend APÓS aprovação do administrador humano no card de Tool Call
   */
  static async executarAcaoConfirmada(req: RequisicaoAutenticada, res: Response): Promise<void> {
    try {
      const { acao, dados } = req.body;
      const usuarioLogado = req.usuario;

      if (!acao || !dados) {
        res.status(400).json({
          sucesso: false,
          mensagem: "Os parâmetros 'acao' e 'dados' são obrigatórios para a execução física no banco."
        });
        return;
      }

      if (!usuarioLogado) {
        res.status(401).json({
          sucesso: false,
          mensagem: "Acesso negado. Administrador não autenticado para esta operação física."
        });
        return;
      }

      console.log(`🛠️ [Confirmado por Administrador] Executando persistência de '${acao}' sob controle humano.`);

      const resultado = await ServicoFerramentas.executarFerramenta(
        acao,
        dados,
        usuarioLogado
      );

      if (resultado.sucesso) {
        res.status(200).json({
          sucesso: true,
          dados: resultado.dados,
          mensagem: "Operação executada e persistida no banco de dados da ABCUNA com sucesso!"
        });
      } else {
        res.status(400).json({
          sucesso: false,
          mensagem: resultado.erro || "Falha ao gravar alteração no banco."
        });
      }

    } catch (erro: any) {
      console.error("❌ Erro interno no Controller de Execução Física:", erro);
      res.status(500).json({
        sucesso: false,
        mensagem: "Ocorreu um erro interno ao processar a gravação no banco de dados."
      });
    }
  }
}
