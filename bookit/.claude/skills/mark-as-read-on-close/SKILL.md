---
name: mark-as-read-on-close
description: "Fixes the anti-pattern of calling markAllRead() on drawer/modal open, which causes unread items to appear read before they render. Use when: implementing or debugging a 'mark as read' action in any notification drawer, modal, or panel."
---

# Mark-as-Read on Close

> Always mark notifications as read when the panel closes — not when it opens.

## Quick Reference

| Problem | Solution |
|---------|----------|
| All notifications appear grey/read on open | Move `markAllRead()` to the close handler |
| Unread badge clears before user sees items | Call mutation only when `open` transitions `true → false` |
| Server response overwrites `isRead: false` before render | Delay mutation until after user has seen the list |

## The Problem

When `markAllRead()` is called inside an open handler (e.g., `onOpenChange` when `val === true`), the mutation fires and the server sets all items to `isRead: true`. By the time React renders the notification list, the updated data has already arrived — so every item renders with its "read" styling. The user never sees any unread highlighting.

Symptom: opening the notifications panel always shows everything as read, even for genuinely new notifications. The unread count badge may also clear instantly on open rather than persisting until close.

## Solutions

### Option 1: Move to Close Handler (Recommended)

Remove the `markAllRead()` call from the open path and fire it only when the panel transitions to closed:

```tsx
// WRONG — fires before list renders
<Drawer.Root
  open={open}
  onOpenChange={(val) => {
    setOpen(val);
    if (val) markAllRead(); // <-- kills unread state before render
  }}
>

// CORRECT — list renders with original isRead state, mutation fires on exit
<Drawer.Root
  open={open}
  onOpenChange={(val) => {
    setOpen(val);
    if (!val) markAllRead(); // <-- fires only on close
  }}
>
```

Works with any drawer/modal library: Vaul, Radix Dialog, shadcn/ui Sheet, Headless UI Dialog, plain React state.

### Option 2: Optimistic Read — Delay Sync

If you need the mutation to fire immediately (e.g., for real-time multi-device sync) but still want items to render as unread first:

```tsx
const [localItems, setLocalItems] = useState(notifications);

const handleOpen = (val: boolean) => {
  setOpen(val);
  if (!val) {
    // Fire server mutation on close
    markAllRead();
  }
};
```

Keep the server state authoritative but only sync it on close. Do not eagerly merge the server response into local state while the panel is open.

### Option 3: Per-Item Read on Scroll (Advanced)

For fine-grained read tracking (mark each item as it becomes visible):

```tsx
const observer = useRef<IntersectionObserver | null>(null);

useEffect(() => {
  if (!open) return;
  observer.current = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = (entry.target as HTMLElement).dataset.notifId;
        if (id) markRead(id);
      }
    });
  });
  // attach to each notification element
}, [open]);
```

Use when items have individual read states and you need precise analytics.

## Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| Mark on close (Option 1) | Simple, zero flicker, no extra state | Mutation fires even if user opened panel by accident |
| Per-item on scroll (Option 3) | Precise, good for analytics | Complex, needs IntersectionObserver cleanup |
| Mark on open with delay (`setTimeout`) | Fires early | Race condition if network is fast — still broken |

## Edge Cases

- **User closes panel immediately:** The mutation still fires correctly — no stale unread count.
- **Panel unmounts without explicit close:** If your drawer can unmount without firing `onOpenChange(false)` (e.g., route change), add a cleanup effect: `useEffect(() => () => { markAllRead(); }, [])`.
- **Real-time subscription overwrites state while open:** If you have a live subscription that merges server data into local state, gate those updates: `if (!isOpen) mergeServerData(payload)`.
- **Multiple tabs / devices:** The on-close mutation updates the DB correctly, but other tabs won't reflect it until they refetch. Use a websocket/real-time channel if cross-tab sync matters.
- **Optimistic unread count in bell badge:** Update the badge count locally on open (so it shows "0 unread" immediately), but keep item-level `isRead` unchanged until close.

## Related

- [Vaul Drawer docs](https://vaul.emilkowal.ski/) — `onOpenChange` API
- [Radix Dialog docs](https://www.radix-ui.com/primitives/docs/components/dialog) — same `onOpenChange` pattern
- React docs: [useEffect cleanup](https://react.dev/reference/react/useEffect#cleaning-up-an-effect) — for unmount-without-close edge case
