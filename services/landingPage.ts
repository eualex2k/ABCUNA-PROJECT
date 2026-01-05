import { supabase } from '../lib/supabase';
import { LandingPageConfig } from '../types';

export const landingPageService = {
    async get(): Promise<LandingPageConfig | null> {
        const { data, error } = await supabase
            .from('landing_page_config')
            .select('*')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No config found, maybe return default or null
                return null;
            }
            console.error('Error fetching landing page config:', error);
            throw error;
        }

        return data as LandingPageConfig;
    },

    async update(config: Partial<LandingPageConfig>): Promise<void> {
        const { data: existing } = await supabase.from('landing_page_config').select('id').maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from('landing_page_config')
                .update(config)
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            // Create new if not exists (though SQL should handle default row often)
            const { error } = await supabase
                .from('landing_page_config')
                .insert(config);
            if (error) throw error;
        }
    },

    async uploadImage(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `landing-page/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('public-assets') // Assuming a public bucket exists
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('public-assets')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};
