console.log("ARQUIVO PUBLICBOOKING CARREGADO");

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CalendarCheck, Clock, DollarSign, MapPin, Check } from 'lucide-react';
import { format, addMinutes, parse, isAfter, isBefore, startOfToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Business = Tables<'businesses'>;
type Service = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
};

export default function PublicBookingPage() {
  const { id } = useParams<{ id: string }>();
console.log("PARAM ID:", id);
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<
  { time: string; available: boolean }[]
>([]);
const [loadingSlots, setLoadingSlots] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(true);
console.log("DEBUG STATE:", {
  selectedService,
  selectedDate,
  selectedTime
});

 useEffect(() => {
 console.log("USE EFFECT DISPAROU, ID:", id);
  if (id) loadBusiness();
}, [id]);

  async function loadBusiness() {
    const { data: biz } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id!)
      .maybeSingle();
  console.log("BUSINESS QUERY RESULT:", biz); 


    if (!biz) { setLoading(false); return; }
    setBusiness(biz);

const { data: svcs } = await supabase
  .from('services')
  .select('id, name, price, duration_minutes')
  .eq('business_id', biz.id)
  .order('name');

console.log("SERVICES COMPLETO:", svcs);

setServices(svcs || []);

    const { data: scheds } = await supabase
      .from('work_schedules')
      .select('*')
      .eq('business_id', biz.id);
    setSchedules(scheds || []);
    setLoading(false);
  }

  useEffect(() => {
  if (selectedDate && selectedService && business) {
    setAvailableSlots([]); // 👈 ADICIONA AQUI
    setSelectedTime(null); // já tinha
    computeSlots();
  }
}, [selectedDate, selectedService]);

 async function computeSlots() {
  if (!selectedDate || !selectedService || !business) return;

  setLoadingSlots(true);

    const dayOfWeek = selectedDate.getDay();
   console.log("DIA JS:", dayOfWeek);
console.log("SCHEDULES:", schedules);

 const schedule = schedules.find(s => s.day_of_week === dayOfWeek && s.is_active);

console.log("SCHEDULE ENCONTRADO:", schedule);

    if (!schedule) { setAvailableSlots([]); return; }

    // Get existing appointments for this date
   const { data: existing } = await supabase
  .from('appointments')
  .select('time, service_id, status')
  .eq('business_id', business.id) // 👈 ADICIONA ESSA LINHA
  .eq('date', format(selectedDate, 'yyyy-MM-dd'));

console.log("DATA SELECIONADA:", format(selectedDate, 'yyyy-MM-dd'));
console.log("AGENDAMENTOS DO DIA:", existing);
  console.log("EXISTING APPOINTMENTS:", existing);

    const start = parse(schedule.start_time.substring(0, 5), 'HH:mm', selectedDate);
    const end = parse(schedule.end_time.substring(0, 5), 'HH:mm', selectedDate);
    let cursor = start;
const slots: { time: string; available: boolean }[] = [];
const now = new Date();

    while (isBefore(cursor, end)) {
      const timeStr = format(cursor, 'HH:mm');
const slotDateTime = new Date(selectedDate);
slotDateTime.setHours(cursor.getHours(), cursor.getMinutes(), 0, 0);

const isPast = slotDateTime < now;
      const conflict = (existing || []).some(a => {
  if (!a.time) return false;

  // 🚨 IGNORA CANCELADO
  if (a.status === "cancelled") return false;

  const service = services.find(s => s.id === a.service_id);
  const duration = service?.duration_minutes || 30;

  const [h, m] = a.time.split(':').map(Number);
  const start = h * 60 + m;
  const end = start + duration;

  const [slotH, slotM] = timeStr.split(':').map(Number);
  const slotTime = slotH * 60 + slotM;

  return slotTime >= start && slotTime < end;
});

if (!isPast && !conflict) {
  slots.push({
    time: timeStr,
    available: true
  });
}
      cursor = addMinutes(cursor, 30);
}
    
if (schedule.start_time_2 && schedule.end_time_2) {
  let cursor2 = parse(schedule.start_time_2.substring(0, 5), 'HH:mm', selectedDate);
  const end2 = parse(schedule.end_time_2.substring(0, 5), 'HH:mm', selectedDate);

  while (isBefore(cursor2, end2)) {
    const timeStr = format(cursor2, 'HH:mm');

    const slotDateTime = new Date(selectedDate);
    slotDateTime.setHours(cursor2.getHours(), cursor2.getMinutes(), 0, 0);

    const isPast = slotDateTime < now;

    const conflict = (existing || []).some(a => {
      if (!a.time) return false;
      if (a.status === "cancelled") return false;

      const service = services.find(s => s.name === a.service_name);
      const duration = service?.duration_minutes || 30;

      const [h, m] = a.time.split(':').map(Number);
      const start = h * 60 + m;
      const end = start + duration;

      const [slotH, slotM] = timeStr.split(':').map(Number);
      const slotTime = slotH * 60 + slotM;

      return slotTime >= start && slotTime < end;
    });

    if (!isPast && !conflict) {
      if (!slots.find(s => s.time === timeStr)) {
        slots.push({ time: timeStr, available: true });
      }
    }

    cursor2 = addMinutes(cursor2, 30);
  }
}

   const sortedSlots = slots.sort((a, b) => {
  return a.time.localeCompare(b.time);
});

setAvailableSlots(sortedSlots);
setLoadingSlots(false);
  }

  const handleBook = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !business) return;

