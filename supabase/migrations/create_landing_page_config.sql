-- Create landing_page_config table
CREATE TABLE IF NOT EXISTS landing_page_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_title TEXT NOT NULL DEFAULT 'ABCUNA - Associação Brasileira de Combate a Urgências e Necessidades Assistenciais',
  hero_subtitle TEXT NOT NULL DEFAULT 'Dedicados a salvar vidas e servir a comunidade com excelência, profissionalismo e compromisso social.',
  hero_image_url TEXT,
  about_text TEXT NOT NULL DEFAULT 'A ABCUNA é uma organização sem fins lucrativos dedicada ao atendimento de emergências e urgências médicas.',
  mission_text TEXT NOT NULL DEFAULT 'Prestar serviços de atendimento pré-hospitalar com excelência.',
  vision_text TEXT NOT NULL DEFAULT 'Ser referência nacional em atendimento de urgência e emergência.',
  values_text TEXT NOT NULL DEFAULT 'Ética, Profissionalismo, Compromisso Social, Excelência Técnica, Respeito à Vida',
  gallery_images TEXT[] DEFAULT '{}',
  sections_visibility JSONB DEFAULT '{"hero": true, "about": true, "gallery": true, "cta": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_landing_page_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER landing_page_config_updated_at
  BEFORE UPDATE ON landing_page_config
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_page_config_updated_at();

-- Insert default configuration (only if table is empty)
INSERT INTO landing_page_config (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM landing_page_config);

-- Enable Row Level Security
ALTER TABLE landing_page_config ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read landing page config
CREATE POLICY "Anyone can read landing page config"
  ON landing_page_config
  FOR SELECT
  USING (true);

-- Policy: Only admins can update landing page config
CREATE POLICY "Only admins can update landing page config"
  ON landing_page_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Policy: Only admins can insert landing page config
CREATE POLICY "Only admins can insert landing page config"
  ON landing_page_config
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Create storage bucket for landing page images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for public-assets bucket
CREATE POLICY "Public assets are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public-assets');

CREATE POLICY "Admins can upload public assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'public-assets' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update public assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'public-assets' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can delete public assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'public-assets' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );
