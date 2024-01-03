import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs";
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
      // <div className="bg-popover border-b mb-2 md:p-0 px-4">
      // <nav className="py-2 flex items-center justify-between transition-all duration-300 max-w-3xl mx-auto">
      //   <h1 className="font-semibold hover:opacity-75 transition-hover cursor-pointer">
      //     <Link href="/">Logo</Link>
      //   </h1>
      //   <div className="space-x-2 flex items-center">
      //     <ModeToggle />
      //     <UserButton afterSignOutUrl="/" />
      //   </div>
      // </nav>
      // </div>
    );
  } else return "No user?";
}
