Scan the current project for technical debt related to code duplication.

1. Walk through the source directories and identify:
   - Functions/methods with highly similar logic (>70% structural overlap)
   - Repeated inline patterns (e.g., the same error handling block, the same data transformation)
   - Copy-pasted utilities that should be extracted into shared modules
   - Near-identical components/classes that could be consolidated

2. For each finding, report:
   - The files and line ranges involved
   - What the duplication is
   - A concrete refactoring suggestion (extract to shared function, create base class, use a helper, etc.)

3. Prioritize by impact: things duplicated 3+ times before things duplicated twice.

Focus on source code in: $ARGUMENTS
If no path specified, scan the full project.
