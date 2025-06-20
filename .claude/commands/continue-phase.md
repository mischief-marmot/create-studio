# Continue Phase Command

This custom command helps you continue working on the Recipe Card Generator project using the phased development approach.

## Usage
Type: `/continue-phase [phase-number]` or just `/continue-phase` to work on the current phase

## What it does
1. Reads the PROJECT_PLAN.md file to check current progress
2. Identifies incomplete tasks in the current or specified phase
3. Updates the todo list with the next set of tasks
4. Provides context about what needs to be done
5. Begins implementation of the next incomplete task

## Examples
- `/continue-phase` - Continue with the current phase
- `/continue-phase 1` - Work on Phase 1 specifically
- `/continue-phase next` - Move to the next phase if current is complete

## Phase Status Indicators
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Complete

## Notes
- The command will automatically update the PROJECT_PLAN.md as tasks are completed
- It maintains context between sessions by reading the plan file
- Always commits changes at logical checkpoints
- Updates the "Session Notes" section with important decisions or blockers