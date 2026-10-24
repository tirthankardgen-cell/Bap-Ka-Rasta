"""Build the readable PDF and HTML editions of the game specification."""

from dataclasses import dataclass
from html import escape
from pathlib import Path
import json
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Flowable, Frame, KeepTogether, LongTable, PageBreak,
    PageTemplate, Paragraph, Preformatted, Spacer, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "Bap-ka-Rasta-Game-Plan.md"
PDF = ROOT / "output" / "pdf" / "Bap-ka-Rasta-Game-Plan.pdf"
HTML = ROOT / "output" / "Bap-ka-Rasta-Game-Plan.html"
QA = ROOT / "tmp" / "pdfs"
PAGE_W, PAGE_H = A4
MARGIN = 48
WIDTH = PAGE_W - MARGIN * 2
INK = colors.HexColor("#20262D")
TEAL = colors.HexColor("#146572")
LINE = colors.HexColor("#D9D9D9")
PALE = colors.HexColor("#F5F8FA")


@dataclass
class Block:
    kind: str
    value: object
    level: int = 0
    language: str = ""


def parse_markdown(text):
    lines = text.splitlines()
    blocks = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith("```"):
            language = line[3:].strip()
            code = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                code.append(lines[i])
                i += 1
            blocks.append(Block("code", "\n".join(code), language=language))
            i += 1
            continue
        heading = re.match(r"^(#{1,3})\s+(.+)$", line)
        if heading:
            blocks.append(Block("heading", heading.group(2), level=len(heading.group(1))))
            i += 1
            continue
        if line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                row = [cell.strip() for cell in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-+:?", cell) for cell in row):
                    rows.append(row)
                i += 1
            blocks.append(Block("table", rows))
            continue
        if re.match(r"^-\s+", line) or re.match(r"^\d+\.\s+", line):
            numbered = bool(re.match(r"^\d+\.\s+", line))
            pattern = r"^\d+\.\s+" if numbered else r"^-\s+"
            items = []
            while i < len(lines) and re.match(pattern, lines[i]):
                items.append(re.sub(pattern, "", lines[i]))
                i += 1
            blocks.append(Block("ordered" if numbered else "list", items))
            continue
        paragraph = [line]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r"^(#|\||```|-\s|\d+\.\s)", lines[i]):
            paragraph.append(lines[i])
            i += 1
        blocks.append(Block("paragraph", " ".join(part.strip() for part in paragraph)))
    return blocks


def register_fonts():
    font_dir = Path("C:/Windows/Fonts")
    for name, filename in [
        ("PlanSans", "segoeui.ttf"),
        ("PlanSansBold", "segoeuib.ttf"),
        ("PlanSansItalic", "segoeuii.ttf"),
        ("PlanMono", "consola.ttf"),
    ]:
        pdfmetrics.registerFont(TTFont(name, str(font_dir / filename)))
    pdfmetrics.registerFontFamily("PlanSans", normal="PlanSans", bold="PlanSansBold", italic="PlanSansItalic", boldItalic="PlanSansBold")


