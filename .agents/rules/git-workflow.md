# Workspace Rules — Git Workflow

## Branching & Push Policy
- **Active Working Branch**: Always use the `development` branch for all commits and pushes to GitHub (`origin development`).
- **Main Branch Protection**: NEVER push directly to the `main` branch unless the user explicitly commands it in their prompt.
- **Workflow**:
  1. Verify current branch is `development` before committing.
  2. Push changes with `git push origin development`.
