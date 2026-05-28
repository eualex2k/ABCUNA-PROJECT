import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

// Interface customizada de requisição autenticada para garantir tipagem estrita no TypeScript
export interface RequisicaoAutenticada extends Request {
  usuario?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'FINANCIAL' | 'ASSOCIATE';
    nome: string;
  };
}

/**
 * Middleware para validar o token JWT vindo do frontend através do Supabase Auth
 * E enriquecer a requisição com o perfil operacional real do usuário (ACL)
 */
export async function middlewareAutenticacao(
  req: RequisicaoAutenticada,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cabecalhoAutorizacao = req.headers.authorization;

    if (!cabecalhoAutorizacao || !cabecalhoAutorizacao.startsWith('Bearer ')) {
      res.status(401).json({
        sucesso: false,
        mensagem: "Acesso negado. Token de autorização ausente ou malformatado no cabeçalho."
      });
      return;
    }

    const token = cabecalhoAutorizacao.split(' ')[1];

    // Valida criptograficamente o JWT na nuvem do Supabase de forma nativa e segura
    const { data: { user }, error: erroAuth } = await supabaseAdmin.auth.getUser(token);

    if (erroAuth || !user) {
      res.status(401).json({
        sucesso: false,
        mensagem: "Sessão inválida ou expirada. Por favor, faça login novamente no painel da ABCUNA."
      });
      return;
    }

    // Busca o perfil operacional e a role dele no banco de dados para checar privilégios (ACL)
    const { data: perfil, error: erroPerfil } = await supabaseAdmin
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    if (erroPerfil || !perfil) {
      res.status(403).json({
        sucesso: false,
        mensagem: "Perfil de usuário não cadastrado ou sem permissões de acesso ativas."
      });
      return;
    }

    // Injeta os dados do usuário autenticado e validado na requisição Express
    req.usuario = {
      id: user.id,
      email: user.email || '',
      role: perfil.role as 'ADMIN' | 'FINANCIAL' | 'ASSOCIATE',
      nome: perfil.full_name || 'Usuário ABCUNA'
    };

    next();
  } catch (erro: any) {
    console.error("❌ Erro interno de interceptação no middleware de autenticação:", erro);
    res.status(500).json({
      sucesso: false,
      mensagem: "Ocorreu um erro interno de segurança ao validar sua assinatura digital."
    });
  }
}
