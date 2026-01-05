# ✅ Checklist de Implementação - Landing Page ABCUNA

## 📋 Pré-requisitos
- [ ] Sistema ABCUNA funcionando
- [ ] Acesso ao Supabase Dashboard
- [ ] Usuário Admin criado no sistema

## 🗄️ Configuração do Banco de Dados

### Passo 1: Executar Migração SQL
- [ ] Acessar Supabase Dashboard
- [ ] Ir em **SQL Editor**
- [ ] Abrir arquivo `supabase/migrations/create_landing_page_config.sql`
- [ ] Copiar todo o conteúdo
- [ ] Colar no SQL Editor
- [ ] Clicar em **Run**
- [ ] Verificar se não há erros

### Passo 2: Verificar Tabela
- [ ] Ir em **Table Editor**
- [ ] Procurar tabela `landing_page_config`
- [ ] Verificar se existe 1 registro com valores padrão
- [ ] Verificar colunas: hero_title, hero_subtitle, etc.

### Passo 3: Verificar Storage
- [ ] Ir em **Storage**
- [ ] Verificar se bucket `public-assets` existe
- [ ] Se não existir, criar:
  - [ ] Nome: `public-assets`
  - [ ] Público: ✅ Sim
  - [ ] Allowed MIME types: `image/*`

### Passo 4: Verificar Políticas RLS
- [ ] Executar queries de teste em `supabase/test_landing_page.sql`
- [ ] Verificar se políticas foram criadas:
  - [ ] Anyone can read landing page config
  - [ ] Only admins can update landing page config
  - [ ] Only admins can insert landing page config
  - [ ] Storage policies para public-assets

## 🚀 Teste do Sistema

### Teste 1: Landing Page Pública
- [ ] Fazer logout (se estiver logado)
- [ ] Acessar URL raiz do sistema (`/`)
- [ ] Verificar se landing page é exibida
- [ ] Verificar seções:
  - [ ] Header com logo e botão "Entrar"
  - [ ] Seção Hero com título e subtítulo
  - [ ] Seção "Sobre a Associação"
  - [ ] Cards de Missão, Visão e Valores
  - [ ] Footer institucional

### Teste 2: Navegação
- [ ] Clicar no botão "Entrar" no header
- [ ] Verificar redirecionamento para `/auth`
- [ ] Fazer login como Admin
- [ ] Verificar redirecionamento para Dashboard

### Teste 3: Menu Admin
- [ ] Verificar menu lateral
- [ ] Procurar item "Página Inicial"
- [ ] Verificar se está visível apenas para Admin
- [ ] Clicar em "Página Inicial"
- [ ] Verificar redirecionamento para `/settings/landing-page`

### Teste 4: Painel de Configurações
- [ ] Acessar `/settings/landing-page`
- [ ] Verificar se página carrega sem erros
- [ ] Verificar seções:
  - [ ] Controles de visibilidade
  - [ ] Formulário Hero
  - [ ] Formulário Sobre
  - [ ] Galeria de imagens
  - [ ] Botões "Pré-visualizar" e "Salvar"

### Teste 5: Edição de Conteúdo
- [ ] Alterar título hero
- [ ] Alterar subtítulo hero
- [ ] Alterar texto "Sobre"
- [ ] Alterar Missão, Visão e Valores
- [ ] Clicar em "Salvar Alterações"
- [ ] Verificar notificação de sucesso
- [ ] Fazer logout
- [ ] Verificar se alterações aparecem na landing page

### Teste 6: Upload de Imagens
- [ ] Fazer login como Admin
- [ ] Acessar painel de configurações
- [ ] Fazer upload de imagem hero:
  - [ ] Clicar em "Escolher Imagem"
  - [ ] Selecionar imagem (máx 5MB)
  - [ ] Verificar preview
  - [ ] Salvar alterações
- [ ] Adicionar imagens à galeria:
  - [ ] Clicar em "Adicionar Imagem"
  - [ ] Selecionar imagem
  - [ ] Verificar se aparece na grade
  - [ ] Adicionar mais 2-3 imagens
  - [ ] Salvar alterações
- [ ] Fazer logout e verificar imagens na landing page

### Teste 7: Controle de Visibilidade
- [ ] Acessar painel de configurações
- [ ] Desativar seção "Galeria"
- [ ] Salvar alterações
- [ ] Verificar se galeria não aparece na landing page
- [ ] Reativar seção "Galeria"
- [ ] Salvar e verificar

