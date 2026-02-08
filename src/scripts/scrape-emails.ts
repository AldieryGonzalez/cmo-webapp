#!/usr/bin/env node

/**
 * Email Scraping Script
 * 
 * Scrapes emails using Gmail API to extract event data.
 * This script replaces the need for direct Google Calendar API access.
 * 
 * Usage:
 *   tsx src/scripts/scrape-emails.ts --query "from:scheduler@example.com" --max-results 50
 *   
 * Options:
 *   --query: Gmail search query (default: searches for CMO-related emails)
 *   --max-results: Maximum number of emails to fetch (default: 100)
 *   --output: Output file path (default: prints to console)
 *   --from-date: Start date (ISO format, e.g., 2024-01-01)
 *   --to-date: End date (ISO format)
 */

import { gmail as GmailClient, type gmail_v1 } from "@googleapis/gmail";
import { simpleParser } from "mailparser";
import { parseEventFromEmail, toCalendarEvent, generateEventId } from "~/lib/email/parser";
import { CmoEvent } from "~/lib/gcal/CmoEvent";
import * as fs from "fs";
import * as path from "path";

interface ScraperConfig {
  query: string;
  maxResults: number;
  output?: string;
  fromDate?: Date;
  toDate?: Date;
  accessToken?: string;
}

interface ScrapedEvent {
  id: string;
  rawEmail: {
    messageId: string;
    subject: string;
    from: string;
    date: Date;
  };
  parsedEvent: ReturnType<typeof parseEventFromEmail>;
  calendarEvent: ReturnType<typeof toCalendarEvent>;
  cmoEvent: CmoEvent;
}

/**
 * Parse command line arguments
 */
function parseArgs(): ScraperConfig {
  const args = process.argv.slice(2);
  const config: ScraperConfig = {
    query: "subject:(CMO OR Concert Management) OR from:(cmo@northwestern.edu)",
    maxResults: 100,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--query":
        if (nextArg) config.query = nextArg;
        i++;
        break;
      case "--max-results":
        if (nextArg) config.maxResults = parseInt(nextArg, 10);
        i++;
        break;
      case "--output":
        if (nextArg) config.output = nextArg;
        i++;
        break;
      case "--from-date":
        if (nextArg) config.fromDate = new Date(nextArg);
        i++;
        break;
      case "--to-date":
        if (nextArg) config.toDate = new Date(nextArg);
        i++;
        break;
      case "--access-token":
        if (nextArg) config.accessToken = nextArg;
        i++;
        break;
      case "--help":
        console.log(`
Email Scraping Script

Usage:
  tsx src/scripts/scrape-emails.ts [options]

Options:
  --query <query>           Gmail search query
  --max-results <number>    Maximum number of emails to fetch (default: 100)
  --output <path>          Output file path (JSON format)
  --from-date <date>       Start date (ISO format)
  --to-date <date>         End date (ISO format)
  --access-token <token>   Gmail API access token (required)
  --help                   Show this help message

Examples:
  tsx src/scripts/scrape-emails.ts --query "from:scheduler@example.com" --max-results 50
  tsx src/scripts/scrape-emails.ts --from-date 2024-01-01 --to-date 2024-12-31 --output events.json
        `);
        process.exit(0);
    }
  }

  return config;
}

/**
 * Build Gmail API query with date filters
 */
function buildQuery(config: ScraperConfig): string {
  let query = config.query;

  if (config.fromDate) {
    const after = config.fromDate.toISOString().split("T")[0]?.replace(/-/g, "/") ?? "";
    query += ` after:${after}`;
  }

  if (config.toDate) {
    const before = config.toDate.toISOString().split("T")[0]?.replace(/-/g, "/") ?? "";
    query += ` before:${before}`;
  }

  return query;
}

/**
 * Fetch and parse emails using Gmail API
 */
