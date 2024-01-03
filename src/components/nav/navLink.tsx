"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "~/lib/utils";

const NavLink = ({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) => {
  const basePath = usePathname();

  const isActive = basePath === href;

  return (
    <Link
      href={href}
      className={cn(isActive && "font-bold underline", className)}
    >
      {children}
    </Link>
  );
};
export default NavLink;
