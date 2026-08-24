import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReliefStore } from "@/lib/store";
import { PROOF_LABEL, type ProofKind } from "@/lib/types";
import { selectClass } from "@/lib/utils";

const KINDS: ProofKind[] = [
  "receipt",
  "invoice",
  "delivery_bill",
  "distribution_record",
];

export function ProofUpload({ txId }: { txId: string }) {
  const uploadProof = useReliefStore((s) => s.uploadProof);
  const [kind, setKind] = useState<ProofKind>("receipt");
  const [amount, setAmount] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [mime, setMime] = useState("application/octet-stream");

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2_500_000) {
      toast.error("Keep proof files under 2.5 MB for this prototype.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDataUrl(String(reader.result));
      setFileName(file.name);
      setMime(file.type || "application/octet-stream");
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!fileName || !dataUrl) {
      toast.error("Attach a receipt, invoice, or delivery bill.");
      return;
    }
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter the quantity shown on the document.");
      return;
    }
    uploadProof({
      txId,
      kind,
      fileName,
      dataUrl,
      mimeType: mime,
      amountEntered: n,
    });
    toast.success("Proof uploaded. AI/OCR check ran against the declared quantity.");
    setFileName(null);
    setDataUrl(null);
    setAmount("");
  };

  return (
    <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <h3 className="text-sm font-semibold">Upload proof</h3>
      <p className="mt-1 text-xs text-muted">
        Simulated AI/OCR compares the quantity you enter with the declared
        amount. A mismatch flags the transfer as disputed.
      </p>
      <div className="mt-4 grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="kind">Document type</Label>
          <select
            id="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as ProofKind)}
            className={selectClass}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {PROOF_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="amt">Quantity on document</Label>
          <Input
            id="amt"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Must match declared quantity"
          />
        </div>
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg bg-bg px-3 py-2 text-sm shadow-[var(--shadow-border)]">
          {fileName ? (
            <FileText className="size-4 shrink-0 text-muted" />
          ) : (
            <Upload className="size-4 shrink-0 text-muted" />
          )}
          <span className="truncate text-muted">
            {fileName ?? "Image or PDF"}
          </span>
          <input
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
        <Button variant="outline" onClick={submit}>
          Run verification
        </Button>
      </div>
    </div>
  );
}
