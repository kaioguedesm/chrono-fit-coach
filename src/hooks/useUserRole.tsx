import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'personal' | 'user' | null;

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, approved')
          .eq('user_id', user.id)
          .eq('approved', true);

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('user'); // Default role
        } else if (!data || data.length === 0) {
          setRole('user'); // Default role
        } else {
          // Se tiver múltiplas roles, priorizar: admin > personal > user
          const roles = data.map(r => r.role);
          if (roles.includes('admin')) {
            setRole('admin');
          } else if (roles.includes('personal')) {
            setRole('personal');
          } else {
            setRole('user');
          }
        }
      } catch (err) {
        console.error('Error:', err);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isPersonal = role === 'personal';
  const isUser = role === 'user' || role === null;

  return { role, loading, isAdmin, isPersonal, isUser };
}
