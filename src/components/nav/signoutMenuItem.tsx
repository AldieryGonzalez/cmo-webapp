"use client";

import { useClerk } from "@clerk/nextjs";
import { DropdownMenuItem } from "~/components/ui/dropdown-menu";

type SignOutMenuItemProps = {
  children: React.ReactNode;
};

const SignOutMenuItem: React.FC<SignOutMenuItemProps> = ({ children }) => {
  const { signOut } = useClerk();
  return (
    <DropdownMenuItem onClick={() => signOut()} className="text-red-500">
      {children}
    </DropdownMenuItem>
  );
};

export default SignOutMenuItem;
