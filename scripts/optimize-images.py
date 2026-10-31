"""Generate lossless WebP delivery assets; originals are preserved.
Run with Python and Pillow installed: python scripts/optimize-images.py
"""
import json
import re
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
folder = root / 'public' / 'roseveil'
names = set(re.findall(r"image: '([^']+)'", (root / 'src/data.js').read_text(encoding='utf-8')))
names.update(re.findall(r'/roseveil/([^"/]+)\.png', (root / 'index.html').read_text(encoding='utf-8')))
# Include names after markup has already been switched to WebP on subsequent runs.
names.update(re.findall(r'/roseveil/([^"/]+)\.webp', (root / 'index.html').read_text(encoding='utf-8')))
names = {re.sub(r'-(240|480|800|960)$', '', name) for name in names}
metrics = []
for name in sorted(names):
    original = folder / f'{name}.png'
    with Image.open(original) as image:
        image = image.convert('RGBA' if 'A' in image.getbands() else 'RGB')
        target = folder / f'{name}.webp'
        image.save(target, 'WEBP', lossless=True, method=4, exact=True)
        with Image.open(target) as decoded:
            assert decoded.convert(image.mode).tobytes() == image.tobytes(), name
        variants = []
        for width in ([960] if name == 'hero' else [240, 480, 800]):
            if width >= image.width:
                continue
            resized = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
            variant = folder / f'{name}-{width}.webp'
            resized.save(variant, 'WEBP', lossless=True, method=4, exact=True)
            variants.append({'file': variant.name, 'width': width, 'height': resized.height, 'bytes': variant.stat().st_size})
        metrics.append({'name': name, 'width': image.width, 'height': image.height, 'pngBytes': original.stat().st_size, 'webpBytes': target.stat().st_size, 'pixelIdentical': True, 'variants': variants})
        print(f'{name}: {original.stat().st_size} -> {target.stat().st_size}', flush=True)
(root / 'docs/image-optimization-metrics.json').write_text(json.dumps(metrics, indent=2) + '\n', encoding='utf-8')
