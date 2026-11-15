const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

// Only the pure prototype modules are loaded; React Native and network APIs are
// intentionally excluded. This is not a clinical safety/triage validation.
function loadModule(relativePath, imports = {}) {
  const source = fs.readFileSync(
    path.join(__dirname, "..", relativePath),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const module = { exports: {} };
  const requireImport = (name) => {
    if (!(name in imports)) throw new Error(`Unexpected module: ${name}`);
    return imports[name];
  };
  new Function("require", "module", "exports", outputText)(
    requireImport,
    module,
    module.exports,
  );
  return module.exports;
}
const content = loadModule("src/constants/healthContent.ts");
const { getDemoReply } = loadModule("src/services/demoAssistant.ts", {
  "@/constants/healthContent": content,
});

test("all six locked starter questions have explicit prototype answers and source context", () => {
  for (const starter of content.starters) {
    const answer = getDemoReply(starter);
    assert.ok(answer.text.length > 80);
    assert.ok(answer.source);
    assert.equal(answer.date, content.contentDate);
    assert.ok(!answer.urgent);
  }
});

test("serious symptom examples lead with urgent care, not a casual answer", () => {
  for (const question of [
    "I have chest pain",
    "I cannot breathe",
    "I am having a seizure",
    "severe bleeding",
    "I want to kill myself",
  ]) {
    const answer = getDemoReply(question);
    assert.equal(answer.urgent, true);
    assert.match(answer.text, /112/);
    assert.match(answer.text, /Do not wait/);
    assert.doesNotMatch(answer.text, /you (?:have|probably have) malaria/i);
  }
});

test("medication and dose questions are declined", () => {
  const answer = getDemoReply("What dosage of malaria medicine should I take?");
  assert.match(answer.text, /cannot diagnose|cannot.*provide a dose/);
  assert.match(answer.text, /health professional/);
  assert.doesNotMatch(answer.text, /\d+\s*(mg|tablets|ml)/i);
});

test("unknown topics do not generate unsupported medical advice", () => {
  for (const question of [
    "Can you interpret my blood test results?",
    "How can I prevent diabetes?",
  ]) {
    const answer = getDemoReply(question);
    assert.match(answer.text, /not a connected AI service/);
    assert.match(answer.text, /do not have a reliable prepared answer/);
    assert.equal(answer.url, undefined);
  }
});

test("area-level information does not invent a model estimate", () => {
  const answer = getDemoReply("What does area-level risk mean?");
  assert.match(answer.text, /not a diagnosis/);
  assert.match(answer.text, /not connected/);
  assert.doesNotMatch(answer.text, /\d+%/);
});

test("sample content includes every Nigerian state and FCT once", () => {
  assert.equal(content.states.length, 37);
  assert.equal(new Set(content.states).size, 37);
  assert.ok(content.states.includes("Lagos"));
  assert.ok(content.states.includes("FCT Abuja"));
});

test("small text colour combinations meet WCAG AA contrast", () => {
  const { palette } = loadModule("src/constants/designTokens.ts", {
    "react-native": { Platform: { OS: "web" } },
  });
  function luminance(hex) {
    const channels = hex
      .slice(1)
      .match(/../g)
      .map((value) => parseInt(value, 16) / 255)
      .map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      );
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }
  for (const [foreground, background] of [
    ["forest", "primary"],
    ["forest", "cream"],
    ["body", "cream"],
    ["body", "white"],
    ["body", "softGreen"],
    ["white", "forest"],
  ]) {
    const values = [
      luminance(palette[foreground]),
      luminance(palette[background]),
    ].sort((a, b) => b - a);
    const contrast = (values[0] + 0.05) / (values[1] + 0.05);
    assert.ok(
      contrast >= 4.5,
      `${foreground} on ${background}: ${contrast.toFixed(2)}`,
    );
  }
});
