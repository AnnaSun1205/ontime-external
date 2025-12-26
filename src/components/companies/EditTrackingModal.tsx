import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SEASONS = ["Summer", "Fall", "Winter"];
const ROLES = ["SWE", "Data", "PM", "Consulting", "Finance", "Design"];

interface EditTrackingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  initialRoles: string[];
  initialSeasons: string[];
  onSave: (roles: string[], seasons: string[]) => void;
}

export function EditTrackingModal({
  open,
  onOpenChange,
  companyName,
  initialRoles,
  initialSeasons,
  onSave,
}: EditTrackingModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(initialRoles);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(initialSeasons);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleSeason = (season: string) => {
    setSelectedSeasons((prev) =>
      prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season]
    );
  };

  const handleSave = () => {
    if (selectedRoles.length > 0 && selectedSeasons.length > 0) {
      onSave(selectedRoles, selectedSeasons);
      onOpenChange(false);
    }
  };

  const canSave = selectedRoles.length > 0 && selectedSeasons.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit tracking for {companyName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seasons */}
          <div className="space-y-3">
            <Label>Recruiting Season</Label>
            <div className="grid grid-cols-3 gap-3">
              {SEASONS.map((season) => (
                <button
                  key={season}
                  onClick={() => toggleSeason(season)}
                  className={cn(
                    "py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center gap-2",
                    selectedSeasons.includes(season)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50 hover:bg-secondary"
                  )}
                >
                  {selectedSeasons.includes(season) && <Check className="w-4 h-4" />}
                  {season}
                </button>
              ))}
            </div>
          </div>

          {/* Roles */}
          <div className="space-y-3">
            <Label>Roles to track</Label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={cn(
                    "py-2 px-3 rounded-lg border text-sm transition-colors text-center",
                    selectedRoles.includes(role)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50 hover:bg-secondary"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
