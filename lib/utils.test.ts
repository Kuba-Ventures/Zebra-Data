import { describe, it, expect, vi, afterEach } from "vitest";
import { cn, formatDate, maskSsn } from "./utils";

// Real tests for the pure display helpers (low-risk surface). Each asserts specific
// behavior — break the logic and one fails.
describe("cn", () => {
  it("joins class names with a space", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
  it("lets a later Tailwind class override a conflicting earlier one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("formatDate", () => {
  it("returns '-' for null/undefined", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
  });
  it("returns '-' for an invalid date", () => {
    expect(formatDate("not-a-date")).toBe("-");
  });
  it("formats short by default", () => {
    expect(formatDate(new Date(2026, 0, 15))).toBe("Jan 15, 2026");
  });
  it("formats long", () => {
    expect(formatDate(new Date(2026, 0, 15), "long")).toBe("January 15, 2026");
  });

  describe("relative", () => {
    afterEach(() => vi.useRealTimers());
    const now = () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
    };
    it("'just now' under a minute", () => {
      now();
      expect(formatDate(new Date(2026, 0, 15, 11, 59, 40), "relative")).toBe("just now");
    });
    it("'Nm ago' under an hour", () => {
      now();
      expect(formatDate(new Date(2026, 0, 15, 11, 45, 0), "relative")).toBe("15m ago");
    });
    it("'Nh ago' under a day", () => {
      now();
      expect(formatDate(new Date(2026, 0, 15, 9, 0, 0), "relative")).toBe("3h ago");
    });
    it("'Nd ago' under a week", () => {
      now();
      expect(formatDate(new Date(2026, 0, 13, 12, 0, 0), "relative")).toBe("2d ago");
    });
  });
});

describe("maskSsn", () => {
  it("returns '-' when there's no value", () => {
    expect(maskSsn(null)).toBe("-");
    expect(maskSsn(undefined)).toBe("-");
  });
  it("masks everything but the last 4", () => {
    expect(maskSsn("1234")).toBe("•••-••-1234");
  });
});
