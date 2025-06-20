-- Drop existing tables to rebuild with new structure
DROP TABLE IF EXISTS public.embeds CASCADE;
DROP TABLE IF EXISTS public.cards CASCADE;

-- Create ingredients master table for ingredient library
CREATE TABLE public.ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT,
  unit_types TEXT[] DEFAULT '{}', -- Common units for this ingredient (cups, grams, etc)
  metadata JSONB DEFAULT '{}', -- Additional data like nutritional info
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create supplies/tools master table
CREATE TABLE public.supplies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Recreate cards table with simplified structure
CREATE TABLE public.cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type card_type NOT NULL,
  status card_status DEFAULT 'draft' NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  prep_time INTEGER, -- in minutes
  cook_time INTEGER, -- in minutes
  total_time INTEGER, -- in minutes
  servings INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  metadata JSONB DEFAULT '{}', -- Additional schema.org fields
  theme_settings JSONB DEFAULT '{}',
  seo_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_at TIMESTAMPTZ,
  UNIQUE(user_id, slug)
);

-- Create card_ingredients junction table with quantities
CREATE TABLE public.card_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  ingredient_id UUID REFERENCES public.ingredients(id) NOT NULL,
  amount DECIMAL(10,2),
  unit TEXT,
  notes TEXT, -- e.g., "diced", "room temperature"
  optional BOOLEAN DEFAULT false,
  group_name TEXT, -- e.g., "For the sauce", "For the topping"
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create card_supplies junction table
CREATE TABLE public.card_supplies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  supply_id UUID REFERENCES public.supplies(id) NOT NULL,
  notes TEXT,
  optional BOOLEAN DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create instructions table
CREATE TABLE public.instructions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  duration INTEGER, -- in minutes
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'gif')),
  tips TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(card_id, step_number)
);

-- Create instruction_ingredients to link ingredients to specific steps
CREATE TABLE public.instruction_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instruction_id UUID REFERENCES public.instructions(id) ON DELETE CASCADE NOT NULL,
  ingredient_id UUID REFERENCES public.ingredients(id) NOT NULL,
  card_ingredient_id UUID REFERENCES public.card_ingredients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create nutrition_info table
CREATE TABLE public.nutrition_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL UNIQUE,
  calories INTEGER,
  protein_grams DECIMAL(10,2),
  carbs_grams DECIMAL(10,2),
  fat_grams DECIMAL(10,2),
  fiber_grams DECIMAL(10,2),
  sugar_grams DECIMAL(10,2),
  sodium_mg DECIMAL(10,2),
  cholesterol_mg DECIMAL(10,2),
  additional_nutrients JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create affiliate_products table for sponsored/affiliate links
CREATE TABLE public.affiliate_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id UUID REFERENCES public.ingredients(id),
  supply_id UUID REFERENCES public.supplies(id),
  product_name TEXT NOT NULL,
  brand TEXT,
  affiliate_url TEXT NOT NULL,
  image_url TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  is_sponsored BOOLEAN DEFAULT false,
  commission_rate DECIMAL(5,2), -- percentage
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CHECK ((ingredient_id IS NOT NULL AND supply_id IS NULL) OR (ingredient_id IS NULL AND supply_id IS NOT NULL))
);

-- Recreate embeds table with proper foreign key
CREATE TABLE public.embeds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  embed_code TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_viewed_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX idx_ingredients_name ON public.ingredients(name);
CREATE INDEX idx_ingredients_slug ON public.ingredients(slug);
CREATE INDEX idx_ingredients_category ON public.ingredients(category);

CREATE INDEX idx_supplies_name ON public.supplies(name);
CREATE INDEX idx_supplies_slug ON public.supplies(slug);
CREATE INDEX idx_supplies_category ON public.supplies(category);

CREATE INDEX idx_cards_user_id ON public.cards(user_id);
CREATE INDEX idx_cards_type ON public.cards(type);
CREATE INDEX idx_cards_status ON public.cards(status);
CREATE INDEX idx_cards_slug ON public.cards(slug);

CREATE INDEX idx_card_ingredients_card_id ON public.card_ingredients(card_id);
CREATE INDEX idx_card_ingredients_ingredient_id ON public.card_ingredients(ingredient_id);

CREATE INDEX idx_card_supplies_card_id ON public.card_supplies(card_id);
CREATE INDEX idx_card_supplies_supply_id ON public.card_supplies(supply_id);

CREATE INDEX idx_instructions_card_id ON public.instructions(card_id);
CREATE INDEX idx_instructions_step_number ON public.instructions(card_id, step_number);

CREATE INDEX idx_instruction_ingredients_instruction_id ON public.instruction_ingredients(instruction_id);
CREATE INDEX idx_instruction_ingredients_ingredient_id ON public.instruction_ingredients(ingredient_id);

CREATE INDEX idx_nutrition_info_card_id ON public.nutrition_info(card_id);

CREATE INDEX idx_affiliate_products_ingredient_id ON public.affiliate_products(ingredient_id);
CREATE INDEX idx_affiliate_products_supply_id ON public.affiliate_products(supply_id);
CREATE INDEX idx_affiliate_products_active ON public.affiliate_products(active);

CREATE INDEX idx_embeds_card_id ON public.embeds(card_id);

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON public.ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplies_updated_at BEFORE UPDATE ON public.supplies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructions_updated_at BEFORE UPDATE ON public.instructions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_info_updated_at BEFORE UPDATE ON public.nutrition_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_products_updated_at BEFORE UPDATE ON public.affiliate_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();