from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "assets/art/layout-references/office-workstation-v2/step5-r02"
OUTPUT = EVIDENCE / "05-step5-r02-owner-contact-sheet.png"
INPUTS = [
    ("01 · CURRENT OFFICE CHARACTER SCALE / PARTS", EVIDENCE / "01-character-scale-and-parts.png"),
    ("02 · FAR / FRONT · PUBLIC DESK SIDE", EVIDENCE / "02-far-front-corrected.png"),
    ("03 · NEAR / BACK · SEAT DESK SIDE", EVIDENCE / "03-near-back-corrected.png"),
    ("04 · FOOTPRINT / VOLUME / SEAT ANCHORS", EVIDENCE / "04-volume-anchor-overlay.png"),
]


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts") / ("arialbd.ttf" if bold else "arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu") / ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def normalize_png(path: Path) -> Image.Image:
    with Image.open(path) as source:
        image = source.convert("RGB")
        source_format = source.format
    if image.size != (1280, 720):
        normalized = Image.new("RGB", (1280, 720), "#07111f")
        normalized.paste(image, ((1280 - image.width) // 2, (720 - image.height) // 2))
        image = normalized
    if source_format != "PNG" or image.size == (1280, 720):
        image.save(path, format="PNG", optimize=True)
    return image


def build() -> None:
    images = [(label, normalize_png(path)) for label, path in INPUTS]
    canvas = Image.new("RGB", (1600, 1080), "#07111f")
    draw = ImageDraw.Draw(canvas)
    draw.text((44, 26), "STEP 5 R02 · CHARACTER-RELATIVE SINGLE-SEAT REVIEW", fill="#67e8f9", font=font(24, True))
    draw.text((44, 61), "Current Office person = 1×1 floor footprint × 3 logical height · visible pixels may overflow", fill="#e2e8f0", font=font(18, True))
    draw.text(
        (44, 89),
        "Active Office before/after SHA-256: c40db448eb8e6d0f3fea67a41f716c0108aca63a4136cfad15293534273c618d",
        fill="#94a3b8",
        font=font(13),
    )
    draw.text((44, 112), "Chair 1×1×2 · desk 3×2 · full keyboard · far=public side · near=seat side", fill="#94a3b8", font=font(13))

    card_width, card_height = 748, 420
    starts = [(40, 154), (812, 154), (40, 602), (812, 602)]
    for (label, image), (left, top) in zip(images, starts, strict=True):
        image.thumbnail((720, 374), Image.Resampling.LANCZOS)
        draw.rounded_rectangle((left, top, left + card_width, top + card_height), radius=12, fill="#0f172a", outline="#334155", width=2)
        draw.text((left + 16, top + 12), label, fill="#67e8f9", font=font(14, True))
        image_left = left + (card_width - image.width) // 2
        image_top = top + 40 + (card_height - 48 - image.height) // 2
        canvas.paste(image, (image_left, image_top))

    draw.rounded_rectangle((40, 1040, 1560, 1070), radius=8, fill="#083344", outline="#22d3ee", width=1)
    draw.text((56, 1047), "OWNER GATE · STEP 6 / TEN SEATS / ACTIVE OFFICE REMAIN BLOCKED", fill="#cffafe", font=font(13, True))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUTPUT, optimize=True)
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    build()
