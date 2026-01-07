import { supabase } from '../lib/supabase';
import { Shift, ShiftMember } from '../types';
import { notificationService } from './notifications';
import { associatesService } from './associates';

export const scheduleService = {
    async getAll(): Promise<Shift[]> {
        const { data, error } = await supabase
            .from('schedules')
            .select('*')
            .order('start_time', { ascending: true });

        if (error) {
            console.error('Error fetching schedules:', error);
            throw error;
        }

        return data.map(mapToFrontend);
    },

    async create(shift: Omit<Shift, 'id' | 'day' | 'date'>): Promise<Shift> {
        const dbRow = mapToDb(shift);
        const { data, error } = await supabase
            .from('schedules')
            .insert(dbRow)
            .select()
            .single();

        if (error) {
            console.error('Error creating shift:', error);
            throw error;
        }

        const newShift = mapToFrontend(data);

        // Notificar todos os associados sobre a nova escala
        if (newShift.status === 'PENDING') {
            await notificationService.add({
                title: 'Nova Escala Disponível',
                message: `Uma nova escala "${newShift.team}" foi aberta para o dia ${newShift.date}. Inscreva-se!`,
                type: 'SCHEDULE',
                link: '/events/schedule',
                broadcast: true
            });
        }

        return newShift;
    },

    async update(id: string, shift: Partial<Shift>): Promise<Shift> {
        const dbRow = mapToDb(shift);
        const { data, error } = await supabase
            .from('schedules')
            .update(dbRow)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating shift:', error);
            throw error;
        }
        return mapToFrontend(data);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting shift:', error);
            throw error;
        }
    },

    /**
     * Gera uma PRÉVIA da escala utilizando o algoritmo de rodízio justo e estrito.
     * NÃO modifica o banco de dados.
     * @param shiftId ID do plantão
     */
    async generatePreview(shiftId: string): Promise<ShiftMember[]> {
        try {
            // 1. Obter detalhes do plantão
            const { data: shift, error: shiftError } = await supabase
                .from('schedules')
                .select('*')
                .eq('id', shiftId)
                .single();

            if (shiftError) throw shiftError;
            if (!shift) throw new Error('Shift not found');

            const currentMembers: ShiftMember[] = Array.isArray(shift.confirmed_members)
                ? shift.confirmed_members.map((m: any) => typeof m === 'string' ? { userId: '', name: m, status: 'CONFIRMED' } : m)
                : [];

            // Se já está cheio, retorna os atuais
            if (currentMembers.length >= shift.vacancies) return currentMembers;

            // 2. Identificar participantes do último plantão (para reduzir prioridade, não bloquear)
            const { data: lastShift, error: lastShiftError } = await supabase
                .from('schedules')
                .select('confirmed_members')
                .in('status', ['CONFIRMED', 'FINISHED'])
                .lt('start_time', shift.start_time)
                .order('start_time', { ascending: false })
                .limit(1)
                .single();

            if (lastShiftError && lastShiftError.code !== 'PGRST116') throw lastShiftError;

            let lastShiftUserIds: string[] = [];
            if (lastShift && Array.isArray(lastShift.confirmed_members)) {
                lastShiftUserIds = lastShift.confirmed_members
                    .filter((m: any) => m.status === 'CONFIRMED' || m.status === 'FINISHED')
                    .map((m: any) => m.userId);
            }

            // 3. Obter TODOS associados elegíveis (ativos)
            const { data: associates, error: assocError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, shifts_count, last_shift_date')
                .not('full_name', 'is', null)
                .neq('role', 'CANDIDATE')
                .eq('status', 'ACTIVE');

            if (assocError) throw assocError;
            if (!associates) return [];

            // 4. Separar em Grupos de Prioridade
            const currentIds = currentMembers.map(m => m.userId);

            // Filtra quem já está neste plantão
            const candidates = associates.filter(a => !currentIds.includes(a.id));

            // Grupo A: Quem NÃO trabalhou no último (Alta Prioridade)
            const groupA = candidates.filter(a => !lastShiftUserIds.includes(a.id));

            // Grupo B: Quem TRABALHOU no último (Baixa Prioridade)
            const groupB = candidates.filter(a => lastShiftUserIds.includes(a.id));

            // Função de ordenação justa (Menos plantões > Data mais antiga > Nome)
            const sortFairly = (list: any[]) => {
                return list.sort((a, b) => {
                    // 1. Quem trabalhou menos tem prioridade
                    if ((a.shifts_count || 0) !== (b.shifts_count || 0)) {
                        return (a.shifts_count || 0) - (b.shifts_count || 0);
                    }
                    // 2. Desempate: Quem trabalhou há mais tempo (data menor/null)
                    const dateA = a.last_shift_date ? new Date(a.last_shift_date).getTime() : 0;
                    const dateB = b.last_shift_date ? new Date(b.last_shift_date).getTime() : 0;
                    if (dateA !== dateB) return dateA - dateB;

                    // 3. Desempate final: Ordem alfabética
                    return a.full_name.localeCompare(b.full_name);
                });
            };

            const sortedGroupA = sortFairly([...groupA]);
            const sortedGroupB = sortFairly([...groupB]);

            // 5. Preenchimento de Vagas (Cascata A -> B)
            const vacanciesNeeded = shift.vacancies - currentMembers.length;

            // Pega o máximo possível do Grupo A
            let selected = sortedGroupA.slice(0, vacanciesNeeded);

            // Se ainda faltar, completa com Grupo B
            if (selected.length < vacanciesNeeded) {
                const remaining = vacanciesNeeded - selected.length;
                const fillFromB = sortedGroupB.slice(0, remaining);
                selected = [...selected, ...fillFromB];
            }
            const dateA = a.last_shift_date ? new Date(a.last_shift_date).getTime() : 0;
            const dateB = b.last_shift_date ? new Date(b.last_shift_date).getTime() : 0;
            return dateA - dateB;
        });

        // 6. Selecionar os necessários para preencher vagas
        const vacanciesNeeded = shift.vacancies - currentMembers.length;
        const selected = eligible.slice(0, vacanciesNeeded);

        // 7. Retornar lista combinada (atuais + propostos)
        const proposedMembers: ShiftMember[] = selected.map(a => ({
            userId: a.id,
            name: a.full_name,
            avatar: a.avatar_url,
            status: 'PENDING', // Proposta, pendente de confirmação
            type: 'ROTATION',
            joinedAt: new Date().toISOString()
        }));

        return [...currentMembers, ...proposedMembers];

    } catch(error) {
        console.error('Error generating preview:', error);
        throw error;
    }
},

    /**
     * Voluntariar-se para um plantão. Requer aprovação.
     */
    async volunteer(shiftId: string, userId: string, userName: string, avatar?: string): Promise<void> {
        // Obter plantão atual
        const { data: shift } = await supabase
            .from('schedules')
            .select('*')
            .eq('id', shiftId)
            .single();

        if (!shift) throw new Error('Plantão não encontrado');

        let members: ShiftMember[] = [];
        if (Array.isArray(shift.confirmed_members)) {
            members = shift.confirmed_members.map((m: any) =>
                typeof m === 'string'
                    ? { userId: '', name: m, status: 'CONFIRMED', type: 'ROTATION', joinedAt: new Date().toISOString() }
                    : m
            );
        }

        // Verifica se já está na lista
        if (members.some(m => m.userId === userId)) {
            throw new Error('Você já está listado nesta escala.');
        }

        // Adiciona como voluntário pendente
        const newMember: ShiftMember = {
            userId,
            name: userName,
            avatar,
            status: 'VOLUNTEER_PENDING',
            type: 'VOLUNTEER',
            joinedAt: new Date().toISOString()
        };

        const updatedMembers = [...members, newMember];

        const { error } = await supabase
            .from('schedules')
            .update({ confirmed_members: updatedMembers })
            .eq('id', shiftId);

        if (error) throw error;

        // Notificar Admin
        const adminIds = await associatesService.getNotificationTargets(['ADMIN', 'SECRETARY']);
        await notificationService.add({
            title: 'Novo Voluntário',
            message: `${userName} solicitou entrar na escala "${shift.title}".`,
            type: 'SCHEDULE',
            link: '/events/schedule',
            targetUserIds: adminIds
        });
    },

        /**
         * Admin aprova um voluntário ou confirma a escala
         */
        async updateMembers(shiftId: string, members: ShiftMember[]): Promise < void> {
            const { error } = await supabase
                .from('schedules')
                .update({ confirmed_members: members })
                .eq('id', shiftId);

            if(error) throw error;
        },

            /**
             * Membro responde à convocação (ACEITAR / RECUSAR)
             */
            async respondToSummon(shiftId: string, userId: string, accept: boolean): Promise < void> {
                // 1. Obter plantão
                const { data: shift } = await supabase
                    .from('schedules')
                    .select('*')
                    .eq('id', shiftId)
                    .single();

                if(!shift) throw new Error('Plantão não encontrado');

                let members: ShiftMember[] = shift.confirmed_members || [];

                // 2. Atualizar status do membro
                const memberIndex = members.findIndex(m => m.userId === userId);
                if(memberIndex === -1) throw new Error('Você não está nesta convocação.');

if (accept) {
    members[memberIndex].status = 'CONFIRMED';
    members[memberIndex].confirmedAt = new Date().toISOString();
    // REMOVED IN FINAL ADJUSTMENT: Stats increment now happens only on finalizeShift
} else {
    members[memberIndex].status = 'DECLINED';
}

// 3. Salvar
const { error } = await supabase
    .from('schedules')
    .update({ confirmed_members: members })
    .eq('id', shiftId);

if (error) throw error;

// Se recusou, notificar admin
if (!accept) {
    const adminIds = await associatesService.getNotificationTargets(['ADMIN', 'SECRETARY']);
    const memberName = members[memberIndex].name;
    await notificationService.add({
        title: 'Recusa de Escala',
        message: `${memberName} recusou a convocação para "${shift.title}". Necessário substituto.`,
        type: 'SCHEDULE',
        link: '/events/schedule',
        targetUserIds: adminIds
    });
}
    },

    /**
     * Finalizar Plantão (Presidente/Admin)
     * Consolida a escala e atualiza as estatísticas de quem participou.
     */
    async finalizeShift(shiftId: string): Promise < void> {
    // 1. Obter plantão
    const { data: shift } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', shiftId)
        .single();

    if(!shift) throw new Error('Plantão não encontrado');
    if(shift.status === 'FINISHED') throw new Error('Este plantão já foi finalizado.');

    let members: ShiftMember[] = shift.confirmed_members || [];

    // 2. Filter CONFIRMED members to update stats
    const participants = members.filter(m => m.status === 'CONFIRMED' && m.userId);

    for(const p of participants) {
        // Incrementar contador de plantões do usuário
        await supabase.rpc('increment_shift_count', { user_id: p.userId });

        // Atualizar data do ultimo plantão
        await supabase
            .from('profiles')
            .update({ last_shift_date: new Date().toISOString() })
            .eq('id', p.userId);
    }

        // 3. Update Status to FINISHED
        const { error } = await supabase
        .from('schedules')
        .update({ status: 'FINISHED' }) // FINISHED status
        .eq('id', shiftId);

    if(error) throw error;

    // Notificar participantes
    await notificationService.add({
        title: 'Plantão Finalizado',
        message: `O plantão "${shift.title}" foi encerrado e contabilizado.`,
        type: 'SCHEDULE',
        targetUserIds: participants.map(p => p.userId)
    });
}
};

