-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeds ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Cards policies
CREATE POLICY "Users can view their own cards"
  ON public.cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards"
  ON public.cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
  ON public.cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
  ON public.cards FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Published cards are viewable by everyone"
  ON public.cards FOR SELECT
  USING (status = 'published');

-- Templates policies
CREATE POLICY "Users can view their own templates"
  ON public.templates FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own templates"
  ON public.templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.templates FOR DELETE
  USING (auth.uid() = user_id);

-- Embeds policies
CREATE POLICY "Users can view embeds for their cards"
  ON public.embeds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cards
      WHERE cards.id = embeds.card_id
      AND cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create embeds for their cards"
  ON public.embeds FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cards
      WHERE cards.id = card_id
      AND cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update embeds for their cards"
  ON public.embeds FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cards
      WHERE cards.id = embeds.card_id
      AND cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete embeds for their cards"
  ON public.embeds FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cards
      WHERE cards.id = embeds.card_id
      AND cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view embeds for published cards"
  ON public.embeds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cards
      WHERE cards.id = embeds.card_id
      AND cards.status = 'published'
    )
  );