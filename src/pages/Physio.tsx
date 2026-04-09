import { useState } from "react";
import { Heart, ChevronDown, ChevronUp, Lock, Activity, Bone, CircleDot, ArrowUpDown, Footprints } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Exercise {
  name: string;
  description: string;
  frequency: string;
  sets?: string;
}

interface Category {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  exercises: Exercise[];
}

const categories: Category[] = [
  {
    id: "coluna",
    label: "Coluna",
    icon: ArrowUpDown,
    color: "text-blue-500",
    exercises: [
      { name: "Gato-Vaca", description: "De quatro apoios, alterne entre arquear e arredondar a coluna lentamente.", frequency: "3x por semana", sets: "3x10 repetições" },
      { name: "Ponte (Glúteos)", description: "Deitado de barriga para cima, eleve o quadril contraindo o abdômen e glúteos.", frequency: "3x por semana", sets: "3x12 repetições" },
      { name: "Alongamento de Flexores", description: "Em posição de avanço, empurre o quadril para frente sentindo alongar a frente da coxa de trás.", frequency: "Diariamente", sets: "3x30 segundos cada lado" },
      { name: "Prancha Frontal", description: "Apoie-se nos antebraços e pontas dos pés, mantendo o corpo alinhado.", frequency: "3x por semana", sets: "3x20-30 segundos" },
      { name: "Superman", description: "Deitado de bruços, eleve braços e pernas simultaneamente por alguns segundos.", frequency: "3x por semana", sets: "3x10 repetições" },
    ],
  },
  {
    id: "joelho",
    label: "Joelho",
    icon: CircleDot,
    color: "text-green-500",
    exercises: [
      { name: "Agachamento na Parede", description: "Encoste as costas na parede e desça até 90°, segurando a posição.", frequency: "3x por semana", sets: "3x20-30 segundos" },
      { name: "Extensão de Joelho Sentado", description: "Sentado em uma cadeira, estenda a perna lentamente até ficar reta e volte.", frequency: "3x por semana", sets: "3x12 cada perna" },
      { name: "Step Up", description: "Suba e desça de um degrau alternando as pernas, controlando o movimento.", frequency: "3x por semana", sets: "3x10 cada perna" },
      { name: "Isometria de Quadríceps", description: "Sentado, contraia a parte da frente da coxa pressionando o joelho para baixo.", frequency: "Diariamente", sets: "3x10 segundos cada" },
      { name: "Elevação de Perna Reta", description: "Deitado, eleve a perna esticada até 45° e desça lentamente.", frequency: "3x por semana", sets: "3x12 cada perna" },
    ],
  },
  {
    id: "ombro",
    label: "Ombro",
    icon: Activity,
    color: "text-orange-500",
    exercises: [
      { name: "Rotação Externa com Elástico", description: "Com o cotovelo junto ao corpo, gire o antebraço para fora usando um elástico.", frequency: "3x por semana", sets: "3x15 cada lado" },
      { name: "Elevação Lateral Leve", description: "Com pesos leves, eleve os braços lateralmente até a altura dos ombros.", frequency: "3x por semana", sets: "3x12 repetições" },
      { name: "Passada de Bastão", description: "Segure um bastão largo e passe por cima da cabeça até as costas, esticando os braços.", frequency: "Diariamente", sets: "3x10 repetições" },
      { name: "Pendular de Codman", description: "Incline o tronco e deixe o braço balançar em círculos suaves como um pêndulo.", frequency: "Diariamente", sets: "1 minuto cada lado" },
      { name: "W-Y-T no Chão", description: "Deitado de bruços, faça as letras W, Y e T com os braços elevados.", frequency: "3x por semana", sets: "3x8 de cada letra" },
    ],
  },
  {
    id: "quadril",
    label: "Quadril",
    icon: Bone,
    color: "text-purple-500",
    exercises: [
      { name: "Abertura 90/90", description: "Sentado no chão com as pernas em 90°, gire o tronco alternando os lados.", frequency: "Diariamente", sets: "3x8 cada lado" },
      { name: "Clamshell", description: "Deitado de lado, abra os joelhos mantendo os pés juntos (como uma concha).", frequency: "3x por semana", sets: "3x15 cada lado" },
      { name: "Agachamento Profundo Assistido", description: "Segure em um suporte e desça em agachamento profundo, mantendo a posição.", frequency: "3x por semana", sets: "3x20 segundos" },
      { name: "Alongamento Piriforme", description: "Deitado, cruze a perna sobre o joelho oposto e puxe em direção ao peito.", frequency: "Diariamente", sets: "3x30 segundos cada lado" },
      { name: "Ponte Unilateral", description: "Deitado, eleve o quadril apoiado em apenas uma perna.", frequency: "3x por semana", sets: "3x10 cada perna" },
    ],
  },
  {
    id: "tornozelo",
    label: "Tornozelo",
    icon: Footprints,
    color: "text-red-500",
    exercises: [
      { name: "Dorsiflexão na Parede", description: "Com o pé no chão, avance o joelho em direção à parede sem levantar o calcanhar.", frequency: "Diariamente", sets: "3x15 cada pé" },
      { name: "Equilibrio Unipodal", description: "Fique em pé sobre uma perna só, tentando manter o equilíbrio.", frequency: "Diariamente", sets: "3x30 segundos cada pé" },
      { name: "Alfabeto com o Pé", description: "Sentado, desenhe as letras do alfabeto no ar com a ponta do pé.", frequency: "Diariamente", sets: "1x completo cada pé" },
      { name: "Elevação de Panturrilha", description: "Em pé, suba nas pontas dos pés e desça lentamente.", frequency: "3x por semana", sets: "3x15 repetições" },
      { name: "Inversão/Eversão com Elástico", description: "Com um elástico no pé, gire o tornozelo para dentro e para fora resistindo.", frequency: "3x por semana", sets: "3x12 cada direção" },
    ],
  },
];

