---
name: frontend-componentization
description: Keep frontend pages modular and readable with component boundaries, reusable hooks, and UI composition. Use when creating or refactoring React pages, especially when files are growing too large.
disable-model-invocation: true
---

# Frontend Componentization

## Goals

- Keep page files focused on composition, not business logic.
- Keep code discoverable for humans during maintenance and review.
- Preserve UX quality while splitting components.

## Rules

1. **Page size**
   - Avoid page/view files larger than ~250 lines.
   - If a page grows beyond that, split immediately.

2. **Separation of concerns**
   - Put stateful orchestration and async side effects in hooks (e.g. `src/hooks/useXxx.js`).
   - Put reusable rendering blocks in feature components (e.g. `src/features/<feature>/components`).
   - Put constants/formatters in `constants.js` and `utils.js`.

3. **Composition-first pages**
   - Page should read like a layout tree: header, filters, content, dialogs.
   - No long inline helper functions unless they are page-only and tiny.

4. **Calendar/complex widgets**
   - Build dedicated components (`CalendarView`, `TimelineView`, etc).
   - Keep interaction handlers passed from hook/page as props.

5. **Refactor safety**
   - Keep existing API contracts and behavior unchanged unless requested.
   - Run lint/build after refactor.

## Checklist before finishing

- [ ] Page file is mostly composition.
- [ ] Complex logic extracted to hook/util/component.
- [ ] No duplicated helper logic across components.
- [ ] UI behavior still matches permissions and backend contracts.
- [ ] Build passes.
