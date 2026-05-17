CREATE TABLE public.users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  preferences JSONB
);

CREATE TABLE public.recipes (
  id           UUID        PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  ingredients  JSONB       NOT NULL DEFAULT '[]',
  steps        JSONB       NOT NULL DEFAULT '[]',
  cooking_time INTEGER,
  cooked       BOOLEAN     NOT NULL DEFAULT FALSE,
  favorite     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatically create a public.users row when a user signs in for the first time via Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, created_at)
  VALUES (NEW.id, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();