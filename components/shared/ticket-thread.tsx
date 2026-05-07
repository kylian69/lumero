"use client";

import * as React from "react";
import {
  MessageThread,
  type ThreadMessage,
  type ThreadAttachment,
} from "@/components/shared/message-thread";

export type { ThreadMessage, ThreadAttachment };

const TICKET_STATUS = [
  { value: "OPEN", label: "Ouvert" },
  { value: "WAITING_STAFF", label: "À traiter" },
  { value: "WAITING_CLIENT", label: "Attente client" },
  { value: "RESOLVED", label: "Résolu" },
  { value: "CLOSED", label: "Fermé" },
];

const TICKET_PRIORITY = [
  { value: "LOW", label: "Faible" },
  { value: "NORMAL", label: "Normale" },
  { value: "HIGH", label: "Haute" },
  { value: "URGENT", label: "Urgent" },
];

export function TicketThread({
  ticketId,
  subject,
  status,
  priority,
  category,
  messages,
  scope,
  allowStatusChange,
  currentUserId,
}: {
  ticketId: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  messages: ThreadMessage[];
  scope: "portal" | "admin";
  allowStatusChange?: boolean;
  currentUserId: string;
}) {
  return (
    <MessageThread
      config={{
        kind: "ticket",
        postEndpoint:
          scope === "portal"
            ? `/api/portal/tickets/${ticketId}/messages`
            : `/api/admin/tickets/${ticketId}/messages`,
        messageEndpoint: (mid) => `/api/tickets/${ticketId}/messages/${mid}`,
        uploadEndpoint: `/api/tickets/${ticketId}/attachments`,
        attachmentHref: (id) => `/api/tickets/attachments/${id}`,
        resourceEndpoint: `/api/admin/tickets/${ticketId}`,
        statusOptions: TICKET_STATUS,
        priorityOptions: TICKET_PRIORITY,
      }}
      subject={subject}
      status={status}
      priority={priority}
      category={category}
      messages={messages}
      scope={scope}
      allowStatusChange={allowStatusChange}
      currentUserId={currentUserId}
    />
  );
}
