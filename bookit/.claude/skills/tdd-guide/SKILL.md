---
name: tdd-guide
description: Test-driven development — write failing test first, then implement. Use when writing new features with tests, improving test coverage, or practicing red-green-refactor. Supports Vitest (BookIT primary), Jest, and Playwright.
version: "1.0.0"
---

# TDD Guide — Test-Driven Development

Write the test first. Then make it pass. Then refactor.

---

## The Three Laws of TDD

1. Write NO production code until you have a failing test
2. Write ONLY enough test code to make it fail
3. Write ONLY enough production code to make the test pass

---

## Vitest Workflow (BookIT primary)

```bash
# Run tests in watch mode
cd bookit && npx vitest --watch

# Run specific test
npx vitest run src/lib/billing/pricing.test.ts

# Coverage report
npx vitest run --coverage
```

### Red → Green → Refactor

```typescript
// 1. RED — write failing test
it('should calculate 20% discount for Pro plan', () => {
  const price = calculateDiscount({ plan: 'pro', basePrice: 70000 })
  expect(price).toBe(56000) // FAILS — function doesn't exist yet
})

// 2. GREEN — minimum implementation
export function calculateDiscount({ plan, basePrice }: Params) {
  if (plan === 'pro') return basePrice * 0.8
  return basePrice
}

// 3. REFACTOR — clean up without breaking test
```

---

## Test Structure for BookIT

### Unit Tests (`src/lib/**/*.test.ts`)
```typescript
import { describe, it, expect, vi } from 'vitest'

describe('featureName', () => {
  describe('when [condition]', () => {
    it('should [behavior]', () => {
      // Arrange
      // Act
      // Assert
    })
  })
})
```

### Component Tests (`src/components/**/*.test.tsx`)
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName prop="value" />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

---

## Coverage Targets

| Category | Target |
|---|---|
| Business logic (billing, referrals, booking) | >90% |
| Utility functions (pluralUk, token, pricing) | >95% |
| UI components | >60% |
| Server actions | >80% |

---

## What to Test vs Skip

| Test | Skip |
|---|---|
| Business logic (pricing, billing, referrals) | Styling/CSS details |
| Edge cases (empty arrays, null, zero) | Framework internals |
| Error paths (network fail, invalid data) | Trivial getters/setters |
| Security (RLS, auth checks) | Generated code |

---

## Marketplace Version

After `/plugin install engineering-skills@claude-code-skills`:
- Automated test generation from source code
- Coverage gap analysis with suggested tests
- Mock/stub generation
- Integration with Vitest + Playwright together
