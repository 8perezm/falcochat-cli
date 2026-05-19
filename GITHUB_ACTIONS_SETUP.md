# GitHub Actions Setup for npm Publishing

## Required Secrets

You need to add the following secret to your GitHub repository:

### 1. NPM_TOKEN

1. Login to npm: `npm login`
2. Create an access token at https://www.npmjs.com/settings/tokens
   - Token type: `Automation` (recommended) or `Publish`
3. Copy the token
4. Go to your GitHub repository: Settings → Secrets and variables → Actions
5. Click "New repository secret"
6. Name: `NPM_TOKEN`
7. Value: Paste your npm token

## How It Works

The workflow will:

1. **Trigger**: Runs on pushes to `main` or `master` branch
2. **Version Bump**: Automatically determines version bump type based on commit message:
   - `major` or `BREAKING CHANGE:` → major version bump (x.0.0)
   - `feat`, `feature`, `minor` → minor version bump (x.y.0)
   - Anything else (default) → patch version bump (x.y.z)
3. **Update Files**: Updates `package.json` and `index.js` with new version
4. **Commit & Tag**: Commits the version bump and creates a git tag
5. **Publish**: Publishes to npm with the new version
6. **Release**: Creates a GitHub Release for the new version

## Commit Message Examples

```bash
# Patch version (1.0.1 → 1.0.2)
git commit -m "fix: resolve connection issue"

# Minor version (1.0.1 → 1.1.0)
git commit -m "feat: add new model selection feature"

# Major version (1.0.1 → 2.0.0)
git commit -m "BREAKING CHANGE: redesign API interface"
# or
git commit -m "major: overhaul configuration system"
```

## Manual Trigger

You can also manually trigger the workflow:
1. Go to Actions tab in GitHub
2. Select "Publish to npm" workflow
3. Click "Run workflow"
4. Choose branch and run

## Testing Locally

To test the version bump locally:

```bash
# Check current version
node -p "require('./package.json').version"

# Bump version (dry run)
npm version patch --dry-run

# Actually bump
npm version patch  # or minor, or major
```

## Notes

- The workflow uses `npm ci` for faster, more reliable builds
- Tests are run but won't fail the build (you can remove `continue-on-error` once you add tests)
- The `publishConfig.access: "public"` in package.json ensures public publishing
- Make sure your package name in package.json doesn't conflict with existing packages
