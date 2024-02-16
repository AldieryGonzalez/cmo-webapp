import { api } from "~/trpc/server";

const Tester = async () => {
    // Date of feb 23, 2024
    const event = await api.events.getEvent.query("1p93ffa7is47g3c4ajhmp7ap04");
    const events = await api.events.getEvents.query({
        start: new Date("2024-02-23"),
        end: new Date("2024-02-25"),
    });

    return (
        <div>
            <div className="whitespace-pre bg-white">
                {JSON.stringify(event, undefined, 4)}
            </div>
            <div className="whitespace-pre">
                {JSON.stringify(events, undefined, 4)}
            </div>
        </div>
    );
};

export default Tester;
