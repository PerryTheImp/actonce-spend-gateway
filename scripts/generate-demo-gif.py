#!/usr/bin/env python3
"""
Generate an animated GIF demo of ActOnce Spend Gateway CLI.
Requires: python3, pip3 install pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Terminal styling
WIDTH = 1200
HEIGHT = 700
BG_COLOR = (40, 42, 54)  # Dracula background
FG_COLOR = (248, 248, 242)  # Dracula foreground
PROMPT_COLOR = (80, 250, 123)  # Dracula green
ACCENT_COLOR = (189, 147, 249)  # Dracula purple
COMMENT_COLOR = (98, 114, 164)  # Dracula comment
FONT_SIZE = 20
LINE_HEIGHT = 28
MARGIN_LEFT = 20
MARGIN_TOP = 20

def get_font():
    """Try to find a monospace font"""
    font_paths = [
        "/System/Library/Fonts/Monaco.dfont",
        "/System/Library/Fonts/Menlo.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            return ImageFont.truetype(path, FONT_SIZE)
    return ImageFont.load_default()

def create_frame(lines, cursor_line=None, cursor_col=None):
    """Create a single frame from text lines"""
    img = Image.new('RGB', (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    font = get_font()
    
    y = MARGIN_TOP
    for i, line in enumerate(lines):
        x = MARGIN_LEFT
        
        # Parse color codes (simple)
        if line.startswith("$"):
            # Prompt
            draw.text((x, y), "$", font=font, fill=PROMPT_COLOR)
            x += draw.textlength("$ ", font=font)
            draw.text((x, y), line[2:], font=font, fill=FG_COLOR)
        elif line.startswith("#"):
            # Comment
            draw.text((x, y), line, font=font, fill=COMMENT_COLOR)
        elif line.startswith(">"):
            # Output
            x += 20  # Indent output
            draw.text((x, y), line[2:], font=font, fill=ACCENT_COLOR)
        else:
            draw.text((x, y), line, font=font, fill=FG_COLOR)
        
        y += LINE_HEIGHT
    
    # Draw cursor
    if cursor_line is not None and cursor_col is not None:
        cursor_y = MARGIN_TOP + cursor_line * LINE_HEIGHT
        cursor_x = MARGIN_LEFT + cursor_col * (FONT_SIZE * 0.6)  # Approx char width
        draw.rectangle([cursor_x, cursor_y, cursor_x + 10, cursor_y + LINE_HEIGHT - 4], fill=FG_COLOR)
    
    return img

def type_text(lines, target_line, text, delay=3):
    """Animate typing text on a specific line"""
    frames = []
    for i in range(len(text) + 1):
        new_lines = lines.copy()
        new_lines[target_line] = f"$ {text[:i]}"
        frames.append(create_frame(new_lines, cursor_line=target_line, cursor_col=i + 2))
        frames.extend([frames[-1]] * delay)  # Hold each frame
    return frames

def hold_frame(lines, duration=10):
    """Hold a static frame"""
    frame = create_frame(lines)
    return [frame] * duration

# Demo script
frames = []

# Scene 1: Title
scene1 = [
    "# ActOnce Spend Gateway — 30 Second Demo",
    "",
    "# Install: npm install -g @actonce/spend-gateway",
    "# GitHub:  github.com/PerryTheImp/actonce-spend-gateway",
]
frames.extend(hold_frame(scene1, 20))

# Scene 2: Init command
scene2 = scene1.copy()
scene2.append("")
scene2.append("$ actonce-spend init")
frames.extend(type_text(scene2, len(scene2) - 1, "actonce-spend init"))

# Output
scene2_output = scene2.copy()
scene2_output[-1] = "$ actonce-spend init"
scene2_output.append("> Created actonce-policy.yaml")
scene2_output.append("> Created data/ directory")
scene2_output.append("> Created logs/ directory")
frames.extend(hold_frame(scene2_output, 15))

# Scene 3: Check spend (simulate)
scene3 = scene2_output.copy()
scene3.append("")
scene3.append("# Test a spend with dry-run...")
scene3.append("$ actonce-spend check --amount 14.99 --currency GBP --merchant namecheap.com --simulate")
frames.extend(type_text(scene3, len(scene3) - 1, "actonce-spend check --amount 14.99 --currency GBP --merchant namecheap.com --simulate"))

scene3_output = scene3.copy()
scene3_output[-1] = "$ actonce-spend check --amount 14.99 --currency GBP --merchant namecheap.com --simulate"
scene3_output.append("> decision: approved")
scene3_output.append("> policy_matched: trusted_merchant_under_limit")
scene3_output.append("> transaction_reference: actonce_txn_abc123")
frames.extend(hold_frame(scene3_output, 15))

# Scene 4: Real check (approved)
scene4 = scene3_output.copy()
scene4.append("")
scene4.append("# Now for real...")
scene4.append("$ actonce-spend check --amount 14.99 --currency GBP --merchant namecheap.com")
frames.extend(type_text(scene4, len(scene4) - 1, "actonce-spend check --amount 14.99 --currency GBP --merchant namecheap.com"))

scene4_output = scene4.copy()
scene4_output[-1] = "$ actonce-spend check --amount 14.99 --currency GBP --merchant namecheap.com"
scene4_output.append("> decision: approved")
scene4_output.append("> approved_by: auto")
scene4_output.append("> transaction_reference: actonce_txn_xyz789")
frames.extend(hold_frame(scene4_output, 15))

# Scene 5: Check over threshold (requires approval)
scene5 = scene4_output.copy()
scene5.append("")
scene5.append("# What happens over the limit?")
scene5.append("$ actonce-spend check --amount 149.99 --currency GBP --merchant aws.amazon.com --reason 'EC2 instance'")
frames.extend(type_text(scene5, len(scene5) - 1, "actonce-spend check --amount 149.99 --currency GBP --merchant aws.amazon.com --reason 'EC2 instance'"))

scene5_output = scene5.copy()
scene5_output[-1] = "$ actonce-spend check --amount 149.99 --currency GBP --merchant aws.amazon.com --reason 'EC2 instance'"
scene5_output.append("> decision: requires_approval")
scene5_output.append("> policy_reason: Amount exceeds auto-approval limit")
scene5_output.append("> transaction_reference: actonce_txn_pending456")
frames.extend(hold_frame(scene5_output, 15))

# Scene 6: Check pending
scene6 = scene5_output.copy()
scene6.append("")
scene6.append("$ actonce-spend pending")
frames.extend(type_text(scene6, len(scene6) - 1, "actonce-spend pending"))

scene6_output = scene6.copy()
scene6_output[-1] = "$ actonce-spend pending"
scene6_output.append("> REFERENCE              AMOUNT   MERCHANT        REASON")
scene6_output.append("> actonce_txn_pending456  £149.99  aws.amazon.com  EC2 instance")
frames.extend(hold_frame(scene6_output, 15))

# Scene 7: Logs
scene7 = scene6_output.copy()
scene7.append("")
scene7.append("$ actonce-spend logs --last 3")
frames.extend(type_text(scene7, len(scene7) - 1, "actonce-spend logs --last 3"))

scene7_output = scene7.copy()
scene7_output[-1] = "$ actonce-spend logs --last 3"
scene7_output.append("> [2026-05-01T10:00:01Z] APPROVED  £14.99   namecheap.com  auto")
scene7_output.append("> [2026-05-01T10:00:15Z] PENDING  £149.99  aws.amazon.com  —")
frames.extend(hold_frame(scene7_output, 20))

# Scene 8: CTA
scene8 = [
    "# Every decision logged. Every spend controlled. Every agent trusted.",
    "",
    "# npm install -g @actonce/spend-gateway",
    "# github.com/PerryTheImp/actonce-spend-gateway",
]
frames.extend(hold_frame(scene8, 20))

# Save GIF
output_path = "actonce-spend-demo.gif"
print(f"Generating {len(frames)} frames...")
frames[0].save(
    output_path,
    save_all=True,
    append_images=frames[1:],
    duration=100,  # 100ms per frame
    loop=0
)
print(f"Saved to {output_path}")
print(f"File size: {os.path.getsize(output_path) / 1024:.1f} KB")
