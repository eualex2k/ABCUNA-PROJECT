import { supabase } from '../lib/supabase';
import { Registration } from '../types';

export const registrationsService = {
    async getAll(): Promise<Registration[]> {
        const { data, error } = await supabase
            .from('registrations')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) {
            console.error('Error fetching registrations:', error);
            throw error;
        }

        return data;
    },

    async create(registration: Partial<Registration>): Promise<Registration> {
        const { data, error } = await supabase
            .from('registrations')
            .insert(registration)
            .select()
            .single();

        if (error) {
            console.error('Error creating registration:', error);
            throw error;
        }

        return data;
    },

    async update(id: string, updates: Partial<Registration>): Promise<Registration> {
        const { data, error } = await supabase
            .from('registrations')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating registration:', error);
            throw error;
        }

        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('registrations')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting registration:', error);
            throw error;
        }
    }
};
