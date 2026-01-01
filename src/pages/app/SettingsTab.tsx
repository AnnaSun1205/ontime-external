import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Trash2, Globe, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Stockholm",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Perth",
  "Pacific/Auckland",
  "Pacific/Honolulu",
];

export default function SettingsTab() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [quietMode, setQuietMode] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Notification preferences
  const [prepReminders, setPrepReminders] = useState(true);
  const [liveAlerts, setLiveAlerts] = useState(true);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [fyiUpdates, setFyiUpdates] = useState(false);
  
  // Prep reminder timing
  const [prepTiming, setPrepTiming] = useState("7");
  
  // Timezone
  const [timezone, setTimezone] = useState("");
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState("");

  const filteredTimezones = useMemo(() => {
    if (!timezoneSearch) return COMMON_TIMEZONES;
    return COMMON_TIMEZONES.filter(tz => 
      tz.toLowerCase().includes(timezoneSearch.toLowerCase())
    );
  }, [timezoneSearch]);

  // Fetch authenticated user's email on page load and auth state changes
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error fetching user:', error);
          setEmail(""); // Clear email if error
          return;
        }

        if (user?.email) {
          setEmail(user.email);
        } else {
          setEmail(""); // No email if user not authenticated
        }
      } catch (err) {
        console.error('Failed to fetch user email:', err);
        setEmail("");
      }
    };

    // Fetch email on mount
    fetchUserEmail();

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email) {
        setEmail(session.user.email);
      } else {
        setEmail(""); // Clear email on logout
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Detect local timezone
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(detectedTimezone);
  }, []);

  const handleDownloadData = () => {
    toast.success("Your data export has been initiated. You'll receive an email shortly.");
  };

  /**
   * Handles account deletion:
   * 1. Calls Edge Function via supabase.functions.invoke() (automatically includes JWT)
   * 2. Logs out user
   * 3. Redirects to landing page
   * 4. Clears client-side state
   */
  const handleDeleteAccount = async () => {
    console.log('delete clicked');
    setIsDeleting(true);
    
    try {
      // Get session and verify authentication
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('session exists?', !!sessionData.session);
      console.log('access_token exists?', !!sessionData.session?.access_token);
      console.log('access_token looks JWT?', sessionData.session?.access_token?.split('.').length === 3);
      
      if (!sessionData.session) {
        toast.error("You must be signed in to delete your account");
        setIsDeleting(false);
        return;
      }

      if (!sessionData.session.access_token) {
        toast.error("Session token missing. Please sign in again.");
        setIsDeleting(false);
        return;
      }

      // Call Edge Function using Supabase client (automatically includes user's JWT from session)
      // supabase.functions.invoke() automatically uses the current session's access_token
      const { data, error } = await supabase.functions.invoke('delete_account');
      console.log('invoke result', { data, error });

      if (error) {
        toast.error(`Failed to delete account: ${error.message || 'Unknown error'}`);
        setIsDeleting(false);
        return;
      }

      if (!data || !data.success) {
        toast.error(data?.error || 'Failed to delete account');
        setIsDeleting(false);
        return;
      }

      // Success: Show toast, log out, and redirect
      toast.success("Your account has been deleted successfully");
      
      // Sign out (clears session and local storage)
      await supabase.auth.signOut();
      
      // Redirect to landing page
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('Account deletion error:', error);
      toast.error(
        error instanceof Error 
          ? `Failed to delete account: ${error.message}`
          : "Failed to delete account. Please try again or contact support."
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      {/* Email Settings */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Email settings</h2>
        <div className="space-y-2">
          <Label>Email address</Label>
          <Input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder={email ? undefined : "Not signed in"}
            disabled={!email}
            className="!bg-white"
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="font-medium">Quiet mode</p>
            <p className="text-sm text-muted-foreground">Only prep + live signals</p>
          </div>
          <Switch checked={quietMode} onCheckedChange={setQuietMode} />
        </div>
        <div className="space-y-2">
          <Label>Email window</Label>
          <p className="text-sm text-muted-foreground">Mon–Fri, 8am–5pm local time</p>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Notification preferences</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Prep reminders</p>
              <p className="text-sm text-muted-foreground">Get reminded to prepare before deadlines</p>
            </div>
            <Switch checked={prepReminders} onCheckedChange={setPrepReminders} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Live opening alerts</p>
              <p className="text-sm text-muted-foreground">Notified when applications go live</p>
            </div>
            <Switch checked={liveAlerts} onCheckedChange={setLiveAlerts} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Deadline reminders</p>
              <p className="text-sm text-muted-foreground">Alerts before application deadlines</p>
            </div>
            <Switch checked={deadlineReminders} onCheckedChange={setDeadlineReminders} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">FYI updates</p>
              <p className="text-sm text-muted-foreground">General updates and tips</p>
            </div>
            <Switch checked={fyiUpdates} onCheckedChange={setFyiUpdates} />
          </div>
        </div>
      </div>

      {/* Prep Reminder Timing */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Prep reminder timing</h2>
        <div className="space-y-2">
          <Label>How early do you want prep alerts?</Label>
          <Select value={prepTiming} onValueChange={setPrepTiming}>
            <SelectTrigger className="w-full !bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 days before</SelectItem>
              <SelectItem value="7">7 days before</SelectItem>
              <SelectItem value="14">14 days before</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timezone */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-lg">Timezone</h2>
        </div>
        <Popover open={timezoneOpen} onOpenChange={setTimezoneOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={timezoneOpen}
              className="w-full justify-between font-normal"
            >
              {timezone || "Select timezone..."}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 bg-popover border border-border z-50" align="start">
            <Command>
              <CommandInput 
                placeholder="Search timezone..." 
                value={timezoneSearch}
                onValueChange={setTimezoneSearch}
              />
              <CommandList>
                <CommandEmpty>No timezone found.</CommandEmpty>
                <CommandGroup>
                  {filteredTimezones.map((tz) => (
                    <CommandItem
                      key={tz}
                      value={tz}
                      onSelect={() => {
                        setTimezone(tz);
                        setTimezoneOpen(false);
                        setTimezoneSearch("");
                      }}
                      className={cn(
                        "cursor-pointer",
                        timezone === tz && "bg-accent"
                      )}
                    >
                      {tz.replace(/_/g, " ")}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Export */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <Button variant="outline" className="gap-2" onClick={handleDownloadData}>
          <Download className="w-4 h-4" /> Export calendar (.ics)
        </Button>
        <p className="text-xs text-muted-foreground mt-3">We link to original postings. We don't auto-apply.</p>
      </div>

      {/* Account */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Account</h2>
        <div className="flex flex-col gap-3">
          <Button variant="outline" className="gap-2 justify-start" onClick={handleDownloadData}>
            <Download className="w-4 h-4" /> Download my data
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 justify-start text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" /> Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is permanent and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteAccount();
                  }}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
