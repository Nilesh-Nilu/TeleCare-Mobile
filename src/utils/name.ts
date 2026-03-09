type NamedEntity = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
};

interface DisplayNameOptions {
  doctorPrefix?: boolean;
  fallback?: string;
}

export const getDisplayName = (
  entity?: NamedEntity | null,
  options: DisplayNameOptions = {},
): string => {
  const { doctorPrefix = false, fallback = 'User' } = options;

  const firstName = (entity?.firstName || '').trim();
  const lastName = (entity?.lastName || '').trim();
  const combined = `${firstName} ${lastName}`.trim();
  const rawName = (entity?.name || '').trim();
  const emailName = (entity?.email || '')
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim();

  const resolved = combined || rawName || emailName || fallback;

  if (!doctorPrefix) return resolved;
  return /^dr\.?\s/i.test(resolved) ? resolved : `Dr. ${resolved}`;
};
