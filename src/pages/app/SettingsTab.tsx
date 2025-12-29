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
  const [email, setEmail] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(true);
  const [quietMode, setQuietMode] = useState(true);
  
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

  useEffect(() => {
    // Detect local timezone
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(detectedTimezone);
  }, []);

  useEffect(() => {
    // Fetch authenticated user's email
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      setEmailLoading(false);
    };
    fetchUserEmail();
  }, []);

  const handleDownloadData = () => {
    toast.success("Your data export has been initiated. You'll receive an email shortly.");
  };

  const handleDeleteAccount = () => {
    toast.success("Account deletion request submitted. You'll receive a confirmation email.");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      {/* Email & Quiet Mode */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Email address</h2>
        <Input 
          type="email" 
          value={emailLoading ? "Loading..." : (email ?? "Not signed in")} 
          readOnly 
          className="bg-white dark:bg-slate-900 border-input"
        />
        <div className="flex items-center justify-between py-2">
          <div className={`transition-opacity duration-300 ${!quietMode ? 'opacity-50' : ''}`}>
            <p className="font-medium">Quiet mode</p>
            <p className="text-sm text-muted-foreground">Only prep + live signals</p>
          </div>
          <Switch checked={quietMode} onCheckedChange={setQuietMode} />
        </div>
        <div className="py-2">
          <p className="font-medium">Email window</p>
          <p className="text-sm text-muted-foreground">Mon–Fri, 8am–5pm local time</p>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Notification preferences</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className={`transition-opacity duration-300 ${!prepReminders ? 'opacity-50' : ''}`}>
              <p className="font-medium">Prep reminders</p>
              <p className="text-sm text-muted-foreground">Get reminded to prepare before deadlines</p>
            </div>
            <Switch checked={prepReminders} onCheckedChange={setPrepReminders} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div className={`transition-opacity duration-300 ${!liveAlerts ? 'opacity-50' : ''}`}>
              <p className="font-medium">Live opening alerts</p>
              <p className="text-sm text-muted-foreground">Notified when applications go live</p>
            </div>
            <Switch checked={liveAlerts} onCheckedChange={setLiveAlerts} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div className={`transition-opacity duration-300 ${!deadlineReminders ? 'opacity-50' : ''}`}>
              <p className="font-medium">Deadline reminders</p>
              <p className="text-sm text-muted-foreground">Alerts before application deadlines</p>
            </div>
            <Switch checked={deadlineReminders} onCheckedChange={setDeadlineReminders} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div className={`transition-opacity duration-300 ${!fyiUpdates ? 'opacity-50' : ''}`}>
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
            <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
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
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
