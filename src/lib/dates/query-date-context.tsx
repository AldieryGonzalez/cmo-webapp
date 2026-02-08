"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

const QUERY_DATE_COOKIE_NAME = "query-date";

interface QueryDateContextType {
  queryDate: Date;
  setQueryDate: (date: Date) => void;
  formattedDate: string;
}

const QueryDateContext = createContext<QueryDateContextType | undefined>(undefined);

const DEFAULT_QUERY_DATE = new Date("2023-08-01T00:00:00.000Z");

export function QueryDateProvider({ children }: { children: React.ReactNode }) {
  const [queryDate, setQueryDateState] = useState<Date>(DEFAULT_QUERY_DATE);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Initialize from cookie on mount
  useEffect(() => {
    setMounted(true);
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${QUERY_DATE_COOKIE_NAME}=`))
      ?.split("=")[1];

    if (cookieValue) {
      try {
        const parsedDate = new Date(decodeURIComponent(cookieValue));
        if (!isNaN(parsedDate.getTime())) {
          setQueryDateState(parsedDate);
        }
      } catch (e) {
        console.error("Failed to parse query date from cookie:", e);
      }
    }
  }, []);

  const setQueryDate = useCallback((date: Date) => {
    if (typeof window === "undefined") return; // Safety check for SSR
    setQueryDateState(date);
    // Set cookie with expiration (1 year)
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${QUERY_DATE_COOKIE_NAME}=${encodeURIComponent(date.toISOString())}; expires=${expires.toUTCString()}; path=/`;
    
    // Refresh server components to pick up the new cookie value
    router.refresh();
  }, [router]);

  const formattedDate = format(queryDate, "MMM dd, yyyy HH:mm");

  // Always provide the context, even during SSR
  // The context will have the default value until mounted
  return (
    <QueryDateContext.Provider value={{ queryDate, setQueryDate, formattedDate }}>
      {children}
    </QueryDateContext.Provider>
  );
}

export function useQueryDate() {
  const context = useContext(QueryDateContext);
  if (context === undefined) {
    throw new Error("useQueryDate must be used within a QueryDateProvider");
  }
  return context;
}
