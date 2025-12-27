import { supabase } from '../lib/supabase';
import { Candidate, SelectionStage, SelectionScheduleItem } from '../types';

export const selectionService = {
    async getCandidates(): Promise<Candidate[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
        id,
        full_name,
        email,
        phone,
        selection_process (
          score,
          status,
          score_breakdown
        )
      `)
            .eq('role', 'CANDIDATE');

        if (error) {
            console.error('Error fetching candidates:', error);
            throw error;
        }

        return (data || []).map(row => {
            const process = Array.isArray(row.selection_process) ? row.selection_process[0] : row.selection_process;
            return {
                id: row.id,
                name: row.full_name || 'Usuário',
                email: row.email,
                phone: row.phone || '',
                score: Number(process?.score) || 0,
                status: (process?.status as Candidate['status']) || 'PENDING',
                breakdown: process?.score_breakdown || {
                    theory: 0,
                    simulation: 0,
                    internship: 0,
                    discipline: 0
                }
            };
        });
    },

    async updateCandidateGrade(candidateId: string, breakdown: any, totalScore: number, status: string): Promise<void> {
        const { data: existing } = await supabase
            .from('selection_process')
            .select('id')
            .eq('candidate_id', candidateId)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from('selection_process')
                .update({
                    score: totalScore,
                    score_breakdown: breakdown,
                    status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('candidate_id', candidateId);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('selection_process')
                .insert({
                    candidate_id: candidateId,
                    score: totalScore,
                    score_breakdown: breakdown,
                    status: status,
                    stage: 'Avaliação Final'
                });
            if (error) throw error;
        }
    },

    async getStages(): Promise<SelectionStage[]> {
        const { data, error } = await supabase
            .from('selection_stages')
            .select('*')
            .order('order', { ascending: true });

        if (error) {
            console.error('Error fetching stages:', error);
            throw error;
        }
        return data || [];
    },

    async updateStageStatus(id: number, status: string): Promise<void> {
        const { error } = await supabase
            .from('selection_stages')
            .update({ status })
            .eq('id', id);
        if (error) throw error;
    },

    async addStage(title: string, description: string, order: number): Promise<SelectionStage> {
        const { data, error } = await supabase
            .from('selection_stages')
            .insert({ title, description, order, status: 'PENDING' })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getSchedule(): Promise<SelectionScheduleItem[]> {
        const { data, error } = await supabase
            .from('selection_schedule')
            .select('*')
            .order('order', { ascending: true });

        if (error) {
            console.error('Error fetching schedule:', error);
            throw error;
        }
        return data || [];
    },

    async updateScheduleItem(id: string, updates: Partial<SelectionScheduleItem>): Promise<void> {
        const { error } = await supabase
            .from('selection_schedule')
            .update(updates)
            .eq('id', id);
        if (error) throw error;
    },

    async addScheduleItem(event: string, date: string, order: number): Promise<SelectionScheduleItem> {
        const { data, error } = await supabase
            .from('selection_schedule')
            .insert({ event, date, order, done: false })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async promoteCandidate(candidateId: string): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({
                role: 'ASSOCIATE',
                operational_role: 'Bombeiro Civil',
                status: 'ACTIVE',
                join_date: new Date().toISOString().split('T')[0],
                updated_at: new Date().toISOString()
            })
            .eq('id', candidateId);

        if (error) {
            console.error('Error promoting candidate:', error);
            throw error;
        }
    }
};