console.log("SERVICE COMPLETO:", selectedService);
console.log("PRICE RAW:", selectedService.price);
console.log("PRICE NUMBER:", Number(selectedService.price));
console.log("PRICE DO SERVIÇO:", selectedService.price);
    setBooking(true);
    try {
  
 const serviceFull = services.find(s => s.id === selectedService.id); 

const { data, error } = await supabase
  .from('appointments')
  .insert({
    client_name: clientName,
    business_id: business.id,
    phone: clientWhatsapp,
    service_id: selectedService.id,
service_name: selectedService.name,
    price: Number(serviceFull?.price) || 0,
    date: format(selectedDate, 'yyyy-MM-dd'),
    time: selectedTime,
    status: "confirmed"
  });

if (error) {
  console.error("ERRO AO SALVAR:", error);

  if (error.code === "23505") {
    toast.error("Esse horário acabou de ser reservado. Escolha outro.");
    setSelectedTime(null);
    setShowModal(false);
    computeSlots(); // recarrega horários
    return;
  }

  toast.error("Erro ao agendar");
  return;
}

console.log("INSERT DATA:", data);
console.log("INSERT ERROR:", error);

const message = `Olá, quero confirmar meu agendamento:

Barbearia: ${business.name}
Serviço: ${selectedService.name}
Data: ${format(selectedDate, "dd/MM/yyyy")}
Horário: ${selectedTime}

Cliente: ${clientName}
WhatsApp: ${clientWhatsapp}
`;

const phone = business.phone?.replace(/\D/g, '');

const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;

window.open(whatsappUrl, '_blank');
      setBooked(true);
      toast.success('Agendamento confirmado!');
await computeSlots();
setSelectedTime(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBooking(false);
    }
  };

  const isDateDisabled = (date: Date) => {
 console.log("TESTE DIA:", date.getDay(), schedules);
    if (isBefore(date, startOfToday())) return true;
    const dayOfWeek = date.getDay();
    const schedule = schedules.find(s => Number(s.day_of_week) === dayOfWeek && s.is_active);
    return !schedule;
  };

  // Group services by category
 const grouped = {
  Geral: services
};

  if (loading) {
    return <div className="dark min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Carregando...</div></div>;
  }

  if (!business) {
    return <div className="dark min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Profissional não encontrado.</p></div>;
  }

