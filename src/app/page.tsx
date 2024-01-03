import { Button } from "~/components/ui/button";
import { getUserAuth } from "~/lib/auth/utils";
import Link from "next/link";
import { api } from "~/trpc/server";

export default async function Home() {
  const userAuth = await getUserAuth();
  const { data } = await api.post.getEvents.query();
  const { items } = data;
  if (items)
    return (
      <main className="space-y-6">
        <Link href="/account">
          <Button variant="outline">Account and Billing</Button>
        </Link>
        <pre className="rounded-sm bg-card p-4">
          {JSON.stringify(userAuth, null, 2)}
        </pre>
        <div>
          {items.map((item) => {
            return <p key={item.id}>{item.description}</p>;
          })}
        </div>
      </main>
    );
}
