import { describe, expect, it } from "vitest";

import { isValidIsoDate, parseValidIsoDate } from "@/lib/date-utils";

describe("date-utils", () => {
  it("accepts valid ISO dates even with surrounding spaces", () => {
    const parsedDate = parseValidIsoDate(" 2026-04-10 ");

    expect(parsedDate).not.toBeNull();
    expect(parsedDate?.getFullYear()).toBe(2026);
    expect(parsedDate?.getMonth()).toBe(3);
    expect(parsedDate?.getDate()).toBe(10);
    expect(isValidIsoDate(" 2026-04-10 ")).toBe(true);
  });

  it("rejects impossible calendar dates", () => {
    expect(parseValidIsoDate("2026-02-31")).toBeNull();
    expect(isValidIsoDate("2026-02-31")).toBe(false);
  });

  it("rejects values outside the expected ISO format", () => {
    expect(parseValidIsoDate("10/04/2026")).toBeNull();
    expect(parseValidIsoDate("2026-4-1")).toBeNull();
  });
});
