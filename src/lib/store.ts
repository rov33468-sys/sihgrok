import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mockVerifyAmount, computePriorityScore } from "./scoring";
import {
  seedRequirements,
  seedSurplus,
  seedTransactions,
  seedUsers,
} from "./seed";
import type {
  Priority,
  Proof,
  ProofKind,
  Requirement,
  ResourceType,
  Role,
  SurplusItem,
  Transaction,
  User,
} from "./types";
import { RESOURCE_UNIT, nextStage } from "./types";
import { uid as makeId } from "./utils";
import {
  fetchReliefData,
  dbSignup,
  dbPostRequirement,
  dbPostSurplus,
  dbSaveTransaction,
  dbResetDemo,
} from "./db-actions";
import {
  firestoreSaveUser,
  firestoreSaveRequirement,
  firestoreSaveSurplus,
  firestoreSaveTransaction,
  seedFirestoreIfEmpty,
} from "./firebase/db";
import { isFirebaseConfigured } from "./firebase/config";

export interface SignupInput {
  id?: string;
  name: string;
  role: Role;
  orgName?: string;
  location?: string;
  region?: string;
  contributionType?: ResourceType;
}

export interface PostRequirementInput {
  title: string;
  resourceType: ResourceType;
  quantityNeeded: number;
  peopleAffected: number;
  durationDays: number;
  urgency: number;
  notes: string;
}

export interface PostSurplusInput {
  resourceType: ResourceType;
  quantity: number;
  notes: string;
}

interface ReliefState {
  _hydrated: boolean;
  currentUser: User | null;
  fieldMode: boolean;
  users: User[];
  requirements: Requirement[];
  surplus: SurplusItem[];
  transactions: Transaction[];
  setHydrated: () => void;
  toggleFieldMode: () => void;
  loginAs: (userId: string) => void;
  signup: (input: SignupInput) => User;
  logout: () => void;
  resetDemo: () => void;
  postRequirement: (input: PostRequirementInput) => Requirement;
  postSurplus: (input: PostSurplusInput) => SurplusItem;
  contribute: (requirementId: string, quantity: number, notes: string) => Transaction;
  advanceStage: (txId: string) => void;
  uploadProof: (input: {
    txId: string;
    kind: ProofKind;
    fileName: string;
    dataUrl: string;
    mimeType: string;
    amountEntered: number;
  }) => void;
  matchSurplus: (surplusId: string, requirementId: string) => Transaction | null;
  resolveDispute: (txId: string) => void;
  syncFromDb: () => Promise<void>;
}

function refreshRequirementStatus(r: Requirement): Requirement {
  const remaining = r.quantityNeeded - r.quantityFulfilled;
  const status =
    remaining <= 0 ? "fulfilled" : r.quantityFulfilled > 0 ? "partial" : "open";
  const scored = computePriorityScore({
    peopleAffected: r.peopleAffected,
    quantityRequired: r.quantityNeeded,
    quantityFulfilled: r.quantityFulfilled,
    durationDays: r.durationDays,
    urgency: r.urgency,
  });
  return {
    ...r,
    status,
    priority: scored.priority,
    priorityScore: scored.score,
    scoreBreakdown: scored.breakdown,
  };
}

function applyProofs(tx: Transaction, proofs: Proof[]): Transaction {
  const amounts = proofs.map((p) => p.amountEntered).filter((n) => n > 0);
  let disputed = false;
  let disputeReason: string | undefined;
  if (amounts.length >= 2) {
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    if (max - min > Math.max(tx.declaredAmount, 1) * 0.08) {
      disputed = true;
      disputeReason = `Entered quantities do not match (${min} vs ${max}). Auto-flagged for review.`;
    }
  }
  if (proofs.some((p) => p.verification === "mismatch_flagged")) {
    disputed = true;
    disputeReason =
      disputeReason ??
      "AI/OCR verification flagged a mismatch against the declared quantity.";
  }
  return { ...tx, proofs, disputed, disputeReason };
}

