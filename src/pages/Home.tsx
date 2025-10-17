import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dumbbell, TrendingUp, Apple, Calendar, Sparkles, ArrowRight, Target, Zap, Shield } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Dumbbell,
      title: "Treinos Personalizados",
      description: "IA cria treinos adaptados ao seu nível e objetivos"
    },
    {
      icon: Apple,
      title: "Nutrição Inteligente",
      description: "Planos alimentares balanceados para seus resultados"
    },
    {
      icon: Calendar,
      title: "Acompanhamento Diário",
      description: "Registre seu progresso e mantenha a consistência"
    },
    {
      icon: TrendingUp,
      title: "Análise de Evolução",
      description: "Gráficos e métricas detalhadas da sua jornada"
    }
  ];

  const benefits = [
    {
      icon: Target,
      title: "Objetivos Claros",
      description: "Defina e alcance suas metas fitness com acompanhamento preciso"
    },
    {
      icon: Zap,
      title: "Resultados Rápidos",
      description: "Métodos comprovados para otimizar seu progresso"
    },
    {
      icon: Shield,
      title: "100% Seguro",
      description: "Exercícios validados e nutrição baseada em ciência"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/80">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/70">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Meta Fit
            </span>
          </div>
          <Button onClick={() => navigate('/auth')} className="gap-2">
            Começar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-5xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Tecnologia de IA Avançada</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight animate-fade-in">
            Transforme seu
            <span className="block mt-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              corpo e mente
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in">
            Plataforma completa de fitness com inteligência artificial. 
            Treinos personalizados, nutrição balanceada e acompanhamento profissional em tempo real.
          </p>

          <div className="flex justify-center pt-6 animate-fade-in">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8 gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              Iniciar Jornada
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tudo que você precisa
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ferramentas profissionais ao seu alcance
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 w-fit mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="text-center space-y-4 p-8 rounded-2xl bg-gradient-to-b from-card/50 to-transparent border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className="mx-auto p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-fit">
                <benefit.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8 p-12 md:p-16 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-2xl">
          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Pronto para transformar
            <span className="block mt-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              sua vida?
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já estão alcançando resultados extraordinários
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-10 py-6 gap-2 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all"
          >
            Começar Agora
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-12 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/70">
                <Dumbbell className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Meta Fit</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Meta Fit. Transformando vidas através da tecnologia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
