import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ResetPassword() {
const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!password || password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Senha atualizada com sucesso!');
setTimeout(() => {
  navigate('/login');
}, 1500);
    }

    setLoading(false);
  };

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-xl text-white text-center font-bold">
          Redefinir senha
        </h1>

        <Input
          type="password"
          placeholder="Nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          onClick={handleUpdate}
          className="w-full gradient-primary"
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Atualizar senha'}
        </Button>
      </div>
    </div>
  );
}