export function getPasswordStrength(password: string): {
  score: number; 
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Faible", color: "bg-red-500" },
    { label: "Moyen", color: "bg-yellow-500" },
    { label: "Bon", color: "bg-green-500" },
    { label: "Excellent", color: "bg-emerald-600" },
  ];

  return levels[score] ?? levels[0];
}
