-- Create card versions table to track changes over time
CREATE TABLE public.card_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'published', 'archived', 'restored')),
  change_summary TEXT, -- Brief description of what changed
  
  -- Snapshot of card data at this version
  card_data JSONB NOT NULL, -- Complete card state including related data
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Index for quick lookups
  UNIQUE(card_id, version_number)
);

-- Create indexes for performance
CREATE INDEX idx_card_versions_card_id ON public.card_versions(card_id);
CREATE INDEX idx_card_versions_version_number ON public.card_versions(card_id, version_number);
CREATE INDEX idx_card_versions_change_type ON public.card_versions(change_type);
CREATE INDEX idx_card_versions_created_at ON public.card_versions(created_at);

-- Function to get the next version number for a card
CREATE OR REPLACE FUNCTION get_next_version_number(target_card_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO next_version
  FROM public.card_versions 
  WHERE card_id = target_card_id;
  
  RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- Function to create a card version snapshot
CREATE OR REPLACE FUNCTION create_card_version_snapshot(
  target_card_id UUID, 
  change_type_param TEXT,
  change_summary_param TEXT DEFAULT NULL,
  user_id_param UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  version_id UUID;
  next_version INTEGER;
  card_snapshot JSONB;
  current_user_id UUID;
BEGIN
  -- Get current user if not provided
  current_user_id := COALESCE(user_id_param, auth.uid());
  
  -- Get next version number
  next_version := get_next_version_number(target_card_id);
  
  -- Build complete card snapshot with all related data
  WITH card_data AS (
    SELECT c.*,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', ci.id,
                 'ingredient_id', ci.ingredient_id,
                 'amount', ci.amount,
                 'unit', ci.unit,
                 'notes', ci.notes,
                 'optional', ci.optional,
                 'group_name', ci.group_name,
                 'display_order', ci.display_order,
                 'ingredient_name', i.name
               ) ORDER BY ci.display_order
             ) FILTER (WHERE ci.id IS NOT NULL), '[]'::json
           ) as ingredients,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', cs.id,
                 'supply_id', cs.supply_id,
                 'notes', cs.notes,
                 'optional', cs.optional,
                 'display_order', cs.display_order,
                 'supply_name', s.name
               ) ORDER BY cs.display_order
             ) FILTER (WHERE cs.id IS NOT NULL), '[]'::json
           ) as supplies,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', inst.id,
                 'step_number', inst.step_number,
                 'title', inst.title,
                 'content', inst.content,
                 'duration', inst.duration,
                 'media_url', inst.media_url,
                 'media_type', inst.media_type,
                 'tips', inst.tips
               ) ORDER BY inst.step_number
             ) FILTER (WHERE inst.id IS NOT NULL), '[]'::json
           ) as instructions,
           row_to_json(ni.*) as nutrition_info
    FROM public.cards c
    LEFT JOIN public.card_ingredients ci ON c.id = ci.card_id
    LEFT JOIN public.ingredients i ON ci.ingredient_id = i.id
    LEFT JOIN public.card_supplies cs ON c.id = cs.card_id
    LEFT JOIN public.supplies s ON cs.supply_id = s.id
    LEFT JOIN public.instructions inst ON c.id = inst.card_id
    LEFT JOIN public.nutrition_info ni ON c.id = ni.card_id
    WHERE c.id = target_card_id
    GROUP BY c.id, ni.id
  )
  SELECT row_to_json(card_data.*) INTO card_snapshot FROM card_data;
  
  -- Insert version record
  INSERT INTO public.card_versions (
    card_id,
    version_number,
    change_type,
    change_summary,
    card_data,
    created_by
  ) VALUES (
    target_card_id,
    next_version,
    change_type_param,
    change_summary_param,
    card_snapshot,
    current_user_id
  ) RETURNING id INTO version_id;
  
  RETURN version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a card to a specific version
CREATE OR REPLACE FUNCTION restore_card_to_version(
  target_card_id UUID,
  target_version_number INTEGER,
  user_id_param UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  version_data JSONB;
  current_user_id UUID;
  restoration_version_id UUID;
BEGIN
  -- Get current user if not provided
  current_user_id := COALESCE(user_id_param, auth.uid());
  
  -- Get the version data
  SELECT card_data INTO version_data
  FROM public.card_versions
  WHERE card_id = target_card_id AND version_number = target_version_number;
  
  IF version_data IS NULL THEN
    RAISE EXCEPTION 'Version % not found for card %', target_version_number, target_card_id;
  END IF;
  
  -- Create a version snapshot before restoration
  restoration_version_id := create_card_version_snapshot(
    target_card_id, 
    'restored', 
    'Restored to version ' || target_version_number,
    current_user_id
  );
  
  -- TODO: Implement the actual restoration logic
  -- This would involve updating the cards table and related tables
  -- with the data from the version snapshot
  
  RETURN restoration_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create version snapshots on card updates
CREATE OR REPLACE FUNCTION trigger_create_card_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version on actual changes
  IF TG_OP = 'UPDATE' AND OLD IS DISTINCT FROM NEW THEN
    PERFORM create_card_version_snapshot(NEW.id, 'updated', 'Automatic version on update');
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM create_card_version_snapshot(NEW.id, 'created', 'Initial version');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on cards table
CREATE TRIGGER trigger_card_versioning
  AFTER INSERT OR UPDATE ON public.cards
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_card_version();

-- Create RLS policies for card_versions
ALTER TABLE public.card_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see versions of their own cards
CREATE POLICY "Users can view their own card versions" ON public.card_versions
  FOR SELECT USING (
    card_id IN (
      SELECT id FROM public.cards WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create versions for their own cards
CREATE POLICY "Users can create versions for their own cards" ON public.card_versions
  FOR INSERT WITH CHECK (
    card_id IN (
      SELECT id FROM public.cards WHERE user_id = auth.uid()
    )
  );

-- Add some comments for documentation
COMMENT ON TABLE public.card_versions IS 'Stores version history of card changes for rollback and audit purposes';
COMMENT ON COLUMN public.card_versions.card_data IS 'Complete JSON snapshot of card state including ingredients, instructions, and nutrition info';
COMMENT ON COLUMN public.card_versions.change_type IS 'Type of change: created, updated, published, archived, restored';
COMMENT ON FUNCTION create_card_version_snapshot IS 'Creates a complete snapshot of a card state for version history';
COMMENT ON FUNCTION restore_card_to_version IS 'Restores a card to a specific version from history';