import { describe, expect, it } from "vitest";
import { insertTranscript, normalizeTranscript } from "./insert-transcript";

describe("normalizeTranscript", () => {
  it("collapses whitespace and trims", () => {
    expect(normalizeTranscript("  帮我\n写个   周报 ")).toBe("帮我 写个 周报");
  });

  it("removes spaces before chinese punctuation", () => {
    expect(normalizeTranscript("好的 ，没问题 。")).toBe("好的，没问题。");
  });

  it("returns an empty string for empty input", () => {
    expect(normalizeTranscript("   ")).toBe("");
  });
});

describe("insertTranscript", () => {
  it("appends at the end when there is no selection", () => {
    expect(insertTranscript("已有内容", "补一句", null)).toEqual({
      text: "已有内容补一句",
      cursor: 7,
    });
  });

  it("inserts at the caret in the middle of the draft", () => {
    const result = insertTranscript("你好世界", "，朋友", { start: 2, end: 2 });
    expect(result.text).toBe("你好，朋友世界");
    expect(result.cursor).toBe(5);
  });

  it("replaces the current selection", () => {
    const result = insertTranscript("把 A 改成 B", "新文案", { start: 2, end: 3 });
    expect(result.text).toBe("把 新文案 改成 B");
  });

  it("adds a space between latin words but not around chinese", () => {
    expect(insertTranscript("hello", "world", null).text).toBe("hello world");
    expect(insertTranscript("你好", "世界", null).text).toBe("你好世界");
  });

  it("clamps out-of-range selections and keeps latin spacing", () => {
    const result = insertTranscript("abc", "d", { start: 99, end: 120 });
    expect(result.text).toBe("abc d");
    expect(result.cursor).toBe(5);
  });

  it("leaves the draft untouched for an empty transcript", () => {
    expect(insertTranscript("draft", "  ", { start: 2, end: 2 })).toEqual({
      text: "draft",
      cursor: 2,
    });
  });
});