export const useReliefStore = create<ReliefState>()(
  persist(
    (set, get) => ({
      _hydrated: false,
      currentUser: null,
      fieldMode: false,
      users: seedUsers,
      requirements: seedRequirements,
      surplus: seedSurplus,
      transactions: seedTransactions,

      setHydrated: () => set({ _hydrated: true }),

      toggleFieldMode: () => set((s) => ({ fieldMode: !s.fieldMode })),

      loginAs: (userId) => {
        const user = get().users.find((u) => u.id === userId);
        if (user) set({ currentUser: user });
      },

      syncFromDb: async () => {
        try {
          const data = await fetchReliefData();
          set({
            users: data.users,
            requirements: data.requirements,
            surplus: data.surplus,
            transactions: data.transactions,
          });
        } catch (err) {
          console.error("Failed to sync from database:", err);
        }
      },

      signup: (input) => {
        const user: User = {
          id: input.id || makeId("u"),
          name: input.name.trim(),
          role: input.role,
          orgName: input.orgName?.trim() || undefined,
          location: input.location?.trim() || undefined,
          region: input.region?.trim() || undefined,
          contributionType: input.contributionType,
        };
        set((s) => ({ users: [...s.users, user], currentUser: user }));
        void dbSignup({ data: user }).catch((err) =>
          console.error("[db] signup sync failed:", err)
        );
        void firestoreSaveUser(user).catch((err) =>
          console.error("[Firebase] signup save failed:", err)
        );
        return user;
      },

      logout: () => set({ currentUser: null }),

      resetDemo: () => {
        set({
          currentUser: null,
          users: seedUsers,
          requirements: seedRequirements,
          surplus: seedSurplus,
          transactions: seedTransactions,
        });
        void dbResetDemo().catch((err) =>
          console.error("[db] reset demo sync failed:", err)
        );
      },

      postRequirement: (input) => {
        const user = get().currentUser;
        if (!user || user.role !== "receiver") {
          throw new Error("Only receivers can post requirements.");
        }
        const scored = computePriorityScore({
          peopleAffected: input.peopleAffected,
          quantityRequired: input.quantityNeeded,
          quantityFulfilled: 0,
          durationDays: input.durationDays,
          urgency: input.urgency,
        });
        const campName = user.orgName || user.name;
        const existing = get().requirements.find((r) => r.receiverId === user.id);
        const item: Requirement = {
          id: makeId("req"),
          title: input.title.trim(),
          campName,
          receiverId: user.id,
          resourceType: input.resourceType,
          quantityNeeded: input.quantityNeeded,
          quantityUnit: RESOURCE_UNIT[input.resourceType],
          quantityFulfilled: 0,
          peopleAffected: input.peopleAffected,
          durationDays: input.durationDays,
          urgency: input.urgency,
          location: user.location || "Unspecified",
          mapX: existing?.mapX ?? 50 + Math.random() * 20,
          mapY: existing?.mapY ?? 40 + Math.random() * 20,
          notes: input.notes.trim(),
          createdAt: new Date().toISOString(),
          status: "open",
          priority: scored.priority,
          priorityScore: scored.score,
          scoreBreakdown: scored.breakdown,
        };
        set((s) => ({ requirements: [item, ...s.requirements] }));
        void dbPostRequirement({ data: item }).catch((err) =>
          console.error("[db] postRequirement sync failed:", err)
        );
        void firestoreSaveRequirement(item).catch((err) =>
          console.error("[Firebase] postRequirement save failed:", err)
        );
        return item;
      },

      postSurplus: (input) => {
        const user = get().currentUser;
        if (!user || user.role !== "receiver") {
          throw new Error("Only receivers can post surplus.");
        }
        const existing = get().requirements.find((r) => r.receiverId === user.id);
        const item: SurplusItem = {
          id: makeId("sur"),
          campName: user.orgName || user.name,
          receiverId: user.id,
          resourceType: input.resourceType,
          quantity: input.quantity,
          quantityUnit: RESOURCE_UNIT[input.resourceType],
          location: user.location || "Unspecified",
          mapX: existing?.mapX ?? 50,
          mapY: existing?.mapY ?? 50,
          notes: input.notes.trim(),
          createdAt: new Date().toISOString(),
          status: "available",
        };
        set((s) => ({ surplus: [item, ...s.surplus] }));
        void dbPostSurplus({ data: item }).catch((err) =>
          console.error("[db] postSurplus sync failed:", err)
        );
        void firestoreSaveSurplus(item).catch((err) =>
          console.error("[Firebase] postSurplus save failed:", err)
        );
        return item;
      },

      contribute: (requirementId, quantity, notes) => {
        const user = get().currentUser;
        if (!user || user.role !== "donor") {
          throw new Error("Only donors can contribute.");
        }
        const req = get().requirements.find((r) => r.id === requirementId);
        if (!req) throw new Error("Requirement not found.");
        const remaining = Math.max(0, req.quantityNeeded - req.quantityFulfilled);
        const qty = Math.max(1, Math.min(quantity, remaining || quantity));
        const now = new Date().toISOString();
        const tx: Transaction = {
          id: makeId("tx"),
          kind: "donation",
          requirementId: req.id,
          donorId: user.id,
          donorName: user.name,
          receiverId: req.receiverId,
          receiverName:
            get().users.find((u) => u.id === req.receiverId)?.name ?? req.campName,
          campName: req.campName,
          resourceType: req.resourceType,
          quantity: qty,
          quantityUnit: req.quantityUnit,
          declaredAmount: qty,
          stage: "donated",
          stageHistory: [
            { stage: "pending", at: now, by: user.name },
            { stage: "donated", at: now, by: user.name },
          ],
          proofs: [],
          disputed: false,
          createdAt: now,
          notes: notes.trim() || undefined,
        };
        const updatedReq = refreshRequirementStatus({
          ...req,
          quantityFulfilled: req.quantityFulfilled + qty,
        });
        set((s) => ({
          transactions: [tx, ...s.transactions],
          requirements: s.requirements.map((r) =>
            r.id === req.id ? updatedReq : r
          ),
        }));
        void dbSaveTransaction({ data: { tx, requirement: updatedReq } }).catch((err) =>
          console.error("[db] contribute sync failed:", err)
        );
        void firestoreSaveTransaction(tx).catch((err) =>
          console.error("[Firebase] contribute tx save failed:", err)
        );
        void firestoreSaveRequirement(updatedReq).catch((err) =>
          console.error("[Firebase] contribute req save failed:", err)
        );
        return tx;
      },

      advanceStage: (txId) => {
        const user = get().currentUser;
        if (!user) return;
        let updatedTx: Transaction | undefined;
        set((s) => ({
          transactions: s.transactions.map((tx) => {
            if (tx.id !== txId) return tx;
            const nxt = nextStage(tx.stage);
            if (!nxt) return tx;
            const now = new Date().toISOString();
            const patch: Partial<Transaction> = {
              stage: nxt,
              stageHistory: [
                ...tx.stageHistory,
                { stage: nxt, at: now, by: user.name },
              ],
            };
            if (
              user.role === "coordinator" &&
              (nxt === "received_by_coordinator" || nxt === "in_transit")
            ) {
              patch.coordinatorId = user.id;
              patch.coordinatorName = user.name;
            }
            updatedTx = { ...tx, ...patch };
            return updatedTx;
          }),
        }));
        if (updatedTx) {
          void dbSaveTransaction({ data: { tx: updatedTx } }).catch((err) =>
            console.error("[db] advanceStage sync failed:", err)
          );
          void firestoreSaveTransaction(updatedTx).catch((err) =>
            console.error("[Firebase] advanceStage tx save failed:", err)
          );
        }
      },

      uploadProof: ({ txId, kind, fileName, dataUrl, mimeType, amountEntered }) => {
        const user = get().currentUser;
        if (!user) return;
        let updatedTx: Transaction | undefined;
        set((s) => ({
          transactions: s.transactions.map((tx) => {
            if (tx.id !== txId) return tx;
            const verification = mockVerifyAmount(amountEntered, tx.declaredAmount);
            const proof: Proof = {
              id: makeId("pf"),
              uploadedBy: user.role,
              uploaderName: user.name,
              kind,
              fileName,
              dataUrl,
              mimeType,
              amountEntered,
              uploadedAt: new Date().toISOString(),
              verification,
            };
            updatedTx = applyProofs(tx, [...tx.proofs, proof]);
            return updatedTx;
          }),
        }));
        if (updatedTx) {
          void dbSaveTransaction({ data: { tx: updatedTx } }).catch((err) =>
            console.error("[db] uploadProof sync failed:", err)
          );
          void firestoreSaveTransaction(updatedTx).catch((err) =>
            console.error("[Firebase] uploadProof tx save failed:", err)
          );
        }
      },

      matchSurplus: (surplusId, requirementId) => {
        const user = get().currentUser;
        if (!user || user.role !== "coordinator") return null;
        const sur = get().surplus.find((x) => x.id === surplusId);
        const req = get().requirements.find((r) => r.id === requirementId);
        if (!sur || !req || sur.status !== "available") return null;
        const remaining = Math.max(0, req.quantityNeeded - req.quantityFulfilled);
        const qty = Math.max(1, Math.min(sur.quantity, remaining || sur.quantity));
        const now = new Date().toISOString();
        const tx: Transaction = {
          id: makeId("tx"),
          kind: "redistribution",
          requirementId: req.id,
          donorId: sur.receiverId,
          donorName: sur.campName,
          coordinatorId: user.id,
          coordinatorName: user.name,
          receiverId: req.receiverId,
          receiverName:
            get().users.find((u) => u.id === req.receiverId)?.name ?? req.campName,
          campName: req.campName,
          resourceType: sur.resourceType,
          quantity: qty,
          quantityUnit: sur.quantityUnit,
          declaredAmount: qty,
          stage: "received_by_coordinator",
          stageHistory: [
            { stage: "pending", at: now, by: user.name },
            { stage: "donated", at: now, by: sur.campName },
            { stage: "received_by_coordinator", at: now, by: user.name },
          ],
          proofs: [],
          disputed: false,
          createdAt: now,
          notes: `Matched surplus from ${sur.campName} to ${req.campName}.`,
        };
        const updatedSur: SurplusItem = {
          ...sur,
          status: "matched" as const,
          matchedToRequirementId: req.id,
          quantity: Math.max(0, sur.quantity - qty),
        };
        const updatedReq = refreshRequirementStatus({
          ...req,
          quantityFulfilled: req.quantityFulfilled + qty,
        });
        set((s) => ({
          transactions: [tx, ...s.transactions],
          surplus: s.surplus.map((x) =>
            x.id === surplusId ? updatedSur : x
          ),
          requirements: s.requirements.map((r) =>
            r.id === req.id ? updatedReq : r
          ),
        }));
        void dbSaveTransaction({ data: { tx, requirement: updatedReq, surplus: updatedSur } }).catch((err) =>
          console.error("[db] matchSurplus sync failed:", err)
        );
        void firestoreSaveTransaction(tx).catch((err) =>
          console.error("[Firebase] matchSurplus tx save failed:", err)
        );
        void firestoreSaveRequirement(updatedReq).catch((err) =>
          console.error("[Firebase] matchSurplus req save failed:", err)
        );
        void firestoreSaveSurplus(updatedSur).catch((err) =>
          console.error("[Firebase] matchSurplus sur save failed:", err)
        );
        return tx;
      },

      resolveDispute: (txId) => {
        const user = get().currentUser;
        if (!user || user.role !== "coordinator") return;
        let updatedTx: Transaction | undefined;
        set((s) => ({
          transactions: s.transactions.map((tx) => {
            if (tx.id !== txId) return tx;
            updatedTx = {
              ...tx,
              disputed: false,
              disputeReason: undefined,
              proofs: tx.proofs.map((p) =>
                p.verification === "mismatch_flagged"
                  ? { ...p, verification: "verified" as const }
                  : p
              ),
            };
            return updatedTx;
          }),
        }));
        if (updatedTx) {
          void dbSaveTransaction({ data: { tx: updatedTx } }).catch((err) =>
            console.error("[db] resolveDispute sync failed:", err)
          );
          void firestoreSaveTransaction(updatedTx).catch((err) =>
            console.error("[Firebase] resolveDispute tx save failed:", err)
          );
        }
      },
    }),
    {
      name: "relietnet-v2",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        currentUser: s.currentUser,
        fieldMode: s.fieldMode,
        users: s.users,
        requirements: s.requirements,
        surplus: s.surplus,
        transactions: s.transactions,
      }),
    },
  ),
);

export function demoUserForRole(role: Role): User | undefined {
  return seedUsers.find((u) => u.role === role);
}

export function highestOpenPriority(reqs: Requirement[]): Priority {
  const open = reqs.filter((r) => r.status !== "fulfilled");
  if (open.some((r) => r.priority === "critical")) return "critical";
  if (open.some((r) => r.priority === "high")) return "high";
  if (open.some((r) => r.priority === "moderate")) return "moderate";
  return "low";
}
