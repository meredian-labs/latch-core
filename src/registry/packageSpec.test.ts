import { describe, expect, it } from "vitest";
import { encodePackageName, parsePackageSpec } from "./packageSpec.js";

describe("parsePackageSpec", () => {
  it("parses unscoped package names", () => {
    expect(parsePackageSpec("react")).toEqual({
      raw: "react",
      name: "react"
    });
  });

  it("parses unscoped package versions", () => {
    expect(parsePackageSpec("react@18.2.0")).toEqual({
      raw: "react@18.2.0",
      name: "react",
      requestedVersion: "18.2.0"
    });
  });

  it("parses scoped packages without treating the scope marker as a version", () => {
    expect(parsePackageSpec("@tanstack/react-query")).toEqual({
      raw: "@tanstack/react-query",
      name: "@tanstack/react-query"
    });
  });

  it("parses scoped package versions", () => {
    expect(parsePackageSpec("@tanstack/react-query@latest")).toEqual({
      raw: "@tanstack/react-query@latest",
      name: "@tanstack/react-query",
      requestedVersion: "latest"
    });
  });
});

describe("encodePackageName", () => {
  it("encodes scoped packages for npm registry URLs", () => {
    expect(encodePackageName("@tanstack/react-query")).toBe("@tanstack%2Freact-query");
  });
});
