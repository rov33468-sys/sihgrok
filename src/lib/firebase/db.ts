import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./config";
import type { Requirement, SurplusItem, Transaction, User } from "../types";
import {
  seedRequirements,
  seedSurplus,
  seedTransactions,
  seedUsers,
} from "../seed";

const USERS_COLLECTION = "users";
const REQUIREMENTS_COLLECTION = "requirements";
const SURPLUS_COLLECTION = "surplus";
const TRANSACTIONS_COLLECTION = "transactions";

/**
 * Seed Firestore with initial demo data if the requirements collection is empty.
 */
export async function seedFirestoreIfEmpty(): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  try {
    const snap = await getDocs(collection(db, REQUIREMENTS_COLLECTION));
    if (!snap.empty) {
      return; // Already populated
    }

    console.log("[Firebase Firestore] Seeding initial disaster relief data...");
    const batch = writeBatch(db);

    for (const u of seedUsers) {
      batch.set(doc(db, USERS_COLLECTION, u.id), u);
    }
    for (const r of seedRequirements) {
      batch.set(doc(db, REQUIREMENTS_COLLECTION, r.id), r);
    }
    for (const s of seedSurplus) {
      batch.set(doc(db, SURPLUS_COLLECTION, s.id), s);
    }
    for (const t of seedTransactions) {
      batch.set(doc(db, TRANSACTIONS_COLLECTION, t.id), t);
    }

    await batch.commit();
    console.log("[Firebase Firestore] Successfully seeded data!");
  } catch (err) {
    console.error("[Firebase Firestore] Error seeding data:", err);
  }
}

/**
 * Real-time subscription to Users.
 */
export function subscribeToUsers(
  callback: (users: User[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured() || !db) return () => {};
  return onSnapshot(
    collection(db, USERS_COLLECTION),
    (snapshot) => {
      const users = snapshot.docs.map((d) => d.data() as User);
      if (users.length > 0) callback(users);
    },
    (err) => console.error("[Firestore] users listener error:", err)
  );
}

/**
 * Real-time subscription to Requirements.
 */
export function subscribeToRequirements(
  callback: (reqs: Requirement[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured() || !db) return () => {};
  return onSnapshot(
    collection(db, REQUIREMENTS_COLLECTION),
    (snapshot) => {
      const reqs = snapshot.docs.map((d) => d.data() as Requirement);
      if (reqs.length > 0) callback(reqs);
    },
    (err) => console.error("[Firestore] requirements listener error:", err)
  );
}

/**
 * Real-time subscription to Surplus.
 */
export function subscribeToSurplus(
  callback: (surplus: SurplusItem[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured() || !db) return () => {};
  return onSnapshot(
    collection(db, SURPLUS_COLLECTION),
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as SurplusItem);
      if (items.length > 0) callback(items);
    },
    (err) => console.error("[Firestore] surplus listener error:", err)
  );
}

/**
 * Real-time subscription to Transactions.
 */
export function subscribeToTransactions(
  callback: (txs: Transaction[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured() || !db) return () => {};
  return onSnapshot(
    collection(db, TRANSACTIONS_COLLECTION),
    (snapshot) => {
      const txs = snapshot.docs.map((d) => d.data() as Transaction);
      if (txs.length > 0) callback(txs);
    },
    (err) => console.error("[Firestore] transactions listener error:", err)
  );
}

/**
 * Save / Update User profile in Firestore.
 */
export async function firestoreSaveUser(user: User): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await setDoc(doc(db, USERS_COLLECTION, user.id), user, { merge: true });
}

/**
 * Save / Update a Requirement in Firestore.
 */
export async function firestoreSaveRequirement(req: Requirement): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await setDoc(doc(db, REQUIREMENTS_COLLECTION, req.id), req, { merge: true });
}

/**
 * Save / Update a Surplus item in Firestore.
 */
export async function firestoreSaveSurplus(item: SurplusItem): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await setDoc(doc(db, SURPLUS_COLLECTION, item.id), item, { merge: true });
}

/**
 * Save / Update a Transaction in Firestore.
 */
export async function firestoreSaveTransaction(tx: Transaction): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await setDoc(doc(db, TRANSACTIONS_COLLECTION, tx.id), tx, { merge: true });
}