function mapToFrontend(row: any): Shift {
    const startObj = new Date(row.start_time);
    const endObj = row.end_time ? new Date(row.end_time) : null;

    // Formatting day and date
    const userTimezoneOffset = startObj.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(startObj.getTime() + userTimezoneOffset);

    const dayName = adjustedDate.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dayStr = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const dateStr = adjustedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    // Handle members mapping (Legacy string[] -> ShiftMember[])
    let members: ShiftMember[] = [];
    if (Array.isArray(row.confirmed_members)) {
        members = row.confirmed_members.map((m: any) => {
            if (typeof m === 'string') {
                return {
                    userId: '', // Legacy records don't have ID
                    name: m,
                    status: 'CONFIRMED',
                    type: 'ROTATION',
                    joinedAt: row.created_at
                } as ShiftMember;
            }
            return m; // Already an object
        });
    }

    return {
        id: row.id,
        fullDate: row.start_time?.split('T')[0] || '',
        day: dayStr,
        date: dateStr,
        team: row.title,
        leader: row.leader || 'A definir',
        status: row.status as any,
        location: row.location || 'Sede',
        startTime: startObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        endTime: endObj ? endObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '18:00',
        amount: Number(row.amount || 0),
        organizer: row.organizer || 'Interno',
        vacancies: row.vacancies || 1,
        description: row.description,
        members: members
    };
}

function mapToDb(shift: Partial<Shift>): any {
    const dbRow: any = {};
    if (shift.team !== undefined) dbRow.title = shift.team;

    if (shift.fullDate !== undefined) {
        const datePart = shift.fullDate;
        const startH = shift.startTime || '08:00';
        dbRow.start_time = `${datePart}T${startH}:00`;
        const endH = shift.endTime || '20:00';
        dbRow.end_time = `${datePart}T${endH}:00`;
    }

    if (shift.leader !== undefined) dbRow.leader = shift.leader;
    if (shift.status !== undefined) dbRow.status = shift.status;
    if (shift.location !== undefined) dbRow.location = shift.location;
    if (shift.amount !== undefined) dbRow.amount = shift.amount;
    if (shift.organizer !== undefined) dbRow.organizer = shift.organizer;
    if (shift.vacancies !== undefined) dbRow.vacancies = shift.vacancies;
    if (shift.description !== undefined) dbRow.description = shift.description;
    if (shift.members !== undefined) dbRow.confirmed_members = shift.members;

    dbRow.type = 'ORDINARY';
    return dbRow;
}