def inline(text):
    value = escape(str(text), quote=False)
    value = re.sub(r"`([^`]+)`", r'<font name="PlanMono" size="9">\1</font>', value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", value)
    return value


def styles():
    sheet = getSampleStyleSheet()
    sheet.add(ParagraphStyle("PlanTitle", fontName="PlanSansBold", fontSize=25, leading=30, textColor=colors.black, spaceAfter=12))
    sheet.add(ParagraphStyle("PlanBody", fontName="PlanSans", fontSize=10.3, leading=14.7, textColor=INK, spaceAfter=9, splitLongWords=True, allowWidows=0, allowOrphans=0))
    sheet.add(ParagraphStyle("PlanMeta", parent=sheet["PlanBody"], fontSize=9.4, leading=13.5, textColor=INK, spaceAfter=15))
    sheet.add(ParagraphStyle("PlanH1", fontName="PlanSansBold", fontSize=17.5, leading=22, textColor=colors.black, spaceBefore=18, spaceAfter=10, keepWithNext=True))
    sheet.add(ParagraphStyle("PlanH2", fontName="PlanSansBold", fontSize=12.3, leading=16, textColor=colors.black, spaceBefore=10, spaceAfter=7, keepWithNext=True))
    sheet.add(ParagraphStyle("PlanCell", fontName="PlanSans", fontSize=9, leading=12.5, textColor=INK, spaceAfter=0))
    sheet.add(ParagraphStyle("PlanCellHeader", parent=sheet["PlanCell"], fontName="PlanSansBold", textColor=colors.black))
    sheet.add(ParagraphStyle("PlanCode", fontName="PlanMono", fontSize=8.5, leading=11.4, textColor=INK, backColor=PALE, borderColor=LINE, borderWidth=0.5, borderPadding=9, spaceBefore=6, spaceAfter=14))
    sheet.add(ParagraphStyle("PlanBullet", parent=sheet["PlanBody"], leftIndent=13, firstLineIndent=-10, spaceAfter=6))
    sheet.add(ParagraphStyle("PlanReference", parent=sheet["PlanBody"], fontSize=9.6, leading=13.5, spaceAfter=10))
    sheet.add(ParagraphStyle("PlanCaption", parent=sheet["PlanBody"], fontSize=9, leading=12.5, textColor=INK, spaceBefore=4, spaceAfter=12))
    sheet.add(ParagraphStyle("PlanTOC", fontName="PlanSans", fontSize=10.5, leading=17, textColor=INK, leftIndent=0, firstLineIndent=0, spaceBefore=3))
    return sheet


def table_widths(headers):
    presets = {
        "Item": [130, WIDTH - 130],
        "Option": [98, 144, 177, WIDTH - 419],
        "Layer": [91, 137, WIDTH - 228],
        "City": [63, 91, 80, WIDTH - 234],
        "Vehicle": [72, 135, 69, 78, WIDTH - 354],
        "Model requirement": [133] + [(WIDTH - 133) / 5] * 5,
        "Action": [122, 146, WIDTH - 268],
        "Asset group": [112, 195, WIDTH - 307],
        "Payload": [165, 101, WIDTH - 266],
        "Preset": [49, 85, 80, 89, 79, WIDTH - 382],
        "Milestone": [94, 157, 92, WIDTH - 343],
        "Device or browser group": [183, WIDTH - 183],
        "Risk": [194, WIDTH - 194],
        "Element": [137, WIDTH - 137],
    }
    return presets.get(headers[0], [WIDTH / len(headers)] * len(headers))


def make_table(rows, sheet):
    count = len(rows[0])
    assert all(len(row) == count for row in rows), rows
    values = [
        [Paragraph(inline(cell), sheet["PlanCellHeader" if index == 0 else "PlanCell"]) for cell in row]
        for index, row in enumerate(rows)
    ]
    table = LongTable(values, colWidths=table_widths(rows[0]), repeatRows=1, hAlign="LEFT", spaceBefore=5, spaceAfter=14)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAF1F5")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFBFC")]),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


class Diagram(Flowable):
    def __init__(self, kind):
        super().__init__()
        self.kind = kind
        self.width = WIDTH
        self.height = 210 if kind == "journey" else 315

    def box(self, x, y, w, h, label, details=None):
        c = self.canv
        c.setFillColor(PALE)
        c.setStrokeColor(LINE)
        c.setLineWidth(0.7)
        c.roundRect(x, y, w, h, 7, fill=1, stroke=1)
        c.setFillColor(INK)
        c.setFont("PlanSansBold", 10)
        c.drawCentredString(x + w / 2, y + h / 2 + (4 if details else -3), label)
        if details:
            c.setFont("PlanSans", 8.8)
            c.drawCentredString(x + w / 2, y + h / 2 - 12, details)

    def arrow(self, x1, y1, x2, y2):
        import math
        c = self.canv
        c.setStrokeColor(TEAL)
        c.setFillColor(TEAL)
        c.setLineWidth(1)
        c.line(x1, y1, x2, y2)
        angle = math.atan2(y2 - y1, x2 - x1)
        length = 6
        path = c.beginPath()
        path.moveTo(x2, y2)
        path.lineTo(x2 - length * math.cos(angle - 0.45), y2 - length * math.sin(angle - 0.45))
        path.lineTo(x2 - length * math.cos(angle + 0.45), y2 - length * math.sin(angle + 0.45))
        path.close()
        c.drawPath(path, stroke=0, fill=1)

    def draw(self):
        c = self.canv
        if self.kind == "journey":
            gap = 18
            w = (WIDTH - gap * 3) / 4
            for i, (label, detail) in enumerate([
                ("Landing", "Mera Bap Ka Rasta"),
                ("Choose city", "Five locations"),
                ("Choose vehicle", "Five vehicles"),
                ("Load and drive", "Selected assets only"),
            ]):
                self.box(i * (w + gap), 140, w, 58, label, detail)
                if i < 3:
                    self.arrow(i * (w + gap) + w + 2, 169, (i + 1) * (w + gap) - 2, 169)
            self.box(0, 33, 151, 57, "Change selection", "Return to city or vehicle")
            self.box((WIDTH - 151) / 2, 33, 151, 57, "Results and replay", "Distance, laps, local best")
            self.box(WIDTH - 151, 33, 151, 57, "Pause and resume", "Reset, settings, end drive")
            self.arrow(WIDTH - w / 2, 137, WIDTH - 75, 93)
            self.arrow(WIDTH - 154, 61, (WIDTH + 151) / 2 + 3, 61)
            self.arrow((WIDTH - 151) / 2 - 3, 61, 154, 61)
            c.setFont("PlanSans", 8.8)
            c.setFillColor(INK)
            c.drawString(0, 11, "A failed asset load offers Retry or a return to the selection screen.")
        else:
            self.box(0, 260, WIDTH, 47, "Vercel static delivery", "HTML, CSS, JavaScript, models, textures, and audio")
            w = (WIDTH - 20) / 2
            self.box(0, 184, w, 51, "React UI and screen state", "Selectors, pause, settings, optional storage")
            self.box(w + 20, 184, w, 51, "Asset manager", "Selected content, progress, cancellation")
            self.arrow(WIDTH / 2 - 50, 257, w / 2, 238)
            self.arrow(WIDTH / 2 + 50, 257, w + 20 + w / 2, 238)
            self.box(132, 100, 235, 55, "Fixed-step game runtime", "Driving, traffic, collisions, and statistics")
            self.box(0, 105, 110, 45, "Input", "Keyboard and touch")
            self.arrow(113, 127, 129, 127)
            self.arrow(w / 2, 181, 173, 158)
            self.arrow(w + 20 + w / 2, 181, 326, 158)
            self.box(132, 11, 175, 57, "Three.js and camera", "Interpolated scene updates")
            self.box(327, 11, WIDTH - 327, 57, "Audio and HUD", "Sound graph and UI snapshots")
            self.arrow(220, 97, 220, 71)
            self.arrow(320, 97, 386, 71)


class PlanDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kwargs):
        super().__init__(filename, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=48, bottomMargin=51, **kwargs)
        frame = Frame(MARGIN, 51, WIDTH, PAGE_H - 99, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="body")
        self.addPageTemplates(PageTemplate(id="plan", frames=frame, onPage=self.decorate))
        self.heading_pages = []

    def beforeDocument(self):
        self.heading_pages = []

    def decorate(self, canvas, doc):
        canvas.saveState()
        canvas.setTitle("Bap ka Rasta Game Design and Architecture")
        canvas.setAuthor("Bap ka Rasta Project")
        canvas.setSubject("Researched product specification and architecture for a lightweight Indian 3D browser driving game")
        canvas.setFont("PlanSans", 8)
        canvas.setFillColor(INK)
        if doc.page > 1:
            canvas.drawString(MARGIN, PAGE_H - 29, "Bap ka Rasta Game Design and Architecture")
        canvas.drawString(MARGIN, 27, "Version 1 revision 1   |   24 October 2026")
        canvas.drawRightString(PAGE_W - MARGIN, 27, str(doc.page))
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and hasattr(flowable, "plan_key"):
            text = flowable.getPlainText()
            key = flowable.plan_key
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text, key, level=0, closed=False)
            self.heading_pages.append({"heading": text, "page": self.page})
            self.notify("TOCEntry", (0, text, self.page, key))


def source_paragraph(item, sheet):
    match = re.match(r"\*\*(S\d+ [^*]+)\*\* - (.+?) (https://\S+)\s*$", item)
    if not match:
        return Paragraph(inline(item), sheet["PlanBullet"])
    title, detail, url = match.groups()
    markup = f'<b>{escape(title)}</b><br/>{escape(detail)} <link href="{escape(url, quote=True)}" color="#146572">Open reference</link>'
    return Paragraph(markup, sheet["PlanReference"])


