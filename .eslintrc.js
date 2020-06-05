module.exports = {
  "env": {
    "es6": true,
    "mocha": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "ignorePatterns": [],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "tsconfig.json",
    "sourceType": "module"
  },
  "plugins": [
    "@typescript-eslint",
    "mocha"
  ],
  "rules": {
    "@typescript-eslint/adjacent-overload-signatures": [
      "error"
    ],
    "@typescript-eslint/ban-ts-ignore": [
      "error"
    ],
    "@typescript-eslint/ban-types": [
      "error"
    ],
    "@typescript-eslint/camelcase": [
      "off"
    ],
    "@typescript-eslint/class-name-casing": [
      "error"
    ],
    "@typescript-eslint/consistent-type-assertions": [
      "error"
    ],
    "@typescript-eslint/explicit-function-return-type": [
      "off"
    ],
    "@typescript-eslint/interface-name-prefix": [
      "error"
    ],
    "@typescript-eslint/member-delimiter-style": [
      "error",
      {
        "multiline": {
          "delimiter": "comma",
          "requireLast": false
        },
        "singleline": {
          "delimiter": "comma",
          "requireLast": false
        },
        "overrides": {
            "interface": {
                "multiline": {
                    "delimiter": "semi",
                    "requireLast": true
                }
            }
        }
      }
    ],
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "property",
        "format": ["camelCase", "snake_case"]
      },
      {
        "selector": "variable",
        "format": ["camelCase", "UPPER_CASE", "PascalCase"]
      },
      {
        "selector": "typeLike",
        "format": ["camelCase", "PascalCase", "UPPER_CASE"]
      },
      {
        "selector": "enumMember",
        "format": ["UPPER_CASE", "PascalCase"]
      },
      {
        "selector": "parameter",
        "format": ["camelCase", "UPPER_CASE"],
        leadingUnderscore: 'allow'
      },
      {
        "selector": "default",
        "format": ["camelCase"]
      }
    ],
    "no-array-constructor": [
      "off"
    ],
    "@typescript-eslint/no-array-constructor": [
      "error"
    ],
    "no-empty-function": [
      "off"
    ],
    "@typescript-eslint/no-empty-function": [
      "error"
    ],
    "@typescript-eslint/no-empty-interface": [
      "error"
    ],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-inferrable-types": [
      "error"
    ],
    "@typescript-eslint/no-misused-new": [
      "error"
    ],
    "@typescript-eslint/no-namespace": [
      "error"
    ],
    "@typescript-eslint/no-non-null-assertion": [
      "warn"
    ],
    "@typescript-eslint/no-this-alias": [
      "error"
    ],
    "no-unused-vars": [
      "off"
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn"
    ],
    "no-use-before-define": [
      "off"
    ],
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/no-var-requires": [
      "error"
    ],
    "@typescript-eslint/prefer-namespace-keyword": [
      "error"
    ],
    "@typescript-eslint/triple-slash-reference": [
      "error"
    ],
    "@typescript-eslint/type-annotation-spacing": [
      "error"
    ],
    "no-var": [
      "error"
    ],
    "prefer-const": [
      "error"
    ],
    "prefer-rest-params": [
      "error"
    ],
    "prefer-spread": [
      "error"
    ],
    "constructor-super": [
      "error"
    ],
    "for-direction": [
      "error"
    ],
    "getter-return": [
      "error"
    ],
    "no-async-promise-executor": [
      "error"
    ],
    "no-case-declarations": [
      "error"
    ],
    "no-class-assign": [
      "error"
    ],
    "no-compare-neg-zero": [
      "error"
    ],
    "no-cond-assign": [
      "error"
    ],
    "no-const-assign": [
      "error"
    ],
    "no-constant-condition": [
      "error"
    ],
    "no-control-regex": [
      "error"
    ],
    "no-debugger": "error",
    "no-delete-var": [
      "error"
    ],
    "no-dupe-args": [
      "error"
    ],
    "no-dupe-class-members": [
      "error"
    ],
    "no-dupe-keys": [
      "error"
    ],
    "no-duplicate-case": [
      "error"
    ],
    "no-empty": "error",
    "no-empty-character-class": [
      "error"
    ],
    "no-empty-pattern": [
      "error"
    ],
    "no-ex-assign": [
      "error"
    ],
    "no-extra-boolean-cast": [
      "error"
    ],
    "no-extra-semi": [
      "error"
    ],
    "no-fallthrough": "error",
    "no-func-assign": [
      "error"
    ],
    "no-global-assign": [
      "error"
    ],
    "no-inner-declarations": [
      "error"
    ],
    "no-invalid-regexp": [
      "error"
    ],
    "no-irregular-whitespace": [
      "error"
    ],
    "no-misleading-character-class": [
      "error"
    ],
    "no-mixed-spaces-and-tabs": [
      "error"
    ],
    "no-new-symbol": [
      "error"
    ],
    "no-obj-calls": [
      "error"
    ],
    "no-octal": [
      "error"
    ],
    "no-prototype-builtins": [
      "error"
    ],
    "no-redeclare": "error",
    "no-regex-spaces": [
      "error"
    ],
    "no-self-assign": [
      "error"
    ],
    "no-shadow-restricted-names": [
      "error"
    ],
    "no-sparse-arrays": [
      "error"
    ],
    "no-this-before-super": [
      "error"
    ],
    "no-undef": [
      "off"
    ],
    "no-unexpected-multiline": [
      "error"
    ],
    "no-unreachable": [
      "error"
    ],
    "no-unsafe-finally": [
      "error"
    ],
    "no-unsafe-negation": [
      "error"
    ],
    "no-unused-labels": "error",
    "no-useless-catch": [
      "error"
    ],
    "no-useless-escape": [
      "error"
    ],
    "no-with": [
      "error"
    ],
    "require-yield": [
      "error"
    ],
    "use-isnan": [
      "error"
    ],
    "valid-typeof": [
      "error"
    ],
    "@typescript-eslint/indent": [
      "error",
      2,
      {
        "FunctionDeclaration": {
          "parameters": "first"
        },
        "FunctionExpression": {
          "parameters": "first"
        }
      }
    ],
    "@typescript-eslint/quotes": [
      "error",
      "single",
      {
        "allowTemplateLiterals": true
      }
    ],
    "@typescript-eslint/semi": [
      "error",
      "always"
    ],
    "brace-style": [
      "error",
      "1tbs"
    ],
    "comma-dangle": "off",
    "curly": "error",
    "default-case": "error",
    "dot-notation": "error",
    "eol-last": "off",
    "eqeqeq": [
      "error",
      "smart"
    ],
    "guard-for-in": "error",
    "id-blacklist": [
      "error"
    ],
    "id-match": "error",
    "max-len": [
      "error",
      {
        "code": 120
      }
    ],
    "no-bitwise": "error",
    "no-caller": "error",
    "no-console": "off",
    "no-eval": "error",
    "no-multiple-empty-lines": "error",
    "no-new-wrappers": "error",
    "no-shadow": [
      "error",
      {
        "hoist": "all"
      }
    ],
    "no-trailing-spaces": "error",
    "no-underscore-dangle": "error",
    "no-unused-expressions": "error",
    "radix": "error",
    "spaced-comment": [
      "error",
      "always",
      {
        "markers": [
          "/"
        ]
      }
    ]
  },
  "settings": {}
};