async function scrapeEmails(config: ScraperConfig): Promise<ScrapedEvent[]> {
  if (!config.accessToken) {
    throw new Error("Access token is required. Use --access-token flag or set GMAIL_ACCESS_TOKEN env variable.");
  }

  console.log("Initializing Gmail API client...");
  const gmail = GmailClient({
    version: "v1",
    headers: { Authorization: `Bearer ${config.accessToken}` },
  });

  const query = buildQuery(config);
  console.log(`Searching emails with query: ${query}`);

  // List messages
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    maxResults: config.maxResults,
    q: query,
  });

  if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
    console.log("No emails found matching the query.");
    return [];
  }

  console.log(`Found ${listResponse.data.messages.length} emails. Fetching and parsing...`);

  const scrapedEvents: ScrapedEvent[] = [];
  const errors: Array<{ messageId: string; error: string }> = [];

  // Fetch and parse each message
  for (const [index, message] of listResponse.data.messages.entries()) {
    try {
      const messageId = message.id!;
      console.log(`[${index + 1}/${listResponse.data.messages.length}] Processing message ${messageId}...`);

      // Get full message
      const messageResponse = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "raw",
      });

      if (!messageResponse.data.raw) {
        console.warn(`  Warning: No raw data for message ${messageId}`);
        continue;
      }

      // Decode and parse email
      const decodedMessage = Buffer.from(messageResponse.data.raw, "base64").toString("utf-8");
      const parsed = await simpleParser(decodedMessage);

      // Extract event data from email
      const parsedEvent = parseEventFromEmail(parsed);
      
      if (!parsedEvent) {
        console.log(`  Skipped: Could not parse event data from email`);
        continue;
      }

      // Generate unique ID
      const eventId = generateEventId(parsedEvent);

      // Transform to calendar event format
      const calendarEvent = toCalendarEvent(parsedEvent, eventId);

      // Parse with CmoEvent class
      const cmoEvent = new CmoEvent(calendarEvent);

      scrapedEvents.push({
        id: eventId,
        rawEmail: {
          messageId: parsed.messageId || messageId,
          subject: parsed.subject || "",
          from: parsed.from?.value[0]?.address || "unknown",
          date: parsed.date || new Date(),
        },
        parsedEvent,
        calendarEvent,
        cmoEvent: {
          title: cmoEvent.title,
          location: cmoEvent.location,
          notes: cmoEvent.notes,
          id: cmoEvent.id,
          creator: cmoEvent.creator,
          updated: cmoEvent.updated,
          created: cmoEvent.created,
          start: cmoEvent.start,
          end: cmoEvent.end,
          cancelled: cmoEvent.cancelled,
          allShifts: cmoEvent.allShifts.map(shift => ({
            isFilled: shift.filledBy !== null,
            isConfirmed: shift.confirmationNote !== "",
            isUnconfirmed: shift.confirmationNote === "",
            isUnfilled: shift.filledBy === null,
            stringify: `${shift.filledBy !== null ? shift.filledBy : "open"} (${shift.role}): ${shift.start.toISOString()}-${shift.end.toISOString()}`,
            id: shift.id,
            eventId: shift.eventId,
            filledBy: shift.filledBy,
            user: shift.user,
            role: shift.role,
            start: shift.start,
            end: shift.end,
            confirmationNote: shift.confirmationNote,
            cancelled: shift.cancelled,
          })),
          openShifts: [],
          filledShifts: [],
        },
      });

      console.log(`  ✓ Successfully parsed: ${cmoEvent.title} (${cmoEvent.allShifts.length} shifts)`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({ messageId: message.id!, error: errorMessage });
      console.error(`  ✗ Error processing message ${message.id}: ${errorMessage}`);
    }
  }

  console.log(`\nScraping complete!`);
  console.log(`  Successfully parsed: ${scrapedEvents.length} events`);
  console.log(`  Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log("\nErrors:");
    errors.forEach(({ messageId, error }) => {
      console.log(`  - ${messageId}: ${error}`);
    });
  }

  return scrapedEvents;
}

/**
 * Main function
 */
async function main() {
  try {
    const config = parseArgs();
    
    // Allow access token from environment variable
    if (!config.accessToken && process.env.GMAIL_ACCESS_TOKEN) {
      config.accessToken = process.env.GMAIL_ACCESS_TOKEN;
    }

    const events = await scrapeEmails(config);

    // Output results
    if (config.output) {
      const outputPath = path.resolve(config.output);
      const outputData = {
        scrapedAt: new Date().toISOString(),
        config: {
          query: config.query,
          maxResults: config.maxResults,
          fromDate: config.fromDate?.toISOString(),
          toDate: config.toDate?.toISOString(),
        },
        events,
      };

      fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
      console.log(`\n✓ Results saved to: ${outputPath}`);
    } else {
      console.log("\n--- Scraped Events ---");
      console.log(JSON.stringify(events, null, 2));
    }
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { scrapeEmails, type ScraperConfig, type ScrapedEvent };
