import { addMonths, subMonths } from "date-fns";
import Link from "next/link";
import DashboardMessages from "~/components/dashboard/DashboardMessages";
import RecentShifts from "~/components/dashboard/RecentShifts";
import UpcomingShifts from "~/components/dashboard/UpcomingShifts";
import { getUser } from "~/lib/auth/utils";
import { getQueryDate } from "~/lib/dates/utils";
import { api } from "~/trpc/server";

export default async function Home() {
    const user = await getUser();
    const queryDate = await getQueryDate();
    const events = user
        ? await api.events.getUserEvents.query({
              userEmail: user.email,
              start: subMonths(queryDate, 1),
              end: addMonths(queryDate, 1),
          })
        : [];

    const announcements = user
        ? await api.messages.getAnnouncements.query({
              userEmail: user.email,
          })
        : await api.messages.getAnnouncements.query();
    return (
        <div className="flex max-h-full flex-col px-8 pt-3">
            {!user ? (
                <PortfolioIntro />
            ) : (
                <>
                    <div className="grow-[2]">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Dashboard
                        </h1>
                        <UpcomingShifts
                            events={events}
                            user={user}
                            queryDate={queryDate}
                        />
                    </div>
                    <div className="flex grow gap-4 overflow-y-auto p-2">
                        <DashboardMessages messages={announcements} />
                        <RecentShifts
                            events={events}
                            user={user}
                            queryDate={queryDate}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

function PortfolioIntro() {
    return (
        <div className="mx-auto mt-6 w-full max-w-3xl space-y-6">
            <div className="rounded-lg border-[3px] border-black bg-white p-8 shadow-[7px_7px_0_#000000] dark:bg-card">
                <h1 className="text-center text-3xl font-bold text-purple-900 dark:text-purple-400">
                    Northwestern CMO
                </h1>
                <p className="mt-1 text-center text-lg font-semibold text-muted-foreground">
                    Concert Management Office &mdash; Portfolio Demo
                </p>

                <hr className="my-5 border-purple-200 dark:border-purple-800" />

                <div className="space-y-4 text-sm leading-relaxed">
                    <p>
                        This is a fully-functional shift-management application
                        built for Northwestern University&rsquo;s Concert
                        Management Office. It lets staff browse upcoming events,
                        view and claim shifts, manage a cart of saved shifts, and
                        synchronize data from Google Calendar.
                    </p>

                    <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950">
                        <h3 className="mb-1 font-semibold text-amber-800 dark:text-amber-300">
                            Privacy Notice
                        </h3>
                        <p className="text-amber-900 dark:text-amber-200">
                            All personal names, email addresses, and phone
                            numbers in this demo have been{" "}
                            <strong>redacted and randomized</strong>. No real
                            personally-identifiable information is exposed. The
                            data you see is structurally identical to production
                            but contains only synthetic identities.
                        </p>
                    </div>

                    <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950">
                        <h3 className="mb-2 font-semibold text-purple-900 dark:text-purple-200">
                            How to Explore
                        </h3>
                        <ol className="ml-4 list-decimal space-y-1.5 text-purple-900 dark:text-purple-100">
                            <li>
                                <strong>
                                    Pick a user
                                </strong>{" "}
                                with the purple{" "}
                                <span className="inline-flex items-center rounded bg-purple-100 px-1 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                    Viewing as
                                </span>{" "}
                                control in the bottom-left corner to impersonate
                                any staff member and see the app from their
                                perspective.
                            </li>
                            <li>
                                <strong>
                                    Adjust the simulated date
                                </strong>{" "}
                                with the amber{" "}
                                <span className="inline-flex items-center rounded bg-amber-100 px-1 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                                    Simulated Date
                                </span>{" "}
                                control in the bottom-right corner to time-travel
                                through the event calendar.
                            </li>
                            <li>
                                Browse{" "}
                                <Link
                                    href="/shifts"
                                    className="font-semibold text-purple-700 underline hover:text-purple-900 dark:text-purple-400"
                                >
                                    Shifts
                                </Link>{" "}
                                to see events, filter by date range, location,
                                role, and availability.
                            </li>
                            <li>
                                Open any event detail page to view its shifts,
                                save them to your cart, and see scheduling
                                conflicts.
                            </li>
                        </ol>
                    </div>

                    <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                        <h3 className="mb-2 font-semibold">
                            Notable Features
                        </h3>
                        <ul className="ml-4 list-disc space-y-1.5 text-sm">
                            <li>
                                <strong>Stable, shareable URLs</strong> &mdash;
                                all filters (date range, location, search term,
                                shift tab) are persisted as query parameters so
                                any view can be bookmarked or shared.
                            </li>
                            <li>
                                <strong>
                                    Anonymous cart via cookie sessions
                                </strong>{" "}
                                &mdash; save shifts to a cart without creating an
                                account; the cart persists across page loads.
                            </li>
                            <li>
                                <strong>
                                    Simulated date &amp; user impersonation
                                </strong>{" "}
                                &mdash; two floating controls let you time-travel
                                and switch perspectives without any sign-in
                                flow.
                            </li>
                            <li>
                                <strong>Google Calendar integration</strong>{" "}
                                &mdash; the admin Sync page pulls events from
                                Google Calendar and diffs them against the local
                                database (mocked in demo mode).
                            </li>
                            <li>
                                <strong>
                                    Full-stack type safety
                                </strong>{" "}
                                &mdash; built with Next.js App Router, tRPC,
                                Drizzle ORM, and TypeScript end-to-end.
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                        <Link
                            href="/shifts?shifts=openShifts"
                            className="flex-1 rounded-lg border-2 border-purple-900 bg-purple-900 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-purple-800 dark:border-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700"
                        >
                            Browse Open Shifts
                        </Link>
                        <Link
                            href="/shifts"
                            className="flex-1 rounded-lg border-2 border-purple-900 px-6 py-3 text-center font-semibold text-purple-900 transition-colors hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-950"
                        >
                            View All Events
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
