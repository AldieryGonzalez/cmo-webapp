"use client";

import { Button } from "../ui/button";
import { useImpersonation } from "~/lib/auth/impersonation-context";
import { useRouter } from "next/navigation";

export default function SignOutBtn() {
    const router = useRouter();
    const { setUser } = useImpersonation();

    const handleSignOut = () => {
        setUser(null);
        router.push("/");
        router.refresh();
    };

    return (
        <Button variant="ghost" onClick={handleSignOut}>
            Sign Out
        </Button>
    );
}