def build_pdf(blocks):
    register_fonts()
    sheet = styles()
    story = []
    toc_added = False
    meta = True
    for index, block in enumerate(blocks):
        if block.kind == "heading":
            if block.level == 1:
                story.append(Paragraph(inline(block.value), sheet["PlanTitle"]))
            elif block.level == 2:
                if str(block.value).startswith("2 ") and not toc_added:
                    story.append(PageBreak())
                    story.append(Paragraph("Contents", sheet["PlanH1"]))
                    toc = TableOfContents()
                    toc.levelStyles = [sheet["PlanTOC"]]
                    toc.dotsMinLevel = 0
                    story.append(toc)
                    story.append(PageBreak())
                    toc_added = True
                paragraph = Paragraph(inline(block.value), sheet["PlanH1"])
                paragraph.plan_key = f"section-{index}"
                story.append(paragraph)
                meta = False
            else:
                story.append(Paragraph(inline(block.value), sheet["PlanH2"]))
        elif block.kind == "paragraph":
            story.append(Paragraph(inline(block.value), sheet["PlanMeta" if meta else "PlanBody"]))
        elif block.kind == "table":
            table = make_table(block.value, sheet)
            story.append(KeepTogether([table]) if table.wrap(WIDTH, PAGE_H)[1] <= 320 else table)
        elif block.kind == "code":
            if block.language == "mermaid":
                kind = "journey" if "flowchart LR" in str(block.value) else "architecture"
                diagram_items = [Spacer(1, 6), Diagram(kind), Paragraph("Player flow" if kind == "journey" else "Application components and their responsibilities", sheet["PlanCaption"])]
                if story and isinstance(story[-1], Paragraph) and hasattr(story[-1], "plan_key"):
                    diagram_items.insert(0, story.pop())
                story.append(KeepTogether(diagram_items))
            else:
                story.append(KeepTogether([Preformatted(str(block.value), sheet["PlanCode"], maxLineLength=94)]))
        elif block.kind in {"list", "ordered"}:
            for number, item in enumerate(block.value, 1):
                if re.match(r"\*\*S\d+\s", item):
                    story.append(source_paragraph(item, sheet))
                else:
                    marker = f"{number}." if block.kind == "ordered" else "-"
                    story.append(Paragraph(f"{marker} {inline(item)}", sheet["PlanBullet"]))
    PDF.parent.mkdir(parents=True, exist_ok=True)
    document = PlanDocTemplate(str(PDF))
    document.multiBuild(story)
    return document.heading_pages


