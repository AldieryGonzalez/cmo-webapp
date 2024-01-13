import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

import { ShoppingCart } from "lucide-react";

import Link from "next/link";
import Image from "next/image";
import NavLink from "./navLink";
import SignOutMenuItem from "./signoutMenuItem";
import type { User } from "@clerk/nextjs/server";

type UserContentsProps = {
  user: User;
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
        <NavLink
          href="/messages"
          className="hidden text-base font-medium text-white md:block"
        >
          Messages
        </NavLink>
        <NavLink
          href="/calendar"
          className="hidden text-base font-medium text-white md:block"
        >
          Calendar
        </NavLink>
        <NavLink
          href="/cart"
          className="hidden gap-0.5 rounded-full border-black border-opacity-10 bg-purple-900 text-base font-medium text-white md:flex md:items-center md:justify-center md:gap-0.5"
        >
          <ShoppingCart size={20} />
          Cart
        </NavLink>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button>
              <div className=" hidden items-center  justify-start gap-0.5 rounded-full border-black border-opacity-10 bg-purple-900 md:flex ">
                <Image
                  className="rounded-full"
                  src={user.imageUrl}
                  alt="Profile photo"
                  width={32}
                  height={32}
                />
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
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>{`Welcome, ${user.firstName}`}</DropdownMenuLabel>

            <DropdownMenuGroup className="md:hidden">
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/cart">
                  <ShoppingCart size={16} />
                  <p className="ml-1">Cart</p>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/shifts">Shifts</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/messages">Messages</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/calendar">Calendar</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <SignOutMenuItem>Log out</SignOutMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

export default UserContents;
