import { supabase } from '../lib/supabase';
import { CompanyInfo } from '../types';

export const companyService = {
    async get(): Promise<CompanyInfo | null> {
        const { data, error } = await supabase
            .from('company_info')
            .select('*')
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching company info:', error);
            throw error;
        }

        if (!data) return null;

        return {
            id: data.id,
            name: data.name,
            corporateName: data.corporate_name,
            cnpj: data.cnpj,
            ie: data.ie,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            logo: data.logo_url,
            website: data.website || ''
        };
    },

    async update(info: Partial<CompanyInfo>): Promise<void> {
        const { data: existing } = await supabase.from('company_info').select('id').single();

        const dbData = {
            name: info.name,
            corporate_name: info.corporateName,
            cnpj: info.cnpj,
            ie: info.ie,
            email: info.email,
            phone: info.phone,
            address: info.address,
            city: info.city,
            state: info.state,
            logo_url: info.logo,
            website: info.website
        };

        if (existing) {
            const { error } = await supabase
                .from('company_info')
                .update(dbData)
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('company_info')
                .insert(dbData);
            if (error) throw error;
        }
    }
};
