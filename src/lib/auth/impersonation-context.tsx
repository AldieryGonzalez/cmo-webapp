"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

const IMPERSONATION_COOKIE_NAME = "impersonate-user";

export interface ImpersonatedUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user";
  isAnonymous: false;
  searchNames: string[];
}

interface ImpersonationContextType {
  user: ImpersonatedUser | null;
  setUser: (email: string | null) => void;
  availableUsers: ImpersonatedUser[];
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

const splitAltNames = (altNames?: string | null) =>
  altNames
    ? altNames
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
    : [];

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { data: impersonationUsers = [] } =
    api.users.listImpersonationUsers.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // 5 min — user list changes rarely
    });

  // Read cookie on mount
  useEffect(() => {
    setMounted(true);
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${IMPERSONATION_COOKIE_NAME}=`))
      ?.split("=")[1];

    if (cookieValue) {
      try {
        setCurrentEmail(decodeURIComponent(cookieValue));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const setUser = useCallback(
    (email: string | null) => {
      setCurrentEmail(email);
      if (email) {
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);
        document.cookie = `${IMPERSONATION_COOKIE_NAME}=${encodeURIComponent(email)}; expires=${expires.toUTCString()}; path=/`;
      } else {
        // Clear the cookie
        document.cookie = `${IMPERSONATION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
      router.refresh();
    },
    [router],
  );

  const availableUsers = useMemo(
    () =>
      impersonationUsers.map((user) => {
        const fullName = `${user.firstName} ${user.lastName}`;
        return {
          id: user.id,
          email: user.email,
          name: fullName,
          firstName: user.firstName,
          lastName: user.lastName,
          role: "user" as const,
          isAnonymous: false as const,
          searchNames: [fullName, ...splitAltNames(user.alternativeNames)],
        };
      }),
    [impersonationUsers],
  );

  const user = currentEmail
    ? availableUsers.find((u) => u.email === currentEmail) ?? null
    : null;

  return (
    <ImpersonationContext.Provider value={{ user, setUser, availableUsers }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error("useImpersonation must be used within an ImpersonationProvider");
  }
  return context;
}
