"use client";
import { Button } from "~/components/ui/button";
import { type EventsOutput } from "~/server/api/routers/events";
import { api } from "~/trpc/react";

type SyncButtonProps = {
  event: EventsOutput["getEvents"][0];
};

const SyncButton: React.FC<SyncButtonProps> = ({ event }) => {
  const syncEvent = api.events.syncEvent.useMutation().mutate;
  return <Button onClick={() => syncEvent(event)}>SyncButton</Button>;
};

export default SyncButton;
