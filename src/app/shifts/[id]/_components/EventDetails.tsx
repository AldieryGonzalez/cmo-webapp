"use client";
import { longTimeRangeString } from "~/lib/events/utils";
import type { EventsOutput } from "~/server/api/routers/events";

type DetailsProps = {
    event: EventsOutput["getEvent"];
};

const Details = ({ event }: DetailsProps) => {
    return (
        <div className="flex flex-col text-sm text-muted-foreground sm:flex-row">
            <p>{longTimeRangeString(event)}</p>
            <p>{`@${event.location}`}</p>
        </div>
    );
};

export default Details;
