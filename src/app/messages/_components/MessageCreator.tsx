"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import MessageMarkdown from "~/components/dashboard/MessageMarkdown";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

export default function MessageCreator() {
    const router = useRouter();
    const [subject, setSubject] = useState("");
    const [toEmail, setToEmail] = useState<string | null>(null);
    const [contentMarkdown, setContentMarkdown] = useState("");
    const [previewMarkdown, setPreviewMarkdown] = useState<string | null>(null);

    const { data: previewData, isFetching: isPreviewLoading } =
        api.messages.previewDraft.useQuery(
            { contentMarkdown: previewMarkdown ?? "" },
            { enabled: previewMarkdown !== null },
        );

    const sendMutation = api.messages.sendAnnouncement.useMutation({
        onSuccess: () => {
            setSubject("");
            setToEmail(null);
            setContentMarkdown("");
            setPreviewMarkdown(null);
            router.refresh();
        },
    });

    const handlePreview = () => {
        setPreviewMarkdown(contentMarkdown);
    };

    const handleSend = () => {
        sendMutation.mutate({
            subject,
            toEmail: toEmail ?? undefined,
            contentMarkdown,
        });
    };

    const canSend =
        subject.trim().length > 0 &&
        contentMarkdown.trim().length > 0 &&
        !sendMutation.isPending;

    return (
        <section className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="text-lg font-semibold">New message</h2>
            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="message-subject">Subject</Label>
                    <Input
                        id="message-subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Message subject"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="message-to">To (optional)</Label>
                    <Input
                        id="message-to"
                        value={toEmail ?? ""}
                        onChange={(e) =>
                            setToEmail(e.target.value.trim() || null)
                        }
                        placeholder="Everyone (leave empty)"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="message-body">Body (Markdown)</Label>
                    <textarea
                        id="message-body"
                        value={contentMarkdown}
                        onChange={(e) => setContentMarkdown(e.target.value)}
                        placeholder="Use **bold**, [links](cmo://shift?id=...), cmo://event?id=..., cmo://user?email=..."
                        className="flex min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        rows={8}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handlePreview}
                        disabled={!contentMarkdown.trim() || isPreviewLoading}
                    >
                        {isPreviewLoading ? "Loading…" : "Preview"}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSend}
                        disabled={!canSend}
                    >
                        {sendMutation.isPending ? "Sending…" : "Send"}
                    </Button>
                    {sendMutation.isError && (
                        <p className="text-sm text-destructive">
                            {sendMutation.error.message}
                        </p>
                    )}
                </div>
            </div>
            {previewMarkdown !== null && previewData && (
                <div className="mt-4 space-y-2 rounded-md border border-muted bg-muted/30 p-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        Preview
                    </h3>
                    <MessageMarkdown
                        content={previewMarkdown}
                        resolvedShifts={previewData.resolvedShifts}
                        resolvedEvents={previewData.resolvedEvents}
                        resolvedUsers={previewData.resolvedUsers}
                    />
                </div>
            )}
        </section>
    );
}
