"use client";

import { useNotifications } from "@/hooks/use-notifications";
import { CheckCircle } from "lucide-react";

export function ValidationAlert() {
  const { data } = useNotifications(15000);
  const recentApproval = data.items.find(
    (n) => n.type === "VALIDATION_APPROVED" && !n.read
  );
  if (!recentApproval) return null;
  return (
    <div className="mb-5 rounded-2xl bg-lime-50 p-4 text-sm font-bold text-lime-700">
      <CheckCircle size={16} className="mr-2 inline" />
      {recentApproval.title} — {recentApproval.message}
    </div>
  );
}
