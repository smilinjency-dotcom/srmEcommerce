/**
 * lib/razorpay.ts
 *
 * Server-only Razorpay SDK singleton.
 *
 * ⚠️  NEVER import this file in Client Components or any `"use client"` module.
 *     RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are server-only env variables
 *     — they must NOT be prefixed with NEXT_PUBLIC_.
 */

import Razorpay from "razorpay";

const keyId     = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error(
    "Missing Razorpay environment variables. " +
    "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local (server-only, no NEXT_PUBLIC_ prefix)."
  );
}

/**
 * Singleton Razorpay instance — re-used across hot reloads in development.
 * All methods are async and safe to call from Route Handlers / Server Actions.
 */
const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

export default razorpay;
