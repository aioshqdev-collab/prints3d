import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "prints3d_admin_session";
const SESSION_HOURS = 8;

function getAdminSecret() {
  return process.env.ADMIN_ACCESS_TOKEN ?? process.env.ADMIN_PASSWORD ?? process.env.ADMIN_TOKEN;
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function hasAdminSecret() {
  return Boolean(getAdminSecret());
}

export function validateAdminToken(token: string) {
  const secret = getAdminSecret();
  if (!secret) return false;
  return safeCompare(token, secret);
}

export async function createAdminSession() {
  const secret = getAdminSecret();
  if (!secret) throw new Error("Admin access token is not configured");

  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = `admin.${expiresAt}`;
  const value = `${payload}.${sign(payload, secret)}`;
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function verifyAdminSession() {
  const secret = getAdminSecret();
  if (!secret) return false;

  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return false;

  const [role, expiresAt, signature] = value.split(".");
  if (role !== "admin" || !expiresAt || !signature) return false;
  if (Number(expiresAt) < Date.now()) return false;

  const payload = `${role}.${expiresAt}`;
  return safeCompare(signature, sign(payload, secret));
}
