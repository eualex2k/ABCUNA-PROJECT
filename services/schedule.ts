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

        // Notificar associados se for uma nova escala aberta
        const targetIds = await associatesService.getNotificationTargets();
        await notificationService.add({
            title: 'Nova Escala Disponível',
            message: `Uma nova escala "${newShift.team}" foi aberta. Inscreva-se!`,
            type: 'SCHEDULE',
            link: '/schedule',
            targetUserIds: targetIds
        });

        return newShift;
    },

    async update(id: string, shift: Partial<Shift>): Promise<void> {
        const dbRow = mapToDb(shift);
        const { error } = await supabase
            .from('schedules')
            .update(dbRow)
            .eq('id', id);

        if (error) {
            console.error('Error updating shift:', error);
            throw error;
        }
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
        // Mock implementation for auto generation
        console.log('Generating auto schedule...');
        return Promise.resolve();
    },

    async join(shiftId: string, memberName: string): Promise<void> {
        const { data: shift, error: fetchError } = await supabase
            .from('schedules')
            .select('id, title, confirmed_members')
            .eq('id', shiftId)
            .single();

        if (fetchError) throw fetchError;

        const members = shift.confirmed_members || [];
        if (!members.includes(memberName)) {
            const { error: updateError } = await supabase
                .from('schedules')
                .update({ confirmed_members: [...members, memberName] })
                .eq('id', shiftId);

            if (updateError) throw updateError;

            // Notificar Admin/Secretaria
            const adminIds = await associatesService.getNotificationTargets(['ADMIN', 'SECRETARY']);
            await notificationService.add({
                title: 'Novo Voluntário na Escala',
                message: `${memberName} entrou na escala "${shift.title}".`,
                type: 'SCHEDULE',
                link: '/schedule',
                targetUserIds: adminIds
            });
        }
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
        if (shift.startTime !== undefined) {
            dbRow.start_time = `${shift.fullDate}T${shift.startTime}:00`;
        } else {
            dbRow.start_time = `${shift.fullDate}T08:00:00`;
        }

        if (shift.endTime !== undefined) {
            dbRow.end_time = `${shift.fullDate}T${shift.endTime}:00`;
        }
    }

    if (shift.leader !== undefined) dbRow.leader = shift.leader;
    if (shift.status !== undefined) dbRow.status = shift.status;
    if (shift.location !== undefined) dbRow.location = shift.location;
    if (shift.amount !== undefined) dbRow.amount = shift.amount;
    if (shift.organizer !== undefined) dbRow.organizer = shift.organizer;
    if (shift.vacancies !== undefined) dbRow.vacancies = shift.vacancies;
    if (shift.description !== undefined) dbRow.description = shift.description;
    if (shift.confirmedMembers !== undefined) dbRow.confirmed_members = shift.confirmedMembers;

    return dbRow;
}
