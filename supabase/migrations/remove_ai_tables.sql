-- Migration to remove AI tables and logs from the system database
DROP TABLE IF EXISTS ai_chat_messages CASCADE;
DROP TABLE IF EXISTS ai_agent_logs CASCADE;
