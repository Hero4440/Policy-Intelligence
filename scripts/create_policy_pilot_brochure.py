from __future__ import annotations

from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "PolicyPilot_Infographic_Brochure.pdf"
LOGO = ROOT / "public" / "assets" / "policy-pilot-logo.png"
PRODUCT = ROOT / "public" / "assets" / "policy-pilot-image.png"

W, H = 2200, 1700
MARGIN = 110

BG = "#FAF9F6"
INK = "#17313A"
MUTED = "#5E7077"
TEAL = "#0A7EA4"
TEAL_DARK = "#075C72"
TEAL_SOFT = "#D9EFF4"
GREEN = "#2F8F62"
GREEN_SOFT = "#DCF3E7"
AMBER = "#C17D15"
AMBER_SOFT = "#F6E6CA"
RED = "#B84A4A"
RED_SOFT = "#F5DADA"
BLUE = "#315AA6"
BLUE_SOFT = "#DDE7FA"
CARD = "#FFFFFF"
LINE = "#D8E0E2"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


F = {
    "hero": font(100, True),
    "h1": font(68, True),
    "h2": font(44, True),
    "h3": font(32, True),
    "body": font(27),
    "body_bold": font(27, True),
    "small": font(21),
    "small_bold": font(21, True),
    "metric": font(72, True),
    "label": font(19, True),
}


def page() -> Image.Image:
    return Image.new("RGB", (W, H), BG)


def draw_soft_card(draw: ImageDraw.ImageDraw, box, radius=34, fill=CARD, outline=LINE):
    x1, y1, x2, y2 = box
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x1 + 10, y1 + 16, x2 + 10, y2 + 16), radius, fill=(18, 68, 80, 22))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    return shadow, (x1, y1, x2, y2, radius, fill, outline)


def paste_card(img: Image.Image, box, radius=34, fill=CARD, outline=LINE):
    shadow, args = draw_soft_card(ImageDraw.Draw(img), box, radius, fill, outline)
    img.paste(shadow, (0, 0), shadow)
    x1, y1, x2, y2, r, f, o = args
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((x1, y1, x2, y2), r, fill=f, outline=o, width=2)


def text(draw: ImageDraw.ImageDraw, xy, value, fnt, fill=INK, max_width=None, line_gap=8):
    x, y = xy
    if max_width is None:
        draw.text((x, y), value, font=fnt, fill=fill)
        bbox = draw.textbbox((x, y), value, font=fnt)
        return bbox[3]

    words = value.split()
    lines = []
    line = ""
    for word in words:
        probe = word if not line else f"{line} {word}"
        if draw.textlength(probe, font=fnt) <= max_width:
            line = probe
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)

    yy = y
    for line in lines:
        draw.text((x, yy), line, font=fnt, fill=fill)
        yy += fnt.size + line_gap
    return yy


