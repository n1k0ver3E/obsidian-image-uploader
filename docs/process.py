"""Crop the raw Mi Monitor screenshot to the GitHub Image Uploader settings modal,
soften it with a drop shadow and rounded corners, save for the README."""
from PIL import Image, ImageDraw, ImageFilter

SRC = '/Users/niko/Cookiy/repos/obsidian-github-image-uploader/docs/raw.png'
OUT = '/Users/niko/Cookiy/repos/obsidian-github-image-uploader/docs/settings.png'

img = Image.open(SRC)
W, H = img.size
print(f'source: {W}x{H}')

# Mi Monitor logical resolution is 1456x819. The settings modal sits at
# x=477..942, y=315..658. Crop slightly tighter than that to drop the
# surrounding backdrop dim, then re-round corners to hide the modal's own.
SCALE_X = W / 1456
SCALE_Y = H / 819
left   = int(478 * SCALE_X)
top    = int(316 * SCALE_Y)
right  = int(941 * SCALE_X)
bottom = int(657 * SCALE_Y)
crop = img.crop((left, top, right, bottom))
print(f'crop: {crop.size}')

# Resize down to a sane README width before the cosmetic pass.
TARGET_W = 2000
sd = TARGET_W / crop.width
crop = crop.resize((TARGET_W, int(crop.height * sd)), Image.LANCZOS)

# Re-round corners (covers Obsidian's own modal corners cleanly).
radius = 48
mask = Image.new('L', crop.size, 0)
ImageDraw.Draw(mask).rounded_rectangle(
    (0, 0, crop.width, crop.height), radius=radius, fill=255
)

# Transparent canvas with padding + soft drop shadow.
pad = 110
canvas_w = crop.width + pad * 2
canvas_h = crop.height + pad * 2
canvas = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))

shadow = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
ImageDraw.Draw(shadow).rounded_rectangle(
    (pad - 6, pad + 28, pad + crop.width + 6, pad + crop.height + 32),
    radius=radius, fill=(0, 0, 0, 120),
)
shadow = shadow.filter(ImageFilter.GaussianBlur(36))
canvas.alpha_composite(shadow)

rounded = Image.new('RGBA', crop.size, (0, 0, 0, 0))
rounded.paste(crop.convert('RGBA'), (0, 0), mask)
canvas.alpha_composite(rounded, (pad, pad))

canvas.save(OUT, optimize=True)
print(f'saved: {OUT}  {canvas.size}')
