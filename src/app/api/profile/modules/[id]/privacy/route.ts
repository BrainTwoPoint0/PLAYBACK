// PUT /api/profile/modules/[id]/privacy — owner sets per-module visibility
//
// Writes `profile_module_privacies` for the variant. Owner-only — RLS on the
// table enforces auth.uid() == variant.profile.user_id, so the route mostly
// validates input shape and surfaces errors. Idempotent: upsert on PK.

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_VISIBILITIES = [
  'public',
  'authenticated',
  'club_only',
  'private',
] as const;
type Visibility = (typeof ALLOWED_VISIBILITIES)[number];

interface PutBody {
  visibility: Visibility;
  publicToOrgIds?: string[];
}

type RouteContext = { params: Promise<{ id: string }> };

function rejectCrossOrigin(request: NextRequest): NextResponse | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const allowed = new Set<string>();
  try {
    if (appUrl) allowed.add(new URL(appUrl).host);
    allowed.add(new URL(request.url).host);
  } catch {
    // ignore — fall through to the missing-Origin path below
  }
  // Origin header is reliable from browsers on mutating XHR; Referer can be
  // stripped by extensions/policies and isn't a trustworthy fallback.
  const originHeader = request.headers.get('origin');
  if (!originHeader) {
    return NextResponse.json(
      { error: 'Missing Origin header' },
      { status: 403 }
    );
  }
  let originHost: string | null = null;
  try {
    originHost = new URL(originHeader).host;
  } catch {
    return NextResponse.json({ error: 'Invalid Origin' }, { status: 403 });
  }
  if (!allowed.has(originHost)) {
    return NextResponse.json(
      { error: 'Cross-origin request not allowed' },
      { status: 403 }
    );
  }
  return null;
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const csrf = rejectCrossOrigin(request);
  if (csrf) return csrf;

  const { id: variantId } = await params;
  if (!UUID_RE.test(variantId)) {
    return NextResponse.json({ error: 'Invalid variant id' }, { status: 400 });
  }

  const ct = request.headers.get('content-type') ?? '';
  if (!ct.toLowerCase().startsWith('application/json')) {
    return NextResponse.json(
      { error: 'Content-Type must be application/json' },
      { status: 415 }
    );
  }

  let body: PutBody;
  try {
    const raw = await request.json();
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Body must be a JSON object');
    }
    body = raw as PutBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!ALLOWED_VISIBILITIES.includes(body.visibility)) {
    return NextResponse.json(
      { error: `visibility must be one of ${ALLOWED_VISIBILITIES.join(', ')}` },
      { status: 400 }
    );
  }
  // Only validate the orgs array when the caller actually sent it. The
  // earlier shape always defaulted to `[]` and wrote it through the
  // upsert, which silently zeroed an existing club allowlist any time
  // the user toggled `visibility` (the client only sends `{ visibility }`).
  let publicToOrgIds: string[] | undefined;
  if (body.publicToOrgIds !== undefined) {
    if (
      !Array.isArray(body.publicToOrgIds) ||
      body.publicToOrgIds.length > 50
    ) {
      return NextResponse.json(
        { error: 'publicToOrgIds must be an array of ≤50 UUIDs' },
        { status: 400 }
      );
    }
    for (const id of body.publicToOrgIds) {
      if (typeof id !== 'string' || !UUID_RE.test(id)) {
        return NextResponse.json(
          { error: 'publicToOrgIds must contain only UUIDs' },
          { status: 400 }
        );
      }
    }
    publicToOrgIds = body.publicToOrgIds;
  }

  // Domain rule: `public_to_org_ids` only carries meaning when visibility is
  // `club_only`. For any other visibility, accepting orgs would persist a
  // misleading scope (and risk privacy-downgrade artefacts surviving on
  // re-toggle). Reject the mismatch instead of silently dropping.
  if (
    publicToOrgIds !== undefined &&
    publicToOrgIds.length > 0 &&
    body.visibility !== 'club_only'
  ) {
    return NextResponse.json(
      { error: 'publicToOrgIds is only valid when visibility is club_only' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Defense-in-depth ownership check before relying solely on RLS WITH CHECK.
  // RLS is the ultimate gate but a missing UPDATE WITH CHECK in a future
  // migration could let an upsert overwrite someone else's row; this server
  // lookup makes that bug detectable instead of exploitable.
  const { data: ownership } = await (supabase as any)
    .from('profile_variants')
    .select('id, profile_id, profiles:profile_id(user_id)')
    .eq('id', variantId)
    .maybeSingle();
  if (!ownership) {
    return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
  }
  const ownerProfile = Array.isArray(ownership.profiles)
    ? ownership.profiles[0]
    : ownership.profiles;
  if (!ownerProfile || ownerProfile.user_id !== user.id) {
    return NextResponse.json(
      { error: 'Not authorized for this variant' },
      { status: 403 }
    );
  }

  // Verify the caller is actually a member of every org they're trying to
  // grant access to. Without this, "club_only" would be a privacy lie — a
  // user could persist arbitrary org UUIDs and the data would flow to
  // strangers' org members.
  if (publicToOrgIds !== undefined && publicToOrgIds.length > 0) {
    const { data: memberships, error: membershipError } = await (
      supabase as any
    )
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .in('organization_id', publicToOrgIds);
    if (membershipError) {
      console.error('membership lookup failed', membershipError);
      return NextResponse.json(
        { error: 'Failed to verify org membership' },
        { status: 500 }
      );
    }
    const memberOf = new Set<string>(
      ((memberships ?? []) as Array<{ organization_id: string }>).map(
        (m) => m.organization_id
      )
    );
    if (publicToOrgIds.some((id) => !memberOf.has(id))) {
      return NextResponse.json(
        {
          error:
            'publicToOrgIds includes one or more organizations you are not a member of',
        },
        { status: 403 }
      );
    }
  }

  // Only project columns the caller actually supplied. Two-call shape: a
  // toggle of just `visibility` (the common path) preserves the existing
  // `public_to_org_ids`; an explicit "set the orgs" call replaces them.
  const upsertPayload: Record<string, unknown> = {
    profile_variant_id: variantId,
    visibility: body.visibility,
  };
  if (publicToOrgIds !== undefined) {
    upsertPayload.public_to_org_ids = publicToOrgIds;
  }

  const { error } = await (supabase as any)
    .from('profile_module_privacies')
    .upsert(upsertPayload, { onConflict: 'profile_variant_id' });

  if (error) {
    // RLS denial surfaces here as a row-level violation; treat as 403.
    if ((error as any).code === '42501' || (error as any).code === 'PGRST301') {
      return NextResponse.json(
        { error: 'Not authorized for this variant' },
        { status: 403 }
      );
    }
    console.error('module-privacy upsert failed', error);
    return NextResponse.json(
      { error: 'Failed to save privacy' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, visibility: body.visibility });
}
