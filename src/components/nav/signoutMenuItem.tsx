"use client";

import { DropdownMenuItem } from "../ui/dropdown-menu";
import { signOut } from "~/lib/auth/client";
import { useRouter } from "next/navigation";

export default function SignOutMenuItem({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    
    const handleSignOut = async () => {
        await signOut();
        router.push("/");
        router.refresh();
    };

    return (
        <DropdownMenuItem onClick={handleSignOut}>
            {children}
        </DropdownMenuItem>
    );
}
