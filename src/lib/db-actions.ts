import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "./db";
import {
  seedRequirements,
  seedSurplus,
  seedTransactions,
  seedUsers,
} from "./seed";
import type {
  Requirement,
  SurplusItem,
  Transaction,
  User,
} from "./types";

async function seedDatabase(sql: Sql) {
  console.log("[db] Seeding database with initial relief data...");

  // Seed Users
  for (const u of seedUsers) {
    await sql`
      INSERT INTO users (id, name, role, org_name, location, region, contribution_type)
      VALUES (${u.id}, ${u.name}, ${u.role}, ${u.orgName ?? null}, ${u.location ?? null}, ${u.region ?? null}, ${u.contributionType ?? null})
    `;
  }

  // Seed Requirements
  for (const r of seedRequirements) {
    await sql`
      INSERT INTO requirements (
        id, title, camp_name, receiver_id, resource_type, quantity_needed, quantity_fulfilled, 
        quantity_unit, people_affected, duration_days, urgency, location, map_x, map_y, notes, 
        created_at, status, priority, priority_score, score_breakdown
      )
      VALUES (
        ${r.id}, ${r.title}, ${r.campName}, ${r.receiverId}, ${r.resourceType}, ${r.quantityNeeded}, 
        ${r.quantityFulfilled}, ${r.quantityUnit}, ${r.peopleAffected}, ${r.durationDays}, ${r.urgency}, 
        ${r.location}, ${r.mapX}, ${r.mapY}, ${r.notes}, ${r.createdAt}, ${r.status}, ${r.priority}, 
        ${r.priorityScore}, ${JSON.stringify(r.scoreBreakdown)}
      )
    `;
  }

  // Seed Surplus
  for (const s of seedSurplus) {
    await sql`
      INSERT INTO surplus (id, camp_name, receiver_id, resource_type, quantity, quantity_unit, location, map_x, map_y, notes, created_at, matched_to_requirement_id, status)
      VALUES (${s.id}, ${s.campName}, ${s.receiverId}, ${s.resourceType}, ${s.quantity}, ${s.quantityUnit}, ${s.location}, ${s.mapX}, ${s.mapY}, ${s.notes}, ${s.createdAt}, ${s.matchedToRequirementId ?? null}, ${s.status})
    `;
  }

  // Seed Transactions
  for (const t of seedTransactions) {
    await sql`
      INSERT INTO transactions (
        id, kind, requirement_id, donor_id, donor_name, coordinator_id, coordinator_name, 
        receiver_id, receiver_name, camp_name, resource_type, quantity, quantity_unit, 
        declared_amount, stage, stage_history, proofs, disputed, dispute_reason, created_at, notes
      )
      VALUES (
        ${t.id}, ${t.kind}, ${t.requirementId}, ${t.donorId}, ${t.donorName}, ${t.coordinatorId ?? null}, 
        ${t.coordinatorName ?? null}, ${t.receiverId}, ${t.receiverName}, ${t.campName}, ${t.resourceType}, 
        ${t.quantity}, ${t.quantityUnit}, ${t.declaredAmount}, ${t.stage}, ${JSON.stringify(t.stageHistory)}, 
        ${JSON.stringify(t.proofs)}, ${t.disputed}, ${t.disputeReason ?? null}, ${t.createdAt}, ${t.notes ?? null}
      )
    `;
  }
}

// Server function to load the entire state, seeding if the DB is empty
export const fetchReliefData = createServerFn({ method: "GET" }).handler(
  async () => {
    const sql = await getSql();

    // Check if the DB is empty by querying the users table
    const usersCount = await sql<{ count: number }>`SELECT COUNT(*)::integer as count FROM users`;
    
    if (usersCount[0]?.count === 0) {
      await seedDatabase(sql);
    }

    // Query active records
    const users = await sql<User>`SELECT * FROM users`;
    const requirementsRaw = await sql<any>`SELECT * FROM requirements`;
    const surplusRaw = await sql<any>`SELECT * FROM surplus`;
    const transactionsRaw = await sql<any>`SELECT * FROM transactions`;

    // Map back JSONB columns
    const requirements: Requirement[] = requirementsRaw.map((r) => ({
      ...r,
      scoreBreakdown: typeof r.score_breakdown === "string" ? JSON.parse(r.score_breakdown) : r.score_breakdown,
      campName: r.camp_name,
      receiverId: r.receiver_id,
      resourceType: r.resource_type,
      quantityNeeded: r.quantity_needed,
      quantityUnit: r.quantity_unit,
      quantityFulfilled: r.quantity_fulfilled,
      peopleAffected: r.people_affected,
      durationDays: r.duration_days,
      mapX: r.map_x,
      mapY: r.map_y,
      createdAt: r.created_at,
      priorityScore: r.priority_score,
    }));

    const surplus: SurplusItem[] = surplusRaw.map((s) => ({
      ...s,
      campName: s.camp_name,
      receiverId: s.receiver_id,
      resourceType: s.resource_type,
      quantityUnit: s.quantity_unit,
      mapX: s.map_x,
      mapY: s.map_y,
      createdAt: s.created_at,
      matchedToRequirementId: s.matched_to_requirement_id,
    }));

    const transactions: Transaction[] = transactionsRaw.map((t) => ({
      ...t,
      stageHistory: typeof t.stage_history === "string" ? JSON.parse(t.stage_history) : t.stage_history,
      proofs: typeof t.proofs === "string" ? JSON.parse(t.proofs) : t.proofs,
      requirementId: t.requirement_id,
      donorId: t.donor_id,
      donorName: t.donor_name,
      coordinatorId: t.coordinator_id,
      coordinatorName: t.coordinator_name,
      receiverId: t.receiver_id,
      receiverName: t.receiver_name,
      campName: t.camp_name,
      resourceType: t.resource_type,
      quantityUnit: t.quantity_unit,
      declaredAmount: t.declared_amount,
      disputeReason: t.dispute_reason,
      createdAt: t.created_at,
    }));

    return { users, requirements, surplus, transactions };
  }
);

