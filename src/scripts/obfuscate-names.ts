#!/usr/bin/env node

/**
 * Obfuscate Names Script
 * 
 * Creates consistent fake names for all users and updates both the users table
 * and the shifts table (filledBy field) to use obfuscated names.
 * 
 * Usage:
 *   tsx src/scripts/obfuscate-names.ts
 *   tsx src/scripts/obfuscate-names.ts --dry-run
 */

import { db } from "~/server/db";
import { users, shifts } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { createHash } from "crypto";

interface ObfuscateConfig {
  dryRun: boolean;
}

// Lists of fake names for consistent generation
const FAKE_FIRST_NAMES = [
  "Alex", "Blake", "Casey", "Dana", "Eli", "Finley", "Gray", "Harper",
  "Ivy", "Jordan", "Kai", "Logan", "Morgan", "Noah", "Oakley", "Parker",
  "Quinn", "Riley", "Sage", "Taylor", "Val", "Wren", "Xander", "Yael", "Zane",
  "Avery", "Brooke", "Cameron", "Drew", "Emery", "Frankie", "Grayson", "Hayden",
  "Indigo", "Jamie", "Kendall", "Lane", "Micah", "Nico", "Ocean", "Phoenix",
  "River", "Skylar", "Tatum", "Vesper", "Willow", "Zephyr"
];

const FAKE_LAST_NAMES = [
  "Anderson", "Baker", "Carter", "Davis", "Evans", "Foster", "Gray", "Harris",
  "Irwin", "Johnson", "Keller", "Lewis", "Martinez", "Nelson", "Owens", "Parker",
  "Quinn", "Roberts", "Smith", "Thompson", "Underwood", "Vance", "Watson", "Young",
  "Adams", "Brown", "Clark", "Dixon", "Edwards", "Fisher", "Green", "Hill",
  "Ingram", "Jones", "King", "Lee", "Miller", "Moore", "Nguyen", "O'Brien",
  "Patel", "Reed", "Scott", "Turner", "White", "Zhang"
];

/**
 * Generate a deterministic fake name from a real name
 */
function generateFakeName(realName: string): string {
  // Create a hash of the real name for deterministic mapping
  const hash = createHash("sha256").update(realName.toLowerCase().trim()).digest("hex");
  
  // Use hash to select from fake name lists
  const firstIndex = parseInt(hash.substring(0, 8), 16) % FAKE_FIRST_NAMES.length;
  const lastIndex = parseInt(hash.substring(8, 16), 16) % FAKE_LAST_NAMES.length;
  
  return `${FAKE_FIRST_NAMES[firstIndex]} ${FAKE_LAST_NAMES[lastIndex]}`;
}

/**
 * Generate a deterministic fake email from a real email
 */
function generateFakeEmail(realEmail: string, fakeFirstName: string, fakeLastName: string): string {
  // Extract domain from real email if it's a university email
  const domain = realEmail.includes("@u.northwestern.edu") 
    ? "@u.northwestern.edu" 
    : realEmail.includes("@northwestern.edu")
    ? "@northwestern.edu"
    : "@example.com";
  
  // Create a deterministic number suffix from the hash
  const hash = createHash("sha256").update(realEmail.toLowerCase().trim()).digest("hex");
  const year = 2020 + (parseInt(hash.substring(0, 4), 16) % 7); // Years 2020-2026
  
  const emailPrefix = `${fakeFirstName.toLowerCase()}${fakeLastName.toLowerCase()}${year}`;
  return `${emailPrefix}${domain}`;
}

/**
 * Generate a deterministic fake phone number
 */
function generateFakePhone(realPhone: string): string {
  // Create a hash from the real phone
  const hash = createHash("sha256").update(realPhone.replace(/\D/g, "")).digest("hex");
  
  // Generate area code (200-999)
  const areaCode = 200 + (parseInt(hash.substring(0, 4), 16) % 800);
  
  // Generate exchange (200-999)
  const exchange = 200 + (parseInt(hash.substring(4, 8), 16) % 800);
  
  // Generate number (0000-9999)
  const number = parseInt(hash.substring(8, 12), 16) % 10000;
  
  return `(${areaCode})${exchange}-${number.toString().padStart(4, "0")}`;
}

/**
 * Parse command line arguments
 */
function parseArgs(): ObfuscateConfig {
  const args = process.argv.slice(2);
  const config: ObfuscateConfig = {
    dryRun: false,
  };

  for (const arg of args) {
    switch (arg) {
      case "--dry-run":
        config.dryRun = true;
        break;
      case "--help":
        console.log(`
Obfuscate Names Script

Usage:
  tsx src/scripts/obfuscate-names.ts [options]

Options:
  --dry-run    Show what would be done without making changes
  --help       Show this help message

Examples:
  tsx src/scripts/obfuscate-names.ts
  tsx src/scripts/obfuscate-names.ts --dry-run
        `);
        process.exit(0);
    }
  }

  return config;
}

