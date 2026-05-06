"use client";

import * as React from "react";
import {
  MessageThread,
  type ThreadMessage,
} from "@/components/shared/message-thread";

const STATUS = [
  { value: "SUBMITTED", label: "Soumise" },
  { value: "IN_REVIEW", label: "En revue" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "COMPLETED", label: "Terminée" },
  { value: "REJECTED", label: "Rejetée" },
];

const PRIORITY = [
  { value: "LOW", label: "Faible" },
  { value: "NORMAL", label: "Normale" },
  { value: "HIGH", label: "Haute" },
];

export function CustomizationThread({
  requestId,
  title,
  status,
  priority,
  category,
  messages,
  scope,
  allowStatusChange,
  currentUserId,
}: {
  requestId: string;
  title: string;
  status: string;
  priority: string;
  category?: string | null;
  messages: ThreadMessage[];
  scope: "portal" | "admin";
  allowStatusChange?: boolean;
  currentUserId: string;
}) {
  return (
    <MessageThread
      config={{
        kind: "customization",
        postEndpoint:
          scope === "portal"
            ? `/api/portal/customizations/${requestId}/messages`
            : `/api/admin/customizations/${requestId}/messages`,
        messageEndpoint: (mid) =>
          `/api/customizations/${requestId}/messages/${mid}`,
        uploadEndpoint: `/api/customizations/${requestId}/attachments`,
        attachmentHref: (id) => `/api/customizations/attachments/${id}`,
        resourceEndpoint: `/api/admin/customizations/${requestId}`,
        statusOptions: STATUS,
        priorityOptions: PRIORITY,
      }}
      subject={title}
      status={status}
      priority={priority}
      category={category ?? undefined}
      messages={messages}
      scope={scope}
      allowStatusChange={allowStatusChange}
      currentUserId={currentUserId}
    />
  );
}
