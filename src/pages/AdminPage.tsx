import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CalendarCheck, LogOut, Users, Shield } from 'lucide-react';
import { format, parseISO, addDays, isSameDay } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Business = Tables<'businesses'>;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  trial: { label: 'Teste', color: 'bg-warning/20 text-warning' },
  active: { label: 'Ativo', color: 'bg-success/20 text-success' },
  blocked: { label: 'Bloqueado', color: 'bg-destructive/20 text-destructive' },
};

export default function AdminPage() {
  const { user, signOut } = useAuth();
const ADMIN_EMAIL = "clebersimoessilva492@gmail.com";
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
const tomorrow = addDays(new Date(), 1);

const expiringTomorrow = businesses.filter(biz => {
  if (!biz.trial_ends_at) return false;
  return isSameDay(parseISO(biz.trial_ends_at), tomorrow);
});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });
    setBusinesses(data || []);
    setLoading(false);
  }
const updateStatus = async (id: string, status: string) => {

// 👇 AGORA FORA da função (isso é o certo)
const extendPlan = async (businessId: string, days: number) => {
  const { error } = await supabase.rpc('extend_subscription', {
    p_business_id: businessId,
    p_days: days,
    p_admin_id: user.id
  });

  if (error) {
    console.error(error);
    toast.error('Erro ao renovar plano');
    return;
  }

  toast.success(`+${days} dias adicionados`);
  load();
};

  console.log("ID:", id);
  console.log("STATUS:", status);

  const { data, error } = await supabase
    .from('businesses')
    .update({ status })
    .eq('id', id)
    .select();

  console.log("UPDATE DATA:", data);
  console.log("UPDATE ERROR:", error);

  if (error) {
    alert(error.message);
    return;
  }

  toast.success('Status atualizado!');
  load();
};

const extendPlan = async (businessId: string, days: number) => {
  const { error } = await supabase.rpc('extend_subscription', {
    p_business_id: businessId,
    p_days: days,
    p_admin_id: user?.id
  });

  if (error) {
    console.error(error);
    toast.error('Erro ao renovar plano');
    return;
  }

  toast.success(`+${days} dias adicionados`);
  load();
};

if (!user || user.email !== ADMIN_EMAIL) {
  return (
    <div className="dark min-h-screen flex items-center justify-center bg-background">
      <p className="text-destructive">Acesso negado. Somente administrador.</p>
    </div>
  );
}

  return (
    <div className="dark min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-foreground">Admin Panel</span>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-4">
{expiringTomorrow.length > 0 && (
  <div className="space-y-2">
    <h2 className="text-sm font-bold text-yellow-500">
      ⚠️ Vencem amanhã ({expiringTomorrow.length})
    </h2>

    {expiringTomorrow.map(biz => (
      <div key={biz.id} className="text-xs bg-yellow-500/10 p-2 rounded">
        {biz.name} - {biz.phone}
      </div>
    ))}
  </div>
)}
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-heading font-bold text-foreground">Profissionais Cadastrados</h1>
          <Badge variant="secondary" className="text-xs">{businesses.length}</Badge>
        </div>

        {loading && <p className="text-muted-foreground text-sm">Carregando...</p>}

       {businesses.map(biz => (
  <Card key={biz.id} className="glass">
    <CardContent className="p-4 space-y-3">

      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">{biz.name}</p>
         <a
  href={`https://wa.me/55${biz.phone}?text=${encodeURIComponent(
    'Seu plano vence amanhã, renove para não perder sua agenda.'
  )}`}
  target="_blank"
  className="text-xs text-primary underline"
>
  WhatsApp: {biz.phone || 'Sem número'}
</a>

    <p className="text-xs text-muted-foreground">
            {biz.category} · /p/{biz.slug}
          </p>

        </div>

        <span className={`text-xs px-2 py-1 rounded-full ${STATUS_CONFIG[biz.status]?.color}`}>
          {STATUS_CONFIG[biz.status]?.label}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">
          Trial expira: {biz.trial_ends_at
            ? format(parseISO(biz.trial_ends_at), 'dd/MM/yyyy')
            : '—'}
        </p>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => extendPlan(biz.id, 30)}>
            +30d
          </Button>

          <Button size="sm" onClick={() => extendPlan(biz.id, 60)}>
            +60d
          </Button>

          <Select value={biz.status} onValueChange={v => updateStatus(biz.id, v)}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trial">Teste</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="blocked">Bloqueado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

    </CardContent>
  </Card>
))}
      </main>
    </div>
  );
}
