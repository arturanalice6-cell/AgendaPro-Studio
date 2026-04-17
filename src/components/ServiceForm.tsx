import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Service = Tables<'services'>;

interface Props {
  businessId: string;
  service?: Service | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function ServiceForm({ businessId, service, onSave, onCancel }: Props) {
  const [name, setName] = useState(service?.name || '');
  const [price, setPrice] = useState(service?.price?.toString() || '');
  const [duration, setDuration] = useState(service?.duration_minutes?.toString() || '30');
  const [category, setCategory] = useState(service?.category || 'geral');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        business_id: businessId,
        name,
        price: parseFloat(price),
        duration_minutes: Number(duration),
        category,
      };

      if (service) {
       const { error } = await supabase
  .from('services')
  .update(data)
  .eq('id', service.id);

if (error) {
  console.error("ERRO AO ATUALIZAR:", error);
  throw error;
}
      } else {
        const { data: insertData, error } = await supabase
  .from('services')
  .insert(data)
  .select();

console.log("INSERT DATA:", insertData);
console.log("INSERT ERROR:", error);

if (error) {
  console.error("ERRO AO CRIAR:", error);
  throw error;
}
      }
      toast.success(service ? 'Serviço atualizado!' : 'Serviço criado!');
      onSave();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="glass border-primary/30">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="Nome do serviço" value={name} onChange={e => setName(e.target.value)} required />
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Preço (R$)" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
            <Input placeholder="Duração (min)" type="number" value={duration} onChange={e => setDuration(e.target.value)} required />
            <Input placeholder="Categoria" value={category} onChange={e => setCategory(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="gradient-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
