# Contributing to Remark PM

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

---

## 🌿 Branching Strategy

We use a modified **Git Flow** workflow:

| Branch | Purpose | Merges Into |
|--------|---------|-------------|
| `main` | Production-ready code | — |
| `develop` | Integration branch for features | `main` |
| `feature/*` | New features | `develop` |
| `bugfix/*` | Bug fixes | `develop` |
| `hotfix/*` | Urgent production fixes | `main` + `develop` |
| `release/*` | Release preparation | `main` + `develop` |

### Branch Naming Convention

```
feature/board-name-short-description
bugfix/issue-number-short-description
hotfix/critical-fix-description
```

**Examples:**
- `feature/marketing-export-pdf`
- `bugfix/42-pipeline-stage-reset`
- `hotfix/localStorage-crash-protection`

---

## 🔄 Pull Request Workflow

### 1. Create a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clean, readable code
- Add comments for complex logic
- Follow the existing code style
- Test your changes locally

### 3. Commit Your Changes

Use **Conventional Commits** format:

```
<type>(<scope>): <description>

[optional body]
```

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, no logic change) |
| `refactor` | Code refactoring |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build, CI, or tooling changes |

**Examples:**
```bash
git commit -m "feat(marketing): add PDF export for pipeline clients"
git commit -m "fix(creative): prevent store crash on empty client list"
git commit -m "docs: update API endpoint documentation"
```

### 4. Push and Open a PR

```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub targeting `develop`.

### 5. PR Checklist

Before requesting review, ensure:

- [ ] Code builds without errors (`npm run build`)
- [ ] No lint warnings (`npm run lint`)
- [ ] UI looks correct in both Arabic and English
- [ ] Dark mode and light mode both work
- [ ] Existing features are not broken
- [ ] PR description explains the changes

---

## 📐 Code Standards

### TypeScript
- Use TypeScript for all new files
- Define interfaces for data structures
- Avoid `any` type where possible

### React
- Use functional components with hooks
- Keep components focused and reusable
- Use `useCallback` and `useMemo` for performance
- Use `useTransition` for non-urgent state updates

### CSS
- Use CSS Modules (`*.module.css`)
- Follow the existing glassmorphism design system
- Support RTL (right-to-left) layout for Arabic
- Include dark mode styles

### Stores
- Singleton stores extend the observer pattern
- Use `batchStart()`/`batchEnd()` for multiple mutations
- Always save to localStorage after state changes
- Emit to listeners after mutations

### i18n
- All user-facing text must be in `src/lib/texts.ts`
- Support both Arabic (`ar`) and English (`en`)
- Use the `t` object from the texts module

---

## 📁 Where to Add Things

| What | Where |
|------|-------|
| New page/route | `src/app/<route>/page.tsx` |
| Reusable component | `src/components/` |
| Business logic | `src/lib/` |
| API endpoint | `src/app/api/<endpoint>/route.ts` |
| Translations | `src/lib/texts.ts` |
| Page styles | `src/app/<route>/page.module.css` |
| Documentation | `docs/` |

---

## 🐛 Reporting Issues

When filing an issue, please include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser and OS version
5. Screenshots (if UI-related)

---

## 📬 Contact

For questions about contributing, reach out to the project maintainer.
