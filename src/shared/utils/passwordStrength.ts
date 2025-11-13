
export function getPasswordStrength(password: string): {
  score: number; // 0..3
  label: string;
  color: string; // classes tailwind
} {
  let score = 0;
  if (password.length >= 8) score++;                               // longueur
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;    // minuscules + majuscules
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++; // chiffres + symbole

  const levels = [
    { label: "Très faible", color: "bg-red-500" },
    { label: "Faible",      color: "bg-orange-500" },
    { label: "Moyen",       color: "bg-yellow-500" },
    { label: "Bon",         color: "bg-green-600" },
  ] as const;

  return { score, ...levels[score] };
}
