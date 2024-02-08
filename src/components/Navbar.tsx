import { currentUser } from "@clerk/nextjs";
import Link from "next/link";
import UserContents from "./nav/userContents";

export default async function Navbar() {
  const user = await currentUser();

  return (
    <nav className="inline-flex max-h-[3.125rem] w-full grow-[2] basis-12 items-center justify-between bg-purple-900 px-8 py-2.5">
      <Link href={"/"} className="text-xl font-semibold text-white">
        Northwestern CMO
      </Link>
      {user && <UserContents user={user} />}
    </nav>
  );
}
