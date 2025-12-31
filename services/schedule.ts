import { supabase } from '../lib/supabase';
import { Shift } from '../types';
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
        await notificationService.add({
            title: 'Nova Escala Disponível',
            message: `Uma nova escala "${newShift.team}" foi aberta para o dia ${newShift.date}. Inscreva-se!`,
            type: 'SCHEDULE',
            link: '/schedule',
            broadcast: true
        });

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

    async generateAuto(): Promise<void> {
        try {
            // 1. Pegar todos os plantões abertos (PENDING)
            const { data: openShifts, error: shiftError } = await supabase
                .from('schedules')
                .select('*')
                .eq('status', 'PENDING');

            if (shiftError) throw shiftError;
            if (!openShifts || openShifts.length === 0) return;

            // 2. Pegar associados ativos
            const { data: associates, error: assocError } = await supabase
                .from('profiles')
                .select('full_name')
                .not('full_name', 'is', null);

            if (assocError) throw assocError;
            if (!associates || associates.length === 0) return;

            // 3. Para cada plantão, preencher vagas aleatoriamente
            for (const shift of openShifts) {
                const confirmed = shift.confirmed_members || [];
                const vacancies = shift.vacancies || 5;
                const needed = vacancies - confirmed.length;

                if (needed > 0) {
                    // Selecionar nomes aleatórios que ainda não estão no plantão
                    const availableNames = associates
                        .map(a => a.full_name)
                        .filter(name => !confirmed.includes(name));

                    const selected = availableNames
                        .sort(() => 0.5 - Math.random())
                        .slice(0, needed);

                    if (selected.length > 0) {
                        await supabase
                            .from('schedules')
                            .update({
                                confirmed_members: [...confirmed, ...selected],
                                status: (confirmed.length + selected.length >= vacancies) ? 'CONFIRMED' : 'PENDING'
                            })
                            .eq('id', shift.id);
                    }
                }
            }
        } catch (error) {
            console.error('Error generating auto schedule:', error);
            throw error;
        }
    },

    async join(shiftId: string, memberName: string): Promise<void> {
        // Obter detalhes para a notificação antes de chamar o RPC
        const { data: shift } = await supabase
            .from('schedules')
            .select('title')
            .eq('id', shiftId)
            .single();

        const { error } = await supabase.rpc('join_shift', {
            p_shift_id: shiftId,
            p_member_name: memberName
        });

        if (error) {
            console.error('Error joining shift:', error);
            throw error;
        }

        // Notificar Admin/Secretaria sobre o novo voluntário
        const adminIds = await associatesService.getNotificationTargets(['ADMIN', 'SECRETARY']);
        await notificationService.add({
            title: 'Novo Voluntário na Escala',
            message: `${memberName} entrou na escala "${shift?.title || 'Plantão'}".`,
            type: 'SCHEDULE',
            link: '/schedule',
            targetUserIds: adminIds
        });
    }
};

function mapToFrontend(row: any): Shift {
    const startObj = new Date(row.start_time);
    const endObj = row.end_time ? new Date(row.end_time) : null;

    // Formatting day and date for display
    const userTimezoneOffset = startObj.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(startObj.getTime() + userTimezoneOffset);

    const dayName = adjustedDate.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dayStr = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const dateStr = adjustedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

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
        confirmedMembers: row.confirmed_members || []
    };
}

function mapToDb(shift: Partial<Shift>): any {
    const dbRow: any = {};
    if (shift.team !== undefined) dbRow.title = shift.team;

    // Handle timestamps
    if (shift.fullDate !== undefined) {
        const datePart = shift.fullDate; // YYYY-MM-DD

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
    if (shift.confirmedMembers !== undefined) dbRow.confirmed_members = shift.confirmedMembers;

    // Default type to avoid not-null constraint error
    dbRow.type = 'ORDINARY';

    return dbRow;
}
