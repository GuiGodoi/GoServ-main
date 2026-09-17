// Configuração do ESLint: usada pelo comando "npm run lint" para checar erros
// e más práticas no código do client.
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  // Pastas que o lint não deve olhar (build gerado e dependências).
  { ignores: ['dist/**', 'node_modules/**'] },

  // Regras básicas recomendadas pelo próprio ESLint.
  js.configs.recommended,

  {
    // Aplica as regras abaixo só a arquivos JavaScript/JSX.
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser, // reconhece variáveis globais do navegador (window, document, etc)
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // não precisa importar React em cada arquivo (React 17+)
      'react/prop-types': 'off', // projeto não usa PropTypes para validar props
      // Variáveis/argumentos não usados só viram aviso, e podem ser ignorados
      // prefixando o nome com "_" (ex: "_evento").
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
]
