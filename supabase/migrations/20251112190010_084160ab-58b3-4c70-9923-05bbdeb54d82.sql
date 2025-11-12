-- Confirmar email manualmente para o usuário Junin
UPDATE auth.users 
SET email_confirmed_at = now(),
    confirmation_token = NULL,
    confirmation_sent_at = NULL
WHERE id = '2f2f828f-a140-40c5-8125-a8dfe89c5350' AND email_confirmed_at IS NULL;