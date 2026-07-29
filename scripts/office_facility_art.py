"""Deterministic image helpers shared by isolated Office facility builders."""

from __future__ import annotations

import hashlib
import io
import json
from collections import deque
from pathlib import Path
from statistics import median
from typing import Any

from PIL import Image, ImageDraw, ImageFont


def repo_path(root: Path, path: Path) -> str:
    return str(path.relative_to(root)).replace("\\", "/")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    value = path.read_bytes()
    if path.suffix.lower() in {".json", ".md", ".mjs", ".py", ".ts"}:
        value = value.decode("utf-8").replace("\r\n", "\n").encode("utf-8")
    return sha256_bytes(value)


def png_bytes(image: Image.Image) -> bytes:
    output = image.convert("RGBA")
    output.putdata(
        [
            pixel if pixel[3] else (0, 0, 0, 0)
            for pixel in output.getdata()
        ]
    )
    buffer = io.BytesIO()
    output.save(buffer, "PNG", optimize=False, compress_level=9)
    return buffer.getvalue()


def json_bytes(value: Any) -> bytes:
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def font(size: int, *, bold: bool = False) -> ImageFont.ImageFont:
    names = (
        ("arialbd.ttf", "DejaVuSans-Bold.ttf")
        if bold
        else ("arial.ttf", "DejaVuSans.ttf")
    )
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


TITLE_FONT = font(34, bold=True)
HEADING_FONT = font(23, bold=True)
BODY_FONT = font(18)
SMALL_FONT = font(14)


def draw_title(
    image: Image.Image,
    title: str,
    subtitle: str,
) -> ImageDraw.ImageDraw:
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, image.width, 92), fill=(26, 43, 63, 255))
    draw.text((28, 16), title, font=TITLE_FONT, fill=(244, 248, 252, 255))
    draw.text((30, 61), subtitle, font=SMALL_FONT, fill=(182, 200, 219, 255))
    return draw


