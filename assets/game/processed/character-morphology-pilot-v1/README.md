# Character morphology pilot v1

This staging-only pilot extends three accepted PetDex-compatible characters to
the final 8x15 Office animation contract without changing the active Office
registry:

- Doraemon proves that an existing 8x13 character can be closed by generating
  only the two missing seated-work rows.
- Anna proves the Einstein semantic poses on a human-like character with
  different hair, clothing, and body proportions.
- AI Workbot proves the same six semantic rows on a non-human robot with a
  large shell head, detached round hands, and short modular legs.

Each extension row contains six active frames followed by two transparent
cells. Furniture and handheld props are excluded from the character pixels.
The source strips use a solid magenta key and are processed by
`scripts/process-character-morphology-pilot.py`. The script preserves every
decoded RGBA pixel in the accepted base rows and writes only new versioned
atlases.

Image generation used the built-in OpenAI image generation tool on 2026-07-27.
Each strip referenced the character's accepted base atlas and the matching
Einstein motion source. The prompts locked a direct front or rear view,
character identity and morphology, six left-to-right frames, two empty cells,
no furniture, no held prop, and a `#ff00ff` background. Seated prompts
explicitly required an invisible-chair pelvis and hanging lower legs.

The measured outputs, provisional interaction hand anchors, and QA image are
indexed in `assets/game/manifests/character-morphology-pilot.json`.
