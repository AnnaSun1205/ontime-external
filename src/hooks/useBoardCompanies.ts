import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BoardCompany {
  id: string;
  user_id: string;
  board_id: string;
  company_name: string;
  status: string;
  created_at: string;
}

export function useBoardCompanies(boardId?: string) {
  const [companies, setCompanies] = useState<BoardCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCompanies([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from("board_companies")
        .select("*")
        .eq("user_id", user.id);

      if (boardId) {
        query = query.eq("board_id", boardId);
      }

      const { data, error: fetchError } = await query.order("created_at", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setCompanies(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [boardId]);

  const createBoardCompany = async (company: Omit<BoardCompany, "id" | "user_id" | "created_at">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("board_companies")
      .insert({
        user_id: user.id,
        board_id: company.board_id,
        company_name: company.company_name,
        status: company.status || "interested",
      })
      .select()
      .single();

    if (error) throw error;
    setCompanies((prev) => [...prev, data]);
    return data;
  };

  const updateCompanyStatus = async (companyId: string, status: string) => {
    const { error } = await supabase
      .from("board_companies")
      .update({ status })
      .eq("id", companyId);

    if (error) throw error;
    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, status } : c))
    );
  };

  return { companies, loading, error, fetchCompanies, createBoardCompany, updateCompanyStatus };
}
