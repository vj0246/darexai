// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Kpi } from "./Kpi";

describe("<Kpi>", () => {
  it("renders label, value and sub", () => {
    render(<Kpi label="PIPELINE" value="₹32L" sub="est" accent />);
    expect(screen.getByText("PIPELINE")).toBeTruthy();
    expect(screen.getByText(/₹32L/)).toBeTruthy();
    expect(screen.getByText("est")).toBeTruthy();
  });
});
