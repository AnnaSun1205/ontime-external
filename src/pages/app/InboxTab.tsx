import { useState, useEffect } from "react";
import { ExternalLink, Calendar, Building2, Check, Bell, Zap, Clock, Info, Archive, Inbox, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InboxItem {
  id: string;
  type: "live" | "prep" | "info" | "update";
  urgency: "now" | "prepare" | "fyi";
  company: string;
  role: string;
  message: string;
  timestamp: Date; // Use actual Date for proper formatting
  link?: string;
  daysUntil?: number;
  isNew: boolean; // "new" badge state
  isArchived: boolean; // moved to archive
  archivedAt?: Date; // when it was archived
  opening_id?: string; // FK to opening_signals
}

interface OpeningInboxRow {
  opening_id: string;
  created_at: string;
  section: string;
  status: string;
  opening_signals: {
    id: string;
    company_name: string;
    role_title: string;
    location: string | null;
    term: string;
    apply_url: string;
    posted_at: string | null;
    first_seen_at: string;
    last_seen_at: string;
  };
}

// Helper to format timestamps
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 1) {
    const mins = Math.floor(diffMs / (1000 * 60));
    return mins <= 1 ? "Just now" : `${mins}m ago`;
  }
  if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  }
  // Older than 24 hours: show actual date
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Mock inbox items - in production these would come from a backend
const createInitialItems = (): InboxItem[] => {
  const now = new Date();
  return [
    { 
      id: "1",
      type: "live", 
      urgency: "now",
      company: "Meta", 
      role: "SWE Intern", 
      message: "Applications are now open. Apply before the deadline.", 
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      link: "https://careers.meta.com",
      isNew: true,
      isArchived: false
    },
    { 
      id: "2",
      type: "prep", 
      urgency: "prepare",
      company: "Google", 
      role: "SWE Intern", 
      message: "Opens in 7 days based on last year. Start preparing.", 
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
      daysUntil: 7,
      isNew: true,
      isArchived: false
    },
    { 
      id: "3",
      type: "live", 
      urgency: "now",
      company: "Stripe", 
      role: "PM Intern", 
      message: "Applications are now open.", 
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      link: "https://stripe.com/jobs",
      isNew: true,
      isArchived: false
    },
    { 
      id: "4",
      type: "update", 
      urgency: "fyi",
      company: "Amazon", 
      role: "SDE Intern", 
      message: "Application deadline extended to Jan 15.", 
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      isNew: false,
      isArchived: false
    },
    { 
      id: "5",
      type: "info", 
      urgency: "fyi",
      company: "Apple", 
      role: "ML Intern", 
      message: "Opening this month based on historical data.", 
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      isNew: false,
      isArchived: true,
      archivedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
    },
    { 
      id: "6",
      type: "prep", 
      urgency: "prepare",
      company: "Netflix", 
      role: "SWE Intern", 
      message: "Opens in 3 days. Get your resume ready.", 
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      daysUntil: 3,
      isNew: true,
      isArchived: false
    },
  ];
};

function getTypeLabel(type: InboxItem["type"]) {
  switch (type) {
    case "live": return "Apply Now";
    case "prep": return "Opens Soon";
    case "info": return "Opening Soon";
    case "update": return "Update";
  }
}

function getTypeBadgeStyles(type: InboxItem["type"], isArchived: boolean) {
  const base = isArchived ? "opacity-60" : "";
  switch (type) {
    case "live": 
      return cn("bg-status-live text-white", base);
    case "prep": 
      return cn("bg-status-prepare text-white", base);
    case "info": 
      return cn("bg-status-opens-soon text-white", base);
    case "update": 
      return cn("bg-status-expected text-white", base);
  }
}

function getLeftBorderColor(type: InboxItem["type"]) {
  switch (type) {
    case "live": return "border-l-status-live";
    case "prep": return "border-l-status-prepare";
    case "info": return "border-l-status-opens-soon";
    case "update": return "border-l-status-expected";
  }
}

function getActionButtonStyles(type: InboxItem["type"], isArchived: boolean) {
  if (isArchived) {
    return "bg-secondary text-foreground hover:bg-secondary/80";
  }
  switch (type) {
    case "live": 
      return "bg-status-live text-white hover:bg-status-live/90";
    case "prep": 
      return "bg-status-prepare text-white hover:bg-status-prepare/90";
    case "info": 
      return "bg-status-opens-soon text-white hover:bg-status-opens-soon/90";
    case "update": 
      return "bg-status-expected text-white hover:bg-status-expected/90";
  }
}

interface UrgencyGroup {
  key: "now" | "prepare" | "fyi";
  label: string;
  description: string;
  emptyMessage: string;
  icon: typeof Zap;
  items: InboxItem[];
}

