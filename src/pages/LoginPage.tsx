import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Scissors, Shield, CalendarCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [profileType, setProfileType] = useState<'professional' | 'admin'>('professional');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast.success('Conta criada! Você já pode fazer login.');
        setIsSignUp(false);
      } else {
        await signIn(email, password);
        toast.success('Login realizado!');
        navigate(profileType === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao autenticar');
    } finally {
      setSubmitting(false);
    }
  };

const handleResetPassword = async () => {
  if (!email) {
    toast.error('Digite seu email primeiro');
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:8080/reset-password'
  });

  if (error) {
    toast.error(error.message);
  } else {
    toast.success('Email de recuperação enviado!');
  }
};

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <CalendarCheck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-heading font-bold text-foreground">AgendaPro Studio</h1>
          </div>
          <p className="text-muted-foreground text-sm">Agendamento inteligente para profissionais</p>
        </div>

        <Card className="glass">
          <CardHeader className="pb-4">
            <Tabs value={profileType} onValueChange={(v) => setProfileType(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="professional" className="flex-1 gap-2">
                  <Scissors className="h-4 w-4" /> Profissional
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex-1 gap-2">
                  <Shield className="h-4 w-4" /> Administrador
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full gradient-primary" disabled={submitting}>
<span
  onClick={handleResetPassword}
  className="block w-full text-sm text-white mt-2 text-center cursor-pointer hover:underline"
>
  Esqueci minha senha
</span>
                {submitting ? 'Aguarde...' : isSignUp ? 'Criar Conta' : 'Entrar'}
              </Button>
            </form>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-center text-sm text-muted-foreground mt-4 hover:text-primary transition-colors"
            >
              {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
