module.exports = {
    "root": true,
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:prettier/recommended",
        "plugin:react/jsx-runtime",
        "plugin:@typescript-eslint/recommended",
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": { "project": ["./tsconfig.app.json", "./tsconfig.node.json"] },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        // React
        'react/react-in-jsx-scope': 'off',
        'react/display-name': 'off',
        'react/prop-types': 'off',
        'react/jsx-curly-brace-presence': 'error',

    },
    "ignorePatterns": ["src/**/*.test.ts", "src/frontend/generated/*"]
}
