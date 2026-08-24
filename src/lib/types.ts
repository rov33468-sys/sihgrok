export type Role = "donor" | "receiver" | "coordinator";

export type Priority = "critical" | "high" | "moderate" | "low";

export type ResourceType =
  | "food"
  | "water"
  | "shelter"
  | "medical"
  | "hygiene"
  | "clothing";

export type RequirementStatus = "open" | "partial" | "fulfilled";

export type TxStage =
  | "pending"
  | "donated"
  | "received_by_coordinator"
  | "in_transit"
  | "delivered"
  | "confirmed";

export type VerificationStatus = "pending_review" | "verified" | "mismatch_flagged";

export type SurplusStatus = "available" | "matched" | "transferred";

export type TxKind = "donation" | "redistribution";

export type ProofKind =
  | "receipt"
  | "invoice"
  | "delivery_bill"
  | "distribution_record";

export interface User {
  id: string;
  name: string;
  role: Role;
  orgName?: string;
  location?: string;
  region?: string;
  contributionType?: ResourceType;
}

export interface Requirement {
  id: string;
  title: string;
  campName: string;
  receiverId: string;
  resourceType: ResourceType;
  quantityNeeded: number;
  quantityUnit: string;
  quantityFulfilled: number;
  peopleAffected: number;
  durationDays: number;
  urgency: number;
  location: string;
  mapX: number;
  mapY: number;
  notes: string;
  createdAt: string;
  status: RequirementStatus;
  priority: Priority;
  priorityScore: number;
  scoreBreakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  people: number;
  gap: number;
  time: number;
  urgency: number;
}

export interface SurplusItem {
  id: string;
  campName: string;
  receiverId: string;
  resourceType: ResourceType;
  quantity: number;
  quantityUnit: string;
  location: string;
  mapX: number;
  mapY: number;
  notes: string;
  createdAt: string;
  matchedToRequirementId?: string;
  status: SurplusStatus;
}

export interface Proof {
  id: string;
  uploadedBy: Role;
  uploaderName: string;
  kind: ProofKind;
  fileName: string;
  dataUrl: string;
  mimeType: string;
  amountEntered: number;
  uploadedAt: string;
  verification: VerificationStatus;
}

export interface StageEvent {
  stage: TxStage;
  at: string;
  by: string;
}

export interface Transaction {
  id: string;
  kind: TxKind;
  requirementId: string;
  donorId: string;
  donorName: string;
  coordinatorId?: string;
  coordinatorName?: string;
  receiverId: string;
  receiverName: string;
  campName: string;
  resourceType: ResourceType;
  quantity: number;
  quantityUnit: string;
  declaredAmount: number;
  stage: TxStage;
  stageHistory: StageEvent[];
  proofs: Proof[];
  disputed: boolean;
  disputeReason?: string;
  createdAt: string;
  notes?: string;
}

export const RESOURCE_LABEL: Record<ResourceType, string> = {
  food: "Food",
  water: "Water",
  shelter: "Shelter",
  medical: "Medical",
  hygiene: "Hygiene",
  clothing: "Clothing",
};

export const RESOURCE_UNIT: Record<ResourceType, string> = {
  food: "packets",
  water: "litres",
  shelter: "tents",
  medical: "kits",
  hygiene: "kits",
  clothing: "blankets",
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  high: 1,
  moderate: 2,
  low: 3,
};

export const STAGE_ORDER: TxStage[] = [
  "pending",
  "donated",
  "received_by_coordinator",
  "in_transit",
  "delivered",
  "confirmed",
];

export const STAGE_LABEL: Record<TxStage, string> = {
  pending: "Pending",
  donated: "Donated",
  received_by_coordinator: "Received by Coordinator",
  in_transit: "In Transit",
  delivered: "Delivered",
  confirmed: "Confirmed",
};

export function nextStage(stage: TxStage): TxStage | null {
  const i = STAGE_ORDER.indexOf(stage);
  if (i < 0 || i >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[i + 1] ?? null;
}

export const ROLE_LABEL: Record<Role, string> = {
  donor: "Donor",
  receiver: "Receiver",
  coordinator: "Coordinator",
};

export const PROOF_LABEL: Record<ProofKind, string> = {
  receipt: "Receipt",
  invoice: "Invoice",
  delivery_bill: "Delivery bill",
  distribution_record: "Distribution record",
};
