-- Migração: Criação da infraestrutura de plantão atômico, histórico de participações e vínculo financeiro

-- 1. Coluna de vínculo de plantão no módulo financeiro
ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS shift_id uuid REFERENCES public.schedules(id) ON DELETE SET NULL;

-- 2. Índices de busca e índice único parcial para garantir idempotência financeira
CREATE INDEX IF NOT EXISTS idx_financial_transactions_shift_id
  ON public.financial_transactions USING btree (shift_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_transactions_shift_recipient
  ON public.financial_transactions USING btree (shift_id, recipient_id)
  WHERE (shift_id IS NOT NULL);

-- 3. Tabela de controle de participações por plantão
CREATE TABLE IF NOT EXISTS public.shift_participations (
  shift_id uuid NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_finalized_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (shift_id, user_id)
);

-- 4. Função de incremento de contador e trigger associado à inserção de participação
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

DROP TRIGGER IF EXISTS trg_increment_shifts_count ON public.shift_participations;
CREATE TRIGGER trg_increment_shifts_count
  AFTER INSERT ON public.shift_participations
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_profile_shifts_count();

-- 5. RPC Atômica de Finalização de Plantão
CREATE OR REPLACE FUNCTION public.finalize_shift_atomic(p_shift_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_caller_id          uuid;
  v_caller_role        user_role;
  v_shift              record;
  v_member             jsonb;
  v_user_id            uuid;
  v_user_name          text;
  v_individual_amount  numeric;
  v_date_part          date;
  v_participants_count integer := 0;
  v_obligations_created  integer := 0;
  v_counters_incremented integer := 0;
  v_participants_notified uuid[] := ARRAY[]::uuid[];
BEGIN
  -- 1. Validar autenticacao
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuario nao autenticado.';
  END IF;

  -- 2. Validar permissao (somente ADMIN e FINANCIAL)
  v_caller_role := public.get_my_role();
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('ADMIN'::user_role, 'FINANCIAL'::user_role) THEN
    RAISE EXCEPTION 'Acesso negado: permissao insuficiente para finalizar plantao.';
  END IF;

  -- 3. Obter e travar o plantao com FOR UPDATE para evitar concorrencia
  SELECT * INTO v_shift
  FROM public.schedules
  WHERE id = p_shift_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plantao com ID % nao encontrado.', p_shift_id;
  END IF;

  IF v_shift.status = 'FINISHED' THEN
    RAISE EXCEPTION 'Este plantao ja esta finalizado.';
  END IF;

  v_individual_amount := COALESCE(v_shift.amount, 0);
  v_date_part := COALESCE(v_shift.start_time::date, CURRENT_DATE);

  -- 4. Iterar sobre confirmed_members de forma segura contra formatos legados
  IF v_shift.confirmed_members IS NOT NULL AND jsonb_typeof(v_shift.confirmed_members) = 'array' THEN
    FOR v_member IN SELECT value FROM jsonb_array_elements(v_shift.confirmed_members)
    LOOP
      IF jsonb_typeof(v_member) = 'object'
         AND (v_member->>'status') = 'CONFIRMED'
         AND (v_member->>'userId') IS NOT NULL
         AND (v_member->>'userId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN

        v_user_id   := (v_member->>'userId')::uuid;
        v_user_name := COALESCE(v_member->>'name', 'Associado');
        v_participants_count := v_participants_count + 1;
        v_participants_notified := array_append(v_participants_notified, v_user_id);

        -- A. Registrar participacao (idempotente via PK unica).
        --    O AFTER INSERT trigger trg_increment_shifts_count dispara SOMENTE
        --    quando uma linha e efetivamente inserida (ON CONFLICT nao dispara trigger).
        --    Isso garante que shifts_count e incrementado uma unica vez por associado por plantao.
        INSERT INTO public.shift_participations (shift_id, user_id, first_finalized_at)
        VALUES (p_shift_id, v_user_id, now())
        ON CONFLICT (shift_id, user_id) DO NOTHING;

        IF FOUND THEN
          v_counters_incremented := v_counters_incremented + 1;
        END IF;

        -- B. Gerar obrigacao individual com valor integral (sem divisao).
        --    ON CONFLICT DO NOTHING preserva transacoes COMPLETED existentes.
        IF v_individual_amount > 0 THEN
          INSERT INTO public.financial_transactions (
            description,
            amount,
            type,
            category,
            date,
            status,
            recipient_id,
            shift_id,
            notes,
            created_by
          ) VALUES (
            'Diaria de Plantao Operacional - ' || v_user_name,
            v_individual_amount,
            'EXPENSE',
            'Plantao Operacional',
            v_date_part,
            'PENDING',
            v_user_id,
            p_shift_id,
            'Plantao "' || v_shift.title || '" em ' || v_date_part::text,
            v_caller_id
          )
          ON CONFLICT (shift_id, recipient_id) WHERE shift_id IS NOT NULL DO NOTHING;

          IF FOUND THEN
            v_obligations_created := v_obligations_created + 1;
          END IF;
        END IF;

      END IF;
    END LOOP;
  END IF;

  -- 5. Atualizar status do plantao para FINISHED
  UPDATE public.schedules
  SET status = 'FINISHED'
  WHERE id = p_shift_id;

  -- 6. Retornar resumo da operacao
  RETURN jsonb_build_object(
    'success',               true,
    'shift_id',              p_shift_id,
    'shift_title',           v_shift.title,
    'participants_count',    v_participants_count,
    'obligations_created',   v_obligations_created,
    'counters_incremented',  v_counters_incremented,
    'individual_amount',     v_individual_amount,
    'total_amount',          v_individual_amount * v_participants_count,
    'participant_ids',       to_jsonb(v_participants_notified)
  );
END;
$function$;

-- Defesa em profundidade para RPC finalize_shift_atomic
REVOKE EXECUTE ON FUNCTION public.finalize_shift_atomic(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.finalize_shift_atomic(uuid) TO authenticated;
