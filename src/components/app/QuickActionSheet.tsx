import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Upload, User, FileText, FileCheck, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RESUME_CATEGORIES = [
  { value: "software_engineering", label: "Software Engineering" },
  { value: "data_engineering", label: "Data Engineering" },
  { value: "data_science", label: "Data Science / ML" },
  { value: "product_management", label: "Product Management" },
  { value: "investment_banking", label: "Investment Banking" },
  { value: "consulting", label: "Consulting" },
  { value: "quantitative_finance", label: "Quantitative Finance" },
  { value: "hardware_engineering", label: "Hardware Engineering" },
  { value: "general", label: "General" },
];

type Step = "actions" | "doc-type" | "uploading";

export function QuickActionSheet() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("actions");
  const [docType, setDocType] = useState<"resume" | "cover_letter" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("software_engineering");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setOpen(false);
    // Reset after animation
    setTimeout(() => {
      setStep("actions");
      setDocType(null);
    }, 300);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB.");
      return;
    }

    setIsUploading(true);
    setStep("uploading");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check resume count
      const { count } = await supabase
        .from("resumes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if ((count ?? 0) >= 5) {
        toast.error("Maximum 5 resumes allowed. Delete one first.");
        handleClose();
        return;
      }

      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("resumes").insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        category: selectedCategory,
        file_size: file.size,
      });
      if (dbError) throw dbError;

      toast.success("Document uploaded!");
      handleClose();
      navigate("/app/settings");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
      handleClose();
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* Center "+" trigger */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "relative -mt-5 flex items-center justify-center w-14 h-14 rounded-full",
          "bg-primary text-primary-foreground shadow-lg",
          "transition-all duration-300 ease-out",
          "hover:scale-105 hover:shadow-xl",
          "active:scale-95",
          open && "rotate-45 scale-110"
        )}
        aria-label="Quick actions"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm",
          "transition-opacity duration-300 ease-out",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[70] bg-card rounded-t-3xl shadow-2xl",
          "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-6 pb-10 pt-2 min-h-[240px]">
          {/* Step: Actions */}
          <div
            className={cn(
              "transition-all duration-250 ease-out",
              step === "actions"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 absolute pointer-events-none"
            )}
          >
            <h3 className="text-lg font-semibold mb-5 text-center">What would you like to do?</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStep("doc-type")}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-border bg-background hover:border-primary/20 hover:bg-secondary/50 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium">Upload Document</span>
              </button>
              <button
                onClick={() => { handleClose(); navigate("/app/settings"); }}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-border bg-background hover:border-primary/20 hover:bg-secondary/50 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium">View My Profile</span>
              </button>
            </div>
          </div>

          {/* Step: Document Type */}
          <div
            className={cn(
              "transition-all duration-250 ease-out",
              step === "doc-type"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 absolute pointer-events-none"
            )}
          >
            <div className="flex items-center gap-2 mb-5">
              <button
                onClick={() => setStep("actions")}
                className="p-1.5 -ml-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <h3 className="text-lg font-semibold">Upload a document</h3>
            </div>

            <div className="space-y-3 mb-5">
              <button
                onClick={() => setDocType("resume")}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 text-left",
                  docType === "resume"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/20"
                )}
              >
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">Resume</p>
                  <p className="text-xs text-muted-foreground">PDF or Word document</p>
                </div>
              </button>
              <button
                onClick={() => setDocType("cover_letter")}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 text-left",
                  docType === "cover_letter"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/20"
                )}
              >
                <FileCheck className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">Cover Letter</p>
                  <p className="text-xs text-muted-foreground">PDF or Word document</p>
                </div>
              </button>
            </div>

            {docType && (
              <div className="space-y-3 animate-fade-in">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full !bg-background">
                    <SelectValue placeholder="Category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RESUME_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors active:scale-[0.98]"
                >
                  <Upload className="w-4 h-4" />
                  Choose File
                </button>
              </div>
            )}
          </div>

          {/* Step: Uploading */}
          <div
            className={cn(
              "transition-all duration-250 ease-out flex flex-col items-center justify-center py-8",
              step === "uploading"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 absolute pointer-events-none"
            )}
          >
            <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Uploading your document…</p>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleUpload}
      />
    </>
  );
}
