import { supabase } from '../lib/supabase';
import { AccessCode, UserRole } from '../types';

class AccessCodeManager {
  async getAll(): Promise<AccessCode[]> {
    const { data, error } = await supabase
      .from('access_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching access codes:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      code: row.code,
      role: row.role as UserRole,
      limit: row.max_uses,
      used: row.used_count,
      active: row.is_active,
      createdAt: row.created_at,
      description: row.description || '',
      isSystem: row.code.startsWith('ABCUNA-ADM') // Logic for system codes
    }));
  }

  async create(code: Partial<AccessCode>): Promise<AccessCode | null> {
    const { data, error } = await supabase
      .from('access_codes')
      .insert([{
        code: code.code!.toUpperCase(),
        role: code.role,
        max_uses: code.limit,
        is_active: true,
        description: code.description
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating access code:', error);
      return null;
    }

    return {
      id: data.id,
      code: data.code,
      role: data.role as UserRole,
      limit: data.max_uses,
      used: data.used_count,
      active: data.is_active,
      createdAt: data.created_at,
      description: data.description || '',
      isSystem: false
    };
  }

  async validate(inputCode: string): Promise<{ valid: boolean; role?: UserRole; message?: string; codeId?: string }> {
    const { data, error } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', inputCode.toUpperCase())
      .single();

    if (error || !data) {
      return { valid: false, message: 'Código de acesso inexistente.' };
    }

    if (!data.is_active) {
      return { valid: false, message: 'Este código de acesso foi desativado.' };
    }

    if (data.max_uses !== null && data.used_count >= data.max_uses) {
      return { valid: false, message: 'Limite de uso deste código foi atingido.' };
    }

    return { valid: true, role: data.role as UserRole, codeId: data.id, message: `Código válido. Perfil: ${data.role}` };
  }

  async consume(codeId: string): Promise<void> {
    // Note: The consume logic is usually handled by a DB trigger on user creation, 
    // but we keep this here if manual consumption is needed.
    const { error } = await supabase.rpc('increment_code_usage', { code_id: codeId });
    if (error) {
      // Fallback to direct update if RPC doesn't exist (though trigger is better)
      await supabase.from('access_codes').update({ used_count: supabase.rpc('increment') }).eq('id', codeId);
    }
  }

  async toggleStatus(id: string, currentStatus: boolean): Promise<void> {
    const { error } = await supabase
      .from('access_codes')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) console.error('Error toggling code status:', error);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('access_codes')
      .delete()
      .eq('id', id);

    if (error) console.error('Error deleting access code:', error);
  }
}

export const accessCodeService = new AccessCodeManager();