export default function InboxTab() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "archive">("active");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch opening_inbox data from Supabase
  useEffect(() => {
    async function fetchInboxItems() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      setUserId(user.id);
      
      try {
        // For active tab: show status='active'
        // For archive tab: show status='archived' (not 'hidden')
        const statusFilter = activeTab === "active" ? "active" : "archived";
        
        const { data: inboxData, error } = await supabase
          .from('opening_inbox' as any)
          .select('opening_id, created_at, section, status, opening_signals(*)')
          .eq('user_id', user.id)
          .eq('status', statusFilter)
          .eq('section', 'action_required')
          .order('created_at', { ascending: false }) as { data: OpeningInboxRow[] | null; error: any };
        
        if (error) {
          console.error('[Inbox] Error fetching inbox items:', error);
          toast.error('Failed to load inbox items');
          setLoading(false);
          return;
        }
        
        // Transform opening_inbox rows to InboxItem format
        const transformedItems: InboxItem[] = (inboxData || []).map((row: OpeningInboxRow) => {
          const signal = row.opening_signals;
          if (!signal) {
            console.warn('[Inbox] Missing opening_signals for row:', row);
            return null;
          }
          return {
            id: row.opening_id, // Use opening_id as the item id
            type: "live" as const, // Default to "live" for action_required items
            urgency: "now" as const, // Action required items are "now"
            company: signal.company_name || '',
            role: signal.role_title || '',
            message: `${signal.company_name} — ${signal.role_title} is available. Apply now.`,
            timestamp: new Date(row.created_at),
            link: signal.apply_url || undefined,
            isNew: false, // Can be enhanced later with read tracking
            isArchived: statusFilter === "archived",
            archivedAt: statusFilter === "archived" ? new Date(row.created_at) : undefined,
            opening_id: row.opening_id
          };
        }).filter((item) => item !== null) as InboxItem[];
        
        setItems(transformedItems);
      } catch (err) {
        console.error('[Inbox] Error:', err);
        toast.error('Failed to load inbox items');
      } finally {
        setLoading(false);
      }
    }
    
    fetchInboxItems();
  }, [activeTab]);

  // Mark item as read (remove "new" badge only)
  const markAsRead = (id: string) => {
    setItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isNew: false } : item
      )
    );
  };

  // Hide an item - update opening_inbox.status to 'hidden'
  const archiveItem = async (id: string) => {
    if (!userId) return;
    
    const { error } = await supabase
      .from('opening_inbox' as any)
      .update({ status: 'hidden' })
      .eq('user_id', userId)
      .eq('opening_id', id);
    
    if (error) {
      console.error('[Inbox] Error hiding item:', error);
      toast.error('Failed to hide item');
      return;
    }
    
    // Remove from list (hidden items don't show in either tab)
    setItems(prev => prev.filter(item => item.id !== id));
    toast.success('Item hidden');
  };

  // Archive an item - update opening_inbox.status to 'archived'
  const archiveToArchive = async (id: string) => {
    if (!userId) return;
    
    const { error } = await supabase
      .from('opening_inbox' as any)
      .update({ status: 'archived' })
      .eq('user_id', userId)
      .eq('opening_id', id);
    
    if (error) {
      console.error('[Inbox] Error archiving item:', error);
      toast.error('Failed to archive item');
      return;
    }
    
    // If on active tab, remove from list (will show in archive tab)
    if (activeTab === "active") {
      setItems(prev => prev.filter(item => item.id !== id));
    } else {
      // If on archive tab, update local state
      setItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, isArchived: true, archivedAt: new Date() } : item
        )
      );
    }
    
    toast.success('Item archived');
  };

  // Unarchive/Restore an item - update opening_inbox.status back to active
  const unarchiveItem = async (id: string) => {
    if (!userId) return;
    
    const { error } = await supabase
      .from('opening_inbox' as any)
      .update({ status: 'active' })
      .eq('user_id', userId)
      .eq('opening_id', id);
    
    if (error) {
      console.error('[Inbox] Error restoring item:', error);
      toast.error('Failed to restore item');
      return;
    }
    
    // If on archive tab, remove from list (will show in active tab)
    if (activeTab === "archive") {
      setItems(prev => prev.filter(item => item.id !== id));
    } else {
      // If on active tab, update local state
      setItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, isArchived: false, archivedAt: undefined } : item
        )
      );
    }
    
    toast.success('Item restored');
  };


  const markAllAsRead = () => {
    setItems(prev => prev.map(item => ({ ...item, isNew: false })));
  };

  // Items are already filtered by status in the query based on activeTab
  // activeTab="active" shows status='active', activeTab="archive" shows status='archived'
  const activeItems = activeTab === "active" ? items : [];
  const archivedItems = activeTab === "archive" ? items : [];
  const newCount = activeItems.filter(item => item.isNew).length;

  const handleCardClick = (item: InboxItem) => {
    // Different behavior per urgency type
    if (item.urgency === "now") {
      // Action Required: clicking just removes "new" badge, card stays
      markAsRead(item.id);
    } else if (item.urgency === "prepare") {
      // Prepare: reading removes "new" state, keeps visible
      markAsRead(item.id);
    } else if (item.urgency === "fyi") {
      // FYI: reading starts the auto-archive timer
      markAsRead(item.id);
    }
  };

  const handlePrimaryAction = (e: React.MouseEvent, item: InboxItem) => {
    e.stopPropagation();
    markAsRead(item.id);
    
    if (item.type === "live" && item.link) {
      window.open(item.link, "_blank");
    } else if (item.type === "prep" || item.type === "info") {
      navigate("/app");
    } else {
      navigate(`/app/companies`);
    }
  };

  const handleArchiveAction = (e: React.MouseEvent, item: InboxItem) => {
    e.stopPropagation();
    if (item.isArchived) {
      // Restore from archive
      unarchiveItem(item.id);
    } else {
      // Hide item (sets status to 'hidden')
      archiveItem(item.id);
    }
  };

  const getPrimaryActionLabel = (item: InboxItem) => {
    if (item.type === "live" && item.link) return "Apply";
    if (item.type === "prep" || item.type === "info") return "View Agenda";
    return "View Details";
  };

  const getPrimaryActionIcon = (item: InboxItem) => {
    if (item.type === "live" && item.link) return ExternalLink;
    if (item.type === "prep" || item.type === "info") return Calendar;
    return Building2;
  };

  // Group items by urgency
  const createUrgencyGroups = (itemList: InboxItem[]): UrgencyGroup[] => [
    {
      key: "now" as const,
      label: "Action Required",
      description: "Apply now — these are live",
      emptyMessage: "No live postings right now",
      icon: Zap,
      items: itemList.filter(item => item.urgency === "now")
    },
    {
      key: "prepare" as const,
      label: "Prepare",
      description: "Opening soon — get ready",
      emptyMessage: "No upcoming openings to prepare for",
      icon: Clock,
      items: itemList.filter(item => item.urgency === "prepare")
    },
    {
      key: "fyi" as const,
      label: "For Your Info",
      description: "Updates and upcoming openings",
      emptyMessage: "No updates at the moment",
      icon: Info,
      items: itemList.filter(item => item.urgency === "fyi")
    }
  ];

  const activeGroups = createUrgencyGroups(activeItems);
  const archivedGroups = createUrgencyGroups(archivedItems).filter(g => g.items.length > 0);

  const renderCard = (item: InboxItem) => {
    const ActionIcon = getPrimaryActionIcon(item);
    const showArchiveButton = item.urgency === "now" || item.isArchived;
    
    return (
      <div 
        key={item.id} 
        onClick={() => handleCardClick(item)}
        className={cn(
          "bg-card border border-border rounded-xl p-4 md:p-5 cursor-pointer transition-all duration-200 border-l-[3px] md:border-l-4",
          getLeftBorderColor(item.type),
          item.isArchived 
            ? "opacity-50 hover:opacity-70" 
            : "shadow-sm hover:shadow-md"
        )}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
              <span className={cn(
                "text-[10px] md:text-xs font-semibold px-1.5 md:px-2 py-0.5 rounded",
                getTypeBadgeStyles(item.type, item.isArchived)
              )}>
                {getTypeLabel(item.type)}
              </span>
              {item.isNew && !item.isArchived && (
                <span className="text-[10px] md:text-xs font-semibold px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                  New
                </span>
              )}
              <span className="text-[10px] md:text-xs text-muted-foreground">{formatTimestamp(item.timestamp)}</span>
            </div>
            <p className={cn(
              "font-semibold text-sm md:text-base",
              item.isArchived ? "text-muted-foreground" : "text-foreground"
            )}>
              {item.company} — {item.role}
            </p>
            <p className={cn(
              "text-xs md:text-sm mt-1",
              item.isArchived ? "text-muted-foreground/70" : "text-muted-foreground"
            )}>
              {item.message}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Archive/Unarchive button for Action Required items */}
            {showArchiveButton && (
              <button
                onClick={(e) => handleArchiveAction(e, item)}
                className="flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2.5 md:py-2 rounded-lg transition-all bg-secondary text-foreground hover:bg-secondary/80"
                title={item.isArchived ? "Restore" : "Mark done"}
              >
                {item.isArchived ? (
                  <>
                    <Inbox className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Restore</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Hide</span>
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={(e) => handlePrimaryAction(e, item)}
              className={cn(
                "flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2.5 md:py-2 rounded-lg transition-all whitespace-nowrap",
                getActionButtonStyles(item.type, item.isArchived)
              )}
            >
              {getPrimaryActionLabel(item)}
              <ActionIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEmptySection = (message: string) => (
    <div className="text-center py-6 text-muted-foreground/60 bg-secondary/30 rounded-lg border border-border/50">
      <p className="text-sm">{message}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <h1 className="text-xl md:text-2xl font-bold">Inbox</h1>
          {newCount > 0 && (
            <span className="bg-status-live text-white text-[10px] md:text-xs font-semibold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full">
              {newCount} new
            </span>
          )}
        </div>
        {newCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 md:gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-lg hover:bg-secondary"
          >
            <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Mark all read</span>
            <span className="sm:hidden">Read all</span>
          </button>
        )}
      </div>

      {/* Active/Archive Toggle */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg w-fit mb-6">
        <button
          onClick={() => setActiveTab("active")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === "active"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Inbox className="w-4 h-4" />
          Active
          {activeItems.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {activeItems.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("archive")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === "archive"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Archive className="w-4 h-4" />
          Archive
          {archivedItems.length > 0 && (
            <span className="text-xs bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">
              {archivedItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Explainer */}
      <div className="bg-card border border-border rounded-lg px-4 py-3 mb-6 md:mb-8">
        <p className="text-xs md:text-sm text-muted-foreground">
          {activeTab === "active" ? (
            <>
              <span className="font-medium text-foreground">Your decision list.</span>{" "}
              Items that need your attention — sorted by urgency. Take action or dismiss.
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">Completed & dismissed items.</span>{" "}
              Items you've handled or hidden. Restore them if needed.
            </>
          )}
        </p>
      </div>

      {activeTab === "active" ? (
        <>
          {/* Active items - show all groups with placeholders */}
          <div className="space-y-8">
            {activeGroups.map((group) => {
              const GroupIcon = group.icon;
              const newInGroup = group.items.filter(i => i.isNew).length;
              
              return (
                <div key={group.key}>
                  {/* Group header */}
                  <div className="flex items-center gap-2 mb-3">
                    <GroupIcon className={cn(
                      "w-4 h-4",
                      group.key === "now" && "text-status-live",
                      group.key === "prepare" && "text-status-prepare",
                      group.key === "fyi" && "text-muted-foreground"
                    )} />
                    <h2 className="text-sm md:text-base font-semibold">{group.label}</h2>
                    {newInGroup > 0 && (
                      <span className="text-[10px] md:text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                        {newInGroup} new
                      </span>
                    )}
                    <span className="hidden md:inline text-xs text-muted-foreground ml-1">
                      — {group.description}
                    </span>
                  </div>
                  
                  {/* Group items or empty placeholder */}
                  {group.items.length > 0 ? (
                    <div className="space-y-3">
                      {group.items.map(renderCard)}
                    </div>
                  ) : (
                    renderEmptySection(group.emptyMessage)
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Archive tab */}
          {archivedItems.length === 0 ? (
            <div className="text-center py-12 md:py-16 text-muted-foreground bg-card rounded-xl md:rounded-2xl border border-border">
              <Archive className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-40" />
              <p className="text-base md:text-lg font-medium text-foreground">Archive is empty</p>
              <p className="text-sm mt-1">Completed and dismissed items will appear here.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {archivedGroups.map((group) => {
                const GroupIcon = group.icon;
                
                return (
                  <div key={group.key}>
                    {/* Group header */}
                    <div className="flex items-center gap-2 mb-3">
                      <GroupIcon className={cn(
                        "w-4 h-4",
                        group.key === "now" && "text-status-live",
                        group.key === "prepare" && "text-status-prepare",
                        group.key === "fyi" && "text-muted-foreground"
                      )} />
                      <h2 className="text-sm md:text-base font-semibold">{group.label}</h2>
                      <span className="text-[10px] md:text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                        {group.items.length}
                      </span>
                    </div>
                    
                    {/* Group items */}
                    <div className="space-y-3">
                      {group.items.map(renderCard)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Footer hint */}
      {items.length > 0 && (
        <p className="text-[10px] md:text-xs text-muted-foreground text-center mt-6 md:mt-8 pb-4">
          {activeTab === "active" 
            ? "Prepare items persist until they go live. FYI items auto-archive after reading."
            : "Archived items are kept for 30 days."}
        </p>
      )}
    </div>
  );
}
