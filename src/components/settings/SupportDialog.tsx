import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/lib/toast-utils';
import { HelpCircle, MessageSquare, Star, Send, BookOpen, Dumbbell, Apple, Camera, Calendar, MessageCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'help' | 'contact' | 'rate';
}

export function SupportDialog({ open, onOpenChange, type }: SupportDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(type);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  
  // Form states
  const [contactForm, setContactForm] = useState({
    name: user?.email?.split('@')[0] || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });

  const [feedbackForm, setFeedbackForm] = useState({
    rating: 0,
    category: '',
    feedback: ''
  });

  const faqData = [
    {
      icon: Dumbbell,
      category: 'Treinos',
      questions: [
        {
          q: 'Como criar um treino personalizado?',
          a: 'Vá até a aba "Treino" e clique em "Criar Treino". Você pode adicionar exercícios manualmente ou usar a IA para gerar um treino baseado em seus objetivos.'
        },
        {
          q: 'Como usar o timer de descanso?',
          a: 'Durante um treino ativo, após completar uma série, o timer de descanso iniciará automaticamente. Você pode ajustar o tempo nas configurações de cada exercício.'
        },
        {
          q: 'Posso compartilhar meus treinos?',
          a: 'Sim! Abra qualquer treino e clique no botão de compartilhar. Você receberá um link que pode enviar para amigos.'
        }
      ]
    },
    {
      icon: Apple,
      category: 'Nutrição',
      questions: [
        {
          q: 'Como funciona a análise de fotos de refeições?',
          a: 'Tire uma foto da sua refeição e nossa IA identificará os alimentos e estimará calorias e macronutrientes automaticamente.'
        },
        {
          q: 'Como fazer upload da minha dieta?',
          a: 'Na aba "Nutrição", use a opção "Upload de Dieta" para enviar arquivos PDF, DOC ou imagens. A IA analisará e criará um plano nutricional personalizado.'
        },
        {
          q: 'Posso editar as informações nutricionais?',
          a: 'Sim! Após a análise automática, você pode ajustar manualmente os valores de calorias, proteínas, carboidratos e gorduras.'
        }
      ]
    },
    {
      icon: Camera,
      category: 'Progresso',
      questions: [
        {
          q: 'Como tirar fotos de progresso?',
          a: 'Na aba "Progresso", clique em "Adicionar Foto". Escolha o tipo (frente, lado, costas) e tire ou selecione uma foto.'
        },
        {
          q: 'Posso comparar fotos de diferentes datas?',
          a: 'Sim! Use a função de comparação lado a lado para ver sua evolução ao longo do tempo.'
        },
        {
          q: 'Como adiciono medidas corporais?',
          a: 'Na aba "Progresso", clique em "Adicionar Medição" e registre peso, porcentagem de gordura, circunferências e outras medidas.'
        }
      ]
    },
    {
      icon: Calendar,
      category: 'Agendamento',
      questions: [
        {
          q: 'Como agendar treinos?',
          a: 'Na aba "Agenda", clique em qualquer dia para adicionar um treino. Você pode definir horários e receber notificações.'
        },
        {
          q: 'As notificações funcionam mesmo com o app fechado?',
          a: 'Sim! Certifique-se de permitir notificações nas configurações do app e do seu dispositivo.'
        }
      ]
    }
  ];

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulação de envio (em produção, enviar para backend/email service)
      await new Promise(resolve => setTimeout(resolve, 1500));

      showToast({
        title: 'Mensagem enviada!',
        description: 'Responderemos em até 24 horas.',
        variant: 'success'
      });

      setContactForm({
        name: user?.email?.split('@')[0] || '',
        email: user?.email || '',
        subject: '',
        message: ''
      });
    } catch (error) {
      showToast({
        title: 'Erro ao enviar',
        description: 'Tente novamente mais tarde.',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (feedbackForm.rating === 0) {
      showToast({
        title: 'Avaliação necessária',
        description: 'Por favor, selecione uma classificação.',
        variant: 'warning'
      });
      return;
    }

    setLoading(true);

    try {
      // Simulação de envio
      await new Promise(resolve => setTimeout(resolve, 1500));

      showToast({
        title: 'Obrigado pelo feedback!',
        description: 'Sua opinião é muito importante para nós.',
        variant: 'success'
      });

      setFeedbackForm({
        rating: 0,
        category: '',
        feedback: ''
      });
      setRating(0);
    } catch (error) {
      showToast({
        title: 'Erro ao enviar',
        description: 'Tente novamente mais tarde.',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Suporte
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof type)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="help">
              <BookOpen className="w-4 h-4 mr-2" />
              Central de Ajuda
            </TabsTrigger>
            <TabsTrigger value="contact">
              <MessageSquare className="w-4 h-4 mr-2" />
              Fale Conosco
            </TabsTrigger>
            <TabsTrigger value="rate">
              <Star className="w-4 h-4 mr-2" />
              Avaliar App
            </TabsTrigger>
          </TabsList>

          <TabsContent value="help" className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {faqData.map((category, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <category.icon className="w-5 h-5" />
                        {category.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((item, qIdx) => (
                          <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                            <AccordionTrigger className="text-left">
                              {item.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                              {item.a}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}

                <Card>
                  <CardHeader>
                    <CardTitle>Ainda precisa de ajuda?</CardTitle>
                    <CardDescription>
                      Nossa equipe está pronta para ajudar você
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setActiveTab('contact')} className="w-full">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Entrar em Contato
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  Fale Conosco no WhatsApp
                </CardTitle>
                <CardDescription>
                  Resposta rápida e atendimento direto via WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => window.open('https://wa.me/5511999999999?text=Olá, preciso de ajuda com o Nex Fit!', '_blank')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Abrir WhatsApp
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ou envie um email</CardTitle>
                <CardDescription>
                  Envie sua mensagem e responderemos em até 24 horas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitContact} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Nome</Label>
                      <Input
                        id="contact-name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-subject">Assunto</Label>
                    <Select
                      value={contactForm.subject}
                      onValueChange={(value) => setContactForm({...contactForm, subject: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um assunto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bug">Reportar Bug</SelectItem>
                        <SelectItem value="feature">Sugerir Funcionalidade</SelectItem>
                        <SelectItem value="help">Preciso de Ajuda</SelectItem>
                        <SelectItem value="account">Problema com Conta</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message">Mensagem</Label>
                    <Textarea
                      id="contact-message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      placeholder="Descreva sua dúvida ou problema..."
                      className="min-h-[150px]"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    <Send className="w-4 h-4 mr-2" />
                    {loading ? 'Enviando...' : 'Enviar Mensagem'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Avalie o Nex Fit</CardTitle>
                <CardDescription>
                  Sua opinião nos ajuda a melhorar constantemente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitRating} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Como você avalia o aplicativo?</Label>
                    <div className="flex gap-2 justify-center py-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            setRating(star);
                            setFeedbackForm({...feedbackForm, rating: star});
                          }}
                          className="transition-all hover:scale-110"
                        >
                          <Star
                            className={`w-10 h-10 ${
                              star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback-category">O que você mais gosta?</Label>
                    <Select
                      value={feedbackForm.category}
                      onValueChange={(value) => setFeedbackForm({...feedbackForm, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="design">Design e Interface</SelectItem>
                        <SelectItem value="features">Funcionalidades</SelectItem>
                        <SelectItem value="ai">Recursos de IA</SelectItem>
                        <SelectItem value="tracking">Acompanhamento de Progresso</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback-text">Comentários (opcional)</Label>
                    <Textarea
                      id="feedback-text"
                      value={feedbackForm.feedback}
                      onChange={(e) => setFeedbackForm({...feedbackForm, feedback: e.target.value})}
                      placeholder="Compartilhe sua experiência com o Nex Fit..."
                      className="min-h-[120px]"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    <Star className="w-4 h-4 mr-2" />
                    {loading ? 'Enviando...' : 'Enviar Avaliação'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
