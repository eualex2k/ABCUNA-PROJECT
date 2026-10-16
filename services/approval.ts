import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

export interface ApprovalRequest {
  id: string;
  module: 'SCHEDULE' | 'EVENT' | 'FINANCIAL' | string;
  record_id: string;
  action: 'FINALIZE' | 'REOPEN' | string;
  previous_data?: any;
  proposed_data?: any;
  justification: string;
  requested_by: string;
  requested_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decided_by?: string;
  decided_at?: string;
  decision_note?: string;
  executed_at?: string;
  requester_name?: string;
  decider_name?: string;
}

export const approvalService = {
  async getPendingRequests(module?: string): Promise<ApprovalRequest[]> {
    let query = supabase
      .from('approval_requests')
      .select(`
        *,
        requester:requested_by (full_name),
        decider:decided_by (full_name)
      `)
      .eq('status', 'PENDING')
      .order('requested_at', { ascending: false });

    if (module) {
      query = query.eq('module', module);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar approval_requests pendentes:', error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      ...row,
      requester_name: row.requester?.full_name || 'Desconhecido',
      decider_name: row.decider?.full_name || null,
    }));
  },

  async getRequestsByRecord(recordId: string): Promise<ApprovalRequest[]> {
    const { data, error } = await supabase
      .from('approval_requests')
      .select(`
        *,
        requester:requested_by (full_name),
        decider:decided_by (full_name)
      `)
      .eq('record_id', recordId)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico de approval_requests:', error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      ...row,
      requester_name: row.requester?.full_name || 'Desconhecido',
      decider_name: row.decider?.full_name || null,
    }));
  },

  async createRequest(params: {
    module: string;
    record_id: string;
    action: string;
    justification: string;
    previous_data?: any;
    proposed_data?: any;
  }): Promise<ApprovalRequest> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuário não autenticado.');
    }

    if (!params.justification || params.justification.trim().length < 5) {
      throw new Error('É obrigatório fornecer uma justificativa clara (mínimo 5 caracteres).');
    }

    const payload = {
      module: params.module,
      record_id: params.record_id,
      action: params.action,
      justification: params.justification.trim(),
      previous_data: params.previous_data || null,
      proposed_data: params.proposed_data || null,
      requested_by: user.id,
      requested_at: new Date().toISOString(),
      status: 'PENDING',
    };

    const { data, error } = await supabase
      .from('approval_requests')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Erro ao registrar solicitação de aprovação:', error);
      throw error;
    }

    return data;
  },

  async decideRequest(params: {
    requestId: string;
    decision: 'APPROVED' | 'REJECTED';
    decisionNote?: string;
    userRole: UserRole;
  }): Promise<ApprovalRequest> {
    // Apenas ADMIN tem permissão de decidir solicitações de aprovação/reabertura
    if (params.userRole !== UserRole.ADMIN) {
      throw new Error('Apenas Administradores têm permissão para aprovar ou rejeitar solicitações.');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuário não autenticado.');
    }

    const payload = {
      status: params.decision,
      decided_by: user.id,
      decided_at: new Date().toISOString(),
      decision_note: params.decisionNote?.trim() || null,
      executed_at: params.decision === 'APPROVED' ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('approval_requests')
      .update(payload)
      .eq('id', params.requestId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao decidir approval_request:', error);
      throw error;
    }

    return data;
  },
};
