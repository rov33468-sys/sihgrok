import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { PriorityBadge } from "@/components/priority-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { computePriorityScore } from "@/lib/scoring";
import { useReliefStore } from "@/lib/store";
import {
  RESOURCE_LABEL,
  RESOURCE_UNIT,
  type ResourceType,
} from "@/lib/types";
import { selectClass } from "@/lib/utils";

export const Route = createFileRoute("/_app/post")({ component: PostPage });

const RESOURCES = Object.keys(RESOURCE_LABEL) as ResourceType[];

function PostPage() {
  const user = useReliefStore((s) => s.currentUser);
  const postRequirement = useReliefStore((s) => s.postRequirement);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>("food");
  const [quantityNeeded, setQuantityNeeded] = useState("100");
  const [peopleAffected, setPeopleAffected] = useState("200");
  const [durationDays, setDurationDays] = useState("3");
  const [urgency, setUrgency] = useState(4);
  const [notes, setNotes] = useState("");

  const preview = computePriorityScore({
    peopleAffected: Number(peopleAffected) || 0,
    quantityRequired: Number(quantityNeeded) || 0,
    durationDays: Number(durationDays) || 0,
    urgency,
  });

  if (user?.role !== "receiver") {
    return (
      <p className="text-sm text-muted">
        Only camp receivers can post requirements. Switch identity from the
        sign-in screen.
      </p>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = postRequirement({
      title: title || `${RESOURCE_LABEL[resourceType]} for ${user.orgName ?? "camp"}`,
      resourceType,
      quantityNeeded: Number(quantityNeeded) || 1,
      peopleAffected: Number(peopleAffected) || 1,
      durationDays: Number(durationDays) || 1,
      urgency,
      notes,
    });
    toast.success(`Posted · AI Priority ${item.priority.toUpperCase()} (${item.priorityScore})`);
    navigate({ to: "/feed/$id", params: { id: item.id } });
  };

  return (
    <div className="rn-enter mx-auto max-w-xl">
      <PageHeader kicker={user.orgName || "Receiver"} title="Post a requirement" />
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Kitchen tents out of rations"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="res">Resource</Label>
            <select
              id="res"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value as ResourceType)}
              className={selectClass}
            >
              {RESOURCES.map((k) => (
                <option key={k} value={k}>
                  {RESOURCE_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="qty">Quantity ({RESOURCE_UNIT[resourceType]})</Label>
            <Input
              id="qty"
              inputMode="numeric"
              value={quantityNeeded}
              onChange={(e) => setQuantityNeeded(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="people">People affected</Label>
            <Input
              id="people"
              inputMode="numeric"
              value={peopleAffected}
              onChange={(e) => setPeopleAffected(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="days">Duration (days)</Label>
            <Input
              id="days"
              inputMode="numeric"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="urg">Urgency {urgency}/5</Label>
          <input
            id="urg"
            type="range"
            min={1}
            max={5}
            value={urgency}
            onChange={(e) => setUrgency(Number(e.target.value))}
            className="w-full accent-[var(--rn-accent)]"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="notes">Situation notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Access, storage, who is most at risk"
            required
          />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <div>
            <p className="text-[11px] tracking-wide text-muted uppercase">
              AI Priority Score
            </p>
            <p className="font-mono text-2xl font-semibold tabular">
              {preview.score}
            </p>
          </div>
          <PriorityBadge priority={preview.priority} score={preview.score} />
        </div>
        <Button type="submit" variant="primary">
          Publish to feed
        </Button>
      </form>
    </div>
  );
}
