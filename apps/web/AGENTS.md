# Web application instructions

- Keep `App.tsx` limited to composition and route selection.
- Features may import from `shared` and `app`, but never directly from another feature.
- Put network access behind `shared/services`; UI components must not call external platforms directly.
- Every external action is proposed first and confirmed through the action boundary.
- Preserve desktop and 320 px mobile behavior and run the production build after UI changes.
