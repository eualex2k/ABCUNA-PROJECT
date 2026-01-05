# Implementação da Landing Page - Guia de Instalação

## 📋 Resumo da Implementação

Foi criada uma **Landing Page pública moderna e institucional** para o sistema ABCUNA, com painel administrativo completo para gerenciamento de conteúdo.

## 🎯 Funcionalidades Implementadas

### Landing Page Pública (`/`)
- ✅ Header fixo com logo e botão "Entrar"
- ✅ Seção Hero com título, subtítulo e imagem
- ✅ Seção "Sobre a Associação" com Missão, Visão e Valores
- ✅ Galeria de imagens responsiva
- ✅ Seção de Call-to-Action (CTA)
- ✅ Footer institucional
- ✅ Design totalmente responsivo (mobile, tablet, desktop)
- ✅ Animações suaves e discretas
- ✅ Mantém fielmente o estilo visual do sistema

### Painel Administrativo (`/settings/landing-page`)
- ✅ Edição de todos os textos da página
- ✅ Upload de imagem hero
- ✅ Gerenciamento de galeria (adicionar/remover imagens)
- ✅ Controle de visibilidade de seções
- ✅ Pré-visualização das alterações
- ✅ Acesso restrito a usuários Admin

## 🗄️ Estrutura do Banco de Dados

### Tabela: `landing_page_config`
```sql
- id (UUID)
- hero_title (TEXT)
- hero_subtitle (TEXT)
- hero_image_url (TEXT)
- about_text (TEXT)
- mission_text (TEXT)
- vision_text (TEXT)
- values_text (TEXT)
- gallery_images (TEXT[])
- sections_visibility (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Storage Bucket: `public-assets`
Bucket público para armazenar imagens da landing page.

## 🚀 Passos para Ativação

### 1. Executar Migração no Supabase

Acesse o **SQL Editor** no dashboard do Supabase e execute o arquivo:
```
supabase/migrations/create_landing_page_config.sql
```

Ou copie e cole o conteúdo do arquivo diretamente no SQL Editor.

### 2. Verificar Criação da Tabela

No Supabase Dashboard:
1. Vá em **Table Editor**
2. Verifique se a tabela `landing_page_config` foi criada
3. Deve haver 1 registro com valores padrão

### 3. Verificar Storage Bucket

No Supabase Dashboard:
1. Vá em **Storage**
2. Verifique se o bucket `public-assets` existe
3. Se não existir, crie manualmente:
   - Nome: `public-assets`
   - Público: ✅ Sim

### 4. Testar o Sistema

1. **Acesse a Landing Page**:
   - Faça logout (se estiver logado)
   - Acesse a URL raiz do sistema
   - Você deve ver a landing page pública

2. **Teste o Botão "Entrar"**:
   - Clique em "Entrar" no header
   - Deve redirecionar para `/auth` (página de login)

3. **Acesse o Painel Admin**:
   - Faça login como Admin
   - No menu lateral, clique em "Página Inicial"
   - Você deve ver o painel de configurações

4. **Teste a Edição de Conteúdo**:
   - Altere algum texto
   - Clique em "Salvar Alterações"
   - Faça logout e verifique se as mudanças aparecem na landing page

5. **Teste Upload de Imagens**:
   - No painel admin, faça upload de uma imagem hero
   - Adicione imagens à galeria
   - Salve e verifique na landing page pública

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
- ✅ `pages/LandingPage.tsx` - Landing page pública
- ✅ `pages/LandingPageSettings.tsx` - Painel administrativo
- ✅ `services/landingPage.ts` - Service para API
- ✅ `supabase/migrations/create_landing_page_config.sql` - Migração SQL
- ✅ `types.ts` - Interface LandingPageConfig adicionada

### Arquivos Modificados:
- ✅ `App.tsx` - Rotas atualizadas
- ✅ `constants.ts` - Menu "Página Inicial" adicionado

## 🎨 Estilo Visual

O design mantém **100% de fidelidade** ao estilo existente:
- ✅ Cores: Brand red (#dc2626) e slate
- ✅ Tipografia: Inter font
- ✅ Componentes: Reutilização dos componentes UI existentes
- ✅ Espaçamentos: Padrão do sistema
- ✅ Animações: Suaves e discretas (fade-in, slide-in)

## 🔒 Segurança

- ✅ Row Level Security (RLS) habilitado
- ✅ Apenas admins podem editar configurações
- ✅ Leitura pública permitida para landing page
- ✅ Upload de imagens restrito a admins
- ✅ Validação de tipos de arquivo (apenas imagens)
- ✅ Limite de tamanho de arquivo (5MB)

## 🌐 Fluxo de Navegação

### Usuário Não Logado:
1. Acessa `/` → Landing Page
2. Clica em "Entrar" → `/auth` (Login/Cadastro)
3. Faz login → Redireciona para Dashboard

### Usuário Admin Logado:
1. Acessa menu "Página Inicial" → `/settings/landing-page`
2. Edita conteúdo e salva
3. Pode pré-visualizar antes de salvar
4. Pode acessar `/landing` para ver a landing page mesmo logado

## 📱 Responsividade

A landing page é totalmente responsiva:
- ✅ **Mobile** (< 640px): Layout em coluna única
- ✅ **Tablet** (640px - 1024px): Layout adaptativo
- ✅ **Desktop** (> 1024px): Layout completo em grid

## ⚠️ Troubleshooting

### Erro: "Table landing_page_config does not exist"
**Solução**: Execute a migração SQL no Supabase.

### Erro: "Bucket public-assets does not exist"
**Solução**: Crie o bucket manualmente no Supabase Storage.

### Erro: "Permission denied for table landing_page_config"
**Solução**: Verifique se as políticas RLS foram criadas corretamente.

### Upload de imagem falha
**Solução**: 
1. Verifique se o bucket `public-assets` é público
2. Verifique se as políticas de storage foram criadas
3. Verifique se o usuário é Admin

## 🎉 Próximos Passos

1. Execute a migração SQL
2. Teste a landing page
3. Personalize o conteúdo no painel admin
4. Adicione imagens da associação
5. Compartilhe a URL pública!

## 📞 Suporte

Se encontrar algum problema:
1. Verifique o console do navegador para erros
2. Verifique os logs do Supabase
3. Confirme que todas as políticas RLS foram criadas
4. Confirme que o bucket de storage está configurado corretamente
