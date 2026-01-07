/**
 * Types génériques pour les résultats d'actions
 * Utilisés pour standardiser les retours des Server Actions
 */

export type ActionResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: string };

export type ActionResultWithCode<T> = 
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

/**
 * Helper pour créer un résultat de succès
 */
export function actionSuccess<T>(data: T): { ok: true; data: T } {
  return { ok: true, data };
}

/**
 * Helper pour créer un résultat d'erreur
 */
export function actionError(error: string, code?: string): { ok: false; error: string; code?: string } {
  return { ok: false, error, ...(code ? { code } : {}) };
}
