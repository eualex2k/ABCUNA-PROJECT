# 🚀 Guia Passo a Passo - Executar Migração SQL no Supabase

## 📋 Pré-requisitos
- [ ] Acesso ao Supabase Dashboard
- [ ] Projeto ABCUNA configurado no Supabase
- [ ] Permissões de administrador no projeto

---

## 📍 Passo 1: Acessar o Supabase Dashboard

1. Abra seu navegador
2. Acesse: https://supabase.com
3. Faça login com sua conta
4. Selecione o projeto **ABCUNA**

**✅ Confirmação**: Você deve estar na página principal do projeto ABCUNA

---

## 📍 Passo 2: Abrir o SQL Editor

1. No menu lateral esquerdo, procure por **"SQL Editor"**
2. Clique em **"SQL Editor"**
3. Você verá uma tela com um editor de código SQL

**✅ Confirmação**: Você deve ver um editor de texto vazio ou com queries anteriores

---

## 📍 Passo 3: Copiar o Código SQL

### Opção A: Copiar do Arquivo (Recomendado)

1. Abra o arquivo no seu editor:
   ```
   supabase/migrations/create_landing_page_config.sql
   ```

2. Selecione **TODO** o conteúdo (Ctrl+A)

3. Copie (Ctrl+C)

### Opção B: Copiar Daqui

<details>
<summary>Clique para expandir o código SQL completo</summary>

```sql
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
```

</details>

**✅ Confirmação**: Você deve ter copiado 111 linhas de código SQL

---

## 📍 Passo 4: Colar no SQL Editor

1. Volte para o **SQL Editor** no Supabase
2. Clique na área do editor (para garantir que está focado)
3. Cole o código (Ctrl+V)

**✅ Confirmação**: Você deve ver todo o código SQL no editor

---

## 📍 Passo 5: Executar a Migração

1. Procure o botão **"Run"** no canto inferior direito do editor
   - Ou use o atalho: **Ctrl+Enter**

2. Clique em **"Run"**

3. Aguarde a execução (pode levar 5-10 segundos)

**✅ Confirmação**: Você deve ver uma mensagem de sucesso verde

---

## 📍 Passo 6: Verificar a Tabela

1. No menu lateral, clique em **"Table Editor"**

2. Procure a tabela **"landing_page_config"** na lista

3. Clique na tabela

4. Você deve ver **1 registro** com valores padrão

**Colunas esperadas:**
- id
- hero_title
- hero_subtitle
- hero_image_url
- about_text
- mission_text
- vision_text
- values_text
- gallery_images
- sections_visibility
- created_at
- updated_at

**✅ Confirmação**: Tabela criada com 1 registro padrão

---

## 📍 Passo 7: Verificar o Storage Bucket

1. No menu lateral, clique em **"Storage"**

2. Procure o bucket **"public-assets"** na lista

3. Se existir, está tudo certo!

4. Se NÃO existir, crie manualmente:
   - Clique em **"New bucket"**
   - Nome: `public-assets`
   - Marque: ✅ **Public bucket**
   - Clique em **"Create bucket"**

**✅ Confirmação**: Bucket "public-assets" existe e é público

---

## 📍 Passo 8: Verificar as Políticas RLS

1. Volte para **"Table Editor"**

2. Clique na tabela **"landing_page_config"**

3. Clique na aba **"Policies"** (no topo)

4. Você deve ver **3 políticas**:
   - ✅ "Anyone can read landing page config"
   - ✅ "Only admins can update landing page config"
   - ✅ "Only admins can insert landing page config"

**✅ Confirmação**: 3 políticas RLS criadas

---

## 📍 Passo 9: Testar com Queries

1. Volte para **"SQL Editor"**

2. Crie uma **nova query**

3. Cole e execute este teste:

```sql
-- Teste 1: Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'landing_page_config'
);

-- Teste 2: Contar registros
SELECT COUNT(*) as total FROM landing_page_config;

-- Teste 3: Ver configuração padrão
SELECT hero_title, hero_subtitle FROM landing_page_config;
```

**Resultados esperados:**
- Teste 1: `true`
- Teste 2: `1`
- Teste 3: Título e subtítulo padrão

