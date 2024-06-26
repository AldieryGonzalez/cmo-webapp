import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "~/styles/globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { neobrutalism } from "@clerk/themes";
import Navbar from "~/components/Navbar";
import { Toaster } from "~/components/ui/sonner";
import { TRPCReactProvider } from "~/trpc/react";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

export const metadata = {
    title: "Northwestern CMO",
    description: "Northwestern's Concert Management Office application",
    icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`font-sans ${inter.variable}`}>
                <SpeedInsights />
                <TRPCReactProvider cookies={cookies().toString()}>
                    <ClerkProvider
                        appearance={{
                            baseTheme: neobrutalism,
                        }}
                    >
                        <div className="flex h-svh flex-col">
                            <Navbar />
                            <main className="grow overflow-y-auto">
                                {children}
                            </main>
                        </div>
                    </ClerkProvider>
                    <Toaster />
                </TRPCReactProvider>
            </body>
        </html>
    );
}
