import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";

const PORTAL_01_NAME = "Portal 01";
const MS_CONSULTORIA_NAME = "MS Consultoria";
const TEAM_GS_NAME = "Team GS";
const AI_ENABLED_PORTALS = new Set([PORTAL_01_NAME]);
const AI_DISABLED_PORTALS = new Set([MS_CONSULTORIA_NAME, TEAM_GS_NAME]);

/**
 * Usuários do portal "Portal 01" podem criar treinos e dietas com IA sem aprovação do personal.
 * O portal "MS Consultoria" (e demais portais) não possui esse acesso.
 */
export function useCanCreateWithoutPersonal() {
  const { user } = useAuth();
  const { isPersonal, loading: roleLoading } = useUserRole();
  const [isPortal01, setIsPortal01] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || roleLoading) {
      setLoading(!!user && roleLoading);
      return;
    }

    if (isPersonal) {
      setIsPortal01(true);
      setLoading(false);
      return;
    }

    const checkPortal = async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("gym_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError || !profile?.gym_id) {
          setIsPortal01(false);
          return;
        }

        const { data: gym, error: gymError } = await supabase
          .from("gyms")
          .select("name")
          .eq("id", profile.gym_id)
          .maybeSingle();

        if (gymError || !gym?.name) {
          setIsPortal01(false);
          return;
        }

        const gymName = gym.name.trim();
        const hasExplicitBlock = AI_DISABLED_PORTALS.has(gymName);
        const hasExplicitAccess = AI_ENABLED_PORTALS.has(gymName);

        setIsPortal01(hasExplicitAccess && !hasExplicitBlock);
      } catch {
        setIsPortal01(false);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    checkPortal();
  }, [user?.id, isPersonal, roleLoading]);

  const canCreateWithoutPersonal = isPersonal || isPortal01;

  return { canCreateWithoutPersonal, loading: roleLoading || loading };
}