def pill(draw, xy, label, fill, fg=INK, pad_x=24, pad_y=12):
    x, y = xy
    tw = draw.textlength(label, font=F["small_bold"])
    h = F["small_bold"].size + pad_y * 2
    draw.rounded_rectangle((x, y, x + tw + pad_x * 2, y + h), h // 2, fill=fill)
    draw.text((x + pad_x, y + pad_y - 1), label, font=F["small_bold"], fill=fg)
    return x + tw + pad_x * 2


def paste_fit(img: Image.Image, src_path: Path, box, radius=28):
    src = Image.open(src_path).convert("RGB")
    x1, y1, x2, y2 = box
    bw, bh = x2 - x1, y2 - y1
    src.thumbnail((bw, bh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (bw, bh), CARD)
    canvas.paste(src, ((bw - src.width) // 2, (bh - src.height) // 2))
    mask = Image.new("L", (bw, bh), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, bw, bh), radius, fill=255)
    img.paste(canvas, (x1, y1), mask)


def footer(draw, n):
    draw.line((MARGIN, H - 82, W - MARGIN, H - 82), fill=LINE, width=2)
    draw.text((MARGIN, H - 56), "PolicyPilot | policy intelligence for healthcare coverage decisions", font=F["small"], fill=MUTED)
    draw.text((W - MARGIN - 30, H - 56), str(n), font=F["small_bold"], fill=TEAL)


def draw_flow_node(draw, center, label, sub, color):
    x, y = center
    draw.ellipse((x - 42, y - 42, x + 42, y + 42), fill=color)
    draw.ellipse((x - 22, y - 22, x + 22, y + 22), outline=CARD, width=8)
    tw = draw.textlength(label, font=F["h3"])
    draw.text((x - tw / 2, y + 68), label, font=F["h3"], fill=INK)
    lines = wrap(sub, width=24)
    yy = y + 112
    for line in lines:
        tw = draw.textlength(line, font=F["small"])
        draw.text((x - tw / 2, yy), line, font=F["small"], fill=MUTED)
        yy += 27


def page_cover():
    img = page()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, W, 560), 0, fill="#EAF5F7")
    d.polygon([(1450, 0), (W, 0), (W, 760), (1780, 560)], fill="#CFE9EF")
    paste_fit(img, LOGO, (MARGIN, 110, 560, 500), radius=30)
    pill(d, (620, 132), "AI-powered coverage intelligence", TEAL_SOFT, TEAL_DARK)
    text(d, (620, 205), "PolicyPilot", F["hero"], TEAL_DARK)
    text(
        d,
        (620, 325),
        "Turn fragmented insurance policies into searchable, comparable, evidence-backed answers at the point of care.",
        F["h2"],
        INK,
        max_width=1180,
        line_gap=10,
    )
    paste_card(img, (MARGIN, 660, W - MARGIN, 1265), radius=38)
    paste_fit(img, PRODUCT, (160, 710, 1120, 1210), radius=28)
    x = 1220
    text(d, (x, 730), "From coverage confusion to confident next steps", F["h1"], INK, max_width=780)
    bullets = [
        ("Search", "Find drug coverage across payers in seconds."),
        ("Compare", "See prior authorization rules side by side."),
        ("Trace", "Ground every answer in source policy evidence."),
    ]
    yy = 940
    for title, body in bullets:
        d.rounded_rectangle((x, yy + 5, x + 36, yy + 41), 10, fill=TEAL)
        d.line((x + 9, yy + 24, x + 17, yy + 33, x + 30, yy + 12), fill=CARD, width=5)
        d.text((x + 58, yy), title, font=F["h3"], fill=INK)
        d.text((x + 58, yy + 42), body, font=F["body"], fill=MUTED)
        yy += 96
    for i, (metric, label, color) in enumerate([
        ("1-2h", "coverage work per provider per day", TEAL),
        ("10+", "demo payers and policy sources", GREEN),
        ("50+", "target payer expansion roadmap", BLUE),
    ]):
        bx = MARGIN + i * 650
        paste_card(img, (bx, 1350, bx + 590, 1540), radius=26, fill="#FFFFFF")
        d.text((bx + 35, 1382), metric, font=F["metric"], fill=color)
        text(d, (bx + 235, 1397), label, F["body"], MUTED, max_width=305, line_gap=5)
    footer(d, 1)
    return img


def page_problem_solution():
    img = page()
    d = ImageDraw.Draw(img)
    text(d, (MARGIN, 90), "The Coverage Bottleneck", F["h1"], INK)
    text(d, (MARGIN, 168), "PolicyPilot converts scattered payer documents into practical decisions providers can use while a patient is still in the room.", F["body"], MUTED, max_width=1500)
    cols = [
        ("Before", RED, RED_SOFT, [
            "Payer PDFs and formularies live in separate places",
            "Prior authorization criteria are written differently",
            "Policy changes are easy to miss",
            "AI answers are hard to trust without citations",
        ]),
        ("After PolicyPilot", TEAL, TEAL_SOFT, [
            "Unified search for drug coverage across payers",
            "Normalized criteria for side-by-side comparison",
            "Version tracking highlights what changed",
            "Responses link back to source policy evidence",
        ]),
    ]
    for i, (heading, color, soft, items) in enumerate(cols):
        x1 = MARGIN + i * 1000
        paste_card(img, (x1, 300, x1 + 910, 1135), radius=34)
        d.rounded_rectangle((x1, 300, x1 + 910, 410), 34, fill=soft)
        d.text((x1 + 44, 328), heading, font=F["h2"], fill=color)
        yy = 480
        for item in items:
            d.ellipse((x1 + 52, yy + 9, x1 + 78, yy + 35), fill=color)
            text(d, (x1 + 105, yy), item, F["body"], INK, max_width=700, line_gap=7)
            yy += 138
    paste_card(img, (MARGIN, 1210, W - MARGIN, 1515), radius=32, fill="#F7FBFC")
    text(d, (MARGIN + 50, 1258), "Human-centered", F["h2"], TEAL_DARK)
    text(d, (MARGIN + 50, 1312), "payoff", F["h2"], TEAL_DARK)
    payoff = [
        ("Faster answers", "Reduce lookup time during clinical conversations."),
        ("Lower risk", "Use current policies and visible evidence instead of stale PDFs."),
        ("Clearer action", "Show what is covered, what needs PA, and what evidence is missing."),
    ]
    for i, (title, body) in enumerate(payoff):
        x = MARGIN + 610 + i * 485
        d.rounded_rectangle((x, 1272, x + 420, 1458), 24, fill=CARD, outline=LINE, width=2)
        d.text((x + 30, 1302), title, font=F["h3"], fill=INK)
        text(d, (x + 30, 1350), body, F["small"], MUTED, max_width=345, line_gap=5)
    footer(d, 2)
    return img


def page_workflow():
    img = page()
    d = ImageDraw.Draw(img)
    text(d, (MARGIN, 90), "How It Works", F["h1"], INK)
    text(d, (MARGIN, 168), "A policy intelligence pipeline built for documents, structured rules, patient context, and grounded responses.", F["body"], MUTED, max_width=1500)
    y = 455
    xs = [310, 755, 1200, 1645, 1960]
    for a, b in zip(xs, xs[1:]):
        d.line((a + 75, y, b - 75, y), fill=TEAL, width=10)
        d.polygon([(b - 85, y - 25), (b - 85, y + 25), (b - 45, y)], fill=TEAL)
    nodes = [
        ("Ingest", "PDFs, formularies and patient files", TEAL),
        ("Normalize", "Drug, payer and criteria structure", BLUE),
        ("Analyze", "AI-assisted semantic policy queries", GREEN),
        ("Compare", "Cross-payer rules and version diffs", AMBER),
        ("Answer", "Traceable next steps for care teams", TEAL_DARK),
    ]
    for x, node in zip(xs, nodes):
        draw_flow_node(d, (x, y), *node)
    features = [
        ("Coverage Search", "Look up drug coverage across plans with visual coverage status."),
        ("Policy Chat", "Ask natural language questions about PA rules and eligibility."),
        ("Evidence Explorer", "Search source policy text to verify the exact basis for an answer."),
        ("Change Tracking", "Monitor policy versions and inspect what changed over time."),
        ("Patient Readiness", "Compare patient facts against authorization criteria."),
        ("Data Management", "Upload, parse and manage policy documents in one workspace."),
    ]
    for i, (title, body) in enumerate(features):
        col = i % 3
        row = i // 3
        x = MARGIN + col * 660
        yy = 930 + row * 250
        paste_card(img, (x, yy, x + 600, yy + 190), radius=24)
        d.rounded_rectangle((x + 30, yy + 34, x + 82, yy + 86), 16, fill=[TEAL_SOFT, BLUE_SOFT, GREEN_SOFT][col])
        d.text((x + 105, yy + 30), title, font=F["h3"], fill=INK)
        text(d, (x + 105, yy + 78), body, F["small"], MUTED, max_width=430, line_gap=4)
    footer(d, 3)
    return img


def page_stack():
    img = page()
    d = ImageDraw.Draw(img)
    text(d, (MARGIN, 90), "Built for Trust, Speed and Demo Impact", F["h1"], INK)
    text(d, (MARGIN, 168), "A modern full-stack prototype focused on usable healthcare policy intelligence rather than another static document repository.", F["body"], MUTED, max_width=1600)
    stack = [
        ("Frontend", "React, TypeScript, Vite, accessible cream-theme interface", TEAL_SOFT, TEAL_DARK),
        ("Backend", "Node.js, TypeScript, Express services and MCP tooling", BLUE_SOFT, BLUE),
        ("AI Layer", "Claude-powered policy Q&A, summarization and readiness reasoning", GREEN_SOFT, GREEN),
        ("Data", "Normalized JSON policies, file storage, version history and evidence links", AMBER_SOFT, AMBER),
    ]
    for i, (title, body, soft, color) in enumerate(stack):
        x = MARGIN + (i % 2) * 990
        y = 325 + (i // 2) * 280
        paste_card(img, (x, y, x + 900, y + 210), radius=28)
        d.rounded_rectangle((x + 34, y + 36, x + 118, y + 120), 22, fill=soft)
        d.text((x + 150, y + 36), title, font=F["h2"], fill=color)
        text(d, (x + 150, y + 95), body, F["body"], MUTED, max_width=660, line_gap=6)
    paste_card(img, (MARGIN, 965, W - MARGIN, 1370), radius=34, fill="#F7FBFC")
    text(d, (MARGIN + 50, 1015), "Why judges should care", F["h2"], TEAL_DARK)
    reasons = [
        "Relatable pain: providers waste time answering basic coverage questions.",
        "Practical workflow: search, compare, verify and act from one workspace.",
        "Trust layer: AI responses are grounded in source policy evidence.",
        "Scalable path: payer expansion, EHR integration and predictive denial insights.",
    ]
    yy = 1095
    for reason in reasons:
        d.rounded_rectangle((MARGIN + 55, yy + 4, MARGIN + 88, yy + 37), 10, fill=TEAL)
        d.line((MARGIN + 64, yy + 23, MARGIN + 74, yy + 33, MARGIN + 84, yy + 12), fill=CARD, width=5)
        text(d, (MARGIN + 115, yy), reason, F["body"], INK, max_width=1700)
        yy += 66
    d.rounded_rectangle((MARGIN, 1415, W - MARGIN, 1538), 28, fill=TEAL_DARK)
    text(d, (MARGIN + 48, 1450), "Bottom line: PolicyPilot makes coverage decisions actionable, accessible and evidence-backed.", F["h3"], CARD, max_width=1780)
    footer(d, 4)
    return img


def main():
    pages = [page_cover(), page_problem_solution(), page_workflow(), page_stack()]
    pages[0].save(OUT, save_all=True, append_images=pages[1:], resolution=200.0, quality=95)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
