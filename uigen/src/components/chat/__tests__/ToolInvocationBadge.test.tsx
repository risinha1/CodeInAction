import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";
import { ToolInvocation } from "ai";

afterEach(cleanup);

// --- getToolLabel unit tests ---

describe("getToolLabel — str_replace_editor", () => {
  test("create: pending", () => {
    expect(getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" }, false))
      .toBe("Creating /App.jsx...");
  });

  test("create: done", () => {
    expect(getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" }, true))
      .toBe("Created /App.jsx");
  });

  test("str_replace: pending", () => {
    expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/components/Button.jsx" }, false))
      .toBe("Editing /components/Button.jsx...");
  });

  test("str_replace: done", () => {
    expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/components/Button.jsx" }, true))
      .toBe("Edited /components/Button.jsx");
  });

  test("insert: pending", () => {
    expect(getToolLabel("str_replace_editor", { command: "insert", path: "/App.jsx" }, false))
      .toBe("Editing /App.jsx...");
  });

  test("insert: done", () => {
    expect(getToolLabel("str_replace_editor", { command: "insert", path: "/App.jsx" }, true))
      .toBe("Edited /App.jsx");
  });

  test("view: pending", () => {
    expect(getToolLabel("str_replace_editor", { command: "view", path: "/App.jsx" }, false))
      .toBe("Reading /App.jsx...");
  });

  test("view: done", () => {
    expect(getToolLabel("str_replace_editor", { command: "view", path: "/App.jsx" }, true))
      .toBe("Read /App.jsx");
  });

  test("undo_edit: pending", () => {
    expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" }, false))
      .toBe("Reverting /App.jsx...");
  });

  test("undo_edit: done", () => {
    expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" }, true))
      .toBe("Reverted /App.jsx");
  });
});

describe("getToolLabel — file_manager", () => {
  test("delete: pending", () => {
    expect(getToolLabel("file_manager", { command: "delete", path: "/old.jsx" }, false))
      .toBe("Deleting /old.jsx...");
  });

  test("delete: done", () => {
    expect(getToolLabel("file_manager", { command: "delete", path: "/old.jsx" }, true))
      .toBe("Deleted /old.jsx");
  });

  test("rename: pending", () => {
    expect(getToolLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" }, false))
      .toBe("Renaming /old.jsx...");
  });

  test("rename: done", () => {
    expect(getToolLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" }, true))
      .toBe("Renamed /old.jsx → /new.jsx");
  });
});

describe("getToolLabel — fallbacks", () => {
  test("unknown tool: pending", () => {
    expect(getToolLabel("some_other_tool", { command: "foo", path: "/x.jsx" }, false))
      .toBe("Working...");
  });

  test("unknown tool: done", () => {
    expect(getToolLabel("some_other_tool", {}, true))
      .toBe("Done");
  });

  test("empty args does not crash", () => {
    expect(() => getToolLabel("str_replace_editor", {}, false)).not.toThrow();
    expect(getToolLabel("str_replace_editor", {}, false)).toBe("Working...");
  });

  test("missing path falls back gracefully", () => {
    const label = getToolLabel("str_replace_editor", { command: "create" }, false);
    expect(label).toBe("Creating ...");
  });
});

// --- Component render tests ---

function makePendingInvocation(toolName: string, args: object): ToolInvocation {
  return { state: "call", toolCallId: "test-id", toolName, args } as ToolInvocation;
}

function makeDoneInvocation(toolName: string, args: object): ToolInvocation {
  return { state: "result", toolCallId: "test-id", toolName, args, result: "Success" } as ToolInvocation;
}

describe("ToolInvocationBadge component", () => {
  test("shows spinner when pending", () => {
    render(
      <ToolInvocationBadge
        toolInvocation={makePendingInvocation("str_replace_editor", { command: "create", path: "/App.jsx" })}
      />
    );
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).not.toBeNull();
  });

  test("shows green dot when done", () => {
    render(
      <ToolInvocationBadge
        toolInvocation={makeDoneInvocation("str_replace_editor", { command: "create", path: "/App.jsx" })}
      />
    );
    const dot = document.querySelector(".bg-emerald-500");
    expect(dot).not.toBeNull();
    expect(document.querySelector(".animate-spin")).toBeNull();
  });

  test("renders label text for pending create", () => {
    render(
      <ToolInvocationBadge
        toolInvocation={makePendingInvocation("str_replace_editor", { command: "create", path: "/App.jsx" })}
      />
    );
    expect(screen.getByText("Creating /App.jsx...")).not.toBeNull();
  });

  test("renders label text for done create", () => {
    render(
      <ToolInvocationBadge
        toolInvocation={makeDoneInvocation("str_replace_editor", { command: "create", path: "/App.jsx" })}
      />
    );
    expect(screen.getByText("Created /App.jsx")).not.toBeNull();
  });

  test("renders label text for done rename", () => {
    render(
      <ToolInvocationBadge
        toolInvocation={makeDoneInvocation("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" })}
      />
    );
    expect(screen.getByText("Renamed /old.jsx → /new.jsx")).not.toBeNull();
  });

  test("renders fallback for unknown tool", () => {
    render(
      <ToolInvocationBadge
        toolInvocation={makePendingInvocation("unknown_tool", {})}
      />
    );
    expect(screen.getByText("Working...")).not.toBeNull();
  });
});
