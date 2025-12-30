import { supabase } from '../lib/supabase';
import { Associate } from '../types';

export const associatesService = {
    async getAll(): Promise<Associate[]> {
        const { data, error } = await supabase
            .from('associate_profiles_with_status')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) {
            console.error('Error fetching associates:', error);
            throw error;
        }

        return data.map(mapToFrontend);
    },

    async update(id: string, updates: Partial<Associate>): Promise<Associate> {
        const dbUpdates = mapToDb(updates);
        const { data, error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating associate:', error);
            throw error;
        }

        return mapToFrontend(data);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting associate:', error);
            throw error;
        }
    },

    async getNotificationTargets(roles?: string[]): Promise<string[]> {
        let query = supabase.from('profiles').select('id');
        if (roles && roles.length > 0) {
            query = query.in('role', roles);
        }
        const { data, error } = await query;
        if (error) return [];
        return data.map(r => r.id);
    }
};

function mapToFrontend(row: any): Associate {
    return {
        id: row.id,
        name: row.full_name || row.email || 'Usuário',
        email: row.email || '',
        phone: row.phone || '',
        role: row.operational_role || row.role || 'Associado', // Return operational_role if available
        status: row.status || 'ACTIVE',
        joinDate: row.join_date || row.created_at,
        avatar: row.avatar_url,
        paymentStatus: row.calculated_payment_status || row.payment_status || 'UP_TO_DATE'
    };
}

function mapToDb(associate: Partial<Associate>): any {
    const dbRow: any = {};
    if (associate.name !== undefined) dbRow.full_name = associate.name;
    if (associate.email !== undefined) dbRow.email = associate.email;
    if (associate.phone !== undefined) dbRow.phone = associate.phone;

    // Map Frontend 'role' (which is the operational title) to 'operational_role' in DB
    // to avoid enum conflict with access 'role'
    if (associate.role !== undefined) dbRow.operational_role = associate.role;

    if (associate.status !== undefined) dbRow.status = associate.status;
    return dbRow;
}