if (business.status === 'blocked') {
  return (
    <div className="dark min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">
        Agenda indisponível. Entre em contato com o profissional.
      </p>
    </div>
  );
}

  if (booked) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-xl font-heading font-bold text-foreground mb-2">Agendamento Confirmado!</h1>
          <p className="text-muted-foreground text-sm mb-1">{selectedService?.name} com {business.name}</p>
          <p className="text-muted-foreground text-sm">
            {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedTime}
          </p>
          <p className="text-xs text-muted-foreground mt-4">Você receberá uma confirmação no WhatsApp.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background">
      {/* Cover & Profile */}
      <div className="relative">
        {business.cover_url ? (
          <img src={business.cover_url} alt="Capa" className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 gradient-primary" />
        )}
        <div className="absolute -bottom-8 left-4">
          {business.logo_url ? (
            <img src={business.logo_url} alt="Logo" className="w-16 h-16 rounded-full border-4 border-background object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full border-4 border-background gradient-primary flex items-center justify-center">
              <CalendarCheck className="h-7 w-7 text-primary-foreground" />
            </div>
          )}
        </div>
      </div>

      <div className="container pt-12 pb-6 space-y-6">
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground">{business.name}</h1>
          <Badge variant="secondary" className="mt-1 text-xs">{business.type}</Badge>
        </div>

        {/* Step 1: Choose service */}{!selectedService && (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
    <h2 className="text-sm font-medium text-muted-foreground">Escolha um serviço</h2>

    {services.map(svc => (
      <Card
        key={svc.id}
        className="glass cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => {
  setSelectedService(svc);
  setSelectedDate(undefined);
  setSelectedTime(null);
  setAvailableSlots([]);
}}
      >
        <CardContent className="p-3 flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground text-sm">{svc.name}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-primary flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                R$ {Number(svc.price).toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {svc.duration_minutes}min
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}

  </motion.div>
)}

        {/* Step 2: Choose date */}
        {selectedService && !selectedDate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">Escolha a data</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedService(null)} className="text-xs">← Voltar</Button>
            </div>
            <Card className="glass flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={isDateDisabled}
                locale={ptBR}
                className={cn("p-3 pointer-events-auto")}
              />
            </Card>
          </motion.div>
        )}

        {/* Step 3: Choose time */}
        {selectedService && selectedDate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">Escolha o horário</h2>
                <p className="text-xs text-muted-foreground">{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</p>
              </div>
              <Button variant="ghost" size="sm" 
onClick={() => {
  setSelectedDate(undefined);
  setSelectedTime(null);
  setAvailableSlots([]); // 👈 ESSENCIAL
}}
 className="text-xs">← Voltar</Button>
            </div>
{loadingSlots ? (
  <p className="text-center text-sm text-muted-foreground py-4">
    Carregando horários...
  </p>
) : availableSlots.length === 0 ? (
  <p className="text-center text-sm text-muted-foreground py-4">
    Nenhum horário disponível nesta data.
  </p>
) : (
              <div className="grid grid-cols-4 gap-2">
               {availableSlots.map(slot => (
  <Button
    key={slot.time}
    disabled={!slot.available}
    variant={selectedTime === slot.time ? 'default' : 'outline'}
    size="sm"
    className={
      !slot.available
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
        : selectedTime === slot.time
        ? 'gradient-primary'
        : ''
    }
    onClick={() => {
      if (!slot.available) return;
      setSelectedTime(slot.time);
      setShowModal(true);
    }}
  >
    {slot.time}
  </Button>
))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="dark glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Confirmar Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p><strong className="text-foreground">{selectedService?.name}</strong></p>
            <p>{selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {selectedTime}</p>
          </div>
          <div className="space-y-3 mt-2">
            <Input placeholder="Seu nome" value={clientName} onChange={e => setClientName(e.target.value)} required />
            <Input placeholder="Seu WhatsApp (ex: 11999999999)" value={clientWhatsapp} onChange={e => setClientWhatsapp(e.target.value)} required />
            <Button
              className="w-full gradient-primary"
              disabled={!clientName || !clientWhatsapp || booking}
            onClick={() => {
  console.log("CLICOU NO BOTÃO");
  handleBook();
}}
            >
              {booking ? 'Agendando...' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
