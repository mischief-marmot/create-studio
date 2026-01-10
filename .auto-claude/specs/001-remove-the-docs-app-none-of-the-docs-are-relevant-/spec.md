# Specification: Remove Docs App from Monorepo

## Overview

Remove the entire `packages/docs` application from the Create Studio monorepo. The documentation content is not relevant, the build is non-functional, and the user plans to create a new docs app later. This is a complete removal task requiring cleanup of the docs package, monorepo workspace configuration, CI/CD pipelines, and any cross-references from other packages.

## Workflow Type

**Type**: feature

**Rationale**: While technically a removal/cleanup task, this workflow represents a structural change to the monorepo that will simplify the project and remove broken infrastructure. The classification as "feature" indicates this is an intentional architectural change rather than a bug fix or refactor.

## Task Scope

### Services Involved
- **docs** (primary - target for removal) - Nuxt documentation app at port 3002
- **app** (verification) - Ensure no dependencies on docs package
- **widgets** (verification) - Ensure no dependencies on docs package
- **shared** (verification) - Ensure no dependencies on docs package

### This Task Will:
- [ ] Delete the entire `packages/docs` directory
- [ ] Remove docs workspace from root `package.json` workspaces configuration
- [ ] Remove docs references from monorepo build scripts
- [ ] Delete CI/CD workflow file `nuxthub-cs-docs.yml`
- [ ] Remove any cross-package dependencies on docs
- [ ] Clean up any docs-related configuration files

### Out of Scope:
- Creating a replacement docs application
- Migrating or preserving any documentation content
- Modifying documentation in other packages (README files, etc.)

## Service Context

### Docs (Target for Removal)

**Tech Stack:**
- Language: TypeScript
- Framework: Nuxt
- Build Tool: Vite
- Styling: Tailwind CSS
- Key directories: `lib/`, `components/`, `pages/`

**Entry Point:** Not specified (entire package being removed)

**How to Run:**
```bash
cd packages/docs
npm run dev
```

**Port:** 3002

**Key Dependencies:**
- @nuxt/content - Documentation content management
- @d0rich/nuxt-content-mermaid - Mermaid diagram support
- @tailwindcss/typography - Typography plugin
- better-sqlite3 - SQLite database
- flexsearch - Search functionality

### App (Main Application)

**Tech Stack:**
- Language: TypeScript
- Framework: Nuxt
- Port: 3001

**How to Run:**
```bash
cd packages/app
npm run dev
```

### Shared (Library)

**Tech Stack:**
- Language: TypeScript
- Type: Library package

**How to Run:**
```bash
cd packages/shared
npm run dev
```

### Widgets

**Tech Stack:**
- Language: TypeScript
- Framework: Vue
- Port: 5173

**How to Run:**
```bash
cd packages/widgets
npm run dev
```

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| `package.json` (root) | monorepo | Remove `packages/docs` from workspaces array |
| `.github/workflows/nuxthub-cs-docs.yml` | infrastructure | Delete entire file (docs deployment workflow) |
| `packages/app/package.json` | app | Remove any dependencies on `@create-studio/docs` if present |
| `packages/widgets/package.json` | widgets | Remove any dependencies on `@create-studio/docs` if present |

## Files to Reference

Since this is a removal task, there are no specific patterns to copy. However, these files should be examined to understand the current state:

| File | Purpose |
|------|---------|
| Root `package.json` | Identify workspace configuration and docs references |
| `.github/workflows/*.yml` | Identify all docs-related CI/CD workflows |
| Root `tsconfig.json` | Check for path mappings to docs package |

## Patterns to Follow

### Monorepo Workspace Removal Pattern

When removing a workspace from a monorepo:

1. **Delete the package directory completely**
   ```bash
   rm -rf packages/docs
   ```

2. **Update root package.json workspaces**
   ```json
   {
     "workspaces": [
       "packages/app",
       "packages/shared",
       "packages/widgets"
       // Remove "packages/docs"
     ]
   }
   ```

3. **Clean node_modules and reinstall**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Remove CI/CD workflows**
   - Delete deployment workflows
   - Remove build/test jobs that reference the package

## Requirements

### Functional Requirements

1. **Complete Docs Package Removal**
   - Description: Delete the entire `packages/docs` directory and all its contents
   - Acceptance: Directory `packages/docs` no longer exists in the filesystem

2. **Workspace Configuration Cleanup**
   - Description: Remove docs from monorepo workspace configuration
   - Acceptance: Root `package.json` workspaces array does not include `packages/docs`

3. **CI/CD Pipeline Cleanup**
   - Description: Remove all docs-related deployment and build workflows
   - Acceptance: `.github/workflows/nuxthub-cs-docs.yml` is deleted

4. **Dependency Verification**
   - Description: Ensure no other packages depend on docs
   - Acceptance: Search for `@create-studio/docs` imports returns no results

5. **Clean Reinstallation**
   - Description: Reinstall monorepo dependencies after removal
   - Acceptance: `npm install` completes successfully without errors

### Edge Cases

1. **Symlinked Dependencies** - If docs package was symlinked via workspace, removal may leave broken symlinks
2. **Cached Build Artifacts** - Build caches may reference the removed package
3. **TypeScript Path Mappings** - Any `tsconfig.json` path mappings to docs must be removed
4. **Shared Types** - If docs exported types used by other packages, compilation may fail

## Implementation Notes