### Teste 8: Pré-visualização
- [ ] Fazer alterações no conteúdo
- [ ] Clicar em "Pré-visualizar"
- [ ] Verificar modal com preview
- [ ] Verificar se mostra alterações
- [ ] Fechar modal
- [ ] Salvar alterações

### Teste 9: Responsividade
- [ ] Abrir landing page em diferentes tamanhos:
  - [ ] Mobile (< 640px)
  - [ ] Tablet (640px - 1024px)
  - [ ] Desktop (> 1024px)
- [ ] Verificar se layout se adapta corretamente
- [ ] Verificar se todas as seções são visíveis
- [ ] Verificar se botões são clicáveis

### Teste 10: Segurança
- [ ] Fazer login como usuário não-Admin
- [ ] Tentar acessar `/settings/landing-page`
- [ ] Verificar se acesso é negado
- [ ] Verificar se menu "Página Inicial" não aparece

## 🎨 Personalização

### Conteúdo Recomendado
- [ ] Atualizar título hero com nome completo da associação
- [ ] Escrever subtítulo institucional atraente
- [ ] Escrever texto "Sobre" detalhado (2-3 parágrafos)
- [ ] Definir Missão clara e objetiva
- [ ] Definir Visão inspiradora
- [ ] Listar Valores fundamentais

### Imagens Recomendadas
- [ ] Imagem hero: Equipe em ação ou logo institucional
- [ ] Galeria: 6-9 imagens variadas:
  - [ ] Equipe em treinamento
  - [ ] Equipe em operação
  - [ ] Eventos da associação
  - [ ] Instalações
  - [ ] Equipamentos
  - [ ] Ações comunitárias

## 🔧 Troubleshooting

### Problema: Tabela não existe
- [ ] Executar migração SQL novamente
- [ ] Verificar erros no console do Supabase
- [ ] Verificar permissões do usuário no Supabase

### Problema: Bucket não existe
- [ ] Criar bucket manualmente no Supabase Storage
- [ ] Nome: `public-assets`
- [ ] Marcar como público
- [ ] Executar políticas de storage do SQL

### Problema: Upload de imagem falha
- [ ] Verificar se bucket é público
- [ ] Verificar políticas de storage
- [ ] Verificar tamanho da imagem (máx 5MB)
- [ ] Verificar formato (JPG, PNG, WebP)
- [ ] Verificar se usuário é Admin

### Problema: Alterações não aparecem
- [ ] Verificar se clicou em "Salvar Alterações"
- [ ] Verificar notificação de sucesso
- [ ] Fazer hard refresh (Ctrl+Shift+R)
- [ ] Verificar console do navegador para erros
- [ ] Verificar se RLS permite leitura pública

### Problema: Menu não aparece
- [ ] Verificar se usuário é Admin
- [ ] Verificar arquivo `constants.ts`
- [ ] Fazer logout e login novamente
- [ ] Limpar cache do navegador

## 📊 Validação Final

### Checklist de Qualidade
- [ ] Landing page carrega sem erros
- [ ] Todas as seções são exibidas corretamente
- [ ] Botão "Entrar" redireciona para login
- [ ] Painel admin acessível apenas para Admin
- [ ] Upload de imagens funciona
- [ ] Edição de textos funciona
- [ ] Alterações são persistidas no banco
- [ ] Layout é responsivo
- [ ] Animações são suaves
- [ ] Estilo visual é consistente com o sistema

### Performance
- [ ] Landing page carrega em < 3 segundos
- [ ] Imagens são otimizadas
- [ ] Sem erros no console
- [ ] Sem warnings no console

### Segurança
- [ ] RLS habilitado
- [ ] Apenas Admin pode editar
- [ ] Leitura pública funciona
- [ ] Upload restrito a Admin
- [ ] Validação de arquivos funciona

## 🎉 Conclusão

- [ ] Todos os testes passaram
- [ ] Conteúdo personalizado
- [ ] Imagens adicionadas
- [ ] Sistema funcionando perfeitamente
- [ ] Documentação lida e compreendida

## 📝 Notas

**Data de Implementação:** _____________

**Responsável:** _____________

**Observações:**
_____________________________________________
_____________________________________________
_____________________________________________

---

**Status:** ⬜ Não Iniciado | 🟡 Em Progresso | ✅ Concluído
