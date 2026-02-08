"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

import type { MockUser } from "~/lib/auth/utils";
import Link from "next/link";
import { Suspense } from "react";
import CartButtonBadge from "./cartButton";
import CartBadge from "./cartLink";
import NavLink from "./navLink";

type UserContentsProps = {
    user: MockUser | null;
};

const UserContents: React.FC<UserContentsProps> = ({ user }) => {
    return (
        <>
            {/* md + Nav */}
            <div className="flex items-center justify-start gap-6">
                <NavLink
                    href="/"
                    className="hidden text-base font-medium text-white md:block"
                >
                    Dashboard
                </NavLink>
                <NavLink
                    href="/shifts"
                    className="hidden text-base font-medium text-white md:block"
                >
                    Shifts
                </NavLink>
                {user && (
                    <NavLink
                        href="/messages"
                        className="hidden text-base font-medium text-white md:block"
                    >
                        Messages
                    </NavLink>
                )}
                <NavLink
                    href="/cart"
                    className="hidden gap-0.5 rounded-full border-black border-opacity-10 bg-purple-900 text-base font-medium text-white md:flex md:items-center md:justify-center md:gap-0.5"
                >
                    <CartBadge />
                </NavLink>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button>
                            <div className="hidden items-center justify-start gap-0.5 rounded-full border-black border-opacity-10 bg-purple-900 p-1 md:flex">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-purple-900">
                                    {user?.name?.[0]?.toUpperCase() ?? "?"}
                                </div>
                            </div>
                            <div className="md:hidden">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="28"
                                    height="28"
                                    fill="white"
                                    className="bi bi-list"
                                    strokeWidth="16"
                                    viewBox="0 0 16 16"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M2.5 11.5A.5.5 0 0 0 3 12h10a.5.5 0 0 0 0-1H3a.5.5 0 0 0-.5.5zm0-4A.5.5 0 0 0 3 8h10a.5.5 0 0 0 0-1H3a.5.5 0 0 0-.5.5zm0-4A.5.5 0 0 0 3 4h10a.5.5 0 0 0 0-1H3a.5.5 0 0 0-.5.5z"
                                    />
                                </svg>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" collisionPadding={20}>
                        <DropdownMenuLabel>
                            {user ? `Viewing as ${user.name}` : "No user selected"}
                        </DropdownMenuLabel>

                        <DropdownMenuGroup className="md:hidden">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/cart">
                                    <Suspense fallback={<p>Loading...</p>}>
                                        <CartButtonBadge />
                                    </Suspense>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/">Dashboard</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/shifts">Shifts</Link>
                            </DropdownMenuItem>
                            {user && (
                                <DropdownMenuItem asChild>
                                    <Link href="/messages">Messages</Link>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                            Use the floating control to switch users
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    );
};

export default UserContents;