### DO
- Search the entire codebase for references to `docs` package before deletion
- Check for import statements: `@create-studio/docs` or relative paths to docs
- Verify no shared configuration files reference docs-specific settings
- Run `npm install` after workspace removal to clean up symlinks
- Test that other packages (app, widgets) still build successfully
- Check for any git submodules or subtrees related to docs

### DON'T
- Delete the docs directory without first checking for dependencies
- Skip verification that other packages still work after removal
- Leave orphaned CI/CD workflows or npm scripts
- Forget to clean and reinstall node_modules

## Development Environment

### Start Services (After Removal)

```bash
# Root level
npm install

# App service
cd packages/app
npm run dev  # Should start on http://localhost:3001

# Widgets service
cd packages/widgets
npm run dev  # Should start on http://localhost:5173

# Shared library
cd packages/shared
npm run dev
```

### Service URLs (After Removal)
- App: http://localhost:3001
- Widgets: http://localhost:5173
- Docs: N/A (removed)

### Required Environment Variables
No environment variables are specific to docs removal. Existing environment variables for app service remain unchanged.

## Success Criteria

The task is complete when:

1. [ ] `packages/docs` directory is completely deleted
2. [ ] Root `package.json` workspaces no longer includes `packages/docs`
3. [ ] `.github/workflows/nuxthub-cs-docs.yml` is deleted
4. [ ] No code references to `@create-studio/docs` exist in any package
5. [ ] `npm install` at root completes without errors
6. [ ] App package builds successfully: `cd packages/app && npm run build`
7. [ ] Widgets package builds successfully: `cd packages/widgets && npm run build`
8. [ ] No console errors or warnings about missing docs package
9. [ ] Existing tests in other packages still pass
10. [ ] Git working tree is clean (all changes committed)

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests
| Test | File | What to Verify |
|------|------|----------------|
| Shared library tests | `packages/shared/tests/**/*` | All tests pass after docs removal |
| App unit tests | `packages/app/tests/unit/**/*` | All tests pass, no broken imports |

### Integration Tests
| Test | Services | What to Verify |
|------|----------|----------------|
| App integration tests | app | No runtime errors from missing docs package |
| Widget tests | widgets | Widgets build and function without docs |

### Build Verification
| Build | Command | Expected Outcome |
|-------|---------|------------------|
| Root install | `npm install` | Completes without errors, no docs workspace |
| App build | `cd packages/app && npm run build` | Successful build, no docs references |
| Widgets build | `cd packages/widgets && npm run build` | Successful build |
| Shared build | `cd packages/shared && npm run dev` | No errors |

### File System Verification
| Check | Command | Expected |
|-------|---------|----------|
| Docs directory removed | `ls packages/` | No `docs` directory present |
| Workspace config | `cat package.json \| grep workspaces -A5` | No docs in workspaces array |
| CI workflow removed | `ls .github/workflows/ \| grep docs` | No docs-related workflow files |

### Code Search Verification
| Check | Command | Expected |
|-------|---------|----------|
| No docs imports | `grep -r "@create-studio/docs" packages/` | No results found |
| No docs references | `grep -r "packages/docs" .` | No results (except git history) |
| No broken imports | TypeScript compilation in all packages | No errors about missing modules |

### Runtime Verification
| Page/Component | URL | Checks |
|----------------|-----|--------|
| App homepage | `http://localhost:3001` | Loads without console errors |
| App development server | `http://localhost:3001` | Starts successfully |
| Widgets development server | `http://localhost:5173` | Starts successfully |

### QA Sign-off Requirements
- [ ] All unit tests pass in remaining packages
- [ ] All builds complete successfully (app, widgets, shared)
- [ ] `packages/docs` directory does not exist
- [ ] Root package.json workspaces array does not include docs
- [ ] No docs-related CI/CD workflows remain
- [ ] Code search for docs imports returns zero results
- [ ] No console errors when running app and widgets
- [ ] TypeScript compilation succeeds in all packages
- [ ] No regressions in existing functionality
- [ ] Git commits are clean with clear removal message

## Removal Checklist

Complete these steps in order:

1. **Discovery Phase**
   - [ ] Search codebase for all references to `@create-studio/docs`
   - [ ] Check all package.json files for docs dependencies
   - [ ] Identify all CI/CD workflows mentioning docs
   - [ ] Check tsconfig.json files for path mappings

2. **Dependency Removal**
   - [ ] Remove docs from any package.json dependencies
   - [ ] Remove docs from root workspace configuration
   - [ ] Update TypeScript path configurations if needed

3. **File Deletion**
   - [ ] Delete `packages/docs` directory
   - [ ] Delete `.github/workflows/nuxthub-cs-docs.yml`
   - [ ] Remove any docs-specific config files

4. **Verification**
   - [ ] Clean install: `rm -rf node_modules package-lock.json && npm install`
   - [ ] Build all packages
   - [ ] Run all tests
   - [ ] Start all development servers

5. **Git Commit**
   - [ ] Stage all changes
   - [ ] Create commit: "Remove docs package from monorepo"
   - [ ] Verify clean working tree

## Risk Assessment

### Low Risk
- Docs package appears isolated with no critical dependencies
- User confirmed docs content is not needed
- Removal is intentional and approved

### Medium Risk
- CI/CD pipelines may have undocumented docs dependencies
- Shared TypeScript types may be referenced
- Git history will retain the package (recoverable if needed)

### Mitigation Strategies
- Comprehensive search before deletion
- Test all remaining packages after removal
- Keep git history for potential recovery
- Verify CI/CD pipelines pass after removal
