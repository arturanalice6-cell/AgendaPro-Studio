import { useRevenue } from "@/hooks/useRevenue";
import { useState } from "react";

export function RevenueCards({ businessId }: { businessId: string }) {
  const { revenue, weeks, loading } = useRevenue(businessId);
const [open, setOpen] = useState(false);

  if (loading) {
    return <p>Carregando faturamento...</p>;
  }

 return (
  <>
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

      <div
        className="bg-white p-4 rounded-2xl shadow cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <p className="text-sm text-gray-500">Mês</p>
        <h2 className="text-2xl font-bold text-purple-600">
          R$ {revenue.month.toFixed(2)}
        </h2>
      </div>

    </div>

    {/* 👇 MODAL AQUI */}
    {open && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white text-black p-4 rounded-2xl w-[90%] max-w-sm">

          <h2 className="text-lg font-bold mb-3 text-black">Semanas do mês</h2>

          {weeks.map((w, i) => (
            <p key={i} className="text-sm mb-1 text-black">
              Semana {i + 1}: <strong>R$ {w.toFixed(2)}</strong>
            </p>
          ))}

          <button
            className="mt-4 w-full bg-black text-white p-2 rounded-lg"
            onClick={() => setOpen(false)}
          >
            Fechar
          </button>
        </div>
      </div>
    )}
  </>
);
}