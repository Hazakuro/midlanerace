import {cookies} from 'next/headers';

const COOKIE = 'midlane_admin';

export async function isAdmin() {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const store = await cookies();
  return store.get(COOKIE)?.value === expected;
}

export function adminCookieName() {
  return COOKIE;
}
