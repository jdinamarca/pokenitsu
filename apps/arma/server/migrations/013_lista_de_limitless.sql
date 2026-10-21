-- The cards of a Japanese expansion TCGdex has without cards, listed from Limitless for local use only
-- (lista-de-limitless-en-japonesas-vacias): the source of the card's list, null when it is its expansion's own source
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS list_source text REFERENCES arma.sources (id);
