from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "ustc_defense_asset_sheet_gemini.png"
SUPPLEMENTAL_SOURCE = ROOT / "assets" / "source" / "supplemental_asset_sheet_imagegen.png"


ASSETS = [
    ("towers/tower_math.png", (470, 710, 612, 884), (256, 256)),
    ("towers/tower_physics.png", (1888, 1177, 1995, 1303), (256, 256)),
    ("towers/tower_lab.png", (1035, 360, 1157, 500), (256, 256)),
    ("towers/tower_coffee.png", (1202, 520, 1328, 695), (256, 256)),
    ("enemies/enemy_homework.png", (1540, 548, 1655, 668), (160, 160)),
    ("enemies/enemy_report.png", (1535, 355, 1662, 492), (180, 180)),
    ("enemies/enemy_ddl.png", (52, 1440, 166, 1568), (160, 160)),
    ("ui/icon_hp.png", (1785, 970, 1884, 1063), (64, 64)),
    ("ui/icon_coin.png", (1986, 970, 2080, 1063), (64, 64)),
    ("ui/icon_wave.png", (1884, 970, 1982, 1063), (64, 64)),
    ("ui/icon_help.png", (1785, 1066, 1884, 1156), (64, 64)),
    ("ui/icon_setting.png", (1884, 1066, 1982, 1156), (64, 64)),
    ("ui/icon_pause.png", (1986, 1066, 2080, 1156), (64, 64)),
    ("ui/tower_card_math.png", (1782, 1177, 1888, 1303), (96, 96)),
    ("ui/tower_card_physics.png", (1888, 1177, 1995, 1303), (96, 96)),
    ("ui/tower_card_lab.png", (2005, 1170, 2094, 1303), (96, 96)),
    ("ui/tower_card_coffee.png", (2198, 1176, 2300, 1303), (96, 96)),
]

SUPPLEMENTAL_ASSETS = [
    ("maps/flag_entrance.png", 0, 0, (128, 160)),
    ("maps/flag_exit.png", 1, 0, (128, 160)),
    ("ui/icon_upgrade.png", 2, 0, (64, 64)),
    ("ui/icon_sell.png", 3, 0, (64, 64)),
    ("effects/fx_bullet_blue.png", 4, 0, (64, 64)),
    ("effects/fx_bullet_orange.png", 0, 1, (64, 64)),
    ("effects/fx_bullet_green.png", 1, 1, (64, 64)),
    ("effects/fx_slow_wave.png", 2, 1, (128, 128)),
    ("effects/fx_hit_spark.png", 3, 1, (96, 96)),
    ("ui/icon_wave_shield.png", 4, 1, (64, 64)),
]


def is_bg_like(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a < 8:
        return True

    # Beige paper and grey grid from the generated sheet.
    if 135 <= r <= 230 and 125 <= g <= 220 and 110 <= b <= 205:
        if abs(r - g) <= 42 and abs(g - b) <= 42 and r >= b:
            return True

    # Darker grid lines.
    if 65 <= r <= 150 and 60 <= g <= 145 and 55 <= b <= 135:
        if max(r, g, b) - min(r, g, b) <= 32:
            return True

    return False


def remove_edge_background(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    seen = [[False] * h for _ in range(w)]
    queue: deque[tuple[int, int]] = deque()

    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))

    while queue:
        x, y = queue.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or seen[x][y]:
            continue
        seen[x][y] = True
        if not is_bg_like(px[x, y]):
            continue
        px[x, y] = (255, 255, 255, 0)
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    return rgba


def remove_magenta_key(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = px[x, y]
            if r > 220 and g < 45 and b > 220:
                px[x, y] = (255, 255, 255, 0)
    return rgba


def alpha_bbox(img: Image.Image) -> tuple[int, int, int, int]:
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    if bbox:
        return bbox
    return (0, 0, img.width, img.height)


def remove_grid_fragments(img: Image.Image) -> Image.Image:
    rgba = img.copy()
    alpha = rgba.getchannel("A")
    w, h = rgba.size
    seen = [[False] * h for _ in range(w)]
    px = rgba.load()

    for start_y in range(h):
        for start_x in range(w):
            if seen[start_x][start_y] or alpha.getpixel((start_x, start_y)) == 0:
                continue
            queue: deque[tuple[int, int]] = deque([(start_x, start_y)])
            component: list[tuple[int, int]] = []
            seen[start_x][start_y] = True
            min_x = max_x = start_x
            min_y = max_y = start_y

            while queue:
                x, y = queue.popleft()
                component.append((x, y))
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if nx < 0 or ny < 0 or nx >= w or ny >= h or seen[nx][ny]:
                        continue
                    seen[nx][ny] = True
                    if alpha.getpixel((nx, ny)) > 0:
                        queue.append((nx, ny))

            comp_w = max_x - min_x + 1
            comp_h = max_y - min_y + 1
            is_thin_line = comp_w <= 5 or comp_h <= 5
            is_tiny = len(component) < 42
            if is_thin_line or is_tiny:
                for x, y in component:
                    px[x, y] = (255, 255, 255, 0)

    return rgba


def fit_to_canvas(img: Image.Image, size: tuple[int, int], padding: int = 10) -> Image.Image:
    bbox = alpha_bbox(img)
    cropped = img.crop(bbox)
    max_w = size[0] - padding * 2
    max_h = size[1] - padding * 2
    scale = min(max_w / cropped.width, max_h / cropped.height)
    new_size = (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale)))
    resampled = cropped.resize(new_size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, (255, 255, 255, 0))
    x = (size[0] - new_size[0]) // 2
    y = (size[1] - new_size[1]) // 2
    canvas.alpha_composite(resampled, (x, y))
    return canvas


