from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "assets/art/layout-references/office-workstation-v2/step5"
OUTPUT = EVIDENCE / "05-step5-owner-contact-sheet.png"
INPUTS = [
    ("01 · LOCKED ASSETS / RUNTIME SCALE", EVIDENCE / "01-asset-provenance-and-scale.png"),
    ("02 · FAR / FRONT CLEAN ASSEMBLY", EVIDENCE / "02-front-seat-layer-stack.png"),
    ("03 · NEAR / BACK CLEAN ASSEMBLY", EVIDENCE / "03-back-seat-layer-stack.png"),
    ("04 · FOOTPRINT / ANCHOR / OCCLUSION", EVIDENCE / "04-anchor-occlusion-overlay.png"),
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


def build() -> None:
    for _, path in INPUTS:
        with Image.open(path) as source:
            source_format = source.format
            screenshot = source.convert("RGB")
        if source_format != "PNG":
            screenshot.save(path, format="PNG", optimize=True)

    canvas = Image.new("RGB", (1600, 1080), "#07111f")
    draw = ImageDraw.Draw(canvas)
    draw.text((44, 28), "STEP 5 · SINGLE-SEAT OWNER REVIEW", fill="#67e8f9", font=font(25, True))
    draw.text((44, 64), "One accepted 3×2 desk · one existing character · two orientations", fill="#e2e8f0", font=font(19, True))
    draw.text(
        (44, 92),
        "Active Office before/after SHA-256: c40db448eb8e6d0f3fea67a41f716c0108aca63a4136cfad15293534273c618d",
        fill="#94a3b8",
        font=font(13),
    )
    draw.text((44, 115), "New artwork: 0 · promoted seats: 0/10 · remaining roster calibration: blocked", fill="#94a3b8", font=font(13))

    card_width, card_height = 748, 420
    image_width, image_height = 720, 405
    starts = [(40, 160), (812, 160), (40, 610), (812, 610)]
    for (label, path), (left, top) in zip(INPUTS, starts, strict=True):
        image = Image.open(path).convert("RGB")
        image.thumbnail((image_width, image_height), Image.Resampling.LANCZOS)
        draw.rounded_rectangle((left, top, left + card_width, top + card_height), radius=12, fill="#0f172a", outline="#334155", width=2)
        draw.text((left + 16, top + 12), label, fill="#67e8f9", font=font(14, True))
        image_left = left + (card_width - image.width) // 2
        image_top = top + 42 + (card_height - 50 - image.height) // 2
        canvas.paste(image, (image_left, image_top))

    draw.rounded_rectangle((40, 1040, 1560, 1070), radius=8, fill="#083344", outline="#22d3ee", width=1)
    draw.text((56, 1047), "OWNER GATE · REVIEW IMAGES ONLY · STEP 6 / TEN SEATS / ACTIVE OFFICE REMAIN BLOCKED", fill="#cffafe", font=font(13, True))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUTPUT, optimize=True)
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    build()
