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
  show_investments: boolean;
  created_at: string;
}

const CACHE_KEY = 'profile_show_investments'

function readInvestmentsCache(): boolean {
  try { return localStorage.getItem(CACHE_KEY) === 'true' } catch { return false }
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  // Stable initial value from cache — prevents navbar shift on every render
  const [showInvestments, setShowInvestments] = useState<boolean>(readInvestmentsCache);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          setProfile(null);
          return;
        }

        const { data: dbProfile, error: dbError } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, email_notifications, base_currency, show_investments")
          .eq("id", user.id)
          .single();

        if (dbError) {
          console.error("Error cargando perfil:", dbError.message);
        }

        const si = dbProfile?.show_investments ?? false
        try { localStorage.setItem(CACHE_KEY, String(si)) } catch {}
        setShowInvestments(si)

        setProfile({
          full_name: dbProfile?.full_name || "Usuario",
          avatar_url: dbProfile?.avatar_url || "",
          email: user.email || "",
          email_notifications: dbProfile?.email_notifications ?? true,
          base_currency: dbProfile?.base_currency ?? 'COP',
          show_investments: si,
          created_at: user.created_at ?? "",
        });

      } catch (err) {
        console.error("Error inesperado en useProfile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  return { profile, loading, showInvestments };
}