# .claude/commands/pr-review.md

Find the open pull request for the current git branch and review all PR comments to build an action plan.

## Steps

1. **Identify the current branch and repo:**
   - Run `git branch --show-current` to get the branch name.
   - Run `git remote get-url origin` to confirm the GitHub repo.
   - If no remote is configured, stop and tell me — this might be a detached worktree.

2. **Find the associated PR:**
   - Use the GitHub MCP `list_pull_requests` tool to find open PRs where the head branch matches the current branch.
   - If no PR is found, say so and stop.
   - If multiple PRs match, list them and ask me which one.

3. **Gather all review comments:**
   - Use the GitHub MCP to retrieve all review comments and general PR comments.
   - For each comment, also read the referenced file and line range so you have full context.

4. **Triage and propose solutions:**
   For each comment or group of related comments, present the following in a structured way:

   - **Comment:** Who said what (summarize, don't just paste)
   - **File/Location:** Where in the code this applies
   - **Your assessment:** Is this a valid concern? Rate it:
     - 🔴 **Must fix** — correctness issue, bug, or security concern
     - 🟡 **Should fix** — legitimate improvement, style/clarity, or maintainability
     - 🟢 **Optional** — subjective preference, bikeshedding, or already fine as-is
     - ⚪ **Disagree** — explain why the comment is incorrect or not applicable
   - **Proposed solution:** Concrete description of what you'd change and why

5. **Wait for my input:**
   After presenting ALL comments with your assessments, stop and ask me which ones to proceed with. Do NOT make any code changes until I confirm.
   
6. **Implement approved fixes:**
   Once I confirm which items to fix, implement them. After all changes are made, give me a summary of what was changed and where.

## Important
- Do not silently skip or dismiss any comment. Surface everything, even if you disagree with it.
- Group related comments together if they're about the same issue.
- If a comment is ambiguous, flag that and give your best interpretation.
- If you think a comment reveals a deeper architectural issue beyond what was mentioned, call that out.
