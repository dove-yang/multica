import { describe, expect, it } from "vitest";
import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
  it("formats sub-minute values", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(4_400)).toBe("00:04");
  });

  it("formats a full minute", () => {
    expect(formatDuration(60_000)).toBe("01:00");
  });

  it("never goes negative", () => {
    expect(formatDuration(-500)).toBe("00:00");
  });
});
