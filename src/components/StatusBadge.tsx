import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, type ApplicationStatus } from "@/lib/types";

const STYLES: Record<ApplicationStatus, string> = {
  applied: "bg-secondary text-secondary-foreground",
  screening: "bg-info/15 text-info border-info/20",
  shortlisted: "bg-warning/20 text-warning-foreground border-warning/30",
  interview_scheduled: "bg-primary/12 text-primary border-primary/25",
  rejected: "bg-destructive/12 text-destructive border-destructive/20",
  approved: "bg-success/15 text-success border-success/25",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("border font-medium", STYLES[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
