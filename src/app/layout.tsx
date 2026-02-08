import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "~/styles/globals.css";

import Navbar from "~/components/Navbar";
import { Toaster } from "~/components/ui/sonner";
import { TRPCReactProvider } from "~/trpc/react";
import { QueryDateProvider } from "~/lib/dates/query-date-context";
import { QueryDatePicker } from "~/components/QueryDatePicker";
import { ImpersonationProvider } from "~/lib/auth/impersonation-context";
import { ImpersonationPicker } from "~/components/ImpersonationPicker";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

export const metadata = {
    title: "Northwestern CMO",
    description: "Northwestern's Concert Management Office Portfolio",
    icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieHeader = (await cookies()).toString();
    return (
        <html lang="en">
            <body className={`font-sans ${inter.variable}`}>
                <SpeedInsights />
                <TRPCReactProvider cookies={cookieHeader}>
                    <ImpersonationProvider>
                        <QueryDateProvider>
                            <div className="flex h-svh flex-col">
                                <Navbar />
                                <main className="grow overflow-y-auto">
                                    {children}
                                </main>
                            </div>
                            <ImpersonationPicker />
                            <QueryDatePicker />
                            <Toaster />
                        </QueryDateProvider>
                    </ImpersonationProvider>
                </TRPCReactProvider>
            </body>
        </html>
    );
}
