import { useRevenue } from "@/hooks/useRevenue";

export function RevenueCardsWeeks({ businessId }: { businessId: string }) {
  const { weeks, loading } = useRevenue(businessId);

  if (loading) {
    return <p>Carregando semanas...</p>;
  }

  return (
    <div className="bg-white p-4 rounded-2xl shadow mt-4 text-black">
      <p className="text-sm text-gray-700 mb-2">Semanas do mês</p>

      {weeks.map((w, i) => (
        <p key={i} className="text-sm text-black">
          Semana {i + 1}: <strong>R$ {w.toFixed(2)}</strong>
        </p>
      ))}
    </div>
  );
}