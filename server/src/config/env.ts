import dotenv from 'dotenv';
import { z } from 'zod';

// Carrega as variáveis do arquivo .env
dotenv.config();

// Define o schema de validação para as variáveis de ambiente usando Zod
const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('3001'),
  SUPABASE_URL: z.string({
    required_error: "A variável SUPABASE_URL é obrigatória para a integração com o banco de dados."
  }).url("A variável SUPABASE_URL precisa ser uma URL válida."),
  SUPABASE_SERVICE_ROLE_KEY: z.string({
    required_error: "A chave SUPABASE_SERVICE_ROLE_KEY é obrigatória para operações seguras no backend."
  }).min(1, "A chave SUPABASE_SERVICE_ROLE_KEY não pode estar vazia."),
  READ_ONLY_MODE: z.string()
    .default('true')
    .transform((val) => val === 'true'),
  JWT_SECRET: z.string().optional()
});

// Executa a validação e exporta o resultado
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Falha na validação das variáveis de ambiente do backend:");
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
