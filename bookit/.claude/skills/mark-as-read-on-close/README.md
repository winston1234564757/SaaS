---
skill: mark-as-read-on-close
version: 1.0.0
source: BookIT NotificationsBell.tsx debugging session (2026-06-12)
---

# mark-as-read-on-close

A portable fix for the "all notifications appear read on open" bug that occurs when `markAllRead()` is called inside a drawer or modal's open handler.

## The Bug in One Line

Calling `markAllRead()` on open fires before React renders the list — so unread items never render highlighted.

## The Fix in One Line

Move `markAllRead()` to the close handler: `if (!val) markAllRead()`.

## Installation

Copy `SKILL.md` into your project's skills or docs folder. No dependencies.

## When to Use

- Building a notification drawer, panel, or modal with a "mark all read" action
- Debugging why all notifications look grey/read the moment the panel opens
- Any pattern where a mutation should run *after* the user has seen the content, not before

## Source

Extracted from a real bug in a Vaul drawer + Supabase real-time stack. The pattern is backend-agnostic and applies to any drawer/modal library in React (or any component framework with an open/close callback).
