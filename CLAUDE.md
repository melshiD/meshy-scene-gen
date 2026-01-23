# Project: meshy_scene_gen

> TypeScript React application - Claude Code persistent instructions

---

## Project Overview

TODO: Add project description

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Framework**: React 18+
- **Build Tool**: Vite / Next.js / CRA
- **Styling**: {{STYLING}} (Tailwind / CSS Modules / Styled Components)
- **State**: {{STATE_MANAGEMENT}} (React Query / Zustand / Redux Toolkit)
- **Testing**: Vitest + React Testing Library
- **Package Manager**: pnpm / npm

---

## Quick Reference

```bash
# Install
pnpm install

# Dev server
pnpm dev

# Type check
pnpm typecheck

# Test
pnpm test

# Build
pnpm build

# Lint & Format
pnpm lint:fix
```

---

## Coding Standards

### TypeScript Rules

1. **Strict mode always** - No `any` types without explicit reason
2. **Prefer interfaces** for object shapes, `type` for unions/intersections
3. **Explicit return types** on exported functions
4. **No non-null assertions** (`!`) without comment explaining why

```typescript
// Good
interface UserProps {
  id: string;
  name: string;
  email?: string;
}

// Avoid
type User = any;
```

### React Patterns

1. **Functional components only** - No class components
2. **Custom hooks** for reusable logic (prefix with `use`)
3. **Composition over props drilling** - Use context sparingly
4. **Memoization** only when profiler shows need

```typescript
// Component structure
export function UserCard({ user }: UserCardProps): React.ReactElement {
  // 1. Hooks first
  const [isOpen, setIsOpen] = useState(false);

  // 2. Derived state
  const fullName = `${user.firstName} ${user.lastName}`;

  // 3. Effects
  useEffect(() => {
    // ...
  }, [dependency]);

  // 4. Handlers
  const handleClick = () => setIsOpen(true);

  // 5. Render
  return <div>...</div>;
}
```

### File Organization

```
src/
├── components/          # Shared UI components
│   └── Button/
│       ├── Button.tsx
│       ├── Button.test.tsx
│       └── index.ts
├── features/            # Feature-based modules
│   └── auth/
│       ├── components/
│       ├── hooks/
│       ├── api/
│       └── types.ts
├── hooks/               # Global custom hooks
├── lib/                 # Utilities and helpers
├── types/               # Global type definitions
└── App.tsx
```

### Testing Standards

```typescript
// Always test:
// 1. User interactions
// 2. Conditional rendering
// 3. Error states
// 4. Loading states

describe('UserCard', () => {
  it('renders user name', () => {
    render(<UserCard user={mockUser} />);
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    render(<UserCard user={mockUser} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

---

## Common Pitfalls

1. **Don't mutate state directly** - Always use setter functions
2. **Dependency arrays** - Include all dependencies or document why not
3. **Key props** - Use stable, unique IDs, never array indices for dynamic lists
4. **Async in useEffect** - Define async function inside, don't make effect async
5. **Event handler types** - Use `React.MouseEvent<HTMLButtonElement>` etc.

---

## Performance Guidelines

1. **Lazy load routes** - Use `React.lazy()` for code splitting
2. **Virtualize long lists** - Use react-virtual or similar
3. **Optimize images** - Use next/image or proper srcset
4. **Avoid inline objects/functions** in render when passed as props

---

## Accessibility Requirements

1. **Semantic HTML** - Use proper elements (button, nav, main, etc.)
2. **ARIA labels** - Add when semantic HTML isn't enough
3. **Keyboard navigation** - All interactive elements must be focusable
4. **Color contrast** - Minimum 4.5:1 ratio

```typescript
// Good
<button onClick={handleDelete} aria-label="Delete user">
  <TrashIcon />
</button>

// Avoid
<div onClick={handleDelete}>
  <TrashIcon />
</div>
```

---

## Agent Instructions

### Before Coding

1. Run `pnpm typecheck` to understand current type health
2. Review existing components for patterns
3. Check if similar component exists before creating new

### After Coding

1. Run `pnpm typecheck` - Zero errors required
2. Run `pnpm test` - All tests must pass
3. Run `pnpm lint:fix` - Auto-fix formatting

### Component Creation Checklist

- [ ] Types defined (Props interface)
- [ ] Default props handled
- [ ] Error boundaries considered
- [ ] Loading states handled
- [ ] Tests written
- [ ] Exported from index

---

*Last updated: 2026-01-23*
