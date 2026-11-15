/**
 * Campus Care — AI-assisted complaint classifier
 * -----------------------------------------------
 * A lightweight, explainable rule-based classifier that:
 *  1. Suggests the most likely category from the description text
 *  2. Detects urgency signals and escalates priority automatically
 *
 * This runs entirely offline, has zero cost, and its behaviour is
 * fully explainable (useful to demonstrate in a viva/demo).
 *
 * Upgrade path: replace `classifyText()` internals with a call to
 * an LLM API (OpenAI/Gemini/Claude) later without touching the
 * rest of the app — the function signature stays the same.
 */

// Keyword sets per category. Add more terms as you observe real
// complaint text — this list is easy to extend.
const CATEGORY_KEYWORDS = {
  Hygiene: [
    "dirty", "unclean", "trash", "garbage", "smell", "dustbin",
    "washroom", "toilet", "bathroom", "clean", "waste", "stinking",
  ],
  Infrastructure: [
    "broken", "crack", "wall", "door", "window", "furniture",
    "chair", "table", "bench", "roof", "ceiling", "floor", "damaged",
  ],
  Electrical: [
    "light", "bulb", "fan", "switch", "wiring", "spark", "shock",
    "socket", "power", "electricity", "short circuit", "mcb",
  ],
  Plumbing: [
    "leak", "tap", "pipe", "water", "drainage", "flush", "clog",
    "overflow", "seepage",
  ],
  "Wi-Fi / IT": [
    "wifi", "wi-fi", "internet", "network", "router", "projector",
    "computer", "lab pc", "software", "printer",
  ],
  Safety: [
    "fire", "spark", "smoke", "shock", "unsafe", "accident",
    "injury", "exposed wire", "collapse", "hazard", "danger",
    "harassment", "unsafe area", "no lighting",
  ],
  "Mess / Food": [
    "food", "mess", "canteen", "meal", "hygiene of food", "spoiled",
    "stale", "insect in food", "cafeteria",
  ],
};

// Words that, if present, force priority to "high" regardless of category —
// these indicate immediate risk to safety.
const URGENT_KEYWORDS = [
  "fire", "spark", "sparking", "smoke", "shock", "electrocute",
  "collapse", "gas leak", "injury", "injured", "bleeding",
  "exposed wire", "short circuit", "unsafe", "harassment", "assault",
];

/**
 * Scores each category by counting keyword matches in the text,
 * and returns the highest-scoring category (or null if no match).
 */
function suggestCategory(text) {
  const normalized = text.toLowerCase();
  let bestCategory = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.reduce(
      (count, word) => count + (normalized.includes(word) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return { category: bestCategory, confidence: bestScore };
}

/**
 * Returns "high" if any urgent keyword is found, otherwise null
 * (meaning: don't override, let the normal category-based default apply).
 */
function detectUrgency(text) {
  const normalized = text.toLowerCase();
  const matched = URGENT_KEYWORDS.filter((word) => normalized.includes(word));
  return {
    isUrgent: matched.length > 0,
    matchedTerms: matched,
  };
}

/**
 * Main entry point used by the controller.
 * Combines category suggestion + urgency detection into one result.
 */
function classifyText(description) {
  const { category, confidence } = suggestCategory(description);
  const { isUrgent, matchedTerms } = detectUrgency(description);

  return {
    suggestedCategory: category, // null if nothing matched
    categoryConfidence: confidence,
    suggestedPriority: isUrgent ? "high" : null, // null = no override
    urgentTermsFound: matchedTerms,
  };
}

module.exports = { classifyText, suggestCategory, detectUrgency };