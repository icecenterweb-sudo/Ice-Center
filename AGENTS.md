# Agent Rules

## Workflow

- **Always ask for user confirmation before running any `git commit` command.** Never commit without explicit approval, even if the changes are ready and verified.
- **NEVER use `prisma db push --accept-data-loss` or any command that can destroy production data.** Always use `prisma migrate dev` (with `--create-only` first if needed) to create safe, reversible migrations. If a migration requires data changes, back up the database first and ask the user before proceeding.
