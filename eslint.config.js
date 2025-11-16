const js = require('@eslint/js');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.git/**',
      'coverage/**',
      'dist/**',
      'build/**',
      'database/migrations/**',
      'database/seeds/**',
      'client/**',
      '*.min.js'
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'indent': ['warn', 2],
      'linebreak-style': ['warn', 'unix'],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'semi': ['warn', 'always'],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'eqeqeq': ['warn', 'always'],
      'curly': ['warn', 'all'],
      'brace-style': ['warn', '1tbs'],
      'comma-dangle': ['warn', 'never'],
      'no-var': 'warn',
      'prefer-const': 'warn',
      'prefer-arrow-callback': 'warn',
      'arrow-spacing': 'warn',
      'no-implicit-coercion': 'warn',
      'no-param-reassign': 'warn'
    }
  }
];
