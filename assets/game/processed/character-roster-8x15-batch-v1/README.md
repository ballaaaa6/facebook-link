# Character roster 8x15 batch provenance

The 84 immutable `*-v1-source.png` strips in the fourteen character folders
were created with the built-in ImageGen workflow on 2026-07-27. Each call used
the character's accepted PetDex/runtime atlas as the identity reference and an
accepted Einstein semantic strip as the motion reference.

Every prompt required:

- one direct front or direct rear orthographic row;
- exactly six active character-only frames;
- empty room for two trailing cells;
- no furniture, facility, prop, shadow, label, or guide;
- solid `#ff00ff` chroma background;
- morphology preservation instead of reshaping non-human characters into the
  Einstein body.

Rejected generations were not copied into the repository. Corrections included
removing a baked bag from Asuka, identity drift from Taffy, an incorrect
five-frame Gugugaga strip, front-of-hood details shown on Gugugaga's rear view,
and a standing-looking QQ Penguin lounge row.

`scripts/process-character-roster-batch.py` is the reproducible extraction and
packing step. Its generated manifest and contact sheet are the QA source of
truth; the active Office consumes none of these v3 atlases yet.
