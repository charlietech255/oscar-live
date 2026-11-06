import { expect, it } from "vitest";
import { dataBundles } from "./data-bundles";

it.each([
  ["900 MB", 1200], ["1 GB", 1500], ["2 GB", 3000],
  ["3 GB", 4500], ["4 GB", 6000], ["5 GB", 7000], ["10 GB", 13000],
])("advertises %s at TSh %i", (label, price) => {
  expect(dataBundles.find(bundle => bundle.label === label)?.price).toBe(price);
});