# Typescript Template

Template for making Typescript projects, has my preferred configurations.

## Using this template

```sh
# Clone the template
git clone git@github.com:aturingmachine/ts-template.git <dir-name>

# Run the init script
npm run setup
# Optionally pass p|pretty to colorize output
npm run setup pretty

# Follow the script's prompts

# Run the project
npm run dev
```

## Template Configuration

### Runtime

- Node v12.13.0 for modules
- Node v16.3.0 for projects

### Testing

- jest
- ts-jest

### Linting

- prettier
- eslint
  - @typescript-eslint/eslint-plugin
  - @typescript-eslint/parser
  - eslint-config-prettier
  - eslint-plugin-import
  - eslint-plugin-prettier
  - eslint
  - jest

### Scripts

```js
scripts: {
  "build": "tsc",
  "dev": "npm run build && node dist/index.js",
  "lint": "eslint",
  "lint:fix": "eslint --fix",
  "test": "jest"
  // Only for modules
  "prepublishOnly": "npm run build",
}
```
