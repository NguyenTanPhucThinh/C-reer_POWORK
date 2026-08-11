import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'

const domains = ['iam', 'profile', 'assessment', 'challenge', 'talent-pool']

// Tạo rule chặn import repositories từ các domain khác để bảo vệ ranh giới DDD
const dddRules = domains.map((domain) => {
  const otherDomains = domains.filter((d) => d !== domain)
  const restrictedPatterns = otherDomains.flatMap((d) => [
    `src/${d}/repositories/**`,
    `../${d}/repositories/**`,
    `../../${d}/repositories/**`,
    `../../../${d}/repositories/**`,
  ])

  return {
    files: [`src/${domain}/**/*.js`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: restrictedPatterns,
              message: `DDD Violation: "${domain}" module cannot import directly from repositories of other domains. Please communicate via exposed services/interfaces.`,
            },
          ],
        },
      ],
    },
  }
})

export default tseslint.config(
  {
    files: ['src/**/*.js'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',

      // Mục 2: Ép chuẩn Naming Convention
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'typeLike', // Dành cho Class, Interface, TypeAlias, Enum
          format: ['PascalCase'],
        },
        {
          selector: 'objectLiteralProperty',
          format: null, // Không ép chuẩn thuộc tính của object (vì thường dùng API trả về)
        },
      ],
    },
  },
  ...dddRules,
)
