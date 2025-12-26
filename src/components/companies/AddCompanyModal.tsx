import { useState, useMemo } from "react";
import { Search, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AddCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCompanies: string[];
  trackedCompanies: string[];
  onAddCompany: (company: string, roles: string[], seasons: string[]) => void;
}

const ALL_ROLES = ["SWE", "PM", "Data", "Design", "Finance", "Consulting"];
const ALL_SEASONS = ["Summer", "Fall", "Winter"];

export function AddCompanyModal({
  open,
  onOpenChange,
  availableCompanies,
  trackedCompanies,
  onAddCompany,
}: AddCompanyModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["SWE"]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(["Summer"]);

  // Filter companies not already tracked
  const untracked = useMemo(() => {
    return availableCompanies.filter(c => !trackedCompanies.includes(c));
  }, [availableCompanies, trackedCompanies]);

  // Filter by search
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return untracked;
    return untracked.filter(c =>
      c.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [untracked, searchQuery]);

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
    if (selectedCompany && selectedRoles.length > 0 && selectedSeasons.length > 0) {
      onAddCompany(selectedCompany, selectedRoles, selectedSeasons);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedCompany(null);
    setSelectedRoles(["SWE"]);
    setSelectedSeasons(["Summer"]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Company</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Company Search */}
          <div>
            <label className="text-sm font-medium mb-2 block">Company</label>
            {selectedCompany ? (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">{selectedCompany}</span>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="mt-2 max-h-40 overflow-y-auto border border-border rounded-lg">
                  {filteredCompanies.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground text-center">
                      No companies found
                    </p>
                  ) : (
                    filteredCompanies.slice(0, 10).map(company => (
                      <button
                        key={company}
                        onClick={() => setSelectedCompany(company)}
                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                      >
                        {company}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

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
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedCompany || selectedRoles.length === 0 || selectedSeasons.length === 0}
            >
              Add Company
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
