import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Profile {
  name: string;
  age: number | null;
  gender: string | null;
  weight: number | null;
  height: number | null;
  goal: string | null;
  experience_level: string | null;
  avatar_url: string | null;
  dietary_preferences: string[];
  dietary_restrictions: string[];
  gym_id: string | null;
  gym_name: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();

      if (error) throw error;

      if (data) {
        // Buscar gym_id - primeiro da tabela profiles, depois de user_roles (para personal trainers)
        let gymId: string | null = data.gym_id || null;

        // Se não tiver gym_id no profile, verificar se é personal trainer e buscar de user_roles
        if (!gymId) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("gym_id")
            .eq("user_id", user.id)
            .eq("role", "personal")
            .maybeSingle();

          if (roleData?.gym_id) {
            gymId = roleData.gym_id;
          }
        }

        // Buscar nome da academia se houver gym_id
        let gymName: string | null = null;
        if (gymId) {
          const { data: gymData } = await supabase.from("gyms").select("name").eq("id", gymId).maybeSingle();

          gymName = gymData?.name || null;
        }

        setProfile({
          name: data.name || "",
          age: data.age,
          gender: data.gender,
          weight: data.weight,
          height: data.height,
          goal: data.goal,
          experience_level: data.experience_level,
          avatar_url: data.avatar_url,
          dietary_preferences: data.dietary_preferences || [],
          dietary_restrictions: data.dietary_restrictions || [],
          gym_id: gymId,
          gym_name: gymName,
        });
      }
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("No user logged in") };

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchProfile();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const calculateIMC = () => {
    if (profile?.weight && profile?.height) {
      const heightInM = profile.height / 100;
      return (profile.weight / (heightInM * heightInM)).toFixed(1);
    }
    return null;
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile: fetchProfile,
    calculateIMC,
  };
}
