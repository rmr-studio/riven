Review code changes in the current branch against the project's established patterns and conventions.

1. Run `git diff main --name-only` (or the appropriate base branch) to identify changed/new files.

2. For each changed file, check:
   - Does it follow the conventions defined in the projects CLAUDE.md?
   - Does it follow the naming conventions used elsewhere in the project?
   - Does it use the project's established patterns for error handling, logging, API calls, state management, etc.?
   - Does it introduce a new dependency or pattern where an existing one already exists?
   - Does it duplicate logic that already exists in shared/util modules?
   - Are new abstractions consistent with the existing architecture?

3. Reference actual existing code in the project as the "standard" — don't assume conventions, discover them from the codebase.

4. Flag deviations with specific file references showing the established pattern vs. what the new code does.

Base branch to diff against: $ARGUMENTS (default: main)
