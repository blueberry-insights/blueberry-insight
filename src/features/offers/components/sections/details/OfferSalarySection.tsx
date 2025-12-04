import type { Offer } from "@/core/models/Offer";

type Props = {
  offer: Offer;
};

export function OfferSalarySection({ offer }: Props) {
  const hasSalaryInfo = offer.salaryMin || offer.salaryMax || offer.currency;

  if (!hasSalaryInfo) {
    return null;
  }

  const formatSalary = (amount: number | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat("fr-FR").format(amount);
  };

  const salaryMin = formatSalary(offer.salaryMin);
  const salaryMax = formatSalary(offer.salaryMax);
  const currency = offer.currency ?? "EUR";

  let salaryDisplay = "Non précisé";
  if (salaryMin && salaryMax) {
    salaryDisplay = `${salaryMin} - ${salaryMax} ${currency}`;
  } else if (salaryMin) {
    salaryDisplay = `À partir de ${salaryMin} ${currency}`;
  } else if (salaryMax) {
    salaryDisplay = `Jusqu'à ${salaryMax} ${currency}`;
  }

  return (
    <section className="rounded-xl border bg-white px-5 py-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">
        Rémunération
      </h2>
      <p className="text-sm text-slate-700">{salaryDisplay}</p>
    </section>
  );
}
