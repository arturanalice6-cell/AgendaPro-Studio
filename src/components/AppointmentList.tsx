import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Phone, User, Clock, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';

type Appointment = Tables<'appointments'> & { services?: { name: string; duration_minutes: number } | null };

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  confirmed: { label: 'Confirmado', variant: 'default' },
  pending: { label: 'Pendente', variant: 'secondary' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

export default function AppointmentList({ businessId }: { businessId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    load();
  }, [businessId]);

  async function load() {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('business_id', businessId)
    .order('date', { ascending: true });
    setAppointments((data as Appointment[]) || []);
  }

  const cancel = async (id: string) => {
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    load();
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-heading font-bold text-foreground">Agendamentos</h2>
      {appointments.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhum agendamento ainda.</p>
      )}
      {appointments
  .filter((apt) => {
  if (apt.status === 'cancelled') return false; // 👈 ADICIONA ISSO
    if (!apt.date || !apt.time) return false;

    const now = new Date();

    const dateTime = new Date(`${apt.date}T${apt.time}`);
    const [h, m] = apt.time.split(':');

    dateTime.setHours(Number(h), Number(m), 0, 0);

    return dateTime >= now;
  })
  .map((apt) => (
        <Card key={apt.id} className="glass">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground text-sm">{apt.services?.name || 'Serviço'}</span>
              <Badge variant={STATUS_MAP[apt.status]?.variant}>{STATUS_MAP[apt.status]?.label}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{apt.client_name}</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{apt.client_whatsapp}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(parseISO(apt.date), "dd/MM/yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {apt.time?.substring(0, 5)}
                </span>
              </div>
              {apt.status !== 'cancelled' && (
                <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs" onClick={() => cancel(apt.id)}>
                  <X className="h-3 w-3 mr-1" /> Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
