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

    async update(id: string, updates: Partial<Event>): Promise<Event> {
        const dbRow = mapToDb(updates);
        const { data, error } = await supabase
            .from('events')
            .update(dbRow)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating event:', error);
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
    // Extract date and time directly from string to avoid timezone shifts
    const dateTimeParts = row.start_date?.split('T') || [];
    const date = dateTimeParts[0] || '';
    const time = dateTimeParts[1]?.substring(0, 5) || '00:00';

    return {
        id: row.id,
        title: row.title,
        description: row.description,
        date: date,
        time: time,
        location: row.location,
        type: row.type as any,
        confirmed: 0,
        status: row.status || 'ACTIVE',
        visibility: row.visibility || 'PUBLIC'
    };
}

function mapToDb(event: Partial<Event>): any {
    const dbRow: any = {};
    if (event.title !== undefined) dbRow.title = event.title;
    if (event.description !== undefined) dbRow.description = event.description;

    if (event.date !== undefined && event.time !== undefined) {
        dbRow.start_date = `${event.date}T${event.time}:00`;
    } else if (event.date !== undefined) {
        dbRow.start_date = `${event.date}T00:00:00`;
    }

    if (event.location !== undefined) dbRow.location = event.location;
    if (event.type !== undefined) dbRow.type = event.type;
    // status and visibility might not exist in the DB, so we omit them for now
    return dbRow;
}
