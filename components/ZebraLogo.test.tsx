// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ZebraWordmark, ZebraMark } from "./ZebraLogo";

afterEach(cleanup);

// ZebraLogo is a low-risk presentational surface. These assert the wordmark text renders
// and the mark stays decorative (aria-hidden) for accessibility.
describe("ZebraLogo", () => {
  it("renders the ZebraData wordmark text", () => {
    const { container } = render(<ZebraWordmark />);
    expect(container.textContent).toContain("Zebra");
    expect(screen.getByText("Data")).toBeTruthy();
  });

  it("renders the mark as an aria-hidden svg", () => {
    const { container } = render(<ZebraMark />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });
});
