import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
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

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Erro capturado:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.href = '/auth';
  };

  handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/auth';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <CardTitle className="text-2xl">Ops! Algo deu errado</CardTitle>
              </div>
              <CardDescription>
                A aplicação encontrou um erro e não pode continuar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="font-mono text-sm text-destructive break-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Tente as seguintes soluções:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Recarregue a página (F5)</li>
                  <li>Limpe o cache do navegador</li>
                  <li>Tente em uma janela anônima</li>
                  <li>Verifique sua conexão com a internet</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={this.handleReload} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar
                </Button>
                <Button onClick={this.handleClearCache} variant="outline" className="flex-1">
                  Limpar Cache
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Detalhes técnicos (dev)
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded overflow-auto text-[10px]">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