// Server function to persist a new user signup
export const dbSignup = createServerFn({ method: "POST" })
  .validator((u: User) => u)
  .handler(async ({ data: u }) => {
    const sql = await getSql();
    await sql`
      INSERT INTO users (id, name, role, org_name, location, region, contribution_type)
      VALUES (${u.id}, ${u.name}, ${u.role}, ${u.orgName ?? null}, ${u.location ?? null}, ${u.region ?? null}, ${u.contributionType ?? null})
    `;
    return { ok: true };
  });

// Server function to persist a new requirement
export const dbPostRequirement = createServerFn({ method: "POST" })
  .validator((r: Requirement) => r)
  .handler(async ({ data: r }) => {
    const sql = await getSql();
    await sql`
      INSERT INTO requirements (
        id, title, camp_name, receiver_id, resource_type, quantity_needed, quantity_fulfilled, 
        quantity_unit, people_affected, duration_days, urgency, location, map_x, map_y, notes, 
        created_at, status, priority, priority_score, score_breakdown
      )
      VALUES (
        ${r.id}, ${r.title}, ${r.campName}, ${r.receiverId}, ${r.resourceType}, ${r.quantityNeeded}, 
        ${r.quantityFulfilled}, ${r.quantityUnit}, ${r.peopleAffected}, ${r.durationDays}, ${r.urgency}, 
        ${r.location}, ${r.mapX}, ${r.mapY}, ${r.notes}, ${r.createdAt}, ${r.status}, ${r.priority}, 
        ${r.priorityScore}, ${JSON.stringify(r.scoreBreakdown)}
      )
    `;
    return { ok: true };
  });

// Server function to persist a new surplus item
export const dbPostSurplus = createServerFn({ method: "POST" })
  .validator((s: SurplusItem) => s)
  .handler(async ({ data: s }) => {
    const sql = await getSql();
    await sql`
      INSERT INTO surplus (id, camp_name, receiver_id, resource_type, quantity, quantity_unit, location, map_x, map_y, notes, created_at, matched_to_requirement_id, status)
      VALUES (${s.id}, ${s.campName}, ${s.receiverId}, ${s.resourceType}, ${s.quantity}, ${s.quantityUnit}, ${s.location}, ${s.mapX}, ${s.mapY}, ${s.notes}, ${s.createdAt}, ${s.matchedToRequirementId ?? null}, ${s.status})
    `;
    return { ok: true };
  });

// Server function to persist a transaction state update
export const dbSaveTransaction = createServerFn({ method: "POST" })
  .validator((data: { tx: Transaction; requirement?: Requirement; surplus?: SurplusItem }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const t = data.tx;

    // Upsert the transaction
    await sql`
      INSERT INTO transactions (
        id, kind, requirement_id, donor_id, donor_name, coordinator_id, coordinator_name, 
        receiver_id, receiver_name, camp_name, resource_type, quantity, quantity_unit, 
        declared_amount, stage, stage_history, proofs, disputed, dispute_reason, created_at, notes
      )
      VALUES (
        ${t.id}, ${t.kind}, ${t.requirementId}, ${t.donorId}, ${t.donorName}, ${t.coordinatorId ?? null}, 
        ${t.coordinatorName ?? null}, ${t.receiverId}, ${t.receiverName}, ${t.campName}, ${t.resourceType}, 
        ${t.quantity}, ${t.quantityUnit}, ${t.declaredAmount}, ${t.stage}, ${JSON.stringify(t.stageHistory)}, 
        ${JSON.stringify(t.proofs)}, ${t.disputed}, ${t.disputeReason ?? null}, ${t.createdAt}, ${t.notes ?? null}
      )
      ON CONFLICT (id) DO UPDATE SET
        coordinator_id = EXCLUDED.coordinator_id,
        coordinator_name = EXCLUDED.coordinator_name,
        stage = EXCLUDED.stage,
        stage_history = EXCLUDED.stage_history,
        proofs = EXCLUDED.proofs,
        disputed = EXCLUDED.disputed,
        dispute_reason = EXCLUDED.dispute_reason,
        notes = EXCLUDED.notes
    `;

    // Optionally update requirement if modified
    if (data.requirement) {
      const r = data.requirement;
      await sql`
        UPDATE requirements SET
          quantity_fulfilled = ${r.quantityFulfilled},
          status = ${r.status},
          priority = ${r.priority},
          priority_score = ${r.priorityScore},
          score_breakdown = ${JSON.stringify(r.scoreBreakdown)}
        WHERE id = ${r.id}
      `;
    }

    // Optionally update surplus item if modified
    if (data.surplus) {
      const s = data.surplus;
      await sql`
        UPDATE surplus SET
          status = ${s.status},
          quantity = ${s.quantity},
          matched_to_requirement_id = ${s.matchedToRequirementId ?? null}
        WHERE id = ${s.id}
      `;
    }

    return { ok: true };
  });

// Server function to reset the database and re-seed it
export const dbResetDemo = createServerFn({ method: "POST" }).handler(async () => {
  const sql = await getSql();
  await sql`TRUNCATE TABLE users, requirements, surplus, transactions RESTART IDENTITY CASCADE`;
  await seedDatabase(sql);
  return { ok: true };
});
