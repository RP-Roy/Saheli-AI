-- 1. Update journeys table
ALTER TABLE public.journeys
ADD COLUMN selected_route_id UUID,
ADD COLUMN selected_route_geometry JSONB,
ADD COLUMN selected_route_distance_meters INTEGER,
ADD COLUMN selected_route_duration_seconds INTEGER,
ADD COLUMN selected_route_safety_score INTEGER;

-- 2. Create route_options table
CREATE TABLE public.route_options (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
  distance_meters INTEGER,
  duration_seconds INTEGER,
  safety_score INTEGER,
  safety_level TEXT CHECK (safety_level IN ('SAFE', 'CAUTION', 'HIGH_RISK')),
  geometry JSONB,
  is_recommended BOOLEAN DEFAULT false,
  selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.route_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own route options" ON route_options
FOR ALL USING (
  EXISTS (SELECT 1 FROM journeys WHERE journeys.id = route_options.journey_id AND journeys.user_id = auth.uid())
);

-- 3. Create route_safety_points table
CREATE TABLE public.route_safety_points (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  route_option_id UUID REFERENCES public.route_options(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  distance_from_route_meters INTEGER,
  opening_status TEXT CHECK (opening_status IN ('OPEN', 'CLOSED', 'OPEN_24_7', 'UNKNOWN')),
  opening_hours TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.route_safety_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own route safety points" ON route_safety_points
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM route_options
    JOIN journeys ON journeys.id = route_options.journey_id
    WHERE route_options.id = route_safety_points.route_option_id AND journeys.user_id = auth.uid()
  )
);

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_route_options_journey_id ON public.route_options(journey_id);
CREATE INDEX IF NOT EXISTS idx_route_safety_points_route_option_id ON public.route_safety_points(route_option_id);
CREATE INDEX IF NOT EXISTS idx_journeys_user_id ON public.journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_journey_id ON public.journey_events(journey_id);
CREATE INDEX IF NOT EXISTS idx_incidents_journey_id ON public.incidents(journey_id);
CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON public.incidents(user_id);

-- 5. Add real-time to new tables
ALTER PUBLICATION supabase_realtime ADD TABLE route_options;
ALTER PUBLICATION supabase_realtime ADD TABLE route_safety_points;
