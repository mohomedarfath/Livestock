create or replace function public.rename_organization(
  target_organization_id uuid,
  org_name text,
  org_slug text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_name text := btrim(org_name);
  normalized_slug text := coalesce(nullif(btrim(org_slug), ''), regexp_replace(lower(btrim(org_name)), '[^a-z0-9]+', '-', 'g'));
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if normalized_name is null or normalized_name = '' then
    raise exception 'Organization name is required';
  end if;

  normalized_slug := regexp_replace(normalized_slug, '^-+|-+$', '', 'g');

  if normalized_slug = '' then
    normalized_slug := 'workspace';
  end if;

  if not exists (
    select 1
    from public.memberships
    where organization_id = target_organization_id
      and user_id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Only organization admins can rename a workspace';
  end if;

  if exists (
    select 1
    from public.organizations
    where slug = normalized_slug
      and id <> target_organization_id
  ) then
    raise exception 'Workspace slug already exists';
  end if;

  update public.organizations
  set
    name = normalized_name,
    slug = normalized_slug
  where id = target_organization_id;

  if not found then
    raise exception 'Organization not found';
  end if;
end;
$$;

grant execute on function public.rename_organization(uuid, text, text) to authenticated;
