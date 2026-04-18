import { useRevenue } from "@/hooks/useRevenue";

export function RevenueCards({ businessId }: { businessId: string }) {
  const { revenue, loading } = useRevenue(businessId);

  if (loading) {
    return <p>Carregando faturamento...</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      <div className="bg-white p-4 rounded-2xl shadow">
        <p className="text-sm text-gray-500">Hoje</p>
        <h2 className="text-2xl font-bold text-green-600">
          R$ {revenue.today.toFixed(2)}
        </h2>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow">
        <p className="text-sm text-gray-500">Semana</p>
        <h2 className="text-2xl font-bold text-blue-600">
          R$ {revenue.week.toFixed(2)}
        </h2>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow">
        <p className="text-sm text-gray-500">Mês</p>
        <h2 className="text-2xl font-bold text-purple-600">
          R$ {revenue.month.toFixed(2)}
        </h2>
      </div>

    </div>
  );
}