import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Revenue = {
  today: number;
  week: number;
  month: number;
};

export function useRevenue(businessId: string) {
  const [revenue, setRevenue] = useState<Revenue>({
    today: 0,
    week: 0,
    month: 0,
  });

  const [loading, setLoading] = useState(true);
const [weeks, setWeeks] = useState<number[]>([]);

 useEffect(() => {
  if (!businessId) return;
  fetchRevenue();
}, [businessId]);
async function fetchRevenue() {
  setLoading(true);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // 📅 semana (domingo até sábado)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const startWeekStr = startOfWeek.toISOString().split("T")[0];
  const endWeekStr = endOfWeek.toISOString().split("T")[0];

  // 📅 mês
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startMonthStr = startOfMonth.toISOString().split("T")[0];

  // 🚨 IMPORTANTE: coloque seu business_id aqui
  
  // 📊 DIA
  const { data: dayData } = await supabase
  .from("appointments")
  .select("price")
  .eq("business_id", businessId)
  .in("status", ["confirmed", "completed"])
  .gte("date", todayStr)
  .lte("date", todayStr);
 
 // 📊 SEMANA
  const { data: weekData } = await supabase
  .from("appointments")
  .select("price")
  .eq("business_id", businessId)
  .in("status", ["confirmed", "completed"])
  .gte("date", startWeekStr)
  .lte("date", endWeekStr);
  
// 📊 MÊS (até hoje, sem futuro)
 const { data: monthData } = await supabase
  .from("appointments")
  .select("price")
  .eq("business_id", businessId)
  .in("status", ["confirmed", "completed"])
  .gte("date", startMonthStr)
  .lte("date", todayStr);

  const sum = (arr: any[]) =>
    arr?.reduce((acc, item) => acc + (item.price || 0), 0) || 0;

  setRevenue({
    today: sum(dayData || []),
    week: sum(weekData || []),
    month: sum(monthData || []),
  });

// 📊 SEMANAS DO MÊS
const start = new Date(today.getFullYear(), today.getMonth(), 1);
const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

const weekTotals: number[] = [];

let current = new Date(start);

while (current <= end) {
  const weekStart = new Date(current);
  const weekEnd = new Date(current);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startStr = weekStart.toISOString().split("T")[0];
  const endStr = weekEnd.toISOString().split("T")[0];

  const { data } = await supabase
    .from("appointments")
    .select("price")
    .eq("business_id", businessId)
    .in("status", ["confirmed", "completed"])
    .gte("date", startStr)
    .lte("date", endStr);

  const total =
    data?.reduce((acc, item) => acc + (item.price || 0), 0) || 0;

  weekTotals.push(total);

  current.setDate(current.getDate() + 7);
}

setWeeks(weekTotals);

  setLoading(false);
}

  return { revenue, weeks, loading };
}