def make_range_circle() -> Image.Image:
    img = Image.new("RGBA", (256, 256), (255, 255, 255, 0))
    px = img.load()
    cx = cy = 128
    for y in range(256):
        for x in range(256):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if d <= 118:
                alpha = 24
                if 110 <= d <= 118:
                    alpha = 92
                px[x, y] = (30, 124, 242, alpha)
    return img


def make_empty_slot() -> Image.Image:
    img = Image.new("RGBA", (128, 128), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    color = (104, 112, 100, 190)
    glow = (255, 255, 255, 70)
    for inset in (19, 20):
        draw.rounded_rectangle((inset, inset, 128 - inset, 128 - inset), radius=18, outline=glow, width=4)
    for x in range(30, 99, 18):
        draw.line((x, 25, min(x + 10, 103), 25), fill=color, width=4)
        draw.line((x, 103, min(x + 10, 103), 103), fill=color, width=4)
    for y in range(30, 99, 18):
        draw.line((25, y, 25, min(y + 10, 103)), fill=color, width=4)
        draw.line((103, y, 103, min(y + 10, 103)), fill=color, width=4)
    draw.line((64, 50, 64, 78), fill=(70, 76, 68, 210), width=5)
    draw.line((50, 64, 78, 64), fill=(70, 76, 68, 210), width=5)
    return img


def make_selected_slot(empty_slot: Image.Image) -> Image.Image:
    img = empty_slot.copy()
    glow = Image.new("RGBA", img.size, (255, 255, 255, 0))
    px = glow.load()
    cx = cy = img.width // 2
    for y in range(img.height):
        for x in range(img.width):
            d = max(abs(x - cx), abs(y - cy))
            if 41 <= d <= 58:
                alpha = int(max(0, 100 - abs(d - 49) * 16))
                px[x, y] = (30, 124, 242, alpha)
    glow.alpha_composite(img)
    return glow


def make_slow_wave() -> Image.Image:
    img = Image.new("RGBA", (128, 128), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    for radius, alpha, width in ((22, 150, 5), (36, 105, 5), (50, 70, 4), (60, 40, 3)):
        box = (64 - radius, 64 - radius, 64 + radius, 64 + radius)
        draw.ellipse(box, outline=(154, 96, 54, alpha), width=width)
    draw.ellipse((54, 54, 74, 74), fill=(196, 128, 72, 68))
    return img.filter(ImageFilter.GaussianBlur(0.35))


def make_contact_sheet(paths: list[Path]) -> None:
    thumbs = []
    for path in paths:
        img = Image.open(path).convert("RGBA")
        img.thumbnail((96, 96), Image.Resampling.LANCZOS)
        tile = Image.new("RGBA", (160, 126), (244, 248, 252, 255))
        tile.alpha_composite(img, ((160 - img.width) // 2, 8))
        thumbs.append((path.name, tile))

    cols = 5
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * 160, rows * 126), (255, 255, 255, 255))
    for index, (_, tile) in enumerate(thumbs):
        x = (index % cols) * 160
        y = (index // cols) * 126
        sheet.alpha_composite(tile, (x, y))
    out = ROOT / "qa-shots" / "asset-extraction-contact-sheet.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    written: list[Path] = []

    for rel_path, box, size in ASSETS:
        out = ROOT / "assets" / rel_path
        out.parent.mkdir(parents=True, exist_ok=True)
        crop = source.crop(box)
        clean = remove_edge_background(crop)
        clean = remove_grid_fragments(clean)
        final = fit_to_canvas(clean, size)
        final.save(out)
        written.append(out)

    empty = make_empty_slot()
    empty.save(ROOT / "assets" / "maps" / "tower_slot_empty.png")
    written.append(ROOT / "assets" / "maps" / "tower_slot_empty.png")

    selected = make_selected_slot(empty)
    selected.save(ROOT / "assets" / "maps" / "tower_slot_selected.png")
    written.append(ROOT / "assets" / "maps" / "tower_slot_selected.png")

    circle = make_range_circle()
    circle.save(ROOT / "assets" / "maps" / "range_circle.png")
    written.append(ROOT / "assets" / "maps" / "range_circle.png")

    if SUPPLEMENTAL_SOURCE.exists():
        supplemental = Image.open(SUPPLEMENTAL_SOURCE).convert("RGBA")
        cell_w = supplemental.width / 5
        cell_h = supplemental.height / 2
        for rel_path, col, row, size in SUPPLEMENTAL_ASSETS:
            out = ROOT / "assets" / rel_path
            out.parent.mkdir(parents=True, exist_ok=True)
            left = round(col * cell_w)
            upper = round(row * cell_h)
            right = round((col + 1) * cell_w)
            lower = round((row + 1) * cell_h)
            crop = supplemental.crop((left, upper, right, lower))
            clean = remove_magenta_key(crop)
            clean = remove_grid_fragments(clean)
            final = fit_to_canvas(clean, size, padding=4)
            final.save(out)
            written.append(out)

    slow_wave = make_slow_wave()
    slow_wave.save(ROOT / "assets" / "effects" / "fx_slow_wave.png")

    make_contact_sheet(written)
    print(f"extracted {len(written)} assets")
    for path in written:
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
