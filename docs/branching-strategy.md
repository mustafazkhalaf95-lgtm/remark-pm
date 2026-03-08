# Branching Strategy & Deployment Workflow

## Branch Structure

```
main (production)
 └── develop (integration)
      ├── feature/marketing-pdf-export
      ├── feature/creative-ai-persona
      ├── bugfix/42-pipeline-crash
      └── release/v1.0.0
```

## Workflow

### Feature Development

```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/board-name-description

# 3. Work on your feature (commit often)
git add .
git commit -m "feat(board): description"

# 4. Push and open PR
git push origin feature/board-name-description
# Open PR: feature/* → develop
```

### Bug Fixes

```bash
git checkout -b bugfix/issue-number-description develop
# Fix the bug, then PR → develop
```

### Hotfixes (urgent production fixes)

```bash
git checkout -b hotfix/description main
# Fix, then PR → main AND develop
```

### Releases

```bash
git checkout -b release/v1.0.0 develop
# Final testing, version bump, then PR → main AND develop
git tag v1.0.0
```

## Code Review

All PRs require:
- [ ] At least 1 approval
- [ ] All checks pass (`npm run build && npm run lint`)
- [ ] No merge conflicts
- [ ] PR description explains the change

## Recommended Setup

### Protect Main Branch
In GitHub Settings → Branches → Branch protection rules:
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass
- ✅ Require branches to be up to date

### Set Default Branch
Set `develop` as the default branch so new PRs target it automatically.
