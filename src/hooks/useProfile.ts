"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

// Definimos la estructura de lo que devuelve el hook
interface ProfileData {
  full_name: string;
  avatar_url: string;
  email: string;
  email_notifications: boolean;
  base_currency: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);

        // 1. Obtenemos la sesión actual del usuario
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          setProfile(null);
          return;
        }

        // 2. Traemos los datos adicionales de la tabla pública 'profiles'
        const { data: dbProfile, error: dbError } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, email_notifications, base_currency")
          .eq("id", user.id)
          .single();

        if (dbError) {
          console.error("Error cargando perfil:", dbError.message);
        }

        // 3. Consolidamos la información
        setProfile({
          full_name: dbProfile?.full_name || "Usuario",
          avatar_url: dbProfile?.avatar_url || "",
          email: user.email || "",
          email_notifications: dbProfile?.email_notifications ?? true,
          base_currency: dbProfile?.base_currency ?? 'COP',
        });

      } catch (err) {
        console.error("Error inesperado en useProfile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  return { profile, loading };
}