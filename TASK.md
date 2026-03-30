
# PLAN: Global Integrity Sweep — Phase 6 (Stub Eradication) - ANTIGRAVITY EDITION

## Context
We are migrating a Next.js app (`bookit`) to a pure Vite SPA (`bookit-spa`).
**STATUS:** Batches 1, 2, 3, and 4 are SUCCESSFULLY COMPLETED. All core master dashboard components are already ported.
**PENDING:** Batches 5, 6, 7, and 8.

Your task as the AI Agent is to execute the remaining batches to complete the frontend migration and eradicate all UI stubs ("TODO" pages).

Source Directory: `bookit/src/` 
Target Directory: `bookit-spa/src/`

---

## Translation Matrix (CRITICAL - APPLY TO ALL FILES)

| Next.js Concept | Vite SPA Replacement |
|---|---|
| Strip `'use client'` | Delete entirely |
| `import Link from 'next/link'` + `href=` | `import { Link } from 'react-router-dom'` + `to=` |
| `import { useRouter } from 'next/navigation'` | `import { useNavigate } from 'react-router-dom'` |
| `router.push(...)` or `router.replace(...)` | `Maps(...)` |
| `import { usePathname } from 'next/navigation'` | `const location = useLocation(); location.pathname` |
| `import { useSearchParams } from 'next/navigation'` | `import { useSearchParams } from 'react-router-dom'` |
| `import Image from 'next/image'` | Remove import; use standard HTML `<img className="...">` |
| `process.env.NEXT_PUBLIC_X` | `import.meta.env.VITE_X` |
| `createClient()` (inline instantiation) | `import { supabase } from '@/lib/supabase/client'` (Singleton) |
| `router.refresh()` | `queryClient.invalidateQueries(...)` |
| `suppressHydrationWarning` | Delete attribute |

---

## Batch 5 — Client Area Components (PORT TO VITE)
Read original files from `bookit/src/components/client/` and create/overwrite in `bookit-spa/src/components/client/`:

1. `MyLoyaltyPage.tsx`
2. `MyMastersPage.tsx`
3. `MyBookingsPage.tsx` (Ensure `ClientRealtimeSync` is imported from `@/components/client/ClientRealtimeSync`)
4. `MyProfilePage.tsx`

## Batch 6 — Public Page Components (PORT TO VITE)
Read original files from `bookit/src/components/public/` and create/overwrite in `bookit-spa/src/components/public/`:

1. `StudioPublicPage.tsx`
2. `PublicMasterPage.tsx` (Apply translation matrix carefully: change `<Image>` to `<img>`, switch router to `useNavigate`, use singleton Supabase).

## Batch 7 — OnboardingWizard (PORT TO VITE)
Read original file from `bookit/src/components/master/onboarding/OnboardingWizard.tsx` and create/overwrite in `bookit-spa/src/components/master/onboarding/OnboardingWizard.tsx`:
- This is a large, complex form component. Apply the Translation Matrix rigorously (`useNavigate`, `<img/>`, singleton supabase instance).

## Batch 8 — Route Integration (ERADICATE STUBS)
Many route pages in `bookit-spa/src/pages/` are currently empty stubs returning `<div>TODO</div>` or commented-out components. You must connect the components ported in Batches 5-7 to these pages.

**Client Zone Pages:**
- `bookit-spa/src/pages/my/MyBookingsPage.tsx` → Import `MyBookingsPage` from `@/components/client/MyBookingsPage` and render it.
- `bookit-spa/src/pages/my/MyLoyaltyPage.tsx` → Import and render `MyLoyaltyPage`.
- `bookit-spa/src/pages/my/MyMastersPage.tsx` → Import and render `MyMastersPage`.
- `bookit-spa/src/pages/my/MyProfilePage.tsx` → Import and render `MyProfilePage`.

**Public/Studio Pages:**
- `bookit-spa/src/pages/public/MasterPublicPage.tsx` → Uncomment `<PublicMasterPage master={data} />` after importing from `@/components/public/PublicMasterPage`.
- `bookit-spa/src/pages/studio/StudioJoinPage.tsx` → Uncomment `<StudioJoinPage studio={studio} token={token} />`.
- `bookit-spa/src/pages/studio/StudioSlugPage.tsx` → Uncomment `<StudioPublicPage studio={data.studio} members={data.members} />`.

**Layout Updates:**
- `bookit-spa/src/components/master/DashboardLayout.tsx`: Uncomment `import { BookingDetailsModal }` and the `<BookingDetailsModal />` component in the JSX.
- `bookit-spa/src/pages/my/MyLayout.tsx`: Import `MasterModeBanner` from `@/components/client/MasterModeBanner` and replace the inline banner div stub.

---

## Execution Directives
Process Batches 5, 6, 7, and 8 sequentially. Do not skip logic, hooks, or state variables. Ensure zero Next.js imports leak into the new files. Report when the entire task is successfully integrated.