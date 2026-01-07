
export type FileValidationError =
  | { type: "FILE_TOO_LARGE"; maxSizeMB: number; actualSizeMB: number }
  | { type: "INVALID_MIME_TYPE"; allowed: string[]; actual: string }
  | { type: "INVALID_EXTENSION"; allowed: string[]; actual: string }
  | { type: "FILE_CORRUPTED" };

export type FileValidationResult =
  | { ok: true }
  | { ok: false; error: FileValidationError };


const CV_VALIDATION_CONFIG = {
  maxSizeBytes: 10 * 1024 * 1024, // 10 MB
  allowedMimeTypes: ["application/pdf"],
  allowedExtensions: [".pdf"],
} as const;

/**
 * Valide un fichier CV selon les règles de sécurité
 * 
 * @param file 
 * @returns 
 */
export function validateCvFile(file: File): FileValidationResult {
 
  if (file.size > CV_VALIDATION_CONFIG.maxSizeBytes) {
    return {
      ok: false,
      error: {
        type: "FILE_TOO_LARGE",
        maxSizeMB: CV_VALIDATION_CONFIG.maxSizeBytes / (1024 * 1024),
        actualSizeMB: file.size / (1024 * 1024),
      },
    };
  }

  // 2. Validation du type MIME
  const mimeType = file.type || "";
  if (!CV_VALIDATION_CONFIG.allowedMimeTypes.includes(mimeType as "application/pdf")) {
    return {
      ok: false,
      error: {
        type: "INVALID_MIME_TYPE",
        allowed: [...CV_VALIDATION_CONFIG.allowedMimeTypes],
        actual: mimeType || "inconnu",
      },
    };
  }

  // 3. Validation de l'extension
  const fileName = file.name.toLowerCase();
  const extension = fileName.includes(".")
    ? fileName.substring(fileName.lastIndexOf("."))
    : "";
  
  if (!CV_VALIDATION_CONFIG.allowedExtensions.includes(extension as ".pdf")) {
    return {
      ok: false,
      error: {
        type: "INVALID_EXTENSION",
        allowed: [...CV_VALIDATION_CONFIG.allowedExtensions],
        actual: extension || "aucune",
      },
    };
  }

  // 4. Validation que le fichier n'est pas vide
  if (file.size === 0) {
    return {
      ok: false,
      error: { type: "FILE_CORRUPTED" },
    };
  }

  return { ok: true };
}

export function getFileValidationErrorMessage(error: FileValidationError): string {
  switch (error.type) {
    case "FILE_TOO_LARGE":
      return `Le fichier est trop volumineux (${error.actualSizeMB.toFixed(1)} MB). Taille maximum autorisée : ${error.maxSizeMB} MB.`;
    case "INVALID_MIME_TYPE":
      return `Type de fichier non autorisé (${error.actual}). Seuls les fichiers PDF sont acceptés.`;
    case "INVALID_EXTENSION":
      return `Extension de fichier non autorisée (${error.actual}). Seuls les fichiers .pdf sont acceptés.`;
    case "FILE_CORRUPTED":
      return "Le fichier semble être corrompu ou vide.";
  }
}
