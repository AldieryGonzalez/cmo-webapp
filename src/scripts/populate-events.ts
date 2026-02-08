#!/usr/bin/env node

/**
 * Database Population Script
 * 
 * Populates the database with events scraped from emails.
 * This script calls the email scraper and inserts/updates events in the database.
 * 
 * Usage:
 *   tsx src/scripts/populate-events.ts --input events.json
 *   tsx src/scripts/populate-events.ts --scrape --query "from:scheduler@example.com"
 */

import { scrapeEmails, type ScrapedEvent } from "./scrape-emails";
import { db } from "~/server/db";
import { events, shifts, syncs } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";

interface PopulateConfig {
  input?: string;
  scrape: boolean;
  query?: string;
  maxResults?: number;
  accessToken?: string;
  dryRun: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): PopulateConfig {
  const args = process.argv.slice(2);
  const config: PopulateConfig = {
    scrape: false,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--input":
        if (nextArg) config.input = nextArg;
        i++;
        break;
      case "--scrape":
        config.scrape = true;
        break;
      case "--query":
        if (nextArg) config.query = nextArg;
        i++;
        break;
      case "--max-results":
        if (nextArg) config.maxResults = parseInt(nextArg, 10);
        i++;
        break;
      case "--access-token":
        if (nextArg) config.accessToken = nextArg;
        i++;
        break;
      case "--dry-run":
        config.dryRun = true;
        break;
      case "--help":
        console.log(`
Database Population Script

Usage:
  tsx src/scripts/populate-events.ts [options]

Options:
  --input <path>           Load scraped events from JSON file
  --scrape                 Scrape emails before populating
  --query <query>          Gmail search query (only with --scrape)
  --max-results <number>   Maximum number of emails (only with --scrape)
  --access-token <token>   Gmail API access token (only with --scrape)
  --dry-run               Show what would be done without making changes
  --help                  Show this help message

Examples:
  tsx src/scripts/populate-events.ts --input events.json
  tsx src/scripts/populate-events.ts --scrape --query "from:cmo@example.com" --max-results 50
  tsx src/scripts/populate-events.ts --scrape --dry-run
        `);
        process.exit(0);
    }
  }

  return config;
}

/**
 * Load scraped events from file
 */
function loadEventsFromFile(filePath: string): ScrapedEvent[] {
  console.log(`Loading events from ${filePath}...`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return data.events || data;
}

/**
 * Populate database with scraped events
 */
async function populateDatabase(scrapedEvents: ScrapedEvent[], dryRun: boolean = false) {
  console.log(`\nPopulating database with ${scrapedEvents.length} events...`);
  
  if (dryRun) {
    console.log("DRY RUN MODE - No changes will be made to the database\n");
  }

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const [index, scrapedEvent] of scrapedEvents.entries()) {
    try {
      const { cmoEvent } = scrapedEvent;
      console.log(`[${index + 1}/${scrapedEvents.length}] Processing: ${cmoEvent.title}...`);

      if (dryRun) {
        // Check if event exists
        const existing = await db
          .select({ id: events.id })
          .from(events)
          .where(eq(events.id, cmoEvent.id))
          .limit(1);

        if (existing.length > 0) {
          console.log(`  Would UPDATE event ${cmoEvent.id}`);
          console.log(`    - ${cmoEvent.allShifts.length} shifts would be replaced`);
          updated++;
        } else {
          console.log(`  Would INSERT event ${cmoEvent.id}`);
          console.log(`    - ${cmoEvent.allShifts.length} shifts would be added`);
          inserted++;
        }
        continue;
      }

      // Use transaction to ensure atomicity
      await db.transaction(async (trx) => {
        // Check if event exists
        const existing = await trx
          .select({ id: events.id })
          .from(events)
          .where(eq(events.id, cmoEvent.id))
          .limit(1);

        const isUpdate = existing.length > 0;

        // Insert or update event
        await trx
          .insert(events)
          .values({
            id: cmoEvent.id,
            title: cmoEvent.title,
            createdByEmail: cmoEvent.creator,
            location: cmoEvent.location,
            notes: cmoEvent.notes,
            createdAt: cmoEvent.created,
            updatedAt: cmoEvent.updated,
            start: cmoEvent.start,
            end: cmoEvent.end,
            cancelled: cmoEvent.cancelled,
            syncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: events.id,
            set: {
              title: cmoEvent.title,
              createdByEmail: cmoEvent.creator,
              location: cmoEvent.location,
              notes: cmoEvent.notes,
              createdAt: cmoEvent.created,
              updatedAt: cmoEvent.updated,
              start: cmoEvent.start,
              end: cmoEvent.end,
              cancelled: cmoEvent.cancelled,
              syncedAt: new Date(),
            },
          });

        // Delete existing shifts for this event
        await trx.delete(shifts).where(eq(shifts.eventId, cmoEvent.id));

        // Insert shifts
        if (cmoEvent.allShifts.length > 0) {
          await trx.insert(shifts).values(
            cmoEvent.allShifts.map((shift) => ({
              eventId: shift.eventId,
              role: shift.role,
              start: shift.start,
              end: shift.end,
              userEmail: shift.user,
              filledBy: shift.filledBy,
              confirmationNote: shift.confirmationNote,
              cancelled: shift.cancelled,
            }))
          );
        }

        if (isUpdate) {
          console.log(`  ✓ Updated event ${cmoEvent.id} (${cmoEvent.allShifts.length} shifts)`);
          updated++;
        } else {
          console.log(`  ✓ Inserted event ${cmoEvent.id} (${cmoEvent.allShifts.length} shifts)`);
          inserted++;
        }
      });
    } catch (error) {
      errors++;
      console.error(`  ✗ Error processing event: ${error}`);
    }
  }

  // Update sync timestamp
  if (!dryRun && (inserted > 0 || updated > 0)) {
    try {
      await db.insert(syncs).values({
        userEmail: "scraper@system",
        lastSynced: new Date(),
      });
      console.log("\n✓ Sync timestamp updated");
    } catch (error) {
      console.warn("Warning: Could not update sync timestamp:", error);
    }
  }

  console.log(`\n${dryRun ? "Dry run" : "Population"} complete!`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Errors: ${errors}`);
}

/**
 * Main function
 */
async function main() {
  try {
    const config = parseArgs();

    let scrapedEvents: ScrapedEvent[];

    if (config.scrape) {
      // Scrape emails first
      console.log("Scraping emails...\n");
      
      const accessToken = config.accessToken || process.env.GMAIL_ACCESS_TOKEN;
      if (!accessToken) {
        throw new Error("Access token required for scraping. Use --access-token or set GMAIL_ACCESS_TOKEN env variable.");
      }

      scrapedEvents = await scrapeEmails({
        query: config.query || "subject:(CMO OR Concert Management)",
        maxResults: config.maxResults || 100,
        accessToken,
      });

      if (scrapedEvents.length === 0) {
        console.log("No events scraped. Exiting.");
        return;
      }
    } else if (config.input) {
      // Load from file
      scrapedEvents = loadEventsFromFile(config.input);
    } else {
      console.error("Error: Either --scrape or --input must be specified");
      console.log("Use --help for usage information");
      process.exit(1);
    }

    // Populate database
    await populateDatabase(scrapedEvents, config.dryRun);

  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { populateDatabase };
