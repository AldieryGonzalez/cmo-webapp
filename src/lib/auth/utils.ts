import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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

export const checkAuth = async () => {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");
};
