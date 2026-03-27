import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import type { FieldResult } from "../types";

interface FieldDrawerProps {
  field: FieldResult | null;
  open: boolean;
  onClose: () => void;
}

const getSignalLabel = (value: number): { label: string; variant: "default" | "secondary" | "destructive" } => {
  if (value >= 0.9) return { label: "Very High", variant: "default" };
  if (value >= 0.7) return { label: "High", variant: "default" };
  if (value >= 0.5) return { label: "Medium", variant: "secondary" };
  if (value >= 0.3) return { label: "Low", variant: "secondary" };
  return { label: "Weak", variant: "destructive" };
};

const getCorruptionLabel = (value: number): { label: string; variant: "default" | "secondary" | "destructive" } => {
  if (value <= 0.1) return { label: "Absent", variant: "default" };
  if (value <= 0.3) return { label: "Possible", variant: "secondary" };
  return { label: "Present", variant: "destructive" };
};

export function FieldDrawer({ field, open, onClose }: FieldDrawerProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!field) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">{field.field_name}</SheetTitle>
          <SheetDescription>Detailed analysis and selection summary</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-3">Final Decision</h3>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Recommended Value:</span>
                  <p className="text-2xl font-semibold mt-1">{field.recommended_value || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      field.field_state === "pass"
                        ? "default"
                        : field.field_state === "review_needed"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {field.field_state === "pass"
                      ? "Pass"
                      : field.field_state === "review_needed"
                        ? "Review Needed"
                        : "Failed"}
                  </Badge>
                  <Badge variant="outline">Confidence: {field.field_confidence.replace("_", " ")}</Badge>
                </div>
                {field.state_reason ? (
                  <div className="pt-2 border-t">
                    <span className="text-sm font-medium text-gray-600">Reason:</span>
                    <p className="text-sm text-gray-700 mt-1">{field.state_reason}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-lg mb-3">Signals</h3>
            <div className="grid grid-cols-2 gap-3">
              <SignalCard label="Rule Consistency" value={field.signals.final_rule_consistency} badge={getSignalLabel(field.signals.final_rule_consistency)} />
              <SignalCard
                label="Engine Self-Consistency"
                value={field.signals.final_engine_self_consistency}
                badge={getSignalLabel(field.signals.final_engine_self_consistency)}
              />
              <SignalCard label="OCR Alignment" value={field.signals.final_ocr_alignment} badge={getSignalLabel(field.signals.final_ocr_alignment)} />
              <SignalCard
                label="OCR Corruption"
                value={field.signals.final_ocr_corruption}
                badge={getCorruptionLabel(field.signals.final_ocr_corruption)}
              />
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Selection Details</h3>
              <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? "Collapse" : "Expand"} Details
              </Button>
            </div>

            <Card>
              <CardContent className="p-4 space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Selected Engine:</span>
                  <p className="font-medium mt-1">
                    {field.selected_engine === "engineA"
                      ? "Engine A"
                      : field.selected_engine === "engineB"
                        ? "Engine B"
                        : "None"}
                  </p>
                </div>
                {showDetails ? (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Selected engine tokens:</span>
                        <span>{field.selected_engine_total_tokens ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Selected engine elapsed:</span>
                        <span>{(field.selected_engine_elapsed_seconds ?? 0).toFixed(4)}s</span>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-gray-600">Selection Reason:</span>
                      <p className="text-xs mt-1 text-gray-700">{field.selection_reason || "No additional selection reason provided."}</p>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SignalCard({
  label,
  value,
  badge,
}: {
  label: string;
  value: number;
  badge: { label: string; variant: "default" | "secondary" | "destructive" };
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <span className="text-sm text-gray-600">{label}</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">{value.toFixed(2)}</span>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
