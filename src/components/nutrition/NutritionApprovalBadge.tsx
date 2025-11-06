import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NutritionApprovalBadgeProps {
  status: string;
  rejectionReason?: string;
  size?: 'sm' | 'md';
}

export function NutritionApprovalBadge({ status, rejectionReason, size = 'md' }: NutritionApprovalBadgeProps) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  const getBadgeContent = () => {
    switch (status) {
      case 'pending':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="gap-1 cursor-help border-orange-500/50 text-orange-600 dark:text-orange-400">
                  <Clock className={iconSize} />
                  Aguardando Aprovação
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Este plano nutricional foi gerado pela IA e está aguardando aprovação do profissional para garantir sua adequação.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'approved':
        return (
          <Badge variant="default" className={`gap-1 bg-green-600 hover:bg-green-700`}>
            <CheckCircle className={iconSize} />
            Aprovado
          </Badge>
        );
      case 'rejected':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="gap-1 cursor-help">
                  <XCircle className={iconSize} />
                  Rejeitado
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Motivo da Rejeição:</p>
                <p className="text-sm">{rejectionReason || 'Não informado'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className={iconSize} />
            Status desconhecido
          </Badge>
        );
    }
  };

  return getBadgeContent();
}
