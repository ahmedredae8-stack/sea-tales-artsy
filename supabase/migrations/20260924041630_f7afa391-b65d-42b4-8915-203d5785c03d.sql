GRANT INSERT, UPDATE ON public.fleet_layout TO anon;

DROP POLICY IF EXISTS "fleet_layout_insert" ON public.fleet_layout;
DROP POLICY IF EXISTS "fleet_layout_update" ON public.fleet_layout;

CREATE POLICY "fleet_layout_insert" ON public.fleet_layout FOR INSERT TO anon, authenticated WITH CHECK (id = 'default');
CREATE POLICY "fleet_layout_update" ON public.fleet_layout FOR UPDATE TO anon, authenticated USING (id = 'default') WITH CHECK (id = 'default');