def checkerboard(size: tuple[int, int], cell: int = 16) -> Image.Image:
    image = Image.new("RGBA", size, (232, 237, 243, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle(
                    (x, y, min(size[0], x + cell), min(size[1], y + cell)),
                    fill=(205, 214, 224, 255),
                )
    return image


def paste_scaled(
    target: Image.Image,
    source: Image.Image,
    box: tuple[int, int, int, int],
    *,
    resample: Image.Resampling = Image.Resampling.NEAREST,
) -> None:
    width = box[2] - box[0]
    height = box[3] - box[1]
    copy = source.copy()
    copy.thumbnail((width, height), resample)
    x = box[0] + (width - copy.width) // 2
    y = box[1] + (height - copy.height) // 2
    target.alpha_composite(copy, (x, y))


def layer_from_box(
    source: Image.Image,
    box: tuple[int, int, int, int],
) -> Image.Image:
    layer = Image.new("RGBA", source.size, (0, 0, 0, 0))
    layer.alpha_composite(source.crop(box), (box[0], box[1]))
    return layer


def clear_box(
    source: Image.Image,
    box: tuple[int, int, int, int],
) -> Image.Image:
    output = source.copy()
    ImageDraw.Draw(output).rectangle(
        (box[0], box[1], box[2] - 1, box[3] - 1),
        fill=(0, 0, 0, 0),
    )
    return output


def changed_outside_box(
    first: Image.Image,
    second: Image.Image,
    box: tuple[int, int, int, int],
) -> int:
    count = 0
    for y in range(first.height):
        for x in range(first.width):
            if box[0] <= x < box[2] and box[1] <= y < box[3]:
                continue
            if first.getpixel((x, y)) != second.getpixel((x, y)):
                count += 1
    return count


def alpha_overlap(
    first: Image.Image,
    first_origin: tuple[int, int],
    second: Image.Image,
    second_origin: tuple[int, int],
) -> int:
    left = max(first_origin[0], second_origin[0])
    top = max(first_origin[1], second_origin[1])
    right = min(
        first_origin[0] + first.width,
        second_origin[0] + second.width,
    )
    bottom = min(
        first_origin[1] + first.height,
        second_origin[1] + second.height,
    )
    if left >= right or top >= bottom:
        return 0
    first_alpha = first.getchannel("A")
    second_alpha = second.getchannel("A")
    return sum(
        1
        for y in range(top, bottom)
        for x in range(left, right)
        if first_alpha.getpixel((x - first_origin[0], y - first_origin[1]))
        and second_alpha.getpixel((x - second_origin[0], y - second_origin[1]))
    )


def connected_components(image: Image.Image) -> list[dict[str, Any]]:
    width, height = image.size
    visible = bytearray(1 if value else 0 for value in image.getchannel("A").getdata())
    seen = bytearray(width * height)
    components: list[dict[str, Any]] = []
    for start, value in enumerate(visible):
        if not value or seen[start]:
            continue
        queue = deque([start])
        seen[start] = 1
        points: list[int] = []
        left, top, right, bottom = width, height, 0, 0
        while queue:
            current = queue.popleft()
            points.append(current)
            x = current % width
            y = current // width
            left = min(left, x)
            top = min(top, y)
            right = max(right, x + 1)
            bottom = max(bottom, y + 1)
            for near_x, near_y in (
                (x - 1, y),
                (x + 1, y),
                (x, y - 1),
                (x, y + 1),
            ):
                if not (0 <= near_x < width and 0 <= near_y < height):
                    continue
                near = near_y * width + near_x
                if visible[near] and not seen[near]:
                    seen[near] = 1
                    queue.append(near)
        components.append(
            {
                "points": points,
                "pixelCount": len(points),
                "bounds": (left, top, right, bottom),
            }
        )
    return components


def _sample_border_key(image: Image.Image) -> tuple[int, int, int]:
    samples: list[tuple[int, int, int]] = []
    band = max(1, min(image.width, image.height, 6))
    step = max(1, min(image.width, image.height) // 256)
    for x in range(0, image.width, step):
        for y in range(band):
            samples.append(image.getpixel((x, y))[:3])
            samples.append(image.getpixel((x, image.height - 1 - y))[:3])
    for y in range(0, image.height, step):
        for x in range(band):
            samples.append(image.getpixel((x, y))[:3])
            samples.append(image.getpixel((image.width - 1 - x, y))[:3])
    return tuple(
        int(round(median(sample[channel] for sample in samples)))
        for channel in range(3)
    )


def _smoothstep(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3.0 - 2.0 * value)


def remove_magenta_chroma(
    source: Image.Image,
    *,
    transparent_threshold: float = 12.0,
    opaque_threshold: float = 220.0,
) -> tuple[Image.Image, tuple[int, int, int], dict[str, int]]:
    """Match the approved built-in ImageGen chroma workflow deterministically."""
    output = source.convert("RGBA")
    key = _sample_border_key(output)
    pixels = output.load()
    transparent = 0
    partial = 0
    for y in range(output.height):
        for x in range(output.width):
            red, green, blue, source_alpha = pixels[x, y]
            distance = max(
                abs(red - key[0]),
                abs(green - key[1]),
                abs(blue - key[2]),
            )
            key_like = (
                distance <= 32
                or min(red, blue) - green >= 16
            )
            if not key_like:
                alpha = source_alpha
            elif distance <= transparent_threshold:
                alpha = 0
            elif distance >= opaque_threshold:
                dominance = max(0, min(red, blue) - green)
                denominator = max(1, max(key) - green)
                alpha = round(255 * (1 - min(1, dominance / denominator)))
            else:
                ratio = (
                    (distance - transparent_threshold)
                    / (opaque_threshold - transparent_threshold)
                )
                distance_alpha = round(255 * _smoothstep(ratio))
                dominance = max(0, min(red, blue) - green)
                denominator = max(1, max(key) - green)
                dominance_alpha = round(
                    255 * (1 - min(1, dominance / denominator))
                )
                alpha = min(distance_alpha, dominance_alpha)
            alpha = round(alpha * source_alpha / 255)
            if 0 < alpha <= 8:
                alpha = 0
            if alpha == 0:
                pixels[x, y] = (0, 0, 0, 0)
                transparent += 1
                continue
            if alpha < 252 and key_like:
                cap = max(0, green - 1)
                red = min(red, cap)
                blue = min(blue, cap)
            pixels[x, y] = (red, green, blue, alpha)
            if alpha < 255:
                partial += 1
    return output, key, {
        "transparentPixels": transparent,
        "partialAlphaPixels": partial,
        "visiblePixels": output.width * output.height - transparent,
    }


def normalize_without_resampling(
    source: Image.Image,
    canvas: tuple[int, int],
    *,
    bottom_padding: int,
) -> tuple[Image.Image, dict[str, int], tuple[int, int, int, int]]:
    bounds = source.getbbox()
    if bounds is None:
        raise ValueError("Clean source has no visible subject")
    subject = source.crop(bounds)
    left = (canvas[0] - subject.width) // 2
    top = canvas[1] - subject.height - bottom_padding
    padding = {
        "left": left,
        "top": top,
        "right": canvas[0] - subject.width - left,
        "bottom": bottom_padding,
    }
    if min(padding.values()) < 32:
        raise ValueError(f"Insufficient clean-source padding: {padding}")
    output = Image.new("RGBA", canvas, (0, 0, 0, 0))
    output.alpha_composite(subject, (left, top))
    return output, padding, bounds
