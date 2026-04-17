import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

interface Schedule {
  id?: string;
  day_of_week: number;
  start_time: string;
end_time: string;

start_time_2?: string;
end_time_2?: string;
  is_active: boolean;
}

export default function ScheduleManager({ businessId }: { businessId: string }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, [businessId]);

  async function loadSchedules() {
    const { data } = await supabase
      .from('work_schedules')
      .select('*')
      .eq('business_id', businessId)
      .order('day_of_week');

    const existing = data || [];
    const full = DAYS.map((_, i) => {
      const found = existing.find(s => s.day_of_week === i);
      return found || { day_of_week: i, start_time: '08:00', end_time: '18:00', is_active: i > 0 && i < 6 };
    });
    setSchedules(full);
  }

  const update = (idx: number, field: string, value: any) => {
    setSchedules(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const save = async () => {
    setSaving(true);
    try {
      for (const s of schedules) {
        if (s.id) {
         await supabase.from('work_schedules').update({
  start_time: s.start_time,
  end_time: s.end_time,
  start_time_2: s.start_time_2,
  end_time_2: s.end_time_2,
  is_active: s.is_active,
}).eq('id', s.id);
        } else {
        await supabase.from('work_schedules').insert({
  business_id: businessId,
  day_of_week: s.day_of_week,
  start_time: s.start_time,
  end_time: s.end_time,
  start_time_2: s.start_time_2,
  end_time_2: s.end_time_2,
  is_active: s.is_active,
});
        }
      }
      toast.success('Horários salvos!');
      loadSchedules();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-bold text-foreground">Horários de Trabalho</h2>
        <Button size="sm" onClick={save} disabled={saving} className="gradient-primary">
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      {schedules.map((s, i) => (
        <Card key={i} className={`glass ${!s.is_active ? 'opacity-50' : ''}`}>
         <CardContent className="p-3 flex flex-col gap-2">

  {/* PRIMEIRO HORÁRIO */}
  <div className="flex items-center gap-3">
    <Switch checked={s.is_active} onCheckedChange={v => update(i, 'is_active', v)} />

    <span className="text-sm font-medium text-foreground w-20">
      {DAYS[s.day_of_week]}
    </span>

    <Input
      type="time"
      value={s.start_time.substring(0, 5)}
      onChange={e => update(i, 'start_time', e.target.value)}
      className="w-24 text-xs"
      disabled={!s.is_active}
    />

    <span className="text-muted-foreground text-xs">até</span>

    <Input
      type="time"
      value={s.end_time.substring(0, 5)}
      onChange={e => update(i, 'end_time', e.target.value)}
      className="w-24 text-xs"
      disabled={!s.is_active}
    />
  </div>

  {/* SEGUNDO HORÁRIO */}
  <div className="flex items-center gap-3 ml-10">
    <Input
      type="time"
      value={s.start_time_2?.substring(0, 5) || ''}
      onChange={e => update(i, 'start_time_2', e.target.value)}
      className="w-24 text-xs"
      disabled={!s.is_active}
    />

    <span className="text-muted-foreground text-xs">até</span>

    <Input
      type="time"
      value={s.end_time_2?.substring(0, 5) || ''}
      onChange={e => update(i, 'end_time_2', e.target.value)}
      className="w-24 text-xs"
      disabled={!s.is_active}
    />
  </div>

</CardContent>
        </Card>
      ))}
    </div>
  );
}
