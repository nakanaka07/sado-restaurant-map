/**
 * @fileoverview services/sheets barrel export test
 */

import { describe, expect, it } from "vitest";
import * as sheetsService from "../index";

describe("services/sheets barrel exports", () => {
  it("should export fetchRestaurantsFromSheets", () => {
    expect(sheetsService).toHaveProperty("fetchRestaurantsFromSheets");
    expect(typeof sheetsService.fetchRestaurantsFromSheets).toBe("function");
  });

  it("should export fetchParkingsFromSheets", () => {
    expect(sheetsService).toHaveProperty("fetchParkingsFromSheets");
    expect(typeof sheetsService.fetchParkingsFromSheets).toBe("function");
  });

  it("should export fetchToiletsFromSheets", () => {
    expect(sheetsService).toHaveProperty("fetchToiletsFromSheets");
    expect(typeof sheetsService.fetchToiletsFromSheets).toBe("function");
  });

  it("should export fetchAllMapPoints", () => {
    expect(sheetsService).toHaveProperty("fetchAllMapPoints");
    expect(typeof sheetsService.fetchAllMapPoints).toBe("function");
  });

  it("should export SheetsApiError", () => {
    expect(sheetsService).toHaveProperty("SheetsApiError");
    expect(typeof sheetsService.SheetsApiError).toBe("function");
  });
});
