REVOKE EXECUTE ON FUNCTION public.owns_player(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_player(UUID) TO authenticated;