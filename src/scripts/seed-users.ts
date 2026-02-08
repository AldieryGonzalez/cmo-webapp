#!/usr/bin/env node
/**
 * Seed users from seed-data/users.ts.
 * Usage: bun run seed-users   or   tsx src/scripts/seed-users.ts
 */

import "dotenv/config";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { seedUsers } from "./seed-data/users";

async function main() {
  console.log("Seeding users from seed-data/users.ts...");
  for (const u of seedUsers) {
    await db
      .insert(users)
      .values({
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        phoneNumber: u.phoneNumber ?? null,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          firstName: u.firstName,
          lastName: u.lastName,
          phoneNumber: u.phoneNumber ?? null,
        },
      });
    console.log("  ", u.email);
  }
  console.log(`Done. ${seedUsers.length} users upserted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
