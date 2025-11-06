import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, AlertTriangle } from 'lucide-react';

interface TermsAcceptanceDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const TERMS_VERSION = '1.0.0';

export function TermsAcceptanceDialog({ open, onAccept, onDecline }: TermsAcceptanceDialogProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <AlertDialogTitle className="text-2xl">Termo de Responsabilidade</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            Por favor, leia e aceite os termos antes de continuar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <div className="space-y-4 text-sm">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">
                  Aviso Importante de Segurança
                </h3>
                <p className="text-muted-foreground">
                  Todos os treinos e dietas gerados pela IA passam por validação de profissionais 
                  qualificados da academia antes de serem liberados para uso.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">1. Validação Profissional</h3>
              <p className="text-muted-foreground">
                Reconheço que todos os planos de treino e nutrição gerados pela Inteligência Artificial 
                serão revisados e aprovados por um profissional qualificado (Personal Trainer ou Nutricionista) 
                antes de serem disponibilizados para minha execução. Entendo que a IA é uma ferramenta de 
                suporte e não substitui a avaliação profissional.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Responsabilidade do Usuário</h3>
              <p className="text-muted-foreground">
                Declaro que forneço informações verdadeiras sobre meu estado de saúde, limitações físicas, 
                e condições médicas. Comprometo-me a comunicar imediatamente qualquer desconforto, dor ou 
                sintoma incomum durante a execução dos exercícios ou dietas.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Avaliação Médica</h3>
              <p className="text-muted-foreground">
                Confirmo que consultei ou consultarei um médico antes de iniciar qualquer programa de 
                exercícios físicos, especialmente se possuo condições médicas pré-existentes, como problemas 
                cardíacos, hipertensão, diabetes ou lesões anteriores.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. Execução dos Exercícios</h3>
              <p className="text-muted-foreground">
                Entendo que sou responsável pela execução correta dos exercícios, respeitando meus limites 
                físicos e seguindo as orientações fornecidas. A academia e seus profissionais não se 
                responsabilizam por lesões decorrentes de execução incorreta ou excesso de esforço.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5. Limitações da Tecnologia</h3>
              <p className="text-muted-foreground">
                Compreendo que a IA utiliza algoritmos baseados em padrões gerais e que, apesar da validação 
                profissional, cada corpo é único. Comprometo-me a seguir as recomendações dos profissionais 
                e ajustar os treinos conforme necessário.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">6. Planos Nutricionais</h3>
              <p className="text-muted-foreground">
                Reconheço que os planos nutricionais são sugestões gerais e podem precisar de ajustes 
                individualizados. Entendo que a academia não substitui acompanhamento nutricional 
                profissional especializado para condições específicas.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">7. Isenção de Responsabilidade</h3>
              <p className="text-muted-foreground">
                Concordo em isentar a academia, seus proprietários, funcionários e profissionais de 
                qualquer responsabilidade por lesões, danos ou problemas de saúde que possam ocorrer 
                durante ou após a utilização dos serviços, desde que os profissionais tenham agido com 
                diligência e dentro dos padrões técnicos adequados.
              </p>
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-xs text-muted-foreground">
                Versão do Termo: {TERMS_VERSION} | Data: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-start gap-2 py-4">
          <Checkbox
            id="terms"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked as boolean)}
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Li e aceito os termos de responsabilidade acima
          </label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDecline}>Recusar</AlertDialogCancel>
          <AlertDialogAction onClick={onAccept} disabled={!accepted}>
            Aceitar e Continuar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const CURRENT_TERMS_VERSION = TERMS_VERSION;
