import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReliefStore } from "@/lib/store";
import { RESOURCE_LABEL } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export function ContributeDialog({
  requirementId,
  open,
  onOpenChange,
}: {
  requirementId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const item = useReliefStore((s) =>
    s.requirements.find((r) => r.id === requirementId),
  );
  const contribute = useReliefStore((s) => s.contribute);
  const navigate = useNavigate();
  const remaining = item
    ? Math.max(0, item.quantityNeeded - item.quantityFulfilled)
    : 0;
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!item) return;
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a quantity to send.");
      return;
    }
    const tx = contribute(item.id, n, notes);
    toast.success(
      `Committed ${tx.quantity} ${tx.quantityUnit} to ${item.campName}.`,
    );
    setQty("");
    setNotes("");
    onOpenChange(false);
    navigate({ to: "/transactions/$id", params: { id: tx.id } });
  };

  return (
    <Dialog
      open={open && !!item}
      onOpenChange={(v) => {
        if (!v) {
          setQty("");
          setNotes("");
        }
        onOpenChange(v);
      }}
    >
      <DialogContent>
        {item ? (
          <>
            <DialogHeader>
              <DialogTitle>Contribute</DialogTitle>
              <DialogDescription>
                {item.campName} needs {formatNumber(remaining)}{" "}
                {item.quantityUnit} of{" "}
                {RESOURCE_LABEL[item.resourceType].toLowerCase()}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="qty">Quantity ({item.quantityUnit})</Label>
                <Input
                  id="qty"
                  inputMode="numeric"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder={`Up to ${remaining}`}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="notes">Note</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Pickup window, vehicle, contact…"
                />
              </div>
              <Button variant="primary" onClick={submit}>
                Commit contribution
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
