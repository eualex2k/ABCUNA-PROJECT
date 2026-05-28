import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';

export interface ParametrosAuditoria {
  usuarioId: string;
  acao: string;
  detalhes: any;
  confirmado: boolean;
  sucesso?: boolean;
  mensagemErro?: string;
}

export class ServicoFerramentas {
  /**
   * Registra uma ação do Agente de IA para auditoria na tabela 'ai_agent_logs'
   */
  static async registrarLogAuditoria(params: ParametrosAuditoria): Promise<void> {
    try {
      await supabaseAdmin.from('ai_agent_logs').insert({
        user_id: params.usuarioId,
        action: params.acao,
        details: params.detalhes,
        confirmed: params.confirmado,
        success: params.sucesso ?? null,
        error_message: params.mensagemErro || null
      });
      console.log(`📊 Log de auditoria registrado para ação '${params.acao}' do usuário ${params.usuarioId}`);
    } catch (erro) {
      console.error("❌ Falha crítica ao gravar log de auditoria no banco:", erro);
    }
  }

  /**
   * Executa a ferramenta administrativa no banco de dados após passar por todas as travas de segurança
   */
  static async executarFerramenta(
    nomeAcao: string,
    dados: any,
    usuario: { id: string; role: string; nome: string }
  ): Promise<{ sucesso: boolean; dados?: any; erro?: string }> {
    
    // 1. AVALIAÇÃO DE CONTROLE DE ACESSO POR PAPEL (ACL)
    const papeisFinanceiros = ['ADMIN', 'FINANCIAL'];
    const papeisEscala = ['ADMIN', 'FINANCIAL', 'SECRETARY'];

    // Travas de ACL rígidas no Backend
    if (['registrar_pagamento', 'registrar_entrada', 'registrar_saida', 'consultar_financeiro', 'listar_inadimplentes'].includes(nomeAcao)) {
      if (!papeisFinanceiros.includes(usuario.role)) {
        return {
          sucesso: false,
          erro: `Acesso negado. Seu perfil de '${usuario.role}' não possui privilégios para executar operações financeiras.`
        };
      }
    }

    if (['criar_evento', 'criar_escala', 'gerar_escala_previa', 'enviar_notificacao'].includes(nomeAcao)) {
      if (!papeisEscala.includes(usuario.role) && usuario.role !== 'INSTRUCTOR') {
        return {
          sucesso: false,
          erro: `Acesso negado. Seu perfil de '${usuario.role}' não possui privilégios para criar escalas, eventos ou disparar notificações.`
        };
      }
    }

    // 2. TRAVA DE SEGURANÇA: MODO READ-ONLY INICIAL
    const acoesEscrita = [
      'registrar_pagamento',
      'registrar_entrada',
      'registrar_saida',
      'criar_evento',
      'criar_escala',
      'enviar_notificacao'
    ];

    if (env.READ_ONLY_MODE && acoesEscrita.includes(nomeAcao)) {
      // Registra a tentativa bloqueada no log de auditoria por segurança
      await this.registrarLogAuditoria({
        usuarioId: usuario.id,
        acao: nomeAcao,
        detalhes: dados,
        confirmado: true,
        sucesso: false,
        mensagemErro: "Bloqueado pelo Modo Read-Only Inicial."
      });

      return {
        sucesso: false,
        erro: "Operação bloqueada. O sistema está rodando em MODO READ-ONLY INICIAL para auditoria de estabilidade operacional."
      };
    }

    try {
      let resultadoExecucao: any;

      switch (nomeAcao) {
        
        // --- FERRAMENTAS DE LEITURA (EXECUTADAS IMEDIATAMENTE PELO BACKEND) ---
        
        case 'buscar_associado': {
          const termo = (dados.query || '').trim();
          const { data: associados, error: erroAssoc } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, email, phone, cpf, role, status')
            .or(`full_name.ilike.%${termo}%,email.ilike.%${termo}%,cpf.ilike.%${termo}%`)
            .limit(5);

          if (erroAssoc) throw erroAssoc;
          resultadoExecucao = associados || [];
          break;
        }

        case 'listar_inadimplentes': {
          const { data: associados, error: erroInad } = await supabaseAdmin
            .from('associate_profiles_with_status')
            .select('*')
            .order('full_name', { ascending: true });

          if (erroInad) throw erroInad;
          
          // Filtra na view os associados com mensalidade em atraso (LATE)
          resultadoExecucao = (associados || [])
            .filter((a: any) => a.calculated_payment_status === 'LATE' || a.payment_status === 'LATE')
            .map((row: any) => ({
              id: row.id,
              nome: row.full_name || 'Membro',
              email: row.email || '',
              phone: row.phone || '',
              status: row.status || 'ACTIVE',
              paymentStatus: 'LATE'
            }));
          break;
        }

        case 'consultar_financeiro': {
          // Busca o resumo das transações e as últimas 5 transações registradas
          const { data: transacoes, error: erroTx } = await supabaseAdmin
            .from('financial_transactions')
            .select('*')
            .order('date', { ascending: false })
            .limit(5);

          if (erroTx) throw erroTx;
          
          // Calcula o resumo total de saldos
          const { data: todasTxs, error: erroSaldo } = await supabaseAdmin
            .from('financial_transactions')
            .select('amount, type, status');

          if (erroSaldo) throw erroSaldo;

          let saldoTotal = 0;
          let receitaMensal = 0;

          (todasTxs || []).forEach((tx: any) => {
            if (tx.status !== 'COMPLETED') return;
            const valor = Number(tx.amount);
            if (tx.type === 'INCOME') {
              saldoTotal += valor;
            } else {
              saldoTotal -= valor;
            }
          });

          resultadoExecucao = {
            resumo: {
              saldoTotal,
              receitaMensal,
            },
            transacoesRecentes: transacoes || []
          };
          break;
        }

        // --- FERRAMENTAS DE ESCRITA (EXIGEM CONFIRMAÇÃO PREVIA HUMANA NO FRONTEND) ---

        case 'registrar_pagamento': {
          // 1. Registra a transação de mensalidade na tabela financeira
          const { data: tx, error: erroTx } = await supabaseAdmin
            .from('financial_transactions')
            .insert({
              description: `Mensalidade - ${dados.associate_name} (${dados.month_reference})`,
              amount: Number(dados.amount),
              type: 'INCOME',
              category: 'Membership',
              date: new Date().toISOString().split('T')[0],
              status: 'COMPLETED',
              payer_id: dados.associate_id,
              notes: dados.notes || `Registrado via Assistente IA. Método: ${dados.payment_method}`
            })
            .select()
            .single();

          if (erroTx) throw erroTx;

          // 2. Atualiza o status do associado para ACTIVE no banco
          await supabaseAdmin
            .from('profiles')
            .update({ status: 'ACTIVE' })
            .eq('id', dados.associate_id);

          resultadoExecucao = tx;
          break;
        }

        case 'registrar_entrada': {
          const { data: tx, error: erroIn } = await supabaseAdmin
            .from('financial_transactions')
            .insert({
              description: dados.description,
              amount: Number(dados.amount),
              type: 'INCOME',
              category: dados.category || 'Other',
              date: dados.date,
              status: 'COMPLETED',
              notes: dados.notes || 'Registrado via comando de IA'
            })
            .select()
            .single();

          if (erroIn) throw erroIn;
          resultadoExecucao = tx;
          break;
        }

        case 'registrar_saida': {
          const { data: tx, error: erroOut } = await supabaseAdmin
            .from('financial_transactions')
            .insert({
              description: dados.description,
              amount: Number(dados.amount),
              type: 'EXPENSE',
              category: dados.category || 'Other',
              date: dados.date,
              status: 'COMPLETED',
              notes: dados.notes || 'Registrado via comando de IA'
            })
            .select()
            .single();

          if (erroOut) throw erroOut;
          resultadoExecucao = tx;
          break;
        }

        case 'criar_evento': {
          const { data: evento, error: erroEv } = await supabaseAdmin
            .from('events')
            .insert({
              title: dados.title,
              description: dados.description || '',
              date: dados.date,
              time: dados.time || '08:00',
              location: dados.location || 'Sede',
              type: dados.type || 'EVENT',
              status: 'ACTIVE',
              visibility: dados.visibility || 'PUBLIC'
            })
            .select()
            .single();

          if (erroEv) throw erroEv;
          resultadoExecucao = evento;
          break;
        }

        case 'criar_escala': {
          const { data: escala, error: erroEsc } = await supabaseAdmin
            .from('shifts')
            .insert({
              team: dados.team,
              date: dados.fullDate.split('-').reverse().slice(0, 2).join('/'), // ex: 28/05
              full_date: dados.fullDate,
              start_time: dados.startTime,
              end_time: dados.endTime,
              location: dados.location || 'Sede',
              vacancies: Number(dados.vacancies || 1),
              leader: dados.leader || 'A definir',
              description: dados.description || '',
              status: 'PENDING',
              members: [],
              organizer: 'Sistema IA',
              amount: 0
            })
            .select()
            .single();

          if (erroEsc) throw erroEsc;
          resultadoExecucao = escala;
          break;
        }

        case 'gerar_escala_previa': {
          // Esta ferramenta aciona um algoritmo simulado de rodízio justo
          // Seleciona associados ativos e monta a sugestão preliminar de preenchimento
          const { data: associados, error: erroMembros } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name')
            .eq('status', 'ACTIVE')
            .limit(3);

          if (erroMembros) throw erroMembros;

          const proposedMembers = (associados || []).map(m => ({
            userId: m.id,
            name: m.full_name,
            status: 'PENDING',
            type: 'ROTATION',
            joinedAt: new Date().toISOString()
          }));

          const { error: erroUpdate } = await supabaseAdmin
            .from('shifts')
            .update({ members: proposedMembers })
            .eq('id', dados.shift_id);

          if (erroUpdate) throw erroUpdate;

          resultadoExecucao = {
            mensagem: "Escala prévia inteligente gerada com sucesso!",
            proposedMembers
          };
          break;
        }

        case 'enviar_notificacao': {
          // Busca os IDs dos usuários de destino com base nas roles
          let query = supabaseAdmin.from('profiles').select('id');
          if (dados.target_roles && dados.target_roles.length > 0) {
            query = query.in('role', dados.target_roles);
          }
          const { data: destinatarios, error: erroDest } = await query;
          
          if (erroDest) throw erroDest;

          const { data: notificacao, error: erroNot } = await supabaseAdmin
            .from('notifications')
            .insert({
              title: dados.title,
              message: dados.message,
              type: dados.type || 'SYSTEM',
              link: '/events',
              broadcast: !destinatarios || destinatarios.length === 0
            })
            .select()
            .single();

          if (erroNot) throw erroNot;

          resultadoExecucao = notificacao;
          break;
        }

        default:
          throw new Error(`A ferramenta '${nomeAcao}' não possui um executor físico configurado.`);
      }

      // 3. PERSISTÊNCIA BEM SUCEDIDA: Grava o log de auditoria com status de Sucesso
      await this.registrarLogAuditoria({
        usuarioId: usuario.id,
        acao: nomeAcao,
        detalhes: dados,
        confirmado: acoesEscrita.includes(nomeAcao),
        sucesso: true
      });

      return { sucesso: true, dados: resultadoExecucao };

    } catch (erro: any) {
      console.error(`❌ Erro físico no Tool Executor para a ação '${nomeAcao}':`, erro);
      
      // Grava o log de auditoria reportando a exceção
      await this.registrarLogAuditoria({
        usuarioId: usuario.id,
        acao: nomeAcao,
        detalhes: dados,
        confirmado: acoesEscrita.includes(nomeAcao),
        sucesso: false,
        mensagemErro: erro.message || 'Erro físico de banco de dados.'
      });

      return {
        sucesso: false,
        erro: `Falha ao executar ação no banco de dados: ${erro.message || 'Erro operacional.'}`
      };
    }
  }
}
