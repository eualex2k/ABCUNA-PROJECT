import { supabase } from '../lib/supabase';
import { User } from '../types';

export function buildProfileDbUpdates(updates: Partial<User>): Record<string, any> {
  const dbUpdates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined && typeof updates.name === 'string' && updates.name.trim() !== '') {
    dbUpdates.full_name = updates.name;
  }
  if (updates.phone !== undefined && typeof updates.phone === 'string' && updates.phone.trim() !== '') {
    dbUpdates.phone = updates.phone;
  }
  if (updates.cpf !== undefined && typeof updates.cpf === 'string' && updates.cpf.trim() !== '') {
    dbUpdates.cpf = updates.cpf;
  }
  if (updates.bio !== undefined && typeof updates.bio === 'string') {
    dbUpdates.bio = updates.bio.trim() !== '' ? updates.bio : null;
  }
  if (updates.birthDate !== undefined && typeof updates.birthDate === 'string' && updates.birthDate.trim() !== '') {
    dbUpdates.birth_date = updates.birthDate;
  }
  if (updates.bloodType !== undefined && typeof updates.bloodType === 'string') {
    dbUpdates.blood_type = updates.bloodType.trim() !== '' ? updates.bloodType : null;
  }
  if (updates.address !== undefined && typeof updates.address === 'string') {
    dbUpdates.address = updates.address.trim() !== '' ? updates.address : null;
  }
  if (updates.susNumber !== undefined && typeof updates.susNumber === 'string') {
    dbUpdates.sus_number = updates.susNumber.trim() !== '' ? updates.susNumber : null;
  }
  if (updates.registrationNumber !== undefined) {
    dbUpdates.registration_number = updates.registrationNumber && typeof updates.registrationNumber === 'string' && updates.registrationNumber.trim() !== '' ? updates.registrationNumber : null;
  }
  if (updates.avatar !== undefined) {
    dbUpdates.avatar_url = updates.avatar;
  }

  return dbUpdates;
}

export const profileService = {
  buildDbUpdates: buildProfileDbUpdates,

  async update(id: string, updates: Partial<User>): Promise<void> {
    const dbUpdates = buildProfileDbUpdates(updates);

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
};
