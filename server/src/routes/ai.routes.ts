import { Router } from 'express';
import { ControllerIA } from '../controllers/ai.controller.js';
import { middlewareAutenticacao } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Rota principal de comunicação com a IA (chat e detecção de ferramentas)
 * POST /api/ai/chat
 */
router.post('/chat', middlewareAutenticacao as any, ControllerIA.processarChat as any);

/**
 * Rota de execução física de ferramentas de escrita (após confirmação visual humana)
 * POST /api/ai/execute
 */
router.post('/execute', middlewareAutenticacao as any, ControllerIA.executarAcaoConfirmada as any);

export const rotasIA = router;
