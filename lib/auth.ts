// lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const secretKey = process.env.JWT_SECRET;
if (!secretKey && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET authentication key is missing in production environment.');
}
const finalKey = secretKey || "default_secret_dont_use_in_prod";
const key = new TextEncoder().encode(finalKey);

/**
 * Encrypts a payload into a JWT.
 * @param payload - Data to encrypt.
 * @returns JSON Web Token string.
 */
export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h") // Session lasts 24 hours
    .sign(key);
}

/**
 * Decrypts a JWT into its original payload.
 * @param input - The JWT string to decrypt.
 * @returns The decoded payload or null if verification fails.
 */
export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Log in as an admin.
 * Creates a session cookie with admin role.
 */
export async function login() {
  // Create the session
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const session = await encrypt({ role: "admin", expires });

  // Set the cookie
  (await cookies()).set("admin_session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Log out the current admin.
 * Invalidates the admin session cookie.
 */
export async function logout() {
  // Destroy the session
  (await cookies()).set("admin_session", "", { expires: new Date(0) });
}

/**
 * Retrieve the current admin session.
 * @returns The decrypted session payload or null if not authenticated.
 */
export async function getSession() {
  const session = (await cookies()).get("admin_session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

// --- Customer Auth Functions ---

/**
 * Log in a customer.
 * Creates a session cookie with customer details throughout the app.
 * @param customer - The customer object from ERP.
 */
export async function loginCustomer(customer: any) {
  // Create the session
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days for customers
  const session = await encrypt({
    customerId: customer.name, // ERPNext ID is often the 'name' field
    customerName: customer.customer_name,
    phone: customer.mobile_no || customer.phone,
    role: "customer",
    expires
  });

  // Set the cookie
  (await cookies()).set("customer_session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Log out the current customer.
 * Invalidates the customer session cookie.
 */
export async function logoutCustomer() {
  (await cookies()).set("customer_session", "", { expires: new Date(0) });
}

/**
 * Retrieve the current customer session.
 * @returns The decrypted customer session payload or null.
 */
export async function getCustomerSession() {
  const session = (await cookies()).get("customer_session")?.value;
  if (!session) return null;
  return await decrypt(session);
}