import "server-only";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "pm_sales_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

export type SessionPayload = {
  staffId: string;
  username: string;
  role: "viewer" | "operator" | "mapping_reviewer" | "administrator";
  mustChangePassword: boolean;
};

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET env var");
  }
  return new TextEncoder().encode(secret);
}

/** Signs the session payload into a compact JWT for the HttpOnly cookie. */
export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

/**
 * Verifies the cookie's JWT and returns the session payload, or null if
 * missing/expired/tampered. Every server route/action must call this itself —
 * never trust a payload handed in from the client.
 */
export async function verifySessionToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
