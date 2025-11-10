-- Criar tabela para receitas recomendadas diárias
CREATE TABLE IF NOT EXISTS public.recommended_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  ingredients TEXT[] NOT NULL,
  instructions TEXT NOT NULL,
  category TEXT NOT NULL, -- cafe_da_manha, almoco, jantar, lanche
  calories INTEGER,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  prep_time_minutes INTEGER,
  difficulty TEXT, -- facil, medio, dificil
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Index para buscar receitas ativas por categoria
CREATE INDEX idx_recommended_recipes_active_category 
ON public.recommended_recipes(is_active, category, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.recommended_recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ver receitas ativas
CREATE POLICY "Everyone can view active recipes"
ON public.recommended_recipes
FOR SELECT
USING (is_active = true);

-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;