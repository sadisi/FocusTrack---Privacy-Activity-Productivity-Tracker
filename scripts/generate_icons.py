import os
import zlib
import struct
import math

def make_png(width, height, pixel_func):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0
        for x in range(width):
            r, g, b, a = pixel_func(x, y, width, height)
            raw_data.extend([r, g, b, a])
    
    compressed = zlib.compress(raw_data, level=9)
    
    png = bytearray()
    png.extend(b'\x89PNG\r\n\x1a\n')  # Signature
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png.extend(struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc))
    
    # IDAT chunk
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    png.extend(struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc))
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND')
    png.extend(struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc))
    
    return bytes(png)

def focus_track_icon_pixels(x, y, width, height):
    # Normalized coords -1 to 1
    nx = (x / (width - 1)) * 2 - 1 if width > 1 else 0
    ny = (y / (height - 1)) * 2 - 1 if height > 1 else 0
    dist = math.sqrt(nx*nx + ny*ny)
    
    # Rounded container background
    if dist > 0.95:
        return (0, 0, 0, 0)  # Transparent corners
        
    # Blue/Cyan Gradient background (#0284c7 -> #0f172a)
    bg_factor = (ny + 1) / 2
    r_bg = int(2 + (15 - 2) * bg_factor)
    g_bg = int(132 + (23 - 132) * bg_factor)
    b_bg = int(199 + (42 - 199) * bg_factor)
    
    # Target / Clock Dial inner circle
    if dist < 0.75 and dist > 0.65:
        # Ring highlight
        return (56, 189, 248, 255) # Light blue accent
        
    # Center clock hands / chart bars
    # Draw a stylized target check / clock pointer
    angle = math.atan2(ny, nx)
    # Check if along 12 o'clock hand or 3 o'clock hand
    is_hand = False
    if dist < 0.65:
        if abs(nx) < 0.12 and ny < 0:  # Up hand
            is_hand = True
        elif abs(ny) < 0.12 and nx > 0: # Right hand
            is_hand = True
        elif dist < 0.2:  # Center dot
            is_hand = True

    if is_hand:
        return (255, 255, 255, 255)
        
    return (r_bg, g_bg, b_bg, 255)

os.makedirs('public/icons', exist_ok=True)
for size in [16, 48, 128]:
    png_bytes = make_png(size, size, focus_track_icon_pixels)
    with open(f'public/icons/icon-{size}.png', 'wb') as f:
        f.write(png_bytes)
print("Icons generated successfully!")
