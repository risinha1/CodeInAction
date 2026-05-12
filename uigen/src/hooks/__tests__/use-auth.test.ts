import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";
import * as nextNavigation from "next/navigation";
import * as actions from "@/actions";
import * as anonTracker from "@/lib/anon-work-tracker";
import * as getProjectsModule from "@/actions/get-projects";
import * as createProjectModule from "@/actions/create-project";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

const mockPush = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (nextNavigation.useRouter as any).mockReturnValue({ push: mockPush });
  (anonTracker.getAnonWorkData as any).mockReturnValue(null);
  (getProjectsModule.getProjects as any).mockResolvedValue([]);
  (createProjectModule.createProject as any).mockResolvedValue({ id: "new-project-1" });
});

describe("useAuth — initial state", () => {
  test("isLoading starts as false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useAuth — signIn", () => {
  test("returns result from signInAction on success", async () => {
    (actions.signIn as any).mockResolvedValue({ success: true });
    (getProjectsModule.getProjects as any).mockResolvedValue([{ id: "proj-1" }]);

    const { result } = renderHook(() => useAuth());
    let returnValue: any;

    await act(async () => {
      returnValue = await result.current.signIn("user@test.com", "password123");
    });

    expect(returnValue).toEqual({ success: true });
  });

  test("returns result from signInAction on failure", async () => {
    (actions.signIn as any).mockResolvedValue({ success: false, error: "Invalid credentials" });

    const { result } = renderHook(() => useAuth());
    let returnValue: any;

    await act(async () => {
      returnValue = await result.current.signIn("user@test.com", "wrongpassword");
    });

    expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
  });

  test("does not call handlePostSignIn when signIn fails", async () => {
    (actions.signIn as any).mockResolvedValue({ success: false, error: "Invalid credentials" });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@test.com", "wrongpassword");
    });

    expect(getProjectsModule.getProjects).not.toHaveBeenCalled();
    expect(createProjectModule.createProject).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("sets isLoading to true during sign in and false after", async () => {
    let resolveSignIn!: (v: any) => void;
    (actions.signIn as any).mockReturnValue(
      new Promise((resolve) => { resolveSignIn = resolve; })
    );
    (getProjectsModule.getProjects as any).mockResolvedValue([{ id: "proj-1" }]);

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.signIn("user@test.com", "password123");
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveSignIn({ success: true });
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("resets isLoading to false even when signInAction throws", async () => {
    (actions.signIn as any).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@test.com", "password123").catch(() => {});
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("calls signInAction with correct arguments", async () => {
    (actions.signIn as any).mockResolvedValue({ success: false });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("hello@example.com", "mypassword");
    });

    expect(actions.signIn).toHaveBeenCalledWith("hello@example.com", "mypassword");
  });
});

describe("useAuth — signUp", () => {
  test("returns result from signUpAction on success", async () => {
    (actions.signUp as any).mockResolvedValue({ success: true });
    (getProjectsModule.getProjects as any).mockResolvedValue([{ id: "proj-1" }]);

    const { result } = renderHook(() => useAuth());
    let returnValue: any;

    await act(async () => {
      returnValue = await result.current.signUp("new@test.com", "password123");
    });

    expect(returnValue).toEqual({ success: true });
  });

  test("returns result from signUpAction on failure", async () => {
    (actions.signUp as any).mockResolvedValue({ success: false, error: "Email already registered" });

    const { result } = renderHook(() => useAuth());
    let returnValue: any;

    await act(async () => {
      returnValue = await result.current.signUp("existing@test.com", "password123");
    });

    expect(returnValue).toEqual({ success: false, error: "Email already registered" });
  });

  test("does not call handlePostSignIn when signUp fails", async () => {
    (actions.signUp as any).mockResolvedValue({ success: false, error: "Email already registered" });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("existing@test.com", "password123");
    });

    expect(getProjectsModule.getProjects).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("sets isLoading to true during sign up and false after", async () => {
    let resolveSignUp!: (v: any) => void;
    (actions.signUp as any).mockReturnValue(
      new Promise((resolve) => { resolveSignUp = resolve; })
    );
    (getProjectsModule.getProjects as any).mockResolvedValue([{ id: "proj-1" }]);

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.signUp("new@test.com", "password123");
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveSignUp({ success: true });
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("resets isLoading to false even when signUpAction throws", async () => {
    (actions.signUp as any).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@test.com", "password123").catch(() => {});
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("calls signUpAction with correct arguments", async () => {
    (actions.signUp as any).mockResolvedValue({ success: false });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("signup@example.com", "securepass");
    });

    expect(actions.signUp).toHaveBeenCalledWith("signup@example.com", "securepass");
  });
});

describe("useAuth — post sign-in with anonymous work", () => {
  beforeEach(() => {
    (actions.signIn as any).mockResolvedValue({ success: true });
  });

  test("creates project from anon work and navigates to it when anon messages exist", async () => {
    const anonWork = {
      messages: [{ id: "1", role: "user", content: "Build a counter" }],
      fileSystemData: { "/App.jsx": { type: "file", content: "..." } },
    };
    (anonTracker.getAnonWorkData as any).mockReturnValue(anonWork);
    (createProjectModule.createProject as any).mockResolvedValue({ id: "anon-project-42" });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@test.com", "password123");
    });

    expect(createProjectModule.createProject).toHaveBeenCalledWith({
      name: expect.stringContaining("Design from"),
      messages: anonWork.messages,
      data: anonWork.fileSystemData,
    });
    expect(anonTracker.clearAnonWork).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/anon-project-42");
    expect(getProjectsModule.getProjects).not.toHaveBeenCalled();
  });

  test("does not use anon work when messages array is empty", async () => {
    (anonTracker.getAnonWorkData as any).mockReturnValue({
      messages: [],
      fileSystemData: {},
    });
    (getProjectsModule.getProjects as any).mockResolvedValue([{ id: "existing-proj" }]);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@test.com", "password123");
    });

    expect(anonTracker.clearAnonWork).not.toHaveBeenCalled();
    expect(getProjectsModule.getProjects).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/existing-proj");
  });

  test("does not use anon work when getAnonWorkData returns null", async () => {
    (anonTracker.getAnonWorkData as any).mockReturnValue(null);
    (getProjectsModule.getProjects as any).mockResolvedValue([{ id: "existing-proj" }]);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@test.com", "password123");
    });

    expect(anonTracker.clearAnonWork).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/existing-proj");
  });
});

