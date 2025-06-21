-- Create templates table
CREATE TABLE public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Template data (based on card structure)
  template_data JSONB NOT NULL,
  
  -- Metadata
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(category, ''))
  ) STORED
);

-- Create template_usage table to track usage
CREATE TABLE public.template_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_templates_user_id ON public.templates(user_id);
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_is_public ON public.templates(is_public);
CREATE INDEX idx_templates_search_vector ON public.templates USING GIN(search_vector);
CREATE INDEX idx_templates_usage_count ON public.templates(usage_count DESC);

CREATE INDEX idx_template_usage_template_id ON public.template_usage(template_id);
CREATE INDEX idx_template_usage_user_id ON public.template_usage(user_id);
CREATE INDEX idx_template_usage_used_at ON public.template_usage(used_at);

-- Add updated_at trigger
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage(template_id_param UUID, user_id_param UUID DEFAULT NULL, card_id_param UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := COALESCE(user_id_param, auth.uid());
  
  -- Update usage count
  UPDATE public.templates 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = template_id_param;
  
  -- Record usage
  INSERT INTO public.template_usage (template_id, user_id, card_id)
  VALUES (template_id_param, current_user_id, card_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create template from card
CREATE OR REPLACE FUNCTION create_template_from_card(
  card_id_param UUID,
  template_name TEXT,
  template_description TEXT DEFAULT NULL,
  template_category TEXT DEFAULT NULL,
  is_public_param BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  template_id UUID;
  card_snapshot JSONB;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Get card data (similar to versioning snapshot but simplified for templates)
  WITH card_data AS (
    SELECT c.type, c.title, c.description, c.image_url, c.prep_time, c.cook_time, c.total_time, c.servings, c.difficulty,
           COALESCE(
             json_agg(
               json_build_object(
                 'name', COALESCE(i.name, ci.name),
                 'amount', ci.amount,
                 'unit', ci.unit,
                 'notes', ci.notes,
                 'optional', ci.optional,
                 'group_name', ci.group_name
               ) ORDER BY ci.display_order
             ) FILTER (WHERE ci.id IS NOT NULL), '[]'::json
           ) as ingredients,
           COALESCE(
             json_agg(
               json_build_object(
                 'name', COALESCE(s.name, cs.notes),
                 'notes', cs.notes,
                 'optional', cs.optional
               ) ORDER BY cs.display_order
             ) FILTER (WHERE cs.id IS NOT NULL), '[]'::json
           ) as supplies,
           COALESCE(
             json_agg(
               json_build_object(
                 'step_number', inst.step_number,
                 'title', inst.title,
                 'content', inst.content,
                 'duration', inst.duration,
                 'tips', inst.tips
               ) ORDER BY inst.step_number
             ) FILTER (WHERE inst.id IS NOT NULL), '[]'::json
           ) as instructions
    FROM public.cards c
    LEFT JOIN public.card_ingredients ci ON c.id = ci.card_id
    LEFT JOIN public.ingredients i ON ci.ingredient_id = i.id
    LEFT JOIN public.card_supplies cs ON c.id = cs.card_id
    LEFT JOIN public.supplies s ON cs.supply_id = s.id
    LEFT JOIN public.instructions inst ON c.id = inst.card_id
    WHERE c.id = card_id_param AND c.user_id = current_user_id
    GROUP BY c.id
  )
  SELECT row_to_json(card_data.*) INTO card_snapshot FROM card_data;
  
  IF card_snapshot IS NULL THEN
    RAISE EXCEPTION 'Card not found or access denied';
  END IF;
  
  -- Insert template
  INSERT INTO public.templates (
    user_id,
    name,
    description,
    category,
    template_data,
    is_public
  ) VALUES (
    current_user_id,
    template_name,
    template_description,
    template_category,
    card_snapshot,
    is_public_param
  ) RETURNING id INTO template_id;
  
  RETURN template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search templates
CREATE OR REPLACE FUNCTION search_templates(
  search_query TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  include_public BOOLEAN DEFAULT TRUE,
  user_id_param UUID DEFAULT NULL,
  limit_param INTEGER DEFAULT 20,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[],
  template_data JSONB,
  is_public BOOLEAN,
  usage_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rank REAL
) AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := COALESCE(user_id_param, auth.uid());
  
  RETURN QUERY
  SELECT t.id, t.user_id, t.name, t.description, t.category, t.tags, t.template_data, 
         t.is_public, t.usage_count, t.created_at, t.updated_at,
         CASE 
           WHEN search_query IS NOT NULL THEN ts_rank(t.search_vector, plainto_tsquery('english', search_query))
           ELSE 0
         END as rank
  FROM public.templates t
  WHERE 
    (current_user_id IS NULL OR t.user_id = current_user_id OR (include_public AND t.is_public))
    AND (search_query IS NULL OR t.search_vector @@ plainto_tsquery('english', search_query))
    AND (category_filter IS NULL OR t.category = category_filter)
  ORDER BY 
    CASE WHEN search_query IS NOT NULL THEN ts_rank(t.search_vector, plainto_tsquery('english', search_query)) END DESC,
    t.usage_count DESC,
    t.updated_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_usage ENABLE ROW LEVEL SECURITY;

-- Templates policies
CREATE POLICY "Users can view their own templates and public templates" ON public.templates
  FOR SELECT USING (user_id = auth.uid() OR is_public = TRUE);

CREATE POLICY "Users can create their own templates" ON public.templates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own templates" ON public.templates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own templates" ON public.templates
  FOR DELETE USING (user_id = auth.uid());

-- Template usage policies
CREATE POLICY "Users can view their own template usage" ON public.template_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create template usage records" ON public.template_usage
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add some sample categories
INSERT INTO public.templates (user_id, name, description, category, template_data, is_public) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Basic Recipe Template', 'A simple recipe template with common ingredients', 'Recipe', '{
    "type": "Recipe",
    "title": "",
    "description": "",
    "prep_time": 15,
    "cook_time": 30,
    "servings": 4,
    "ingredients": [
      {"name": "Salt", "amount": "1", "unit": "tsp"},
      {"name": "Black pepper", "amount": "1/2", "unit": "tsp"}
    ],
    "instructions": [
      {"step_number": 1, "title": "Prepare", "content": "Gather all ingredients and tools."},
      {"step_number": 2, "title": "Cook", "content": "Follow your recipe steps here."}
    ]
  }'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE public.templates IS 'Template system for creating reusable card structures';
COMMENT ON COLUMN public.templates.template_data IS 'JSON structure containing the template layout and default values';
COMMENT ON FUNCTION create_template_from_card IS 'Creates a reusable template from an existing card';
COMMENT ON FUNCTION search_templates IS 'Full-text search across templates with filtering options';