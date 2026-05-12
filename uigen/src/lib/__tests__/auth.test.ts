// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";
import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockGet = vi.fn();
const mockSet = vi.fn();
const mockDelete = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({ get: mockGet, set: mockSet, delete: mockDelete })
  ),
}));

import {
  createSession,
  getSession,
  deleteSession,
  verifySession,
} from "@/lib/auth";

const SECRET = new TextEncoder().encode("development-secret-key");
const COOKIE_NAME = "auth-token";

async function makeToken(payload: object, expiresIn = "7d") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(SECRET);
}

function makeRequest(token?: string) {
  return new NextRequest("http://localhost/", {
    headers: token ? { Cookie: `${COOKIE_NAME}=${token}` } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// --- createSession ---

describe("createSession", () => {
  test("sets the auth-token cookie", async () => {
    await createSession("user-1", "test@example.com");
    expect(mockSet).toHaveBeenCalledOnce();
    expect(mockSet.mock.calls[0][0]).toBe(COOKIE_NAME);
  });

  test("token encodes userId and email", async () => {
    await createSession("user-1", "test@example.com");
    const token = mockSet.mock.calls[0][1];
    const { payload } = await jwtVerify(token, SECRET);
    expect(payload.userId).toBe("user-1");
    expect(payload.email).toBe("test@example.com");
  });

  test("cookie is httpOnly with lax sameSite and root path", async () => {
    await createSession("user-1", "test@example.com");
    const options = mockSet.mock.calls[0][2];
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("cookie expires in ~7 days", async () => {
    const before = Date.now();
    await createSession("user-1", "test@example.com");
    const options = mockSet.mock.calls[0][2];
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDays - 1000);
    expect(options.expires.getTime()).toBeLessThanOrEqual(Date.now() + sevenDays + 1000);
  });
});

// --- getSession ---

describe("getSession", () => {
  test("returns null when no cookie exists", async () => {
    mockGet.mockReturnValue(undefined);
    expect(await getSession()).toBeNull();
  });

  test("returns the session payload for a valid token", async () => {
    const token = await makeToken({ userId: "user-1", email: "test@example.com", expiresAt: new Date() });
    mockGet.mockReturnValue({ value: token });
    const session = await getSession();
    expect(session?.userId).toBe("user-1");
    expect(session?.email).toBe("test@example.com");
  });

  test("returns null for a malformed token", async () => {
    mockGet.mockReturnValue({ value: "not.a.real.token" });
    expect(await getSession()).toBeNull();
  });

  test("returns null for an expired token", async () => {
    const token = await makeToken(
      { userId: "user-1", email: "test@example.com", expiresAt: new Date() },
      "-1s"
    );
    mockGet.mockReturnValue({ value: token });
    expect(await getSession()).toBeNull();
  });
});

// --- deleteSession ---

describe("deleteSession", () => {
  test("deletes the auth-token cookie", async () => {
    await deleteSession();
    expect(mockDelete).toHaveBeenCalledWith(COOKIE_NAME);
  });

  test("calls delete exactly once", async () => {
    await deleteSession();
    expect(mockDelete).toHaveBeenCalledOnce();
  });
});

// --- verifySession ---

describe("verifySession", () => {
  test("returns null when request has no cookie", async () => {
    expect(await verifySession(makeRequest())).toBeNull();
  });

  test("returns the session payload for a valid token", async () => {
    const token = await makeToken({ userId: "user-2", email: "other@example.com", expiresAt: new Date() });
    const session = await verifySession(makeRequest(token));
    expect(session?.userId).toBe("user-2");
    expect(session?.email).toBe("other@example.com");
  });

  test("returns null for a malformed token", async () => {
    expect(await verifySession(makeRequest("bad.token.value"))).toBeNull();
  });

  test("returns null for an expired token", async () => {
    const token = await makeToken(
      { userId: "user-2", email: "other@example.com", expiresAt: new Date() },
      "-1s"
    );
    expect(await verifySession(makeRequest(token))).toBeNull();
  });
});
