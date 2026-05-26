-- Create ai_chat_messages table for persisting conversations with the AI Assistant
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  content TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for chat messages
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for ai_chat_messages: Users can only see and manage their own chat history
CREATE POLICY "Usuários leem suas próprias mensagens do chat"
  ON ai_chat_messages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários inserem suas próprias mensagens do chat"
  ON ai_chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários deletam suas próprias mensagens do chat"
  ON ai_chat_messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance on chat history queries
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_id ON ai_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created_at ON ai_chat_messages(created_at);


-- Create ai_agent_logs table to track AI actions, parameter proposals and user approvals
CREATE TABLE IF NOT EXISTS ai_agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL,
  confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for AI agent logs
ALTER TABLE ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- Policies for ai_agent_logs: Only Admins and Financial roles can view logs, any authenticated user can insert
CREATE POLICY "Admins e Tesoureiros leem logs do agente"
  ON ai_agent_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'FINANCIAL')
    )
  );

CREATE POLICY "Usuários logados inserem logs do agente"
  ON ai_agent_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create index for performance on AI log queries
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_user_id ON ai_agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_created_at ON ai_agent_logs(created_at DESC);
