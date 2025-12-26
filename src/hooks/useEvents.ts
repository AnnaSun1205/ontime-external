import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CalendarEventDB {
  id: string;
  user_id: string;
  board_id: string;
  company_name: string;
  title: string;
  event_type: string;
  start_at: string;
  end_at: string | null;
  source: string;
  created_at: string;
}

export function useEvents(boardId?: string) {
  const [events, setEvents] = useState<CalendarEventDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setEvents([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id);

      if (boardId) {
        query = query.eq("board_id", boardId);
      }

      const { data, error: fetchError } = await query.order("start_at", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [boardId]);

  const createEvent = async (event: Omit<CalendarEventDB, "id" | "user_id" | "created_at">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("events")
      .insert({
        user_id: user.id,
        board_id: event.board_id,
        company_name: event.company_name,
        title: event.title,
        event_type: event.event_type,
        start_at: event.start_at,
        end_at: event.end_at,
        source: event.source || "generated",
      })
      .select()
      .single();

    if (error) throw error;
    setEvents((prev) => [...prev, data].sort((a, b) => 
      new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    ));
    return data;
  };

  const createManyEvents = async (eventsData: Array<Omit<CalendarEventDB, "id" | "user_id" | "created_at">>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const eventsWithUserId = eventsData.map(e => ({
      ...e,
      user_id: user.id,
      source: e.source || "generated",
    }));

    const { data, error } = await supabase
      .from("events")
      .insert(eventsWithUserId)
      .select();

    if (error) throw error;
    setEvents((prev) => [...prev, ...(data || [])].sort((a, b) => 
      new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    ));
    return data;
  };

  const deleteEvent = async (eventId: string) => {
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) throw error;
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  return { events, loading, error, fetchEvents, createEvent, createManyEvents, deleteEvent };
}
