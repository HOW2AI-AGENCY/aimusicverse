export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Define allowed commit types
    'type-enum': [2, 'always', [
      'feat',     // New feature
      'fix',      // Bug fix
      'docs',     // Documentation changes
      'style',    // Code style changes (formatting, semi-colons, etc)
      'refactor', // Code refactoring
      'perf',     // Performance improvements
      'test',     // Adding or updating tests
      'build',    // Build system changes
      'ci',       // CI/CD changes
      'chore',    // Other changes (maintenance, dependencies, etc)
      'revert'    // Revert a previous commit
    ]],

    // Enforce sentence case for subject
    'subject-case': [2, 'always', 'sentence-case'],

    // Subject max line length
    'subject-max-length': [2, 'always', 72],

    // Body max line length
    'body-max-line-length': [2, 'always', 100],

    // Require a blank line after subject
    'body-leading-blank': [1, 'always'],

    // Footer max line length
    'footer-max-line-length': [2, 'always', 100],

    // Prevent empty commits
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],

    // Enforce consistent ending (no period for subject)
    'subject-full-stop': [2, 'never', '.'],

    // Require type to be lowercase
    'type-case': [2, 'always', 'lower-case'],

    // Header max line length
    'header-max-length': [2, 'always', 100]
  },
  parserPreset: {
    parserOpts: {
      breakHeaderPattern: /^(?<break>breaking change)/,
    },
  },
};