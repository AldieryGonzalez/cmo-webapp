import { type calendar_v3 } from "@googleapis/calendar";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { type ParsedMail } from "mailparser";

/**
 * Email Parser Module
 * 
 * Extracts event data from emails and transforms it into Google Calendar API format
 * to be compatible with the existing CmoEvent class.
 */

interface ParsedEventData {
  title: string;
  location: string;
  description: string;
  start: string;
  end: string;
  created: string;
  updated: string;
  creator: string;
}

/**
 * Parse email body to extract event information
 * Assumes emails contain event details in a structured format
 */
export function parseEventFromEmail(email: ParsedMail): ParsedEventData | null {
  const window = new JSDOM("").window;
  const purify = DOMPurify(window);
  
  // Get sanitized HTML or fallback to text
  const content = email.html 
    ? purify.sanitize(email.html as string, { FORBID_TAGS: ["style", "script"] })
    : email.text || "";

  // Extract title from subject
  const title = extractTitle(email.subject || "");
  if (!title) return null;

  // Extract location
  const location = extractLocation(content);

  // Extract dates
  const dates = extractDates(content);
  if (!dates) return null;

  // Extract description (shifts info)
  const description = extractDescription(content);

  // Get creator email
  const creator = email.from?.value[0]?.address || "unknown@example.com";

  return {
    title,
    location,
    description,
    start: dates.start,
    end: dates.end,
    created: email.date?.toISOString() || new Date().toISOString(),
    updated: email.date?.toISOString() || new Date().toISOString(),
    creator,
  };
}

/**
 * Extract event title from email subject
 * Looks for patterns like "Event: <title>" or just uses the subject
 */
function extractTitle(subject: string): string | null {
  // Remove common prefixes
  const cleaned = subject
    .replace(/^(Re:|Fwd:|Event:|CMO:)\s*/i, "")
    .trim();
  
  return cleaned || null;
}

/**
 * Extract location from email content
 * Looks for common location indicators
 */
function extractLocation(content: string): string {
  const locationPatterns = [
    /Location:\s*([^\n<]+)/i,
    /Venue:\s*([^\n<]+)/i,
    /At:\s*([^\n<]+)/i,
    /(Pick-Staiger|Galvin|McClintock|Master Class Room|Ryan Opera Theater|Lutkin|Cahn|Alice Millar|Regenstein|Ryan Field|Norris)/i,
  ];

  for (const pattern of locationPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return "Other";
}

/**
 * Extract dates from email content
 * Looks for date/time patterns in various formats
 */
function extractDates(content: string): { start: string; end: string } | null {
  // Common date patterns
  const datePatterns = [
    // ISO format: 2024-01-15T19:00:00
    /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/g,
    // US format: January 15, 2024 at 7:00 PM
    /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}(?:\s+at\s+\d{1,2}:\d{2}\s*(?:AM|PM))?)/gi,
    // Short format: 01/15/2024 7:00 PM
    /(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi,
  ];

  const dates: Date[] = [];
  
  for (const pattern of datePatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      try {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          dates.push(date);
        }
      } catch (e) {
        // Skip invalid dates
      }
    }
  }

  if (dates.length >= 2) {
    // Sort dates and use first two
    dates.sort((a, b) => a.getTime() - b.getTime());
    return {
      start: dates[0].toISOString(),
      end: dates[1].toISOString(),
    };
  }

  // Try to find start/end explicitly
  const startMatch = content.match(/Start:\s*([^\n<]+)/i);
  const endMatch = content.match(/End:\s*([^\n<]+)/i);
  
  if (startMatch && endMatch) {
    try {
      return {
        start: new Date(startMatch[1]).toISOString(),
        end: new Date(endMatch[1]).toISOString(),
      };
    } catch (e) {
      // Invalid dates
    }
  }

  return null;
}

/**
 * Extract event description including shift information
 * This will be parsed by the CmoEvent class
 */
function extractDescription(content: string): string {
  // Remove HTML tags for plain text parsing
  const text = content.replace(/<[^>]+>/g, "\n").trim();
  
  // Look for shift patterns in the content
  const shiftSection = extractShiftSection(text);
  
  return shiftSection || text;
}

/**
 * Extract the section of content that contains shift information
 */
function extractShiftSection(text: string): string {
  const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
  
  // Patterns that indicate shift information
  const shiftIndicators = [
    /^(open|filled|\[cancel)/i,
    /\(SM|Tech|PA|REC|VID\)/i,
    /\d{1,2}:\d{2}[ap]m/i,
  ];

  // Find lines that look like shift descriptions
  const shiftLines: string[] = [];
  let inShiftSection = false;

  for (const line of lines) {
    const hasShiftPattern = shiftIndicators.some(pattern => pattern.test(line));
    
    if (hasShiftPattern) {
      inShiftSection = true;
      shiftLines.push(line);
    } else if (inShiftSection && line.length < 100) {
      // Might be a note or continuation
      shiftLines.push(line);
    } else if (inShiftSection && line.length > 100) {
      // Probably not shift info anymore
      break;
    }
  }

  return shiftLines.join("\n");
}

/**
 * Transform parsed event data into Google Calendar API format
 * This allows the existing CmoEvent class to work without modification
 */
export function toCalendarEvent(data: ParsedEventData, id: string): calendar_v3.Schema$Event {
  return {
    id,
    summary: data.title,
    location: data.location,
    description: data.description,
    start: {
      dateTime: data.start,
    },
    end: {
      dateTime: data.end,
    },
    created: data.created,
    updated: data.updated,
    creator: {
      email: data.creator,
    },
    organizer: {
      email: data.creator,
    },
  };
}

/**
 * Generate a unique ID for an event based on its properties
 */
export function generateEventId(data: ParsedEventData): string {
  const hash = `${data.title}-${data.start}-${data.location}`;
  return Buffer.from(hash).toString("base64").replace(/[^a-zA-Z0-9]/g, "").substring(0, 26);
}
