# API instructions

- Keep handlers thin and move reusable behavior into packages.
- Parse untrusted input at the boundary and return stable JSON error codes.
- Never place browser credentials, cookies, tokens, or local filesystem paths in responses.
- Mutating external actions require an action proposal and explicit confirmation.
