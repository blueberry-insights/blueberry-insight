/**
 * Helper pour parser FormData de manière cohérente et type-safe
 * 
 * Réduit la duplication dans les mapInput des Server Actions.
 * 
 * @example
 * ```ts
 * mapInput: (formData, ctx) => ({
 *   orgId: ctx.orgId,
 *   title: getString(formData, "title"), // string obligatoire
 *   description: getStringOrNull(formData, "description"), // string optionnelle
 *   isRemote: getBoolean(formData, "isRemote"), // boolean
 *   salaryMin: getNumberOrNull(formData, "salaryMin"), // number optionnel
 *   tags: getStringArray(formData, "tags"), // array de strings (split par virgule)
 * })
 * ```
 */

/**
 * Récupère une string obligatoire depuis FormData
 * Retourne une string vide si la valeur est absente
 */
export function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return value ? String(value) : "";
}

/**
 * Récupère une string obligatoire avec trim automatique
 * Retourne une string vide si la valeur est absente
 */
export function getStringTrimmed(formData: FormData, key: string): string {
  return getString(formData, key).trim();
}

/**
 * Récupère une string optionnelle depuis FormData
 * Retourne null si la valeur est absente ou vide
 */
export function getStringOrNull(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (!value) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

/**
 * Récupère une string optionnelle qui peut être undefined
 * Utile pour les champs qui ne doivent pas être envoyés si vides
 */
export function getStringOrUndefined(formData: FormData, key: string): string | undefined {
  const value = getStringOrNull(formData, key);
  return value ?? undefined;
}

/**
 * Récupère un nombre depuis FormData
 * Retourne 0 si la valeur est absente ou invalide
 */
export function getNumber(formData: FormData, key: string): number {
  const value = formData.get(key);
  if (!value) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Récupère un nombre optionnel depuis FormData
 * Retourne null si la valeur est absente ou invalide
 */
export function getNumberOrNull(formData: FormData, key: string): number | null {
  const value = formData.get(key);
  if (!value) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/**
 * Récupère un boolean depuis FormData
 * Retourne true si la valeur est "true", false sinon
 */
export function getBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "true";
}

/**
 * Récupère un array de strings depuis FormData
 * Split par virgule, trim chaque élément, filtre les vides
 * 
 * @example
 * getStringArray(formData, "tags") // "tag1, tag2, tag3" => ["tag1", "tag2", "tag3"]
 */
export function getStringArray(formData: FormData, key: string): string[] {
  const value = getStringTrimmed(formData, key);
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Récupère une valeur typée depuis FormData (pour les enums)
 * Retourne undefined si la valeur est absente
 */
export function getTypedOrUndefined<T extends string>(
  formData: FormData,
  key: string
): T | undefined {
  const value = formData.get(key);
  return value ? (String(value) as T) : undefined;
}
