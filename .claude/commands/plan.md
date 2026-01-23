# Plan Mode - Design Before Implementing

Enter structured planning mode for non-trivial tasks.

## Process

1. **Understand the Request**
   - Restate the goal in your own words
   - Identify any ambiguities
   - List assumptions being made

2. **Research Current State**
   - Find relevant existing code
   - Understand current patterns
   - Identify dependencies

3. **Design the Approach**
   - Break into discrete steps
   - Identify files to create/modify
   - Note potential risks

4. **Present the Plan**

   ```
   ## Plan: [Task Name]

   ### Goal
   [Clear statement of what we're achieving]

   ### Approach
   1. [Step 1]
   2. [Step 2]
   3. [Step 3]

   ### Files to Modify
   - `path/to/file.ts` - [what changes]

   ### Files to Create
   - `path/to/new-file.ts` - [purpose]

   ### Risks & Considerations
   - [Risk 1] - [mitigation]

   ### Questions
   - [Any clarifications needed]
   ```

5. **Wait for Approval**
   - Do not proceed until plan is approved
   - Revise if feedback given

## Arguments

$ARGUMENTS is the task description to plan.

## Example Usage

```
/plan "Add user authentication with JWT"
/plan "Refactor database layer to use repository pattern"
/plan "Implement caching for API responses"
```
