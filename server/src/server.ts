import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';

const app = express();

// --- CONFIGURAÇÃO DE SEGURANÇA GLOBAL ---

// Helmet ajuda a blindar o Express contra vetores conhecidos configurando cabeçalhos HTTP de segurança
app.use(helmet());

// Habilita CORS de forma restrita para permitir apenas conexões seguras do nosso Frontend Vite
const configuracaoCors = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'],
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(configuracaoCors));

// Limitação de requisições contra injeção em massa e flood
const limitadorGlobal = rateLimit({
  windowMs: 15 * 60 * 1000, // Janela temporal de 15 minutos
  max: 100, // Limita cada IP a no máximo 100 requisições por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    mensagem: "O sistema detectou um volume elevado de comandos operacionais. Por favor, aguarde alguns minutos antes de fazer novas requisições."
  }
});
app.use(limitadorGlobal);

// Parse de payloads de entrada no formato JSON com limite máximo de tamanho seguro (1mb)
app.use(express.json({ limit: '1mb' }));

// --- ROTAS DO SISTEMA ---

// Rota de status/healthcheck básica
app.get('/status', (_req, res) => {
  res.status(200).json({
    sucesso: true,
    mensagem: "Servidor administrativo operacional da ABCUNA ativo e respondendo.",
    modoSomenteLeitura: env.READ_ONLY_MODE,
    dataHoraServidor: new Date().toISOString()
  });
});

// --- TRATAMENTO GLOBAL DE EXCEÇÕES E ERROS ---

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Exceção interna crítica detectada no pipeline do servidor:", err);
  res.status(500).json({
    sucesso: false,
    mensagem: "Desculpe, ocorreu uma instabilidade interna crítica nos nossos servidores de API ao processar a operação."
  });
});

// --- INICIALIZAÇÃO DO SERVIDOR ---

const porta = env.PORT || 3001;

app.listen(porta, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🚀 SERVIDOR ADMINISTRATIVO DA ABCUNA INICIADO COM SUCESSO`);
  console.log(`📡 Endereço Local: http://localhost:${porta}`);
  console.log(`🔒 Modo Somente Leitura (Read-Only): ${env.READ_ONLY_MODE ? 'ATIVO (Escritas bloqueadas)' : 'INATIVO (Ações de persistência liberadas)'}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});
