/**
 * Helpers pour les candidats
 */

/**
 * Extrait les initiales d'un nom complet
 * Ex: "John Doe" -> "JD", "Marie" -> "MA"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[1]![0]).toUpperCase();
}

/**
 * Retourne les classes CSS pour le statut d'un candidat
 */
export function getStatusClasses(status: string | null): string {
  switch (status) {
    case "new":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "screening":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "test":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "interview":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "offer":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "hired":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "archived":
      return "bg-slate-50 text-slate-600 border-slate-200";
    case "rejected":  
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

