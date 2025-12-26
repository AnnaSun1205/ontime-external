import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Board {
  id: string;
  user_id: string;
  name: string;
  season: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export function useBoards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setBoards([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("boards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setBoards(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch boards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const createBoard = async (board: Omit<Board, "id" | "user_id" | "created_at">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("boards")
      .insert({
        user_id: user.id,
        name: board.name,
        season: board.season,
        start_date: board.start_date,
        end_date: board.end_date,
      })
      .select()
      .single();

    if (error) throw error;
    setBoards((prev) => [data, ...prev]);
    return data;
  };

  return { boards, loading, error, fetchBoards, createBoard };
}
