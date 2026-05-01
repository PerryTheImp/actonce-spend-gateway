#!/usr/bin/env python3
"""
Generate an animated GIF demo of ActOnce Spend Gateway CLI.
Requires: python3, pip3 install pillow
Each scene clears the screen so all content is visible.
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
    font_paths = [
        "/System/Library/Fonts/Monaco.dfont",
        "/System/Library/Fonts/Menlo.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            return ImageFont.truetype(path, FONT_SIZE)
    return ImageFont.load_default()

def draw_frame(lines, cursor_line=None, cursor_col=None):
    img = Image.new('RGB', (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    font = get_font()
    
    y = MARGIN_TOP
    for i, line in enumerate(lines):
        x = MARGIN_LEFT
        
        if line.startswith("$"):
            draw.text((x, y), "$", font=font, fill=PROMPT_COLOR)
            x += draw.textlength("$ ", font=font)
            draw.text((x, y), line[2:], font=font, fill=FG_COLOR)
        elif line.startswith("#"):
            draw.text((x, y), line, font=font, fill=COMMENT_COLOR)
        elif line.startswith(">"):
            x += 20
            draw.text((x, y), line[2:], font=font, fill=ACCENT_COLOR)
        else:
            draw.text((x, y), line, font=font, fill=FG_COLOR)
        
        y += LINE_HEIGHT
    
    if cursor_line is not None and cursor_col is not None:
        cursor_y = MARGIN_TOP + cursor_line * LINE_HEIGHT
        cursor_x = MARGIN_LEFT + cursor_col * (FONT_SIZE * 0.6)
        draw.rectangle([cursor_x, cursor_y, cursor_x + 10, cursor_y + LINE_HEIGHT - 4], fill=FG_COLOR)
    
    return img

def type_text(lines, target_line, text, delay=3):
    frames = []
    for i in range(len(text) + 1):
        new_lines = lines.copy()
        new_lines[target_line] = f"$ {text[:i]}"
        frames.append(draw_frame(new_lines, cursor_line=target_line, cursor_col=i + 2))
        frames.extend([frames[-1]] * delay)
    return frames

def hold_frame(lines, duration=10):
    frame = draw_frame(lines)
    return [frame] * duration

frames = []

# === SCENE 1: Title ===
scene1 = [
    "# ActOnce Spend Gateway — 30 Second Demo",
    "",
    "# Install: npm install -g @actonce/spend-gateway",
    "# GitHub:  github.com/PerryTheImp/actonce-spend-gateway",
]
frames.extend(hold_frame(scene1, 20))

# === SCENE 2: Init ===
scene2 = [
    "# ActOnce Spend Gateway — 30 Second Demo",
    "",
    "$ actonce-spend init",
]
frames.extend(type_text(scene2, 2, "actonce-spend init"))

scene2_out = [
    "# ActOnce Spend Gateway — 30 Second Demo",
    "",
    "$ actonce-spend init",
    "> Created actonce-policy.yaml",
    "> Created data/ directory",
    "> Created logs/ directory",
]
frames.extend(hold_frame(scene2_out, 12))

# === SCENE 3: Simulate check ===
scene3 = [
    "# Test a spend with dry-run...",
    "",
    "$ actonce-spend check --amount 14.99 --currency GBP --merchant namecheap.com --simulate",
]
frames.extend(type_text(scene3, 2, "actonce-spend check --amount 14.99 --currency GBP --merchant namecheap.com --simulate"))

scene3_out = [
    "# Test a spend with dry-run...",
    "",
    "$ actonce-spend check --amount 14.99 --currency GBP --merchant namecheap.com --simulate",
    "> decision: approved",
    "> policy_matched: trusted_merchant_under_limit",
    "> transaction_reference: actonce_txn_abc123",
]
frames.extend(hold_frame(scene3_out, 12))

# === SCENE 4: Real check (approved) ===
scene4 = [
    "# Now for real...",
    "",
    "$ actonce-spend check --amount 14.99 --currency GBP --merchant namecheap.com",
]
frames.extend(type_text(scene4, 2, "actonce-spend check --amount 14.99 --currency GBP --merchant namecheap.com"))

scene4_out = [
    "# Now for real...",
    "",
    "$ actonce-spend check --amount 14.99 --currency GBP --merchant namecheap.com",
    "> decision: approved",
    "> approved_by: auto",
    "> transaction_reference: actonce_txn_xyz789",
]
frames.extend(hold_frame(scene4_out, 12))

# === SCENE 5: Over threshold ===
scene5 = [
    "# What happens over the limit?",
    "",
    "$ actonce-spend check --amount 149.99 --currency GBP --merchant aws.amazon.com --reason 'EC2 instance'",
]
frames.extend(type_text(scene5, 2, "actonce-spend check --amount 149.99 --currency GBP --merchant aws.amazon.com --reason 'EC2 instance'"))

scene5_out = [
    "# What happens over the limit?",
    "",
    "$ actonce-spend check --amount 149.99 --currency GBP --merchant aws.amazon.com --reason 'EC2 instance'",
    "> decision: requires_approval",
    "> policy_reason: Amount exceeds auto-approval limit",
    "> transaction_reference: actonce_txn_pending456",
]
frames.extend(hold_frame(scene5_out, 12))

# === SCENE 6: Pending ===
scene6 = [
    "# See queued approvals...",
    "",
    "$ actonce-spend pending",
]
frames.extend(type_text(scene6, 2, "actonce-spend pending"))

scene6_out = [
    "# See queued approvals...",
    "",
    "$ actonce-spend pending",
    "> REFERENCE               AMOUNT    MERCHANT         REASON",
    "> actonce_txn_pending456  £149.99   aws.amazon.com   EC2 instance",
]
frames.extend(hold_frame(scene6_out, 12))

# === SCENE 7: Logs ===
scene7 = [
    "# Full audit trail...",
    "",
    "$ actonce-spend logs --last 3",
]
frames.extend(type_text(scene7, 2, "actonce-spend logs --last 3"))

scene7_out = [
    "# Full audit trail...",
    "",
    "$ actonce-spend logs --last 3",
    "> [10:00:01Z] APPROVED  £14.99   namecheap.com   auto",
    "> [10:00:15Z] PENDING   £149.99  aws.amazon.com  —",
    "> [10:00:16Z] APPROVED  £149.99  aws.amazon.com  perry (manual)",
]
frames.extend(hold_frame(scene7_out, 15))

# === SCENE 8: CTA ===
scene8 = [
    "# Every decision logged. Every spend controlled. Every agent trusted.",
    "",
    "# npm install -g @actonce/spend-gateway",
    "# github.com/PerryTheImp/actonce-spend-gateway",
]
frames.extend(hold_frame(scene8, 18))

# Save
output_path = "actonce-spend-demo.gif"
print(f"Generating {len(frames)} frames...")
frames[0].save(
    output_path,
    save_all=True,
    append_images=frames[1:],
    duration=100,
    loop=0
)
print(f"Saved to {output_path}")
print(f"File size: {os.path.getsize(output_path) / 1024:.1f} KB")
