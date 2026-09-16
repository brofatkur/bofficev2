-- Authenticated users may read only their own role through the existing
-- user_roles_self_select RLS policy. This grant is required for middleware
-- routing and the customer/partner portals.
GRANT SELECT ON TABLE public.user_roles TO authenticated;
