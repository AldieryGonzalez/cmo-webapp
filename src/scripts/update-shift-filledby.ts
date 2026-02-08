#!/usr/bin/env node

/**
 * Update Shift FilledBy Script
 * 
 * Updates the filledBy field in shifts table based on userEmail.
 * For each unique userEmail in shifts, finds the corresponding user
 * and sets filledBy to "FirstName LastInitial." format.
 * 
 * Usage:
 *   tsx src/scripts/update-shift-filledby.ts
 *   tsx src/scripts/update-shift-filledby.ts --dry-run
 */

import { db } from "~/server/db";
import { users, shifts } from "~/server/db/schema";
import { eq, sql, isNotNull } from "drizzle-orm";

interface Config {
  dryRun: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): Config {
  const args = process.argv.slice(2);
  const config: Config = {
    dryRun: false,
  };

  for (const arg of args) {
    switch (arg) {
      case "--dry-run":
        config.dryRun = true;
        break;
      case "--help":
        console.log(`
Update Shift FilledBy Script

Updates the filledBy field in shifts table based on userEmail.
For each unique userEmail in shifts, finds the corresponding user
and sets filledBy to "FirstName LastInitial." format.

Usage:
  tsx src/scripts/update-shift-filledby.ts [options]

Options:
  --dry-run    Show what would be done without making changes
  --help       Show this help message

Examples:
  tsx src/scripts/update-shift-filledby.ts
  tsx src/scripts/update-shift-filledby.ts --dry-run
        `);
        process.exit(0);
    }
  }

  return config;
}

/**
 * Update filledBy in shifts based on userEmail
 */
async function updateShiftFilledBy(dryRun: boolean = false) {
  console.log(`\nUpdating shift filledBy fields based on userEmail...`);
  
  if (dryRun) {
    console.log("DRY RUN MODE - No changes will be made to the database\n");
  }

  // Get all distinct userEmails from shifts table
  // Use Drizzle query builder which handles table names correctly, then get distinct values
  const allShiftsWithEmail = await db
    .select({ userEmail: shifts.userEmail })
    .from(shifts)
    .where(isNotNull(shifts.userEmail));

  // Get distinct emails using Set
  const distinctEmails = Array.from(
    new Set(
      allShiftsWithEmail
        .map((s) => s.userEmail)
        .filter((email): email is string => email !== null && email !== undefined)
    )
  );

  console.log(`Found ${distinctEmails.length} unique userEmails in shifts table\n`);

  // Get all users and create a lookup map
  const allUsers = await db.select().from(users);
  const userMap = new Map<string, typeof allUsers[0]>();
  for (const user of allUsers) {
    userMap.set(user.email.toLowerCase(), user);
  }

  let totalShiftsUpdated = 0;
  let emailsNotFound = 0;

  // Process each email
  for (const email of distinctEmails) {
    const user = userMap.get(email.toLowerCase());
    
    if (!user) {
      console.warn(`  ⚠ User not found for email: ${email}`);
      emailsNotFound++;
      continue;
    }

    // Create "FirstName LastInitial." format
    const lastInitial = user.lastName.charAt(0).toUpperCase();
    const filledByValue = `${user.firstName} ${lastInitial}.`;

    // Count how many shifts will be updated
    const shiftsToUpdate = await db
      .select({ id: shifts.id })
      .from(shifts)
      .where(eq(shifts.userEmail, email));

    console.log(`  ${email} → ${filledByValue} (${shiftsToUpdate.length} shifts)`);

    if (!dryRun) {
      // Update all shifts with this userEmail
      await db
        .update(shifts)
        .set({ filledBy: filledByValue })
        .where(eq(shifts.userEmail, email));

      totalShiftsUpdated += shiftsToUpdate.length;
    } else {
      totalShiftsUpdated += shiftsToUpdate.length;
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Emails processed: ${distinctEmails.length}`);
  console.log(`  Emails not found: ${emailsNotFound}`);
  console.log(`  Shifts ${dryRun ? "would be" : ""} updated: ${totalShiftsUpdated}`);

  if (dryRun) {
    console.log(`\nRun without --dry-run to apply changes`);
  } else {
    console.log(`\n✓ Update complete!`);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const config = parseArgs();
    await updateShiftFilledBy(config.dryRun);
    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
