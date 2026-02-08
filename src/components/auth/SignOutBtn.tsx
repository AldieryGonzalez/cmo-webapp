"use client";

import { Button } from "../ui/button";
import { signOut } from "~/lib/auth/client";
import { useRouter } from "next/navigation";

export default function SignOutBtn() {
    const router = useRouter();
    
    const handleSignOut = async () => {
        await signOut();
        router.push("/");
        router.refresh();
    };

    return (
        <Button variant="ghost" onClick={handleSignOut}>
            Sign Out
        </Button>
    );
}