def html_inline(text):
    value = escape(str(text))
    value = re.sub(r"`([^`]+)`", r"<code>\1</code>", value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", value)
    return re.sub(r"(https://[^\s<]+)", r'<a href="\1">\1</a>', value)


def build_html(blocks):
    parts = []
    nav = []
    for i, block in enumerate(blocks):
        if block.kind == "heading":
            key = f"section-{i}"
            parts.append(f'<h{block.level} id="{key}">{html_inline(block.value)}</h{block.level}>')
            if block.level == 2:
                nav.append(f'<a href="#{key}">{escape(str(block.value))}</a>')
        elif block.kind == "paragraph":
            parts.append(f"<p>{html_inline(block.value)}</p>")
        elif block.kind == "table":
            rows = block.value
            parts.append('<div class="table-wrap"><table><thead><tr>' + "".join(f"<th>{html_inline(c)}</th>" for c in rows[0]) + "</tr></thead><tbody>")
            for row in rows[1:]:
                parts.append("<tr>" + "".join(f"<td>{html_inline(c)}</td>" for c in row) + "</tr>")
            parts.append("</tbody></table></div>")
        elif block.kind in {"list", "ordered"}:
            tag = "ol" if block.kind == "ordered" else "ul"
            parts.append(f"<{tag}>" + "".join(f"<li>{html_inline(item)}</li>" for item in block.value) + f"</{tag}>")
        elif block.kind == "code":
            if block.language == "mermaid":
                if "flowchart LR" in str(block.value):
                    parts.append('<div class="flow"><span>Landing</span><b>→</b><span>Choose city</span><b>→</b><span>Choose vehicle</span><b>→</b><span>Load and drive</span></div><p class="caption">Pause, resume, reset, replay, or return to selection. Failed downloads offer retry.</p>')
                else:
                    parts.append('<div class="architecture"><div>Vercel static delivery</div><div>React UI and screen state · Asset manager</div><div>Input → Fixed-step game runtime</div><div>Three.js scene and camera · Web Audio · HUD</div></div>')
            else:
                parts.append(f"<pre><code>{escape(str(block.value))}</code></pre>")
    css = """
    :root{color-scheme:light;--ink:#20262d;--muted:#52626b;--line:#d9d9d9;--accent:#146572}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#edf1f2;color:var(--ink);font:16px/1.68 'Segoe UI',system-ui,sans-serif}
    .layout{display:grid;grid-template-columns:260px minmax(0,950px);gap:28px;max-width:1260px;margin:30px auto;padding:0 24px}
    nav{position:sticky;top:24px;align-self:start;max-height:calc(100vh - 48px);overflow:auto;padding:8px 0}nav a{display:block;color:var(--muted);text-decoration:none;font-size:13px;padding:5px 10px;border-radius:5px}nav a:hover,nav a:focus{background:#fff;color:var(--accent)}
    main{background:white;padding:52px 56px;border:1px solid #e0e6e8;border-radius:12px;min-width:0}h1{font-size:36px;line-height:1.2;margin:0 0 18px;color:#000}h2{font-size:25px;line-height:1.28;color:#000;margin:44px 0 16px;scroll-margin-top:24px}h3{font-size:19px;color:#000;margin:26px 0 10px}p{margin:0 0 17px}li{margin:8px 0}a{color:var(--accent);overflow-wrap:anywhere}
    .table-wrap{overflow:auto;margin:22px 0}table{width:100%;border-collapse:collapse;font-size:14px;line-height:1.5}td,th{border:1px solid var(--line);text-align:left;vertical-align:middle;padding:11px 12px}th{background:#eaf1f5;color:#000}tbody tr:nth-child(even){background:#fafbfc}
    code{font:0.87em Consolas,monospace;background:#f5f8fa;padding:2px 4px;border-radius:3px}pre{background:#f5f8fa;border:1px solid var(--line);padding:18px;overflow:auto;line-height:1.55}pre code{padding:0;background:none;font-size:13px}
    .flow{display:flex;align-items:center;gap:10px;margin:25px 0 10px}.flow span,.architecture div{border:1px solid var(--line);background:#f5f8fa;border-radius:7px;padding:16px;text-align:center;font-weight:600}.flow span{flex:1;font-size:14px}.flow b{color:var(--accent)}.caption{font-size:13px;color:var(--muted)}.architecture{display:grid;gap:10px;margin:24px 0}.architecture div:not(:last-child)::after{content:'↓';display:block;color:var(--accent);font-size:22px;margin-bottom:-10px}
    @media(max-width:900px){.layout{display:block;margin:12px auto;padding:0 12px}nav{position:static;max-height:250px;margin-bottom:20px}main{padding:28px 22px}h1{font-size:29px}.flow{flex-wrap:wrap}.flow span{min-width:100px}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}@media print{body{background:white;font-size:11pt}.layout{display:block;margin:0;padding:0}nav{display:none}main{border:0;padding:0}h2,h3{break-after:avoid}tr,pre,.flow,.architecture{break-inside:avoid}a{color:inherit;text-decoration:none}}
    """
    HTML.parent.mkdir(parents=True, exist_ok=True)
    HTML.write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bap ka Rasta Game Design and Architecture</title><style>' + css + '</style></head><body><div class="layout"><nav aria-label="Document contents">' + "".join(nav) + '</nav><main>' + "\n".join(parts) + '</main></div></body></html>', encoding="utf-8")


def verify_content():
    from pypdf import PdfReader
    reader = PdfReader(str(PDF))
    extracted = re.sub(r"\s+", " ", "\n".join(page.extract_text() or "" for page in reader.pages))
    required = ["Mera Bap Ka Rasta", "Mumbai", "Delhi", "Kolkata", "Chennai", "Bangalore", "Thar", "Fortuner", "Scooty", "KTM", "Vercel", "Fixed-step", "25 city and vehicle", "S26"]
    missing = [value for value in required if value.lower() not in extracted.lower()]
    assert not missing, f"Missing required content: {missing}"
    assert len(reader.pages) >= 10, "Unexpectedly incomplete PDF"
    assert all((page.extract_text() or "").strip() for page in reader.pages), "Empty page"
    research = json.loads((ROOT / "docs" / "research" / "source-checks.json").read_text(encoding="utf-8"))
    assert len(research["sources"]) == 26
    assert all(row.get("status") == 200 and "error" not in row and row.get("evidence") for row in research["sources"]), "A primary reference remains unverified"
    return {"pages": len(reader.pages), "words": len(SOURCE.read_text(encoding="utf-8").split()), "pdf_bytes": PDF.stat().st_size, "references": len(research["sources"]), "links": sum(len(page.get("/Annots", [])) for page in reader.pages), "required_content": "present", "empty_pages": 0}


def main():
    text = SOURCE.read_text(encoding="utf-8")
    blocks = parse_markdown(text)
    heading_pages = build_pdf(blocks)
    build_html(blocks)
    result = verify_content()
    result["headings"] = heading_pages
    QA.mkdir(parents=True, exist_ok=True)
    (QA / "document-checks.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    print(f"PDF: {PDF}")
    print(f"HTML: {HTML}")


if __name__ == "__main__":
    main()
