import { useState, useEffect } from "react";
import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CompanyData {
  name: string;
  roles: string[];
  seasons: string[];
}

interface EditCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyData | null;
  onSave: (company: string, roles: string[], seasons: string[]) => void;
  onRemove: (company: string) => void;
}

const ALL_ROLES = ["SWE", "PM", "Data", "Design", "Finance", "Consulting"];
const ALL_SEASONS = ["Summer", "Fall", "Winter"];

export function EditCompanyModal({
  open,
  onOpenChange,
  company,
  onSave,
  onRemove,
}: EditCompanyModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);

  useEffect(() => {
    if (company) {
      setSelectedRoles(company.roles);
      setSelectedSeasons(company.seasons);
    }
  }, [company]);

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const toggleSeason = (season: string) => {
    setSelectedSeasons(prev =>
      prev.includes(season) ? prev.filter(s => s !== season) : [...prev, season]
    );
  };

  const handleSave = () => {
    if (company && selectedRoles.length > 0 && selectedSeasons.length > 0) {
      onSave(company.name, selectedRoles, selectedSeasons);
      onOpenChange(false);
    }
  };

  const handleRemove = () => {
    if (company) {
      onRemove(company.name);
      onOpenChange(false);
    }
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {company.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Roles */}
          <div>
            <label className="text-sm font-medium mb-2 block">Roles</label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    selectedRoles.includes(role)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {selectedRoles.includes(role) && <Check className="w-3 h-3 inline mr-1" />}
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Seasons */}
          <div>
            <label className="text-sm font-medium mb-2 block">Seasons</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SEASONS.map(season => (
                <button
                  key={season}
                  onClick={() => toggleSeason(season)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    selectedSeasons.includes(season)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {selectedSeasons.includes(season) && <Check className="w-3 h-3 inline mr-1" />}
                  {season}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2">
            <Button variant="destructive" onClick={handleRemove} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Remove
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={selectedRoles.length === 0 || selectedSeasons.length === 0}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