const professionalSections = [
  { title: "Avaliação Física", description: "Avaliação postural detalhada, análise de mobilidade e relatório completo.", icon: "🩺" },
  { title: "Protocolos de Reabilitação", description: "Treinos de recuperação personalizados pelo fisioterapeuta.", icon: "📋" },
  { title: "Acompanhamento", description: "Check-in semanal, histórico de progresso e feedback profissional.", icon: "📊" },
  { title: "Liberação para Treino", description: "Status de liberação definido pelo fisioterapeuta.", icon: "✅" },
  { title: "Agendamento", description: "Agende sessões presenciais, avaliações e atendimento domiciliar.", icon: "📅" },
];

export default function Physio() {
  const [openCategory, setOpenCategory] = useState<string | null>("coluna");

  const toggleCategory = (id: string) => {
    setOpenCategory(openCategory === id ? null : id);
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
          <Heart className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Fisioterapia</h1>
        <p className="text-sm text-muted-foreground">
          Previna lesões, recupere-se corretamente e treine com segurança.
        </p>
      </div>

      {/* Exercícios Preventivos */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Exercícios Preventivos</h2>
          <Badge variant="secondary" className="text-xs">Gratuito</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Exercícios para fazer em casa e reduzir o risco de lesões.
        </p>

        {categories.map((cat) => {
          const Icon = cat.icon;
          const isOpen = openCategory === cat.id;

          return (
            <Card key={cat.id} className="overflow-hidden">
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg bg-muted", cat.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{cat.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {cat.exercises.length} exercícios
                    </span>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {isOpen && (
                <CardContent className="pt-0 pb-4 px-4 space-y-3">
                  {cat.exercises.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-muted/50 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm text-foreground">{ex.name}</h4>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {ex.frequency}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{ex.description}</p>
                      {ex.sets && (
                        <p className="text-xs font-medium text-primary">{ex.sets}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Seções Profissionais (Bloqueadas) */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Área Profissional</h2>
          <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
            <Lock className="w-3 h-3 mr-1" />
            Em breve
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Acompanhamento com fisioterapeuta profissional.
        </p>

        <div className="grid gap-3">
          {professionalSections.map((section, idx) => (
            <Card key={idx} className="opacity-60 relative overflow-hidden">
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Badge variant="outline" className="text-xs gap-1">
                  <Lock className="w-3 h-3" />
                  Em breve
                </Badge>
              </div>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span>{section.icon}</span>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 px-4">
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Aviso legal */}
      <div className="text-center py-4">
        <p className="text-[11px] text-muted-foreground/70 max-w-sm mx-auto">
          ⚕️ Esta seção oferece orientações gerais de prevenção e não substitui acompanhamento médico ou fisioterapêutico presencial.
        </p>
      </div>
    </div>
  );
}
