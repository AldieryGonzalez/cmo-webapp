import Link from "next/link";
import { currentUser } from "@clerk/nextjs";
import UserContents from "./nav/userContents";

export default async function Navbar() {
  const user = await currentUser();

  if (user) {
    return (
      <nav className="inline-flex w-full basis-14 items-center justify-between bg-purple-900 px-8 py-2.5">
        <Link href={"/"} className="text-xl font-semibold text-white">
          Northwestern CMO
        </Link>
        <UserContents user={user} />
      </nav>
    );
  }
}
