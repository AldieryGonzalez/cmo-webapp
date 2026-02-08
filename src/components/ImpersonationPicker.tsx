"use client";

import { useState, useEffect, useMemo } from "react";
import { UserRound, RotateCcw } from "lucide-react";
import { useImpersonation } from "~/lib/auth/impersonation-context";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

export function ImpersonationPicker() {
  const { user, setUser, availableUsers } = useImpersonation();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset search when popover closes
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return availableUsers;
    const q = search.toLowerCase();
    return availableUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [search, availableUsers]);

  if (!mounted) return null;

  const handleSelect = (email: string) => {
    setUser(email);
    setOpen(false);
  };

  const handleClear = () => {
    setUser(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "fixed bottom-4 left-4 z-50 h-auto gap-2 border-purple-500/40 px-4 py-2 shadow-lg",
            "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          )}
        >
          <UserRound className="h-4 w-4 text-purple-500" />
          <span className="hidden text-xs text-purple-600 sm:inline dark:text-purple-400">
            Viewing as:
          </span>
          <span className="max-w-[160px] truncate font-mono text-sm">
            {user ? user.name : "No user"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start" side="top">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
              Impersonate User
            </Label>
            <p className="text-xs text-muted-foreground">
              Select a user to view the app from their perspective. All names
              have been redacted and randomized.
            </p>
          </div>

          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />

          <div className="max-h-52 overflow-y-auto rounded-md border">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No users match your search.
              </p>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.email}
                  onClick={() => handleSelect(u.email)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                    u.email === user?.email && "bg-purple-50 font-medium dark:bg-purple-950",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      u.email === user?.email
                        ? "bg-purple-600 text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {u.firstName[0]}
                    {u.lastName[0]}
                  </span>
                  <span className="truncate">{u.name}</span>
                </button>
              ))
            )}
          </div>

          <Button
            onClick={handleClear}
            variant="outline"
            size="sm"
            className="w-full gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear Selection
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
