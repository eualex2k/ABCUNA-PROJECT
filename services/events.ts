import { supabase } from '../lib/supabase';
import { Event } from '../types';

export const eventsService = {
    async getAll(): Promise<Event[]> {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('start_date', { ascending: true });

        if (error) {
            console.error('Error fetching events:', error);
            throw error;
        }

        return data.map(mapToFrontend);
    },

    async create(event: Omit<Event, 'id' | 'confirmed'>): Promise<Event> {
        const dbRow = mapToDb(event);
        const { data, error } = await supabase
            .from('events')
            .insert(dbRow)
            .select()
            .single();

        if (error) {
            console.error('Error creating event:', error);
            throw error;
        }

        return mapToFrontend(data);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }
};

function mapToFrontend(row: any): Event {
    const startDate = new Date(row.start_date);
    return {
        id: row.id,
        title: row.title,
        date: row.start_date?.split('T')[0] || '',
        time: startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        location: row.location,
        type: row.type as any,
        confirmed: 0 // Logic for confirmation count would be separate
    };
}

function mapToDb(event: Partial<Event>): any {
    const dbRow: any = {};
    if (event.title !== undefined) dbRow.title = event.title;

    if (event.date !== undefined && event.time !== undefined) {
        // Merge date (YYYY-MM-DD) and time (HH:mm) into a single timestamp
        dbRow.start_date = `${event.date}T${event.time}:00`;
    } else if (event.date !== undefined) {
        dbRow.start_date = `${event.date}T00:00:00`;
    }

    if (event.location !== undefined) dbRow.location = event.location;
    if (event.type !== undefined) dbRow.type = event.type;
    return dbRow;
}
