/**
 * Rate limiting simple basé sur l'IP.
 * 
 * ⚠️ Solution basique en mémoire - pour la production, utiliser Redis/Upstash.
 * 
 * Limites :
 * - 10 requêtes par minute par IP pour GET
 * - 5 requêtes par minute par IP pour POST
 */

import { RATE_LIMIT } from "@/config/constants";

// Store en mémoire (sera perdu au redémarrage)
// En production, utiliser Redis ou Upstash
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: Request): string {
  // Vérifier les headers proxy (Vercel, Cloudflare, etc.)
  const headers = req.headers as Headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  
  // Fallback
  return "unknown";
}

export function isRateLimited(ip: string, method: "GET" | "POST"): boolean {
  const now = Date.now();
  const limit = RATE_LIMIT[method];
  const key = `${ip}:${method}`;
  
  const record = requestCounts.get(key);
  
  // Si pas de record ou fenêtre expirée, créer un nouveau
  if (!record || now > record.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + limit.windowMs });
    return false;
  }
  
  // Incrémenter le compteur
  record.count++;
  
  // Nettoyer les anciennes entrées (garbage collection simple)
  if (requestCounts.size > 10000) {
    for (const [k, v] of requestCounts.entries()) {
      if (now > v.resetAt) {
        requestCounts.delete(k);
      }
    }
  }
  
  return record.count > limit.max;
}

export function createRateLimitResponse(method: "GET" | "POST") {
  const limit = RATE_LIMIT[method];
  return new Response(
    JSON.stringify({
      ok: false,
      error: "Trop de requêtes. Veuillez réessayer dans quelques instants.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
        "X-RateLimit-Limit": String(limit.max),
        "X-RateLimit-Window": String(limit.windowMs / 1000),
      },
    }
  );
}
