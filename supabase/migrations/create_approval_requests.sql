-- Migração: Criação da tabela approval_requests para governança e aprovação de ações sensíveis

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  record_id uuid,
  action text NOT NULL,
  previous_data jsonb,
  proposed_data jsonb,
  justification text NOT NULL,
  requested_by uuid NOT NULL REFERENCES public.profiles(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'PENDING'::text,
  decided_by uuid REFERENCES public.profiles(id),
  decided_at timestamptz,
  decision_note text,
  expected_updated_at timestamptz,
  executed_at timestamptz,
  CONSTRAINT approval_requests_action_check CHECK (action = ANY (ARRAY['CREATE'::text, 'UPDATE'::text, 'DELETE'::text, 'UPLOAD'::text, 'FINALIZE'::text, 'REOPEN'::text, 'OTHER'::text])),
  CONSTRAINT approval_requests_justification_check CHECK (length(btrim(justification)) >= 3),
  CONSTRAINT approval_requests_status_check CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text, 'CANCELLED'::text]))
);

CREATE INDEX IF NOT EXISTS approval_requests_status_requested_at_idx 
  ON public.approval_requests USING btree (status, requested_at DESC);

CREATE INDEX IF NOT EXISTS approval_requests_requested_by_idx 
  ON public.approval_requests USING btree (requested_by);

CREATE INDEX IF NOT EXISTS approval_requests_record_idx 
  ON public.approval_requests USING btree (module, record_id);

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- 1. Leitura: usuário lê suas próprias solicitações; administradores leem todas
DROP POLICY IF EXISTS "approval_requests_select_authenticated" ON public.approval_requests;
CREATE POLICY "approval_requests_select_authenticated"
  ON public.approval_requests
  FOR SELECT
  TO authenticated
  USING (
    requested_by = (SELECT auth.uid() AS uid) 
    OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = (SELECT auth.uid() AS uid) 
      AND p.role = 'ADMIN'::user_role
    )
  );

-- 2. Inserção: usuário autenticado pode criar solicitações em seu próprio nome com status PENDING
DROP POLICY IF EXISTS "approval_requests_insert_authenticated" ON public.approval_requests;
CREATE POLICY "approval_requests_insert_authenticated"
  ON public.approval_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by = (SELECT auth.uid() AS uid)
    AND status = 'PENDING'
  );

-- 3. Atualização: somente administradores podem decidir aprovações/rejeições
DROP POLICY IF EXISTS "approval_requests_update_admin" ON public.approval_requests;
CREATE POLICY "approval_requests_update_admin"
  ON public.approval_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = (SELECT auth.uid() AS uid) 
      AND p.role = 'ADMIN'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = (SELECT auth.uid() AS uid) 
      AND p.role = 'ADMIN'::user_role
    )
  );

-- Permissões no nível de tabela para o papel authenticated da API
GRANT SELECT, INSERT, UPDATE ON public.approval_requests TO authenticated;
