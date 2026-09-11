/**
 * Canonical permission slug derivation — the single source of truth for
 * translating a stored (resource, action) pair into the dotted
 * `<module>.<action>` convention (e.g. "read:users" → "users.view").
 *
 * Kept as one function so JWT encoding, guard normalization and seed backfills
 * cannot drift apart.
 */
export function permissionActionToSlug(action: string): string {
    return action === 'read' ? 'view' : action;
}

export function permissionSlug(resource: string, action: string): string {
    const moduleKey = resource.replace(/-/g, '_');
    return `${moduleKey}.${permissionActionToSlug(action)}`;
}

/**
 * Normalize a user-supplied permission string to its canonical dotted form.
 * Accepts both the legacy "action:resource" and the dotted "module.action".
 */
export function normalizePermissionToDot(value: string): string {
    if (value.includes('.')) return value; // already canonical
    if (value.includes(':')) {
        const [action, resource] = value.split(':');
        return permissionSlug(resource ?? '', action ?? '');
    }
    return value;
}