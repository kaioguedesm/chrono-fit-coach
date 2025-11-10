-- Configurar cron job para atualizar receitas diariamente às 6h da manhã
SELECT cron.schedule(
  'update-daily-recipes',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://gztjiknpddlkcxuavoeg.supabase.co/functions/v1/update-daily-recipes',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dGppa25wZGRsa2N4dWF2b2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MzcwODQsImV4cCI6MjA3NDIxMzA4NH0.CFkXaIGhRYhRojGIstCtqhIJoKTMLgDHk2LB0Q8Pt-4"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);