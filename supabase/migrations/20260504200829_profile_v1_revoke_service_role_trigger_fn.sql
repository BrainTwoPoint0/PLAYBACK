-- Defense-in-depth: revoke service_role's EXECUTE on the SECURITY DEFINER
-- trigger function. Trigger firing happens under table-owner privileges and
-- is unaffected; this only closes the RPC-callability door for service_role.
REVOKE EXECUTE ON FUNCTION public.derive_clip_attributions_from_jersey_map() FROM service_role;
