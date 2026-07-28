from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops


ROOT = Path(__file__).resolve().parents[1]
CHAIR_ROOT = ROOT / "assets/game/processed/office-library-modern-bright-v1/chair-office-modern-v1"
FRONT_MASK = ROOT / "assets/game/processed/office-interactions-v1/foreground-masks/chair-office-modern-foreground.png"
KEYBOARD = ROOT / "assets/game/processed/office-facility-v1-lab/derived/keyboard.only.png"
OUTPUT = ROOT / "assets/game/processed/office-workstation-v2/step5-r02"


def with_alpha(source: Image.Image, alpha: Image.Image) -> Image.Image:
    result = source.copy()
    result.putalpha(alpha)
    return result


def split_front() -> None:
    source = Image.open(CHAIR_ROOT / "chair.office.modern.front.png").convert("RGBA")
    foreground = Image.open(FRONT_MASK).convert("RGBA")
    source_alpha = source.getchannel("A")
    foreground_alpha = foreground.getchannel("A")
    backrest_alpha = ImageChops.subtract(source_alpha, foreground_alpha)
    with_alpha(source, backrest_alpha).save(OUTPUT / "chair.office.modern.front.backrest.png", optimize=True)
    foreground.save(OUTPUT / "chair.office.modern.front.seat-base.png", optimize=True)


def split_back() -> None:
    source = Image.open(CHAIR_ROOT / "chair.office.modern.back.png").convert("RGBA")
    source_alpha = source.getchannel("A")
    backrest_alpha = Image.new("L", source.size, 0)
    seat_base_alpha = Image.new("L", source.size, 0)
    cut_y = 205
    backrest_alpha.paste(source_alpha.crop((0, 0, source.width, cut_y)), (0, 0))
    seat_base_alpha.paste(source_alpha.crop((0, cut_y, source.width, source.height)), (0, cut_y))
    with_alpha(source, backrest_alpha).save(OUTPUT / "chair.office.modern.back.backrest.png", optimize=True)
    with_alpha(source, seat_base_alpha).save(OUTPUT / "chair.office.modern.back.seat-base.png", optimize=True)


def crop_keyboard() -> None:
    source = Image.open(KEYBOARD).convert("RGBA")
    bounds = source.getchannel("A").getbbox()
    if bounds is None:
        raise RuntimeError("Keyboard source has no visible pixels")
    source.crop(bounds).save(OUTPUT / "keyboard.workstation.full-tight.png", optimize=True)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    split_front()
    split_back()
    crop_keyboard()
    for path in sorted(OUTPUT.glob("*.png")):
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
