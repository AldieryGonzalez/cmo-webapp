import { asc } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schema";

export const userRouter = createTRPCRouter({
  listImpersonationUsers: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        alternativeNames: users.alternativeNames,
      })
      .from(users)
      .orderBy(asc(users.lastName), asc(users.firstName));
  }),
});
