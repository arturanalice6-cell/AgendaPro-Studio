import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  CalendarCheck, Plus, Trash2, Edit2, Copy, ExternalLink,
  MessageCircle, LogOut, Clock, DollarSign, Scissors
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';
import ServiceForm from '@/components/ServiceForm';
import ScheduleManager from '@/components/ScheduleManager';
import BusinessSetup from '@/components/BusinessSetup';
import AppointmentList from '@/components/AppointmentList';

type Business = Tables<'businesses'>;
type Service = Tables<'services'>;

export default function DashboardPage() {
  const { user, signOut, role } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
console.log("📥 ENTROU NO DASHBOARD");
  console.log("👤 USER:", user?.id);
    setLoading(true);
   const { data: biz } = await supabase
  .from('businesses')
  .select('*')
  .eq('user_id', user!.id)
  .limit(1)
.maybeSingle();

console.log("🏪 BUSINESS ENCONTRADO:", biz);
    setBusiness(biz);

    if (biz) {
      const { data: svcs } = await supabase
  .from('services')
  .select('*')
  .eq('business_id', biz.id);

console.log("SERVIÇOS DO BANCO:", svcs);
      setServices(svcs || []);
    }
    setLoading(false);
  }

const handleCoverChange = async (e: any) => {
  const file = e.target.files[0];
  if (!file || !business) return;

  const path = `${business.id}/cover-${Date.now()}`;
console.log("UPLOAD PATH:", path);

  const { error } = await supabase.storage
    .from('business-assets')
    .upload(path, file, { upsert: true });

  if (error) return console.error(error);

  const { data: urlData } = supabase.storage
    .from('business-assets')
    .getPublicUrl(path);

const publicUrl = urlData.publicUrl;
console.log("URL FINAL:", publicUrl);

  await supabase
    .from('businesses')
    .update({ cover_url: urlData.publicUrl })
    .eq('id', business.id);

  loadData(); // 🔥 atualiza dashboard
};

const statusLabel: Record<string, string> = {
  trial: '🟡 Período de Teste',
  active: '🟢 Ativo',
  blocked: '🔴 Bloqueado',
};

const publicLink = business 
  ? `https://agendaprostudio.com/p/${business.id}` 
  : '';

const copyLink = () => {
  navigator.clipboard.writeText(publicLink);
  toast.success('Link copiado!');
};

const deleteService = async (id: string) => {
  await supabase.from('services').delete().eq('id', id);
  toast.success('Serviço removido');
  loadData();
};

  if (loading) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="dark min-h-screen bg-background">
        <BusinessSetup userId={user!.id} onComplete={loadData} />
      </div>
    );
  }

  const isBlocked = business.status === 'blocked';

  return (
    <div className="dark min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-foreground">AgendaPro Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {statusLabel[business.status]}
            </Badge>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {isBlocked && (
        <div className="bg-destructive/10 border-b border-destructive/20 p-3 text-center text-sm text-destructive">
          Seu acesso está bloqueado. Entre em contato com o suporte.
        </div>
      )}

   <main className="container py-6 space-y-6">

  {/* 🔥 CAPA DO NEGÓCIO (SEMPRE VISÍVEL) */}
 <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden bg-gray-800">

  <img
    src={business?.cover_url || '/cover-default.png'}
    className="w-full h-full object-cover"
  />

  <label className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded cursor-pointer">
    Alterar capa
    <input
      type="file"
      className="hidden"
      onChange={handleCoverChange}
    />
  </label>
</div>


        {/* Quick Stapots */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="glass">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Scissors className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{services.length}</p>
                <p className="text-xs text-muted-foreground">Serviços</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <ExternalLink className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Link Público</span>
              </div>
              <button onClick={copyLink} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Copy className="h-3 w-3" /> Copiar link
              </button>
            </CardContent>
          </Card>
        </div>

        {/* WhatsApp Support */}
        <a
          href="https://wa.me/5519987107701?text=Olá! Preciso de ajuda com o AgendaPro"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20 text-success hover:bg-success/20 transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Falar com Vendedor</span>
        </a>

        {/* Tabs */}
        <Tabs defaultValue="services">
          <TabsList className="w-full">
            <TabsTrigger value="services" className="flex-1">Serviços</TabsTrigger>
            <TabsTrigger value="schedule" className="flex-1">Horários</TabsTrigger>
            <TabsTrigger value="appointments" className="flex-1">Agenda</TabsTrigger>
            <TabsTrigger value="profile" className="flex-1">Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-heading font-bold text-foreground">Serviços</h2>
              <Button size="sm" onClick={() => { setEditingService(null); setShowServiceForm(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Novo
              </Button>
            </div>

            {showServiceForm && (
              <ServiceForm
                businessId={business.id}
                service={editingService}
                onSave={() => { setShowServiceForm(false); loadData(); }}
                onCancel={() => setShowServiceForm(false)}
              />
            )}

            <div className="space-y-2">
              {services.map((svc) => (
                <Card key={svc.id} className="glass">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">{svc.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-primary flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />R$ {Number(svc.price).toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />{svc.duration_minutes}min
                        </span>
                        <Badge variant="secondary" className="text-[10px]">{svc.category}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingService(svc); setShowServiceForm(true); }}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteService(svc.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {services.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Nenhum serviço cadastrado. Clique em "Novo" para começar.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            <ScheduleManager businessId={business.id} />
          </TabsContent>

          <TabsContent value="appointments" className="mt-4">
            <AppointmentList businessId={business.id} />
          </TabsContent>

          <TabsContent value="profile" className="mt-4">
            <BusinessSetup userId={user!.id} existing={business} onComplete={loadData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
