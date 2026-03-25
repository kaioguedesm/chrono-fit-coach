import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, WifiOff, ShieldAlert, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Mapeia mensagens de erro técnicas para explicações amigáveis em português.
 */
function getFriendlyError(error: Error | null): { title: string; description: string; icon: 'network' | 'auth' | 'generic' } {
  if (!error) {
    return {
      title: 'Erro inesperado',
      description: 'Algo deu errado no aplicativo. Tente recarregar a página.',
      icon: 'generic',
    };
  }

  const msg = error.message?.toLowerCase() || '';

  // Subscription / Provider context errors
  if (msg.includes('usesubscription') || msg.includes('subscriptionprovider') || msg.includes('within')) {
    return {
      title: 'Erro ao verificar sua assinatura',
      description: 'O sistema não conseguiu verificar o status da sua conta. Isso geralmente acontece por uma falha temporária. Tente recarregar a página ou fazer login novamente.',
      icon: 'auth',
    };
  }

  // Network / fetch errors
  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('net::') || msg.includes('timeout')) {
    return {
      title: 'Erro de conexão',
      description: 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.',
      icon: 'network',
    };
  }

  // Auth errors
  if (msg.includes('auth') || msg.includes('token') || msg.includes('unauthorized') || msg.includes('not authenticated') || msg.includes('jwt')) {
    return {
      title: 'Sessão expirada',
      description: 'Sua sessão de login expirou ou é inválida. Faça login novamente para continuar.',
      icon: 'auth',
    };
  }

  // Permission / RLS errors
  if (msg.includes('permission') || msg.includes('denied') || msg.includes('rls') || msg.includes('policy')) {
    return {
      title: 'Sem permissão',
      description: 'Você não tem permissão para acessar este recurso. Se acredita que isso é um erro, entre em contato com o suporte.',
      icon: 'auth',
    };
  }

  // Database errors
  if (msg.includes('database') || msg.includes('supabase') || msg.includes('postgres') || msg.includes('relation') || msg.includes('column')) {
    return {
      title: 'Erro no servidor',
      description: 'Houve um problema ao acessar os dados. Tente novamente em alguns instantes.',
      icon: 'generic',
    };
  }

  // Chunk loading / code splitting errors
  if (msg.includes('loading chunk') || msg.includes('dynamically imported') || msg.includes('loading css')) {
    return {
      title: 'Atualização disponível',
      description: 'Uma nova versão do app está disponível. Recarregue a página para atualizar.',
      icon: 'generic',
    };
  }

  return {
    title: 'Ops! Algo deu errado',
    description: 'O aplicativo encontrou um erro inesperado. Tente recarregar a página ou limpar o cache do navegador.',
    icon: 'generic',
  };
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Erro capturado:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/auth');
  };

  handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { title, description, icon } = getFriendlyError(this.state.error);

      const IconComponent = icon === 'network' ? WifiOff : icon === 'auth' ? ShieldAlert : AlertTriangle;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-destructive/10">
                  <IconComponent className="h-7 w-7 text-destructive" />
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
              </div>
              <CardDescription className="text-sm leading-relaxed">
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">O que você pode fazer:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Recarregar a página clicando no botão abaixo</li>
                  <li>Verificar sua conexão com a internet</li>
                  <li>Fazer login novamente</li>
                  <li>Limpar o cache do navegador</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReload} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar Página
                </Button>
                <div className="flex gap-2">
                  <Button onClick={this.handleLogout} variant="outline" className="flex-1">
                    <LogOut className="h-4 w-4 mr-2" />
                    Voltar ao Login
                  </Button>
                  <Button onClick={this.handleClearCache} variant="ghost" className="flex-1">
                    Limpar Cache
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
