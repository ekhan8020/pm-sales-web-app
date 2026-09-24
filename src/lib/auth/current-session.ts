import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

/**
 * Reads and verifies the session cookie for the current request. This is the
 * ONLY source of truth for "who is calling" anywhere in the app — API routes
 * and server actions must call this themselves and never accept an actor
 * id/role from the request body.
 */
export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
