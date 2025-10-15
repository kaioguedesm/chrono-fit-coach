-- Adicionar campos de humor e dicas de IA à tabela workout_sessions
ALTER TABLE public.workout_sessions 
ADD COLUMN mood TEXT,
ADD COLUMN mood_intensity INTEGER,
ADD COLUMN ai_pre_workout_message TEXT,
ADD COLUMN ai_post_workout_message TEXT;