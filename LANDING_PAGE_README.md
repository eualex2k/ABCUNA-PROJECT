# 🏠 Landing Page ABCUNA - README

## 📖 Visão Geral

A Landing Page ABCUNA é uma página inicial pública, moderna e institucional que apresenta a associação aos visitantes antes do login. Foi desenvolvida mantendo 100% de fidelidade ao estilo visual do sistema existente.

## 🎯 Objetivos

1. **Apresentação Institucional**: Mostrar a missão, visão e valores da ABCUNA
2. **Primeira Impressão**: Criar impacto visual positivo nos visitantes
3. **Call-to-Action**: Direcionar visitantes para o login/cadastro
4. **Gerenciamento Fácil**: Permitir que admins atualizem conteúdo sem código

## 🏗️ Arquitetura

### Frontend
```
pages/
├── LandingPage.tsx          # Página pública
└── LandingPageSettings.tsx  # Painel admin
```

### Backend
```
services/
└── landingPage.ts           # API service

supabase/
└── migrations/
    └── create_landing_page_config.sql  # Database schema
```

### Database Schema
```sql
landing_page_config
├── id (UUID)
├── hero_title (TEXT)
├── hero_subtitle (TEXT)
├── hero_image_url (TEXT)
├── about_text (TEXT)
├── mission_text (TEXT)
├── vision_text (TEXT)
├── values_text (TEXT)
├── gallery_images (TEXT[])
├── sections_visibility (JSONB)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## 🎨 Componentes da Landing Page

### 1. Header (Fixo)
- Logo ABCUNA
- Botão "Entrar" destacado
- Responsivo com menu mobile

### 2. Seção Hero
- Título institucional forte
- Subtítulo explicativo
- Imagem/ilustração moderna
- Botões de ação (Acessar Sistema, Saiba Mais)
- Background com gradiente

### 3. Seção Sobre
- Texto institucional
- Cards de Missão, Visão e Valores
- Ícones ilustrativos
- Hover effects

### 4. Galeria
- Grid responsivo de imagens
- Hover com zoom
- Overlay com gradiente

### 5. Call-to-Action
- Background gradiente brand
- Botão destacado para login
- Texto motivacional

### 6. Footer
- Logo e nome da associação
- Copyright
- Informações institucionais

## 🔧 Painel Administrativo

### Funcionalidades

#### 1. Controle de Visibilidade
- Toggle para cada seção (Hero, Sobre, Galeria, CTA)
- Ativação/desativação instantânea

#### 2. Edição de Conteúdo
- **Hero**: Título, subtítulo, imagem
- **Sobre**: Texto institucional
- **Missão/Visão/Valores**: Textos individuais
- **Galeria**: Upload múltiplo de imagens

#### 3. Gerenciamento de Imagens
- Upload com validação (tipo e tamanho)
- Preview antes de salvar
- Remoção de imagens da galeria
- Limite de 5MB por imagem

#### 4. Pré-visualização
- Modal com preview das alterações
- Visualização antes de publicar
- Não afeta conteúdo publicado

## 🚀 Como Usar

### Para Visitantes
1. Acesse a URL raiz do sistema
2. Navegue pelas seções da landing page
3. Clique em "Entrar" para fazer login
4. Ou clique em "Acessar o Sistema" na seção CTA

### Para Administradores

#### Primeira Configuração
1. Faça login como Admin
2. Acesse menu "Página Inicial"
3. Personalize todos os textos
4. Faça upload da imagem hero
5. Adicione imagens à galeria
6. Salve as alterações

#### Atualizações Futuras
1. Acesse menu "Página Inicial"
2. Edite o conteúdo desejado
3. Use "Pré-visualizar" para conferir
4. Clique em "Salvar Alterações"
5. Faça logout para ver as mudanças

## 📱 Responsividade

### Mobile (< 640px)
- Layout vertical
- Cards empilhados
- Menu hamburger
- Imagens full-width

### Tablet (640px - 1024px)
- Layout em 2 colunas
- Cards lado a lado
- Navegação adaptativa

### Desktop (> 1024px)
- Layout em 3 colunas
- Grid completo
- Todas as funcionalidades

## 🎨 Estilo Visual

### Cores
- **Primary**: `#dc2626` (Brand Red)
- **Background**: `#f8fafc` (Slate 50)
- **Text**: `#1e293b` (Slate 900)
- **Accent**: `#0f172a` (Slate 900)

### Tipografia
- **Font**: Inter
- **Títulos**: Bold, tracking-tight
- **Corpo**: Regular, leading-relaxed

### Animações
- **Fade-in**: 500-700ms
- **Slide-in**: Bottom to top
- **Hover**: Scale, shadow, color
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1)

## 🔐 Segurança

### Row Level Security (RLS)
- ✅ Leitura pública permitida
- ✅ Edição restrita a Admin
- ✅ Upload restrito a Admin
- ✅ Validação de tipos de arquivo

### Validações
- Tamanho máximo de imagem: 5MB
- Formatos permitidos: JPG, PNG, WebP
- Campos obrigatórios validados
- Sanitização de inputs

## 📊 Performance

### Otimizações
- Lazy loading de imagens
- Componentes reutilizados
- CSS otimizado
- Animações GPU-accelerated

### Métricas Esperadas
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90

## 🐛 Troubleshooting

### Problema: Landing page não carrega
**Solução**: Verificar se migração SQL foi executada

### Problema: Imagens não aparecem
**Solução**: Verificar bucket `public-assets` no Supabase

### Problema: Não consigo editar
**Solução**: Verificar se usuário é Admin

### Problema: Upload falha
**Solução**: Verificar tamanho e formato da imagem

## 📚 Documentação Adicional

- `LANDING_PAGE_GUIDE.md` - Guia completo de instalação
- `LANDING_PAGE_SUMMARY.md` - Resumo da implementação
- `LANDING_PAGE_CHECKLIST.md` - Checklist de testes
- `supabase/migrations/create_landing_page_config.sql` - Schema SQL
- `supabase/test_landing_page.sql` - Queries de teste

## 🔄 Atualizações Futuras

### Possíveis Melhorias
- [ ] Suporte a múltiplos idiomas
- [ ] Analytics integrado
- [ ] SEO otimizado
- [ ] Formulário de contato
- [ ] Newsletter signup
- [ ] Depoimentos de membros
- [ ] Contador de vidas salvas
- [ ] Mapa de atuação

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação
2. Verifique o checklist
3. Execute queries de teste
4. Verifique console do navegador
5. Verifique logs do Supabase

## 📝 Changelog

### v1.0.0 (2026-01-05)
- ✅ Implementação inicial
- ✅ Landing page pública
- ✅ Painel administrativo
- ✅ Upload de imagens
- ✅ Controle de visibilidade
- ✅ Pré-visualização
- ✅ Responsividade completa
- ✅ Documentação completa

## 🎉 Créditos

Desenvolvido para ABCUNA - Associação Brasileira de Combate a Urgências e Necessidades Assistenciais

---

**Versão:** 1.0.0  
**Data:** 05/01/2026  
**Status:** ✅ Produção
