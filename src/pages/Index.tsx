import { useNavigate } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Scissors, Star, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Index() {
  const navigate = useNavigate();
const { user, loading } = useAuth();

if (loading) return null;

if (user) {
  return <Navigate to="/dashboard" replace />;
}

  return (
    <div className="dark min-h-screen bg-background">
      {/* Header */}
      <header className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-primary" />
          <span className="font-heading font-bold text-lg text-foreground">AgendaPro Studio</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
          Entrar
        </Button>
      </header>

      {/* Hero */}
      <main className="container">
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="py-20 text-center max-w-2xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground leading-tight">
            Agendamento <span className="text-gradient">inteligente</span> para seu negócio
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            Barbearias, salões, lash design e muito mais. Receba agendamentos 24h pelo celular.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Button size="lg" className="gradient-primary gap-2" onClick={() => navigate('/login')}>
              Começar Grátis <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">15 dias grátis · Sem cartão de crédito</p>
        </motion.section>

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-6 py-16">
          {[
            { icon: Scissors, title: 'Multi-serviço', desc: 'Cadastre todos os seus serviços com preço e duração.' },
            { icon: Zap, title: 'Link Compartilhável', desc: 'Envie seu link pelo WhatsApp e receba agendamentos.' },
            { icon: Star, title: 'Notificações', desc: 'Receba alertas de novos agendamentos e lembretes.' },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="p-6 rounded-xl glass text-center"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  );
}
