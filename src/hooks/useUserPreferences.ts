import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserPreferences {
  id?: string;
  user_id?: string;
  selected_seasons: string[];
  selected_regions: string[];
  selected_roles: string[];
  selected_companies: string[];
  email: string;
  quiet_mode: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  selected_seasons: [],
  selected_regions: [],
  selected_roles: [],
  selected_companies: [],
  email: "",
  quiet_mode: true,
};

// MOCK DATA FOR UI TESTING - Remove when auth is re-enabled
const MOCK_PREFERENCES: UserPreferences = {
  selected_seasons: ["Summer", "Fall"],
  selected_regions: ["US", "Remote"],
  selected_roles: ["SWE", "PM", "Data"],
  selected_companies: ["Google", "Meta", "Amazon", "Apple", "Microsoft", "Stripe", "Goldman Sachs", "Jane Street", "Palantir", "NVIDIA"],
  email: "test@example.com",
  quiet_mode: false,
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch preferences when user is available
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!userId) {
        // USE MOCK DATA FOR UI TESTING
        setPreferences(MOCK_PREFERENCES);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching preferences:", error);
          return;
        }

        if (data) {
          setPreferences({
            id: data.id,
            user_id: data.user_id,
            selected_seasons: data.selected_seasons || [],
            selected_regions: data.selected_regions || [],
            selected_roles: data.selected_roles || [],
            selected_companies: data.selected_companies || [],
            email: data.email || "",
            quiet_mode: data.quiet_mode ?? true,
          });
        }
      } catch (err) {
        console.error("Error fetching preferences:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [userId]);

  // Save preferences
  const savePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    if (!userId) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to save your preferences.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const dataToSave = {
        user_id: userId,
        selected_seasons: newPreferences.selected_seasons ?? preferences.selected_seasons,
        selected_regions: newPreferences.selected_regions ?? preferences.selected_regions,
        selected_roles: newPreferences.selected_roles ?? preferences.selected_roles,
        selected_companies: newPreferences.selected_companies ?? preferences.selected_companies,
        email: newPreferences.email ?? preferences.email,
        quiet_mode: newPreferences.quiet_mode ?? preferences.quiet_mode,
      };

      const { data, error } = await supabase
        .from("user_preferences")
        .upsert(dataToSave, { onConflict: "user_id" })
        .select()
        .single();

      if (error) {
        console.error("Error saving preferences:", error);
        toast({
          title: "Error saving preferences",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setPreferences({
        id: data.id,
        user_id: data.user_id,
        selected_seasons: data.selected_seasons || [],
        selected_regions: data.selected_regions || [],
        selected_roles: data.selected_roles || [],
        selected_companies: data.selected_companies || [],
        email: data.email || "",
        quiet_mode: data.quiet_mode ?? true,
      });

      return true;
    } catch (err) {
      console.error("Error saving preferences:", err);
      return false;
    }
  }, [userId, preferences, toast]);

  // Update company paused status (local toggle for now)
  const toggleCompanyPaused = useCallback((companyName: string) => {
    // For now, just update local state - could be extended to persist paused state
    setPreferences(prev => ({
      ...prev,
      // This would need a more complex data structure to track paused companies
    }));
  }, []);

  return {
    preferences,
    loading,
    isAuthenticated: !!userId,
    savePreferences,
    toggleCompanyPaused,
  };
}