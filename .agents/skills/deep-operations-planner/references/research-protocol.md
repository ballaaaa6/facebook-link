# Evidence and Research Protocol

Use this protocol for deep research, tracing, comparisons, audits, and any
decision whose correctness depends on external or changing information.

## Claim decomposition

Rewrite the request as a list of answerable claims. For each claim record:

- what would count as evidence;
- whether the claim is factual, interpretive, comparative, or predictive;
- required freshness and version/date boundary;
- acceptable source types;
- whether the claim is load-bearing for the recommendation.

Do not allow an impressive headline source to stand in for all sub-claims.

## Source discipline

- Prefer primary documentation, source code, standards, filings, datasets,
  release notes, direct measurements, or first-party statements.
- Use secondary sources to discover leads, explain context, or compare
  interpretations; trace load-bearing facts back to primary evidence.
- Count independence by origin, not URL count. A mirror, repost, PDF copy, and
  publisher page for one document are one source.
- Verify that the source directly supports the claim. Label inferences as
  inferences or remove them.
- Preserve exact dates, versions, prices, figures, and quoted constraints when
  they affect the decision.

## Investigation passes

Run these passes in order:

1. **Scope:** define the question, date boundary, geographic or product scope,
   and output shape.
2. **Gather:** search each sub-claim using source-type variants and fetch the
   underlying pages or artifacts.
3. **Triangulate:** seek at least two independent sources for each non-trivial
   load-bearing claim. Mark a claim single-sourced when a second source is not
   available.
4. **Contrarian:** actively search for criticism, failure reports,
   deprecation, scams, incompatibilities, counterexamples, and reasons the
   preferred option may be wrong.
5. **Synthesize:** separate observed facts, calculations, inferences, and
   recommendations. Preserve material disagreements.
6. **Completeness:** re-read the original request and map every named part to
   an explicit answer or residual unknown.

## Saturation stop rule

Stop only after:

- every requested claim has an evidence status;
- primary sources were checked where reasonably available;
- the contrarian pass produced a result or a documented bounded search;
- multiple query families and relevant source types were tried;
- the latest searches add no new load-bearing fact or change in direction;
- remaining unknowns are listed with the reason they cannot currently be
  resolved.

Do not claim that the entire internet or every possible source was exhausted.
Claim a bounded, reproducible investigation with a documented stopping point.

## Evidence ledger

Use [../assets/evidence-ledger-template.md](../assets/evidence-ledger-template.md)
for claims that materially affect a plan. Keep citations close to the claim in
the final report and record source dates. Do not use a source merely because a
search result summarized it.
