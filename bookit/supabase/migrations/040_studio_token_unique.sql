-- Міграція 040: UNIQUE constraint на studios.invite_token
-- Без цього обмеження дві студії теоретично можуть отримати однаковий токен,
-- і будь-хто за посиланням потрапить у першу з них.

ALTER TABLE studios
  ADD CONSTRAINT studios_invite_token_unique UNIQUE (invite_token);
