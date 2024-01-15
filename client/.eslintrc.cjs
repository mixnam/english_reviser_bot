module.exports = {
    "root": true,
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "plugin:@typescript-eslint/recommended",
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": { "project": ["./tsconfig.app.json"] },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "react/jsx-indent": [2, 2]
    },
    "ignorePatterns": ["src/**/*.test.ts", "src/frontend/generated/*"]
}
