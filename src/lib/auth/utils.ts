import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { alternateNames, contacts } from "../const/contacts";

export type AuthSession = {
  session: {
    user: {
      id: string;
      name?: string;
      email?: string;
    };
  } | null;
};

export const getUserAuth = async () => {
  // find out more about setting up 'sessionClaims' (custom sessions) here: https://clerk.com/docs/backend-requests/making/custom-session-token
  const { userId, sessionId } = auth();
  if (userId && sessionId) {
    const session = await clerkClient.sessions.getSession(sessionId);
    const user = await clerkClient.users.getUser(userId);
    return {
      session,
      user,
    };
  } else {
    return { session: null, user: null };
  }
};

export const getUser = async () => {
  const user = await currentUser();
  if (!user) return null;
  const contact = nameToContact(user.firstName + " " + user.lastName);
  return {
    ...user,
    contact,
  };
};

export const checkAuth = async () => {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");
};

export function nameToContact(name: string | null) {
  if (!name) return null;
  const names: Record<string, string> = alternateNames;
  try {
    const firstName = name.split(" ")[0]?.toLowerCase();
    const lastInitial = name.split(" ")[1]?.[0];
    if (!firstName || !lastInitial) return null;
    const contact = contacts.find((contact) => {
      return (
        (contact.firstName.toLowerCase() === firstName ||
          contact.firstName.toLowerCase() === names[firstName]) &&
        contact.lastName.startsWith(lastInitial)
      );
    });
    if (!contact) return null;
    return contact;
  } catch (e) {
    return null;
  }
}
