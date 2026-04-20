"""
Gera os ícones do PWA do Catálogo da Comunidade.
- icon-192.png         (Android maskable-ready base)
- icon-512.png         (Android/PWA store)
- icon-512-maskable.png (Android adaptive, com safe zone)
- apple-touch-icon.png (iOS, 180x180)
- favicon.png          (32x32 aba do navegador)

Paleta: azul profundo (#1B2A4A) + dourado (#C8963E)
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Cores da identidade
BLUE_DEEP = (27, 42, 74)       # #1B2A4A
BLUE_MID  = (44, 62, 107)      # #2C3E6B
GOLD      = (200, 150, 62)     # #C8963E
GOLD_LIGHT= (232, 200, 122)    # #E8C87A
CREAM     = (250, 246, 240)    # #FAF6F0


def font_bold(size: int) -> ImageFont.FreeTypeFont:
    """Carrega uma fonte bold razoável; cai no default se não achar."""
    candidates = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
    ]
    for p in candidates:
        if os.path.exists(p):
            return ImageFont.truetype(p, size=size)
    return ImageFont.load_default()


def gradient_bg(size: int, c1=BLUE_DEEP, c2=BLUE_MID) -> Image.Image:
    """Fundo com gradiente diagonal."""
    img = Image.new('RGB', (size, size), c1)
    top = Image.new('RGB', (size, size), c2)
    mask = Image.new('L', (size, size))
    for y in range(size):
        for x in range(size):
            # Diagonal: alpha = (x + y) / (2*size)
            mask.putpixel((x, y), int(255 * (x + y) / (2 * size)))
    img.paste(top, (0, 0), mask)
    return img


def draw_icon(size: int, safe_ratio: float = 1.0, corner_radius: int = None) -> Image.Image:
    """
    Gera o ícone principal.
    - safe_ratio < 1 → conteúdo ocupa menos (margem para maskable)
    - corner_radius → arredonda os cantos (para ícone não-maskable)
    """
    img = gradient_bg(size)
    draw = ImageDraw.Draw(img)

    # Glow dourado de fundo
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    glow_r = int(size * 0.45 * safe_ratio)
    gd.ellipse(
        [(size//2 - glow_r, size//2 - glow_r),
         (size//2 + glow_r, size//2 + glow_r)],
        fill=(*GOLD, 50)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=size//10))
    img.paste(glow, (0, 0), glow)

    # Badge dourado (moldura circular)
    inner_r = int(size * 0.32 * safe_ratio)
    center = (size // 2, size // 2)
    ring_thickness = max(2, int(size * 0.015))

    draw.ellipse(
        [(center[0] - inner_r, center[1] - inner_r),
         (center[0] + inner_r, center[1] + inner_r)],
        outline=GOLD_LIGHT,
        width=ring_thickness
    )

    # Letra "C" central em dourado
    # Tamanho da fonte proporcional ao raio interno
    f = font_bold(int(inner_r * 1.5))
    letter = 'C'
    bbox = draw.textbbox((0, 0), letter, font=f)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    # Ajuste vertical porque bbox do PIL não considera ascent perfeito
    tx = center[0] - tw // 2 - bbox[0]
    ty = center[1] - th // 2 - bbox[1]
    # Sombra leve
    draw.text((tx + 2, ty + 2), letter, font=f, fill=(0, 0, 0, 100))
    draw.text((tx, ty), letter, font=f, fill=GOLD)

    # Pequena cruz acima (referência paroquial)
    cross_size = int(size * 0.05 * safe_ratio)
    cross_top = center[1] - inner_r - cross_size - int(size * 0.02 * safe_ratio)
    cx = center[0]
    draw.rectangle(
        [(cx - cross_size // 6, cross_top - cross_size // 2),
         (cx + cross_size // 6, cross_top + cross_size // 2)],
        fill=GOLD
    )
    draw.rectangle(
        [(cx - cross_size // 2, cross_top - cross_size // 6),
         (cx + cross_size // 2, cross_top + cross_size // 6)],
        fill=GOLD
    )

    # Arredondar cantos (para ícone NÃO-maskable)
    if corner_radius:
        mask = Image.new('L', (size, size), 0)
        md = ImageDraw.Draw(mask)
        md.rounded_rectangle([(0, 0), (size, size)], radius=corner_radius, fill=255)
        result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        result.paste(img, (0, 0), mask)
        return result

    return img.convert('RGBA')


# ================================================
# Gerar todos os tamanhos
# ================================================

configs = [
    # (nome, tamanho, safe_ratio, corner_radius)
    ('icon-192.png',          192, 1.0, 36),
    ('icon-512.png',          512, 1.0, 96),
    ('icon-512-maskable.png', 512, 0.65, None),   # safe zone para adaptive
    ('apple-touch-icon.png',  180, 1.0, None),    # iOS arredonda sozinho
    ('favicon.png',           64,  1.0, 12),
]

for nome, size, safe, corner in configs:
    img = draw_icon(size, safe_ratio=safe, corner_radius=corner)
    path = os.path.join(BASE_DIR, nome)
    img.save(path, 'PNG')
    print(f'✅ {nome}  ({size}x{size}, safe={safe}, corner={corner})')

print('\n🎉 Ícones gerados em:', BASE_DIR)
