import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CalendarCheck, Upload } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Business = Tables<'businesses'>;

const CATEGORIES = [
  'barbearia', 'salao', 'lash-design', 'manicure', 'estetica', 'massagem', 'tatuagem', 'outro'
];

const CATEGORY_LABELS: Record<string, string> = {
  'barbearia': 'Barbearia',
  'salao': 'Salão de Beleza',
  'lash-design': 'Lash Design',
  'manicure': 'Manicure & Pedicure',
  'estetica': 'Estética',
  'massagem': 'Massagem',
  'tatuagem': 'Tatuagem',
  'outro': 'Outro',
};

import { useAuth } from '@/hooks/useAuth';

interface Props {
  userId: string;
  existing?: Business | null;
  onComplete: () => void;
}

export default function BusinessSetup({ userId, existing, onComplete }: Props) {
const { user } = useAuth();
  const [name, setName] = useState(existing?.name || '');
  const [category, setCategory] = useState(existing?.category || 'barbearia');
  const [whatsapp, setWhatsapp] = useState(existing?.phone || '');
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  async function uploadFile(file: File, path: string) {
const trialEnd = new Date();
trialEnd.setDate(trialEnd.getDate() + 15);
    const { data, error } = await supabase.storage
      .from('business-assets')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from('business-assets')
      .getPublicUrl(path);
    return publicUrl;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
console.log("🚀 INICIOU SUBMIT");
  console.log("USER AUTH:", user?.id);
  console.log("USER PROP:", userId);

    if (!name.trim()) return;
    setSaving(true);

    try {
      let cover_url = existing?.cover_url || null;
      let logo_url = existing?.logo_url || null;

      if (coverFile) {
        cover_url = await uploadFile(coverFile, `${userId}/cover-${Date.now()}`);
      }
      if (logoFile) {
        logo_url = await uploadFile(logoFile, `${userId}/logo-${Date.now()}`);
      }

    if (existing) {
  // 🔄 UPDATE (quando já existe negócio)
  await supabase.from('businesses').update({
    name,
    type: category,
    phone: whatsapp,
    cover_url,
    logo_url,
  }).eq('id', existing.id);

  onComplete();

} else {
  // ➕ INSERT (quando é novo)
const trialEnd = new Date();
trialEnd.setDate(trialEnd.getDate() + 15);
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      user_id: user?.id,
      name,
      type: category,
      phone: whatsapp,
      cover_url,
      logo_url,
trial_ends_at: trialEnd.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("ERRO INSERT:", error);
    return;
  }

  onComplete();

console.log("📦 INSERT DATA:", data);
console.log("❌ INSERT ERROR:", error);
      }


      toast.success(existing ? 'Perfil atualizado!' : 'Negócio criado! Você tem 15 dias de teste grátis.');
     console.log("➡️ VAI REDIRECIONAR PRA DASHBOARD");
 // window.location.href = '/dashboard';

console.log("🚨 FINAL DO SUBMIT");
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-8 max-w-lg">
      {!existing && (
        <div className="text-center mb-8">
          <CalendarCheck className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-heading font-bold text-foreground">Configure seu negócio</h1>
          <p className="text-muted-foreground text-sm mt-1">Preencha os dados para começar a receber agendamentos</p>
        </div>
      )}

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-foreground">{existing ? 'Editar Perfil' : 'Dados do Negócio'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Nome do Negócio</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Barbearia do João" required />
              {slug && <p className="text-xs text-muted-foreground mt-1">Link: /p/{slug}</p>}
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Categoria</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">WhatsApp</label>
              <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="5511999999999" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Foto de Capa</label>
                <label className="flex items-center gap-2 p-3 border border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{coverFile?.name || 'Selecionar'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Logo</label>
                <label className="flex items-center gap-2 p-3 border border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{logoFile?.name || 'Selecionar'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full gradient-primary" disabled={saving}>
              {saving ? 'Salvando...' : existing ? 'Salvar Alterações' : 'Criar Negócio'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
