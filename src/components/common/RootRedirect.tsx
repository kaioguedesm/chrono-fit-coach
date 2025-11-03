import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export function RootRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[RootRedirect] Estado:', { loading, hasUser: !!user });
    
    if (!loading) {
      const timeout = setTimeout(() => {
        if (user) {
          console.log('[RootRedirect] Redirecionando para /app');
          navigate('/app', { replace: true });
        } else {
          console.log('[RootRedirect] Redirecionando para /auth');
          navigate('/auth', { replace: true });
        }
      }, 100); // Pequeno delay para evitar loops
      
      return () => clearTimeout(timeout);
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Carregando...</p>
        {/* Debug info - remover em produção */}
        <p className="text-xs text-muted-foreground/50">
          {loading ? 'Verificando sessão...' : user ? 'Redirecionando para app...' : 'Redirecionando para login...'}
        </p>
      </div>
    </div>
  );
}
