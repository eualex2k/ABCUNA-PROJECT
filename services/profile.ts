import { supabase } from '../lib/supabase';
import { User } from '../types';

export const profileService = {
    async update(id: string, updates: Partial<User>): Promise<void> {
        const dbUpdates: any = {
            full_name: updates.name,
            phone: updates.phone,
            cpf: updates.cpf,
            bio: updates.bio,
            birth_date: updates.birthDate || null, // Garante que string vazia vire null
            blood_type: updates.bloodType,
            address: updates.address,
            sus_number: updates.susNumber || null,
            registration_number: updates.registrationNumber,
            avatar_url: updates.avatar,
            updated_at: new Date().toISOString()
        };

        // Remove undefined fields but KEEP nulls (to allow clearing fields)
        Object.keys(dbUpdates).forEach(key => {
            if (dbUpdates[key] === undefined) {
                delete dbUpdates[key];
            }
        });

        const { error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }
};
