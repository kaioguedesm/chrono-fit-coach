import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dumbbell, TrendingUp, Apple, Calendar, Sparkles, ArrowRight } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              ChronoFit
            </span>
          </div>
          <Button onClick={() => navigate('/auth')} variant="outline">
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Seu Personal Trainer Inteligente</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Transforme seu corpo com
            <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              inteligência artificial
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Treinos personalizados, nutrição balanceada e acompanhamento completo. 
            Tudo em um só lugar, guiado por IA.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg px-8"
            >
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/app')}
              className="text-lg px-8"
            >
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6 p-12 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <h2 className="text-3xl md:text-4xl font-bold">
            Pronto para começar sua transformação?
          </h2>
          <p className="text-lg text-muted-foreground">
            Junte-se a milhares de pessoas que já estão alcançando seus objetivos
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-8"
          >
            Criar Conta Grátis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-primary" />
              <span className="font-semibold">ChronoFit</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 ChronoFit. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
