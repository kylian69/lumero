// Conventional Commits — enforced locally (husky commit-msg hook) and in CI
// (.github/workflows/commitlint.yml). The bump logic in
// scripts/compute-version.mjs relies on these exact prefixes:
//   feat   → minor    feat! / BREAKING CHANGE → major    everything else → patch
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",     // nouvelle fonctionnalité  → minor
        "fix",      // correction de bug         → patch
        "perf",     // amélioration de perf      → patch
        "refactor", // refactor sans changement fonctionnel → patch
        "docs",     // documentation             → patch
        "test",     // tests                     → patch
        "build",    // build system / deps       → patch
        "ci",       // CI/CD                     → patch
        "chore",    // tâches diverses           → patch
        "style",    // formatage                 → patch
        "revert",   // revert d'un commit        → patch
      ],
    ],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],
    "subject-empty": [2, "never"],
    "subject-case": [0],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 100],
    "body-leading-blank": [2, "always"],
    "footer-leading-blank": [2, "always"],
  },
};
