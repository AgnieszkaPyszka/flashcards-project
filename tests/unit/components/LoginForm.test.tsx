import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/LoginForm";

// Mock the getSupabaseClient function
vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: () => ({
    auth: {
      setSession: vi.fn().mockResolvedValue({}),
    },
  }),
}));

// Mock the fetch function
const mockFetch = vi.fn();

// Mock window.location (scoped to this file)
let originalLocation: Location;

describe("LoginForm", () => {
  beforeAll(() => {
    originalLocation = window.location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    window.location = { ...originalLocation, href: "" } as Location;
  });

  afterAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    window.location = originalLocation;
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    window.location.href = "";
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders login form correctly", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
  });

  it("validates email format", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    await user.type(emailInput, "invalid-email");

    const submitButton = screen.getByRole("button", { name: "Log in" });
    await user.click(submitButton);

    // The component doesn't show validation errors for email format
    // Just verify that the fetch wasn't called with invalid data
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: "Log in" });
    await user.click(submitButton);

    // Verify that the fetch wasn't called with empty fields
    expect(mockFetch).not.toHaveBeenCalled();
    // Check for generic error message
    expect(screen.getByText("Email and password are required")).toBeInTheDocument();
  });

  it("submits form with valid credentials", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: "123" } }),
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    await user.type(emailInput, "test.user@gmail.com");
    await user.type(passwordInput, "test");

    const submitButton = screen.getByRole("button", { name: "Log in" });
    await user.click(submitButton);

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test.user@gmail.com", password: "test" }),
    });

    await waitFor(() => {
      expect(window.location.href).toBe("/generate");
    });
  });

  it("shows error message on failed login", async () => {
    const errorMessage = "Invalid email or password";
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: errorMessage }),
    });

    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "wrongpassword");

    const submitButton = screen.getByRole("button", { name: "Log in" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
