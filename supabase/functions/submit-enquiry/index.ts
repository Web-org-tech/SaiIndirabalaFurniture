// ==============================================================================
// SAI INDIRABALA FURNITURE & INTERIORS
// Supabase Edge Function: submit-enquiry
// Runtime: Deno (TypeScript)
// Security: Server-side validation, CORS, Honeypot, Rate Limiting & RLS Protection
// Domain: https://saiindirabala.in/
// ==============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── 01. ALLOWED ORIGINS & CORS ────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://saiindirabala.in",
  "https://www.saiindirabala.in",
  "https://sai-indirabala-furniture.vercel.app",
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : "https://saiindirabala.in";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json"
  };
}

// ── 02. IN-MEMORY SLIDING RATE LIMITER ─────────────────────────────────────────
// Limits submissions to a maximum of 5 requests per 10-minute window per IP.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean expired records periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  record.count += 1;
  return false;
}

// ── 03. VALID SERVICE TYPES ───────────────────────────────────────────────────
const VALID_SERVICE_TYPES = new Set([
  "office-arrangement",
  "home-furniture",
  "institution-furniture",
  "modular-workstation",
  "readymade-showroom",
  "complete-interior"
]);

// ── 04. EDGE FUNCTION REQUEST HANDLER ─────────────────────────────────────────
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Reject unsupported HTTP methods
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed. Use POST." }),
      { status: 405, headers: corsHeaders }
    );
  }

  // Extract client IP for security and rate limiting
  const clientIp = (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );

  // Apply Rate Limiting
  if (clientIp !== "unknown" && isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Too many consultation requests. Please wait a few minutes or call us directly at +91 74184 94994."
      }),
      { status: 429, headers: corsHeaders }
    );
  }

  // Parse JSON Body
  let body: any;
  try {
    body = await req.json();
  } catch (_) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON request payload." }),
      { status: 400, headers: corsHeaders }
    );
  }

  // ── 05. HONEYPOT BOT DETECTION ──────────────────────────────────────────────
  // If a bot fills out the hidden honeypot field, drop silently with fake success
  if (body.website_hp || body.hp_field || body.honeypot) {
    console.warn(`[Bot Detected] Honeypot triggered from IP: ${clientIp}`);
    return new Response(
      JSON.stringify({ success: true, message: "Enquiry received successfully." }),
      { status: 200, headers: corsHeaders }
    );
  }

  // ── 06. SERVER-SIDE FIELD VALIDATION & NORMALIZATION ────────────────────────
  const rawName = String(body.name || body.customer_name || "").trim();
  const rawPhone = String(body.phone || "").replace(/[\s\-\(\)]/g, "").trim();
  const rawEmail = body.email ? String(body.email).trim() : null;
  const rawService = String(body.service_type || body.projectType || "").trim();
  const rawMessage = body.message ? String(body.message).trim() : null;

  // Validate Name (2 to 100 characters)
  if (!rawName || rawName.length < 2 || rawName.length > 100) {
    return new Response(
      JSON.stringify({ success: false, error: "Please enter your full name (minimum 2 characters)." }),
      { status: 422, headers: corsHeaders }
    );
  }

  // Validate Phone (10 to 15 digits standard phone format)
  const phoneRegex = /^[0-9+]{10,15}$/;
  if (!rawPhone || !phoneRegex.test(rawPhone)) {
    return new Response(
      JSON.stringify({ success: false, error: "Please enter a valid 10-digit phone number." }),
      { status: 422, headers: corsHeaders }
    );
  }

  // Validate Email (Optional, but if present must be valid)
  if (rawEmail) {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(rawEmail) || rawEmail.length > 150) {
      return new Response(
        JSON.stringify({ success: false, error: "Please enter a valid email address." }),
        { status: 422, headers: corsHeaders }
      );
    }
  }

  // Validate Service Type against allowed options
  if (!rawService || !VALID_SERVICE_TYPES.has(rawService)) {
    return new Response(
      JSON.stringify({ success: false, error: "Please select a valid service or furniture requirement." }),
      { status: 422, headers: corsHeaders }
    );
  }

  // Validate Message Length (Max 2000 characters)
  if (rawMessage && rawMessage.length > 2000) {
    return new Response(
      JSON.stringify({ success: false, error: "Project description exceeds maximum length of 2,000 characters." }),
      { status: 422, headers: corsHeaders }
    );
  }

  // ── 07. SUPABASE DATABASE INSERTION (SERVICE ROLE) ──────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[Configuration Error] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in Edge Function environment.");
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server configuration error. Please call +91 74184 94994 for immediate assistance."
      }),
      { status: 500, headers: corsHeaders }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  // Insert validated record into public.enquiries table
  const { error: insertError } = await supabase
    .from("enquiries")
    .insert([
      {
        customer_name: rawName,
        phone: rawPhone,
        email: rawEmail,
        service_type: rawService,
        message: rawMessage,
        status: "new", // FORCED TO 'new'
        user_agent: req.headers.get("user-agent") || null,
        created_at: new Date().toISOString()
      }
    ]);

  if (insertError) {
    console.error("[Database Insert Error]:", insertError.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Unable to save your inquiry. Please call us directly at +91 74184 94994."
      }),
      { status: 500, headers: corsHeaders }
    );
  }

  // ── 08. SAFE SUCCESS RESPONSE ───────────────────────────────────────────────
  // Strictly returns a generic confirmation message; never leaks customer data.
  return new Response(
    JSON.stringify({
      success: true,
      message: `Thank you, ${rawName}. Your consultation request has been received. Our team will contact you shortly.`
    }),
    { status: 200, headers: corsHeaders }
  );
});
