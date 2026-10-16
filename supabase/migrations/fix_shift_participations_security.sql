-- Migração de Segurança: Fechamento de acesso público a shift_participations e correção da trigger guard de profiles

-- 1. Assegurar existência da tabela e fechar acesso público e direto a shift_participations
CREATE TABLE IF NOT EXISTS public.shift_participations (
  shift_id uuid NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_finalized_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (shift_id, user_id)
);

ALTER TABLE public.shift_participations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.shift_participations FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.shift_participations FROM authenticated;
GRANT SELECT ON public.shift_participations TO authenticated;

DROP POLICY IF EXISTS "Users can read own shift participations" ON public.shift_participations;
CREATE POLICY "Users can read own shift participations"
ON public.shift_participations
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.get_my_role() IN ('ADMIN'::user_role, 'FINANCIAL'::user_role)
);

-- 2. Atualizar increment_profile_shifts_count com assinatura de autorização interna
CREATE OR REPLACE FUNCTION public.increment_profile_shifts_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Incrementa shifts_count e atualiza last_shift_date do associado.
  -- Chamado SOMENTE via AFTER INSERT em shift_participations (trigger autorizada).
  -- A chave unica (shift_id, user_id) em shift_participations garante
  -- que este trigger dispara UMA UNICA VEZ por participante por plantao,
  -- mesmo em reaberturas ou retentativas.

  -- Sinaliza autorização interna com escopo local da transação
  PERFORM set_config('abcuna.internal_shift_counter_authorized', 'true', true);

  UPDATE public.profiles
  SET
    shifts_count    = COALESCE(shifts_count, 0) + 1,
    last_shift_date = now()
  WHERE id = NEW.user_id;

  -- Garante reset da flag
  PERFORM set_config('abcuna.internal_shift_counter_authorized', 'false', true);

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.increment_profile_shifts_count() FROM PUBLIC, anon, authenticated;

-- 3. Atualizar guard_profile_sensitive_columns com dupla validação (depth > 1 e token interno)
CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_role text;
  v_authorized_internal text;
BEGIN
  -- Permite atualizacao de shifts_count/last_shift_date SOMENTE quando a chamada
  -- vem da rotina interna autorizada (increment_profile_shifts_count) e com profundidade de trigger > 1.
  IF (NEW.shifts_count IS DISTINCT FROM OLD.shifts_count
      OR NEW.last_shift_date IS DISTINCT FROM OLD.last_shift_date) THEN
    v_authorized_internal := current_setting('abcuna.internal_shift_counter_authorized', true);
    IF v_authorized_internal IS DISTINCT FROM 'true' OR pg_trigger_depth() <= 1 THEN
      RAISE EXCEPTION 'Acesso negado: estatisticas de plantao so podem ser atualizadas por rotina interna autorizada.'
        USING ERRCODE = '42501';
    END IF;
    -- Consumir o token de autorização imediatamente para evitar reuso
    PERFORM set_config('abcuna.internal_shift_counter_authorized', 'false', true);
  END IF;

  -- Se nenhum campo protegido de controle administrativo foi alterado, passa.
  IF NEW.role IS NOT DISTINCT FROM OLD.role
     AND NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.payment_status IS NOT DISTINCT FROM OLD.payment_status
     AND NEW.registration_number IS NOT DISTINCT FROM OLD.registration_number
     AND NEW.email IS NOT DISTINCT FROM OLD.email
     AND NEW.operational_role IS NOT DISTINCT FROM OLD.operational_role THEN
    RETURN NEW;
  END IF;

  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuario autenticado obrigatorio para alterar campos protegidos.'
      USING ERRCODE = '42501';
  END IF;

  SELECT p.role::text
    INTO v_role
    FROM public.profiles AS p
   WHERE p.id = v_actor;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: perfil do usuario nao encontrado.'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role AND v_role <> 'ADMIN' THEN
    RAISE EXCEPTION 'Acesso negado: somente ADMIN pode alterar o papel de acesso.'
      USING ERRCODE = '42501';
  END IF;

  IF (NEW.status IS DISTINCT FROM OLD.status
      OR NEW.operational_role IS DISTINCT FROM OLD.operational_role
      OR NEW.registration_number IS DISTINCT FROM OLD.registration_number)
     AND v_role NOT IN ('ADMIN', 'SECRETARY') THEN
    RAISE EXCEPTION 'Acesso negado: somente ADMIN ou SECRETARY pode alterar dados administrativos do associado.'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status
     AND v_role NOT IN ('ADMIN', 'FINANCIAL') THEN
    RAISE EXCEPTION 'Acesso negado: somente ADMIN ou FINANCIAL pode alterar a situacao financeira.'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email
     AND v_role NOT IN ('ADMIN', 'SECRETARY') THEN
    RAISE EXCEPTION 'Acesso negado: somente ADMIN ou SECRETARY pode alterar o e-mail do perfil.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

-- 4. Camada de defesa em profundidade para RPC finalize_shift_atomic
REVOKE EXECUTE ON FUNCTION public.finalize_shift_atomic(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.finalize_shift_atomic(uuid) TO authenticated;