/**
 * Obfuscate names in users and shifts
 */
async function obfuscateNames(dryRun: boolean = false) {
  console.log(`\nObfuscating names in users and shifts...`);
  
  if (dryRun) {
    console.log("DRY RUN MODE - No changes will be made to the database\n");
  }

  // Get all users
  const allUsers = await db.select().from(users);
  console.log(`Found ${allUsers.length} users to obfuscate\n`);

  // Create mapping of real names to fake names
  const nameMapping = new Map<string, string>(); // Maps "FirstName LastName" to fake name
  const altNameMapping = new Map<string, string>(); // Maps alternative names to fake alt names
  const emailMapping = new Map<string, string>();
  const phoneMapping = new Map<string, string>();

  // Build mappings
  for (const user of allUsers) {
    const realFullName = `${user.firstName} ${user.lastName}`;
    const fakeFullName = generateFakeName(realFullName);
    const [fakeFirstName, fakeLastName] = fakeFullName.split(" ");
    const fakeEmail = generateFakeEmail(user.email, fakeFirstName!, fakeLastName!);
    const fakePhone = user.phoneNumber ? generateFakePhone(user.phoneNumber) : null;

    nameMapping.set(realFullName, fakeFullName);
    nameMapping.set(realFullName.toLowerCase(), fakeFullName); // Case-insensitive mapping
    nameMapping.set(user.firstName, fakeFirstName!); // Map first name alone
    nameMapping.set(user.firstName.toLowerCase(), fakeFirstName!); // Case-insensitive first name
    
    // Map "FirstName LastInitial." format (e.g., "Kevin O." -> "FakeFirstName F.")
    const realLastInitial = user.lastName.charAt(0).toUpperCase();
    const fakeLastInitial = fakeLastName!.charAt(0).toUpperCase();
    const realFirstLastInitial = `${user.firstName} ${realLastInitial}.`;
    const fakeFirstLastInitial = `${fakeFirstName!} ${fakeLastInitial}.`;
    nameMapping.set(realFirstLastInitial, fakeFirstLastInitial);
    nameMapping.set(realFirstLastInitial.toLowerCase(), fakeFirstLastInitial); // Case-insensitive
    
    emailMapping.set(user.email, fakeEmail);
    if (fakePhone) {
      phoneMapping.set(user.phoneNumber || "", fakePhone);
    }

    // Handle alternative names (can be single string or comma-separated)
    if (user.alternativeNames) {
      const altNames = user.alternativeNames.includes(",")
        ? user.alternativeNames.split(",").map(n => n.trim()).filter(Boolean)
        : [user.alternativeNames.trim()].filter(Boolean);
      const fakeAltNames: string[] = [];
      
      for (const altName of altNames) {
        // Generate a fake alternative name (could be a nickname variant)
        const hash = createHash("sha256").update(`${realFullName}:${altName}`).digest("hex");
        const altIndex = parseInt(hash.substring(0, 8), 16) % FAKE_FIRST_NAMES.length;
        const fakeAltName = FAKE_FIRST_NAMES[altIndex]!;
        altNameMapping.set(altName, fakeAltName);
        altNameMapping.set(altName.toLowerCase(), fakeAltName); // Also map lowercase
        fakeAltNames.push(fakeAltName);
      }
      
      console.log(`  ${realFullName} → ${fakeFullName}`);
      console.log(`    Email: ${user.email} → ${fakeEmail}`);
      if (user.phoneNumber) {
        console.log(`    Phone: ${user.phoneNumber} → ${fakePhone}`);
      }
      if (altNames.length > 0) {
        console.log(`    Alt names: ${altNames.join(", ")} → ${fakeAltNames.join(", ")}`);
      }
    } else {
      console.log(`  ${realFullName} → ${fakeFullName}`);
      console.log(`    Email: ${user.email} → ${fakeEmail}`);
      if (user.phoneNumber) {
        console.log(`    Phone: ${user.phoneNumber} → ${fakePhone}`);
      }
    }
  }

  if (dryRun) {
    console.log(`\nWould update ${allUsers.length} users`);
    
    // Count shifts that would be affected
    const allShifts = await db.select({ filledBy: shifts.filledBy, userEmail: shifts.userEmail }).from(shifts);
    const affectedShiftsByFilledBy = allShifts.filter(s => s.filledBy && nameMapping.has(s.filledBy));
    const affectedShiftsByEmail = allShifts.filter(s => s.userEmail && emailMapping.has(s.userEmail));
    const totalAffectedShifts = new Set([
      ...affectedShiftsByFilledBy.map(s => s.filledBy),
      ...affectedShiftsByEmail.map(s => s.userEmail)
    ]).size;
    console.log(`Would update ${totalAffectedShifts} shifts (filledBy and/or userEmail)`);
    return;
  }

  // Update users
  console.log(`\nUpdating users...`);
  let usersUpdated = 0;
  for (const user of allUsers) {
    const realFullName = `${user.firstName} ${user.lastName}`;
    const fakeFullName = nameMapping.get(realFullName)!;
    const [fakeFirstName, fakeLastName] = fakeFullName.split(" ");
    const fakeEmail = emailMapping.get(user.email)!;
    const fakePhone = user.phoneNumber ? phoneMapping.get(user.phoneNumber) : null;

    // Handle alternative names (can be single string or comma-separated)
    let fakeAltNames: string | null = null;
    if (user.alternativeNames) {
      const altNames = user.alternativeNames.includes(",")
        ? user.alternativeNames.split(",").map(n => n.trim()).filter(Boolean)
        : [user.alternativeNames.trim()].filter(Boolean);
      const fakeAltNamesList = altNames
        .map(altName => altNameMapping.get(altName))
        .filter(Boolean) as string[];
      fakeAltNames = fakeAltNamesList.length > 0 ? fakeAltNamesList.join(", ") : null;
    }

    await db
      .update(users)
      .set({
        email: fakeEmail,
        firstName: fakeFirstName!,
        lastName: fakeLastName!,
        phoneNumber: fakePhone || null,
        alternativeNames: fakeAltNames,
      })
      .where(eq(users.id, user.id));

    usersUpdated++;
  }
  console.log(`✓ Updated ${usersUpdated} users`);

  // Update shifts - map filledBy names and userEmail
  console.log(`\nUpdating shifts...`);
  const allShifts = await db.select().from(shifts);
  let shiftsUpdated = 0;
  
  for (const shift of allShifts) {
    let needsUpdate = false;
    const updateData: { filledBy?: string; userEmail?: string } = {};
    
    // Handle filledBy field
    if (shift.filledBy) {
      // Try to find the fake name - could be full name, first name, or alternative name
      let fakeName = nameMapping.get(shift.filledBy);
      
      // If not found, try case-insensitive lookup
      if (!fakeName) {
        fakeName = nameMapping.get(shift.filledBy.toLowerCase());
      }
      
      // If not found, try alternative name mapping (case-insensitive)
      if (!fakeName) {
        fakeName = altNameMapping.get(shift.filledBy) || altNameMapping.get(shift.filledBy.toLowerCase());
      }
      
      // If still not found, try matching "FirstName LastInitial." format
      // Pattern: "FirstName LastInitial." or "FirstName LastInitial" (with or without period)
      if (!fakeName) {
        const filledByTrimmed = shift.filledBy.trim();
        const firstLastInitialMatch = filledByTrimmed.match(/^(.+?)\s+([A-Za-z])\.?$/i);
        if (firstLastInitialMatch) {
          const [, firstName, lastInitial] = firstLastInitialMatch;
          const normalizedPattern = `${firstName} ${lastInitial?.toUpperCase() ?? ""}.`;
          fakeName = nameMapping.get(normalizedPattern) || nameMapping.get(normalizedPattern.toLowerCase());
        }
      }
      
      // If still not found, try matching by first name only (case-insensitive)
      if (!fakeName) {
        // Check if filledBy matches any user's first name
        for (const [realName, fakeNameValue] of nameMapping.entries()) {
          const [realFirstName] = realName.split(" ");
          if (realFirstName && realFirstName.toLowerCase() === shift.filledBy.toLowerCase()) {
            const [fakeFirstName] = fakeNameValue.split(" ");
            fakeName = fakeFirstName;
            break;
          }
        }
      }
      
      // Also try matching full name case-insensitively
      if (!fakeName) {
        for (const [realName, fakeNameValue] of nameMapping.entries()) {
          if (realName.toLowerCase() === shift.filledBy.toLowerCase()) {
            fakeName = fakeNameValue;
            break;
          }
        }
      }
      
      if (fakeName) {
        updateData.filledBy = fakeName;
        needsUpdate = true;
      } else {
        console.warn(`  ⚠ Could not map shift filledBy: "${shift.filledBy}"`);
      }
    }
    
    // Handle userEmail field
    if (shift.userEmail) {
      const fakeEmail = emailMapping.get(shift.userEmail);
      if (fakeEmail) {
        updateData.userEmail = fakeEmail;
        needsUpdate = true;
      } else {
        console.warn(`  ⚠ Could not map shift userEmail: "${shift.userEmail}"`);
      }
    }
    
    // Update shift if any fields need updating
    if (needsUpdate) {
      await db
        .update(shifts)
        .set(updateData)
        .where(eq(shifts.id, shift.id));
      shiftsUpdated++;
    }
  }
  console.log(`✓ Updated ${shiftsUpdated} shifts`);

  console.log(`\nObfuscation complete!`);
  console.log(`  Users updated: ${usersUpdated}`);
  console.log(`  Shifts updated: ${shiftsUpdated}`);
}

/**
 * Main execution
 */
async function main() {
  try {
    const config = parseArgs();
    await obfuscateNames(config.dryRun);
    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
