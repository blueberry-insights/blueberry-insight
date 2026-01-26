/**
 * Constantes centralisées de l'application
 * 
 * Évite les magic numbers/strings et facilite la maintenance.
 * Toutes les valeurs critiques sont définies ici.
 */

// ============================================================================
// STORAGE
// ============================================================================

export const STORAGE = {
  /** Bucket Supabase pour les vidéos du catalogue Blueberry */
  VIDEO_BUCKET: "blueberry-videos",
  
  /** Taille maximale d'une vidéo en bytes (200MB) */
  MAX_VIDEO_SIZE_BYTES: 200 * 1024 * 1024,
  
  /** Durée de vie des signed URLs de lecture vidéo (en secondes) */
  SIGNED_URL_READ_TTL_SECONDS: 60 * 5, // 5 minutes
} as const;

// ============================================================================
// VALIDATION
// ============================================================================

export const VALIDATION = {
  /** Nombre maximum de réponses dans une soumission de test */
  MAX_ANSWERS: 200,
  
  /** Longueur maximale d'une réponse texte (en caractères) */
  MAX_ANSWER_LENGTH: 4000,
  
  /** Longueur maximale d'un titre (en caractères) */
  MAX_TITLE_LENGTH: 200,
  
  /** Longueur maximale d'une description (en caractères) */
  MAX_DESCRIPTION_LENGTH: 1000,
} as const;

// ============================================================================
// RATE LIMITING
// ============================================================================

export const RATE_LIMIT = {
  GET: {
    max: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  POST: {
    max: 5,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;
