import assert from "node:assert/strict";
import { scanAmazonListing } from "../lib/amazonScanner";

const product = { category: "Dietary Supplement", ingredients: ["Ashwagandha"], market: "United States FDA + FTC" };

const high = scanAmazonListing({
  title: "Cures anxiety and prevents insomnia guaranteed",
  bullet_points: ["Clinically proven to eliminate stress"],
  description: "",
  product,
});

assert.equal(high.overall_risk, "high");
assert.ok(high.issues.some((i) => i.rule.includes("disease") || i.rule.includes("Amazon")));

const clean = scanAmazonListing({
  title: "Ashwagandha Gummies — Dietary Supplement",
  bullet_points: ["Supports relaxation as part of a healthy routine"],
  description: "",
  product,
});

assert.ok(["low", "medium"].includes(clean.overall_risk));

console.log("amazon scanner tests passed");