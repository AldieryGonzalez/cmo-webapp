"use client";

import { DropdownMenuItem } from "../ui/dropdown-menu";
import { useImpersonation } from "~/lib/auth/impersonation-context";
import { useRouter } from "next/navigation";

export default function SignOutMenuItem({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { setUser } = useImpersonation();

    const handleSignOut = () => {
        setUser(null);
        router.push("/");
        router.refresh();
    };

    return (
        <DropdownMenuItem onClick={handleSignOut}>
            {children}
        </DropdownMenuItem>
    );
}
