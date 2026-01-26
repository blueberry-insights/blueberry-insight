/**
 * Système de logging sécurisé et structuré
 * 
 * ✅ Sécurité :
 * - Masque les données sensibles (emails, tokens, passwords, IDs)
 * - Sanitize les stack traces en production
 * - Structure les logs pour faciliter le debugging
 * 
 * ✅ Pérenne :
 * - Prêt pour migration vers un service externe (Sentry, LogRocket, etc.)
 * - Supporte différents niveaux de log
 * - Format JSON structuré pour parsing
 */

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = {
  action?: string;
  userId?: string;
  orgId?: string;
  [key: string]: unknown;
};

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Masque les données sensibles dans les valeurs
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value !== "string") return value;

  // Masque les emails (garde seulement le domaine si besoin)
  if (value.includes("@") && value.includes(".")) {
    const [local, domain] = value.split("@");
    return `${local.slice(0, 2)}***@${domain}`;
  }

  // Masque les tokens (UUIDs, JWT, etc.)
  if (
    value.length > 20 &&
    (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ||
     value.match(/^eyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\./))
  ) {
    return `${value.slice(0, 8)}***${value.slice(-4)}`;
  }

  // Masque les passwords (mots-clés suspects)
  if (
    value.toLowerCase().includes("password") ||
    value.toLowerCase().includes("secret") ||
    value.toLowerCase().includes("token")
  ) {
    return "***REDACTED***";
  }

  return value;
}

/**
 * Sanitize un objet récursivement
 */
function sanitizeObject(obj: unknown, depth = 0): unknown {
  if (depth > 5) return "[MAX_DEPTH]"; // Évite la récursion infinie

  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return sanitizeValue(obj);
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Masque les clés sensibles
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("password") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("token") ||
      lowerKey.includes("key") ||
      lowerKey === "authorization" ||
      lowerKey === "cookie"
    ) {
      sanitized[key] = "***REDACTED***";
    } else {
      sanitized[key] = sanitizeObject(value, depth + 1);
    }
  }
  return sanitized;
}

/**
 * Extrait un message d'erreur sécurisé (sans stack trace en prod)
 */
function extractSafeError(err: unknown): {
  message: string;
  name?: string;
  code?: string;
  stack?: string;
} {
  if (err instanceof Error) {
    return {
      message: err.message,
      name: err.name,
      code: (err as Error & { code?: string }).code,
      stack: isDevelopment ? err.stack : undefined,
    };
  }
  return {
    message: String(err),
  };
}

/**
 * Formate un log structuré
 */
function formatLog(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
): string {
  const sanitizedContext = context
    ? (sanitizeObject(context) as Record<string, unknown>)
    : {};
  const errorData = error ? { error: extractSafeError(error) } : {};
  const logEntry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitizedContext,
    ...errorData,
  };

  // En dev, format lisible
  if (isDevelopment) {
    return JSON.stringify(logEntry, null, 2);
  }

  // En prod, format compact (JSON one-line pour parsing)
  return JSON.stringify(logEntry);
}

/**
 * Logger de base avec niveaux
 */
class Logger {
  private context: LogContext = {};

  /**
   * Ajoute un contexte permanent au logger
   */
  withContext(context: LogContext): Logger {
    const newLogger = new Logger();
    newLogger.context = { ...this.context, ...context };
    return newLogger;
  }

  /**
   * Log de debug (dev uniquement)
   */
  debug(message: string, context?: LogContext): void {
    if (isDevelopment) {
      console.debug(formatLog("debug", message, { ...this.context, ...context }));
    }
  }

  /**
   * Log d'information
   */
  info(message: string, context?: LogContext): void {
    console.info(formatLog("info", message, { ...this.context, ...context }));
  }

  /**
   * Log d'avertissement
   */
  warn(message: string, context?: LogContext, error?: unknown): void {
    console.warn(formatLog("warn", message, { ...this.context, ...context }, error));
  }

  /**
   * Log d'erreur
   */
  error(message: string, context?: LogContext, error?: unknown): void {
    console.error(formatLog("error", message, { ...this.context, ...context }, error));
  }
}

/**
 * Logger par défaut (singleton)
 */
export const logger = new Logger();

/**
 * Helper pour créer un logger avec contexte d'action
 * 
 * @example
 * ```ts
 * const log = createActionLogger("createOfferAction", { userId: ctx.userId });
 * log.error("Erreur lors de la création", { offerId }, err);
 * ```
 */
export function createActionLogger(
  actionName: string,
  baseContext?: LogContext
): Logger {
  return logger.withContext({
    action: actionName,
    ...baseContext,
  });
}

/**
 * Helper pour logger une erreur d'action de manière standardisée
 * 
 * @example
 * ```ts
 * logActionError("createOfferAction", err, { userId: ctx.userId, offerId });
 * ```
 */
export function logActionError(
  actionName: string,
  error: unknown,
  context?: LogContext
): void {
  logger.error(`[${actionName}] error`, { action: actionName, ...context }, error);
}
