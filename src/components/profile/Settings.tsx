import { Suspense, useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";

const Settings = () => {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-4xl font-bold">Settings</h1>
                <p className="font-medium">Change interactions here</p>
            </div>
            <div className="flex flex-col items-stretch justify-start gap-2">
                <p className="border-b border-black/5 font-semibold">
                    Connected Google Calendars -{" "}
                    <span className="text-sm font-normal">
                        Change calendars allowed to have conflicts
                    </span>
                </p>
                <Suspense fallback={<p>Loading...</p>}>
                    <Calendars />
                </Suspense>
            </div>
            <div className="flex flex-col items-stretch justify-start gap-2">
                <p className="border-b border-black/5 font-semibold">
                    Alternative Names
                </p>
                <ul className="flex flex-col gap-2">
                    <li>Display Name</li>
                    <li>Username</li>
                    <li>Preferred Name</li>
                </ul>
            </div>
        </div>
    );
};

export default Settings;

function Calendars() {
    const [savedCalendars, savedQuery] =
        api.events.getSavedCalendars.useSuspenseQuery();
    const saveCalendars = api.events.saveCalendars.useMutation({
        onSuccess: async () => {
            await savedQuery.refetch();
            toast.success("Calendars saved");
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });
    const [allCalendars] = api.events.getCalendarList.useSuspenseQuery();
    const dbCalendars = savedCalendars[0]?.calendars?.split(",") ?? [];
    const [selectedCalendars, setSelectedCalendars] =
        useState<string[]>(dbCalendars);
    const changed = selectedCalendars.join(",") !== dbCalendars.join(",");

    const handleSelect = (id: string, checked: boolean) => {
        if (!checked) {
            setSelectedCalendars((prev) =>
                prev.filter((calendarId) => calendarId !== id),
            );
        } else {
            setSelectedCalendars((prev) => [...prev, id]);
        }
    };
    console.log("Calendars", savedCalendars);

    return (
        <div className="flex flex-col gap-2">
            <ul className="flex flex-col gap-2">
                {allCalendars.map((calendar) => (
                    <li
                        key={calendar.id}
                        className="flex items-center gap-2 border-b border-black/5"
                    >
                        <Switch
                            id={calendar.id!}
                            checked={
                                calendar.id
                                    ? selectedCalendars.includes(calendar.id)
                                    : false
                            }
                            onCheckedChange={(checked) =>
                                handleSelect(calendar.id!, checked)
                            }
                        />

                        <label htmlFor={calendar.id!}>{calendar.summary}</label>
                    </li>
                ))}
            </ul>
            <Button
                onClick={() => {
                    saveCalendars.mutate(selectedCalendars);
                }}
                disabled={!changed || saveCalendars.isLoading}
            >
                Save
            </Button>
        </div>
    );
}