describe("useAuth — post sign-in without anonymous work", () => {
  beforeEach(() => {
    (actions.signIn as any).mockResolvedValue({ success: true });
    (anonTracker.getAnonWorkData as any).mockReturnValue(null);
  });

  test("navigates to most recent existing project", async () => {
    (getProjectsModule.getProjects as any).mockResolvedValue([
      { id: "recent-proj" },
      { id: "older-proj" },
    ]);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@test.com", "password123");
    });

    expect(mockPush).toHaveBeenCalledWith("/recent-proj");
    expect(createProjectModule.createProject).not.toHaveBeenCalled();
  });

  test("creates a new project when user has no projects and navigates to it", async () => {
    (getProjectsModule.getProjects as any).mockResolvedValue([]);
    (createProjectModule.createProject as any).mockResolvedValue({ id: "brand-new-proj" });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@test.com", "password123");
    });

    expect(createProjectModule.createProject).toHaveBeenCalledWith({
      name: expect.stringMatching(/^New Design #\d+$/),
      messages: [],
      data: {},
    });
    expect(mockPush).toHaveBeenCalledWith("/brand-new-proj");
  });

  test("new project name contains a number between 0 and 99999", async () => {
    (getProjectsModule.getProjects as any).mockResolvedValue([]);
    (createProjectModule.createProject as any).mockResolvedValue({ id: "x" });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@test.com", "password123");
    });

    const callArg = (createProjectModule.createProject as any).mock.calls[0][0];
    const match = callArg.name.match(/^New Design #(\d+)$/);
    expect(match).not.toBeNull();
    const num = Number(match[1]);
    expect(num).toBeGreaterThanOrEqual(0);
    expect(num).toBeLessThan(100000);
  });
});

describe("useAuth — signUp post sign-in routing", () => {
  beforeEach(() => {
    (actions.signUp as any).mockResolvedValue({ success: true });
    (anonTracker.getAnonWorkData as any).mockReturnValue(null);
  });

  test("navigates to existing project after successful signUp", async () => {
    (getProjectsModule.getProjects as any).mockResolvedValue([{ id: "user-project" }]);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@test.com", "password123");
    });

    expect(mockPush).toHaveBeenCalledWith("/user-project");
  });

  test("creates new project after signUp when no projects exist", async () => {
    (getProjectsModule.getProjects as any).mockResolvedValue([]);
    (createProjectModule.createProject as any).mockResolvedValue({ id: "fresh-project" });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@test.com", "password123");
    });

    expect(createProjectModule.createProject).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/fresh-project");
  });

  test("uses anon work after signUp when anon messages exist", async () => {
    const anonWork = {
      messages: [{ id: "m1", role: "user", content: "Make a form" }],
      fileSystemData: { "/App.jsx": { type: "file", content: "..." } },
    };
    (anonTracker.getAnonWorkData as any).mockReturnValue(anonWork);
    (createProjectModule.createProject as any).mockResolvedValue({ id: "saved-anon" });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@test.com", "password123");
    });

    expect(anonTracker.clearAnonWork).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/saved-anon");
  });
});