**✅ Confirmação**: Todos os testes passaram

---

## 🎉 Passo 10: Testar no Sistema

1. Abra o sistema ABCUNA no navegador

2. **Faça logout** (se estiver logado)

3. Acesse a URL raiz: `http://localhost:3000` (ou sua URL)

4. Você deve ver a **Landing Page** com:
   - ✅ Header com logo e botão "Entrar"
   - ✅ Seção Hero com título padrão
   - ✅ Seção Sobre com Missão, Visão e Valores
   - ✅ Footer

5. Clique no botão **"Entrar"**

6. Você deve ser redirecionado para `/auth`

7. Faça **login como Admin**

8. No menu lateral, procure **"Página Inicial"**

9. Clique em **"Página Inicial"**

10. Você deve ver o **painel de configurações**

**✅ Confirmação**: Sistema funcionando perfeitamente!

---

## ❌ Troubleshooting

### Erro: "relation landing_page_config already exists"

**Causa**: Tabela já foi criada anteriormente

**Solução**: 
- Ignore o erro, a tabela já existe
- Ou delete a tabela e execute novamente:
  ```sql
  DROP TABLE IF EXISTS landing_page_config CASCADE;
  ```

### Erro: "permission denied for schema public"

**Causa**: Usuário sem permissões

**Solução**: 
- Verifique se está usando o usuário correto
- Verifique permissões do projeto no Supabase

### Erro: "bucket public-assets already exists"

**Causa**: Bucket já foi criado

**Solução**: 
- Ignore o erro, o bucket já existe
- A migração usa `ON CONFLICT DO NOTHING`

### Erro: "policy already exists"

**Causa**: Políticas já foram criadas

**Solução**: 
- Delete as políticas antigas:
  ```sql
  DROP POLICY IF EXISTS "Anyone can read landing page config" ON landing_page_config;
  DROP POLICY IF EXISTS "Only admins can update landing page config" ON landing_page_config;
  DROP POLICY IF EXISTS "Only admins can insert landing page config" ON landing_page_config;
  ```
- Execute a migração novamente

### Landing Page não aparece

**Soluções**:
1. Limpe o cache do navegador (Ctrl+Shift+R)
2. Verifique se a tabela tem dados:
   ```sql
   SELECT * FROM landing_page_config;
   ```
3. Verifique o console do navegador (F12) para erros
4. Verifique se as políticas RLS estão corretas

### Painel Admin não aparece no menu

**Soluções**:
1. Verifique se o usuário é Admin:
   ```sql
   SELECT id, email, role FROM profiles WHERE email = 'seu-email@exemplo.com';
   ```
2. Faça logout e login novamente
3. Limpe o cache do navegador

---

## 📊 Checklist Final

Marque cada item conforme completa:

- [ ] Acessei o Supabase Dashboard
- [ ] Abri o SQL Editor
- [ ] Copiei o código SQL completo
- [ ] Colei no SQL Editor
- [ ] Executei a migração (Run)
- [ ] Vi mensagem de sucesso
- [ ] Verifiquei a tabela no Table Editor
- [ ] Verifiquei o bucket no Storage
- [ ] Verifiquei as políticas RLS
- [ ] Executei queries de teste
- [ ] Testei a landing page no navegador
- [ ] Testei o painel admin
- [ ] Tudo funcionando! 🎉

---

## 📞 Próximos Passos

Após a migração bem-sucedida:

1. ✅ Personalize o conteúdo no painel admin
2. ✅ Faça upload de imagens reais
3. ✅ Ajuste Missão, Visão e Valores
4. ✅ Teste em diferentes dispositivos
5. ✅ Compartilhe com a equipe!

---

## 📚 Documentação de Referência

- `LANDING_PAGE_GUIDE.md` - Guia completo
- `LANDING_PAGE_CHECKLIST.md` - Checklist de testes
- `LANDING_PAGE_CONTENT_EXAMPLES.md` - Exemplos de conteúdo
- `supabase/test_landing_page.sql` - Queries de teste

---

**🎉 Parabéns! Sua Landing Page está pronta para uso!**

Se tiver alguma dúvida, consulte a documentação ou verifique o troubleshooting acima.
