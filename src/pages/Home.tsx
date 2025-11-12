import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { InstallPWA } from "@/components/common/InstallPWA";
import { 
  Dumbbell, TrendingUp, Apple, Calendar, Sparkles, ArrowRight, 
  Target, Zap, Shield, Brain, Trophy, Users, Check, Star,
  BarChart3, Heart, Smartphone, Clock
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  const stats = [
    { value: "50K+", label: "Usuários Ativos" },
    { value: "95%", label: "Taxa de Sucesso" },
    { value: "4.9/5", label: "Avaliação Média" },
    { value: "1M+", label: "Treinos Realizados" }
  ];

  const features = [
    {
      icon: Brain,
      title: "IA Personalizada",
      description: "Algoritmos avançados criam treinos únicos baseados em seu histórico, preferências e objetivos específicos"
    },
    {
      icon: Apple,
      title: "Nutrição Inteligente",
      description: "Planos alimentares dinâmicos que se adaptam ao seu progresso e metabolismo em tempo real"
    },
    {
      icon: BarChart3,
      title: "Analytics Avançado",
      description: "Dashboards interativos com insights profundos sobre sua evolução e padrões de performance"
    },
    {
      icon: Calendar,
      title: "Planejamento Smart",
      description: "Organize sua rotina fitness com lembretes inteligentes e sincronização automática"
    },
    {
      icon: Heart,
      title: "Monitoramento Completo",
      description: "Acompanhe métricas vitais, sono, recuperação e bem-estar em um só lugar"
    },
    {
      icon: Smartphone,
      title: "App Multiplataforma",
      description: "Acesse de qualquer dispositivo com sincronização em nuvem em tempo real"
    }
  ];

  const benefits = [
    {
      icon: Target,
      title: "Resultados Garantidos",
      description: "Metodologia comprovada por mais de 50 mil transformações reais",
      highlight: "95% de taxa de sucesso"
    },
    {
      icon: Zap,
      title: "Transformação Acelerada",
      description: "Veja resultados visíveis nas primeiras 3 semanas com nosso sistema otimizado",
      highlight: "3x mais rápido"
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Protocolos validados por especialistas certificados e profissionais de saúde",
      highlight: "100% seguro"
    }
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Empresária",
      image: "👩‍💼",
      rating: 5,
      text: "Perdi 15kg em 4 meses sem passar fome. O app mudou completamente minha relação com exercícios!"
    },
    {
      name: "Pedro Santos",
      role: "Engenheiro",
      image: "👨‍💻",
      rating: 5,
      text: "Como alguém com rotina corrida, o Nex Fit se encaixou perfeitamente na minha agenda. Resultados incríveis!"
    },
    {
      name: "Ana Costa",
      role: "Professora",
      image: "👩‍🏫",
      rating: 5,
      text: "A inteligência artificial realmente entende minhas necessidades. É como ter um personal trainer 24/7!"
    }
  ];

  const plans = [
    {
      name: "Mensal",
      price: "67",
      period: "/mês",
      description: "Ideal para começar sua jornada",
      features: [
        "Treinos personalizados ilimitados",
        "Planos nutricionais com IA",
        "Acompanhamento de progresso",
        "Suporte por chat",
        "Acesso ao app mobile"
      ],
      popular: false
    },
    {
      name: "Trimestral",
      price: "167",
      period: "/trimestre",
      description: "Melhor custo-benefício",
      badge: "MAIS POPULAR",
      features: [
        "Tudo do plano mensal",
        "Economia de R$ 34",
        "Análises avançadas",
        "Consultoria nutricional",
        "Planos de treino premium",
        "Prioridade no suporte"
      ],
      popular: true,
      savings: "Economize R$ 34"
    },
    {
      name: "Anual",
      price: "667",
      period: "/ano",
      description: "Máximo comprometimento",
      badge: "MELHOR VALOR",
      features: [
        "Tudo do plano trimestral",
        "Economia de R$ 137",
        "Sessões de coaching 1-on-1",
        "Acesso antecipado a recursos",
        "Comunidade VIP exclusiva",
        "Garantia estendida de resultados"
      ],
      popular: false,
      savings: "Economize R$ 137"
    }
  ];

  const faqs = [
    {
      question: "Como funciona a personalização por IA?",
      answer: "Nossa inteligência artificial analisa seu perfil, objetivos, histórico e preferências para criar treinos e planos nutricionais únicos que evoluem com você."
    },
    {
      question: "Preciso de equipamentos especiais?",
      answer: "Não! Nossos treinos se adaptam ao que você tem disponível - desde academias completas até treinos em casa sem equipamentos."
    },
    {
      question: "Quanto tempo até ver resultados?",
      answer: "A maioria dos usuários relata mudanças visíveis nas primeiras 3 semanas. Resultados sustentáveis aparecem de forma consistente ao longo de 8-12 semanas."
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim! Você tem total liberdade para cancelar quando quiser, sem multas ou complicações."
    },
    {
      question: "O app funciona offline?",
      answer: "Sim! Você pode baixar treinos e planos para acessar offline. A sincronização acontece quando você voltar a ter conexão."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/95 shadow-sm">
        <div className="container mx-auto px-4 py-5 md:py-6 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25">
              <Dumbbell className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Nex Fit
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Button 
              variant="outline"
              onClick={() => navigate('/personal-login')}
              className="text-sm md:text-base px-3 md:px-4 gap-2 border-primary/50 bg-primary/5 hover:bg-primary/10 hover:border-primary font-medium"
            >
              <Shield className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Área Personal</span>
              <span className="sm:hidden">Personal</span>
            </Button>
            <Button 
              variant="ghost"
              onClick={() => navigate('/app')}
              className="text-sm md:text-base px-3 md:px-4"
            >
              Acessar App
            </Button>
            <Button 
              onClick={() => navigate('/auth')} 
              className="gap-2 shadow-lg shadow-primary/20 text-sm md:text-base px-4 md:px-6"
            >
              <span className="hidden sm:inline">Começar Agora</span>
              <span className="sm:hidden">Começar</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background pt-8 md:pt-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="text-center max-w-5xl mx-auto space-y-6 md:space-y-8">
            <Badge className="mx-auto gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium shadow-lg" variant="secondary">
              <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
              Mais de 50.000 vidas transformadas
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight px-4">
              Transforme seu corpo
              <span className="block mt-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                com inteligência
              </span>
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              A plataforma de fitness mais inteligente do Brasil. IA avançada que cria treinos e nutrição 
              personalizados que evoluem com você.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-4 md:pt-6 px-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="text-base md:text-lg px-6 md:px-10 py-6 md:py-7 gap-2 shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:scale-105 transition-all"
              >
                Iniciar Transformação
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-base md:text-lg px-6 md:px-10 py-6 md:py-7 border-2"
              >
                Ver Planos
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 pt-8 md:pt-12 max-w-4xl mx-auto px-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-3 md:p-4 rounded-xl bg-card/50 backdrop-blur border border-border/50">
                  <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="outline">
            Tecnologia de Ponta
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Tudo que você precisa para vencer
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ferramentas profissionais que se adaptam ao seu estilo de vida
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 border-border/50 hover:border-primary/50 bg-card/50 backdrop-blur"
            >
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-fit mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-b from-primary/5 via-background to-background py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">
              Por que escolher Nex Fit?
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Resultados que falam por si
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card 
                key={index}
                className="relative overflow-hidden p-8 text-center hover:shadow-xl transition-all border-border/50 bg-card/80 backdrop-blur"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                <div className="relative">
                  <div className="mx-auto p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-fit mb-6">
                    <benefit.icon className="h-10 w-10 text-primary" />
                  </div>
                  <Badge className="mb-4" variant="secondary">{benefit.highlight}</Badge>
                  <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Depoimentos
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Histórias de sucesso reais
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Veja o que nossos usuários têm a dizer sobre suas transformações
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-8 hover:shadow-xl transition-all border-border/50 bg-card/80">
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed italic">
                "{testimonial.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="text-4xl">{testimonial.image}</div>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="bg-gradient-to-b from-background via-primary/5 to-background py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">
              <Trophy className="h-4 w-4 mr-2" />
              Planos e Preços
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Escolha o plano ideal para você
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Todos os planos incluem acesso completo à plataforma. Sem taxas ocultas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index}
                className={`relative p-8 hover:shadow-2xl transition-all ${
                  plan.popular 
                    ? 'border-primary/50 shadow-xl shadow-primary/20 scale-105 bg-card' 
                    : 'border-border/50 bg-card/80'
                }`}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-lg">
                    {plan.badge}
                  </Badge>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-4xl font-bold">R$</span>
                    <span className="text-6xl font-bold text-primary">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  
                  {plan.savings && (
                    <Badge variant="secondary" className="mt-2">
                      {plan.savings}
                    </Badge>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={() => navigate('/auth')}
                  className={`w-full gap-2 ${
                    plan.popular 
                      ? 'shadow-lg shadow-primary/30' 
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.popular ? 'Começar Agora' : 'Selecionar Plano'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>

          <p className="text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
            💳 Aceitamos todos os cartões de crédito • 🔒 Pagamento 100% seguro • ✨ Cancele quando quiser
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="outline">
            Perguntas Frequentes
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ainda tem dúvidas?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Respostas para as perguntas mais comuns
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-all border-border/50 bg-card/80">
              <h3 className="text-lg font-semibold mb-3 flex items-start gap-3">
                <span className="text-primary">Q:</span>
                {faq.question}
              </h3>
              <p className="text-muted-foreground leading-relaxed pl-7">
                {faq.answer}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <Card className="max-w-5xl mx-auto text-center p-8 md:p-16 lg:p-20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-2xl">
          <Badge className="mb-4 md:mb-6" variant="secondary">
            <Clock className="h-4 w-4 mr-2" />
            Oferta por tempo limitado
          </Badge>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 md:mb-6 px-4">
            Comece sua transformação
            <span className="block mt-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              hoje mesmo
            </span>
          </h2>
          
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto mb-6 md:mb-8 px-4">
            Junte-se a mais de 50.000 pessoas que já alcançaram seus objetivos com Nex Fit
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-base md:text-lg px-8 md:px-12 py-6 md:py-7 gap-2 shadow-2xl shadow-primary/40 hover:shadow-3xl hover:scale-105 transition-all"
            >
              Garantir Minha Vaga
              <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 md:gap-8 mt-8 md:mt-12 flex-wrap px-4">
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <Shield className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
              <span className="text-muted-foreground">Garantia de 7 dias</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <Check className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
              <span className="text-muted-foreground">Sem compromisso</span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <Star className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
              <span className="text-muted-foreground">4.9/5 estrelas</span>
            </div>
          </div>
        </Card>
      </section>

      {/* Personal Trainers Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16 md:py-24 border-t border-primary/10">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto p-8 md:p-12 text-center bg-card/80 backdrop-blur border-primary/20">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Você é Personal Trainer?
            </h2>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Acesse a área exclusiva para gerenciar e aprovar treinos gerados pela IA para seus alunos. 
              Garanta a segurança e eficácia de cada treino antes de liberar para execução.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center gap-3 text-sm md:text-base">
                <Check className="h-5 w-5 text-primary shrink-0" />
                <span>Aprovar treinos gerados pela IA</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-sm md:text-base">
                <Check className="h-5 w-5 text-primary shrink-0" />
                <span>Garantir segurança dos alunos</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-sm md:text-base">
                <Check className="h-5 w-5 text-primary shrink-0" />
                <span>Dashboard exclusivo de gestão</span>
              </div>
            </div>

            <Button 
              size="lg" 
              onClick={() => navigate('/personal-login')}
              className="gap-2 shadow-lg shadow-primary/30 text-base md:text-lg px-8 py-6"
            >
              <Shield className="h-5 w-5" />
              Acessar Área Personal
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 backdrop-blur">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-xl bg-gradient-to-br from-primary to-primary/70">
                <Dumbbell className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-base md:text-lg">Nex Fit</span>
            </div>
            
            <div className="flex flex-col items-center gap-1 md:gap-2">
              <p className="text-xs md:text-sm text-muted-foreground text-center">
                © 2025 Nex Fit. Transformando vidas através da tecnologia.
              </p>
              <p className="text-xs text-muted-foreground">
                Feito com ❤️ no Brasil
              </p>
            </div>
          </div>
        </div>
      </footer>
      
      <InstallPWA />
    </div>
  );
};

export default Home;
