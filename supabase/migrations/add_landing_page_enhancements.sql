-- Add new fields to landing_page_config table for enhanced customization

-- Hero Section enhancements
ALTER TABLE landing_page_config
ADD COLUMN IF NOT EXISTS hero_badge_text TEXT DEFAULT 'Salvando vidas desde sempre';

-- About Section enhancements
ALTER TABLE landing_page_config
ADD COLUMN IF NOT EXISTS about_title TEXT DEFAULT 'Sobre a Associação';

-- Statistics Section
ALTER TABLE landing_page_config
ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '[]'::jsonb;

-- Services Section
ALTER TABLE landing_page_config
ADD COLUMN IF NOT EXISTS services_title TEXT DEFAULT 'O que Oferecemos',
ADD COLUMN IF NOT EXISTS services_subtitle TEXT DEFAULT 'Soluções completas para atendimento de emergências',
ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;

-- Testimonials Section
ALTER TABLE landing_page_config
ADD COLUMN IF NOT EXISTS testimonials_title TEXT DEFAULT 'O que dizem sobre nós',
ADD COLUMN IF NOT EXISTS testimonials_subtitle TEXT DEFAULT 'Veja o que nossos parceiros e clientes têm a dizer',
ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb;

-- Gallery Section enhancements
ALTER TABLE landing_page_config
ADD COLUMN IF NOT EXISTS gallery_title TEXT DEFAULT 'Nossa Galeria',
ADD COLUMN IF NOT EXISTS gallery_subtitle TEXT DEFAULT 'Conheça um pouco mais sobre nosso trabalho';

-- Contact Section
ALTER TABLE landing_page_config
ADD COLUMN IF NOT EXISTS contact JSONB DEFAULT '{
  "phone": "(11) 1234-5678",
  "email": "contato@abcuna.org.br",
  "address": "Rua Exemplo, 123 - São Paulo, SP",
  "workingHours": "Seg-Sex: 8h-18h | Emergências: 24/7"
}'::jsonb;

-- Social Media Section
ALTER TABLE landing_page_config
ADD COLUMN IF NOT EXISTS social JSONB DEFAULT '{
  "facebook": "",
  "instagram": "",
  "twitter": "",
  "linkedin": "",
  "youtube": ""
}'::jsonb;

-- CTA Section enhancements
ALTER TABLE landing_page_config
ADD COLUMN IF NOT EXISTS cta_title TEXT DEFAULT 'Pronto para fazer a diferença?',
ADD COLUMN IF NOT EXISTS cta_subtitle TEXT DEFAULT 'Junte-se à nossa equipe e ajude a salvar vidas',
ADD COLUMN IF NOT EXISTS cta_button_text TEXT DEFAULT 'Acessar o Sistema';

-- Theme Customization
ALTER TABLE landing_page_config
ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{
  "primaryColor": "#dc2626",
  "secondaryColor": "#1e293b",
  "accentColor": "#f59e0b"
}'::jsonb;

-- Update sections_visibility to include new sections
UPDATE landing_page_config
SET sections_visibility = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          sections_visibility,
          '{stats}',
          'true'::jsonb,
          true
        ),
        '{services}',
        'true'::jsonb,
        true
      ),
      '{testimonials}',
      'true'::jsonb,
      true
    ),
    '{contact}',
    'true'::jsonb,
    true
  ),
  '{cta}',
  COALESCE(sections_visibility->'cta', 'true'::jsonb),
  true
)
WHERE sections_visibility IS NOT NULL;

-- Add default stats if none exist
UPDATE landing_page_config
SET stats = '[
  {
    "label": "Vidas Salvas",
    "value": "10.000+",
    "icon": "users"
  },
  {
    "label": "Anos de Experiência",
    "value": "15+",
    "icon": "award"
  },
  {
    "label": "Profissionais",
    "value": "200+",
    "icon": "shield"
  },
  {
    "label": "Atendimentos/Ano",
    "value": "50.000+",
    "icon": "activity"
  }
]'::jsonb
WHERE stats = '[]'::jsonb OR stats IS NULL;

-- Add default services if none exist
UPDATE landing_page_config
SET services = '[
  {
    "title": "Atendimento Pré-Hospitalar",
    "description": "Equipe especializada em atendimento de urgência e emergência, disponível 24/7.",
    "icon": "activity"
  },
  {
    "title": "Treinamentos e Capacitação",
    "description": "Cursos e treinamentos para formação de socorristas e profissionais de saúde.",
    "icon": "award"
  },
  {
    "title": "Eventos e Operações",
    "description": "Cobertura médica para eventos esportivos, culturais e corporativos.",
    "icon": "calendar"
  },
  {
    "title": "Consultoria em Saúde",
    "description": "Assessoria técnica para empresas e instituições em gestão de emergências.",
    "icon": "briefcase"
  }
]'::jsonb
WHERE services = '[]'::jsonb OR services IS NULL;

-- Add default testimonials if none exist
UPDATE landing_page_config
SET testimonials = '[
  {
    "name": "Maria Silva",
    "role": "Coordenadora de Eventos",
    "content": "A ABCUNA prestou um serviço excepcional no nosso evento. Profissionalismo e dedicação incomparáveis!",
    "avatar": ""
  },
  {
    "name": "João Santos",
    "role": "Gestor de RH",
    "content": "Os treinamentos oferecidos pela ABCUNA transformaram nossa equipe de segurança. Altamente recomendado!",
    "avatar": ""
  },
  {
    "name": "Ana Costa",
    "role": "Diretora Escolar",
    "content": "Confiamos na ABCUNA para a segurança dos nossos alunos. Equipe sempre pronta e preparada.",
    "avatar": ""
  }
]'::jsonb
WHERE testimonials = '[]'::jsonb OR testimonials IS NULL;

-- Create index for better performance on JSONB fields
CREATE INDEX IF NOT EXISTS idx_landing_page_config_stats ON landing_page_config USING GIN (stats);
CREATE INDEX IF NOT EXISTS idx_landing_page_config_services ON landing_page_config USING GIN (services);
CREATE INDEX IF NOT EXISTS idx_landing_page_config_testimonials ON landing_page_config USING GIN (testimonials);
CREATE INDEX IF NOT EXISTS idx_landing_page_config_contact ON landing_page_config USING GIN (contact);
CREATE INDEX IF NOT EXISTS idx_landing_page_config_social ON landing_page_config USING GIN (social);
CREATE INDEX IF NOT EXISTS idx_landing_page_config_theme ON landing_page_config USING GIN (theme);
