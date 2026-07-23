# Attribution Strategy

Shopee provides five Sub ID fields using ASCII letters and numbers. The stable project mapping is:

| Sub ID | Dimension | Example | Answers |
|---|---|---|---|
| 1 | Platform | `fb` | Which platform produced the outcome? |
| 2 | Account | `page01` | Which page/account produced it? |
| 3 | Placement | `feed` | Which format or placement? |
| 4 | Campaign | `evening` | Which strategy, slot, or experiment? |
| 5 | Creative | `p123c02` | Which product/creative variant? |

The encoder is `packages/attribution/src/index.ts`; the editable catalog is `config/attribution.json`.

## Rules

- Values are deterministic and reconstructable from database records.
- Never put personal data, tokens, timestamps with excessive cardinality, or Thai characters in Sub IDs.
- Reuse a creative ID only for the same artifact version.
- Record the full mapping before creating the Shopee affiliate link.
- Changing dimension meaning requires a versioned attribution plan, not an in-place reinterpretation.
