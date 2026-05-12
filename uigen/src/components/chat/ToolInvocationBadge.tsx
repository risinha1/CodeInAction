"use client";

import { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

export function getToolLabel(
  toolName: string,
  args: Record<string, unknown>,
  isDone: boolean
): string {
  const path = (args?.path as string) ?? "";
  const command = args?.command as string | undefined;

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return isDone ? `Created ${path}` : `Creating ${path}...`;
      case "str_replace":
      case "insert":
        return isDone ? `Edited ${path}` : `Editing ${path}...`;
      case "view":
        return isDone ? `Read ${path}` : `Reading ${path}...`;
      case "undo_edit":
        return isDone ? `Reverted ${path}` : `Reverting ${path}...`;
    }
  }

  if (toolName === "file_manager") {
    const newPath = (args?.new_path as string) ?? "";
    switch (command) {
      case "delete":
        return isDone ? `Deleted ${path}` : `Deleting ${path}...`;
      case "rename":
        return isDone ? `Renamed ${path} → ${newPath}` : `Renaming ${path}...`;
    }
  }

  return isDone ? "Done" : "Working...";
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const isDone = toolInvocation.state === "result";
  const label = getToolLabel(
    toolInvocation.toolName,
    toolInvocation.args as Record<string, unknown>,
    isDone
  );

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
