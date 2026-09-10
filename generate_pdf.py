import os
import re
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Preformatted
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0B3C74"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(40, A4[1] - 30, "NAGAR DRISHTI (नगर दृष्टि) — Official Technical Documentation")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawRightString(A4[0] - 40, A4[1] - 30, "MoHUA / Smart Cities AI Fleet")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(40, A4[1] - 34, A4[0] - 40, A4[1] - 34)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(40, 42, A4[0] - 40, 42)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(40, 30, "Confidential & Proprietary • Smart India Hackathon (SIH 26124)")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(A4[0] - 40, 30, page_text)
        self.restoreState()


def clean_markdown_text(text):
    """Clean markdown formatting for ReportLab XML parser."""
    # Convert all variations of <br> to self-closing <br/>
    text = re.sub(r'<br\s*/?>', '<br/>', text, flags=re.IGNORECASE)
    # Convert bold **text** to <b>text</b>
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    # Convert italic *text* to <i>text</i>
    text = re.sub(r'(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)', r'<i>\1</i>', text)
    # Convert code `code` to <font name="Courier" color="#0B3C74"><b>code</b></font>
    text = re.sub(r'`(.*?)`', r'<font name="Courier" color="#0B3C74"><b>\1</b></font>', text)
    # Remove markdown links [text](url) -> text
    text = re.sub(r'\[(.*?)\]\((.*?)\)', r'<b>\1</b>', text)
    # Clean up math symbols
    text = text.replace(r'\to', '→').replace(r'\Delta', 'Δ')
    text = re.sub(r'\$(.*?)\$', r'<i>\1</i>', text)
    # Escape ampersands if not part of an XML entity
    text = re.sub(r'&(?!(?:amp|lt|gt|quot|apos);)', '&amp;', text)
    return text


def build_pdf_from_readme(readme_path, output_pdf_path):
    print(f"Reading from {readme_path}...")
    with open(readme_path, 'r', encoding='utf-8') as f:
        content = f.read()

    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=48,
        bottomMargin=52
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette Styles
    navy = colors.HexColor("#0B3C74")
    slate_dark = colors.HexColor("#0F172A")
    slate_text = colors.HexColor("#334155")
    emerald = colors.HexColor("#047857")
    bg_code = colors.HexColor("#F1F5F9")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=navy,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=emerald,
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=navy,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=slate_text,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=13,
        textColor=slate_text,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        fontName='Courier',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=8
    )

    th_style = ParagraphStyle(
        'TH_Style',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=colors.white
    )

    td_style = ParagraphStyle(
        'TD_Style',
        fontName='Helvetica',
        fontSize=7.5,
        leading=10.5,
        textColor=slate_text
    )

    story = []
    lines = content.split('\n')
    i = 0
    in_code_block = False
    code_lines = []
    in_table = False
    table_rows = []

    while i < len(lines):
        line = lines[i]

        # Check for code block toggle
        if line.strip().startswith('```'):
            if in_code_block:
                # End of code block
                in_code_block = False
                code_text = "\n".join(code_lines)
                table_data = [[Preformatted(code_text, code_style)]]
                t = Table(table_data, colWidths=[A4[0] - 80])
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), bg_code),
                    ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('LEFTPADDING', (0, 0), (-1, -1), 8),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ]))
                story.append(t)
                story.append(Spacer(1, 6))
                code_lines = []
            else:
                # Start of code block
                in_code_block = True
                code_lines = []
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        # Check for tables
        if line.strip().startswith('|') and '|' in line[1:]:
            # Collect table lines
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                table_lines.append(lines[i].strip())
                i += 1
            
            # Process table
            parsed_rows = []
            is_header = True
            for t_line in table_lines:
                # Check if separator row
                if re.match(r'^\|[\s\-:|]+\|$', t_line):
                    is_header = False
                    continue
                cells = [c.strip() for c in t_line.split('|')[1:-1]]
                row_flowables = []
                for cell in cells:
                    # Clean <br> tags in cell
                    cell_text = cell.replace('<br>', '<br/>').replace('<br/>', '\n')
                    clean_cell = clean_markdown_text(cell)
                    if is_header:
                        row_flowables.append(Paragraph(clean_cell, th_style))
                    else:
                        row_flowables.append(Paragraph(clean_cell, td_style))
                parsed_rows.append(row_flowables)
                is_header = False

            if parsed_rows:
                num_cols = len(parsed_rows[0])
                available_width = A4[0] - 80
                
                # Dynamic column widths
                if num_cols == 2:
                    col_widths = [available_width * 0.3, available_width * 0.7]
                elif num_cols == 4:
                    col_widths = [available_width * 0.22, available_width * 0.38, available_width * 0.15, available_width * 0.25]
                elif num_cols == 5:
                    col_widths = [available_width * 0.2, available_width * 0.2, available_width * 0.2, available_width * 0.2, available_width * 0.2]
                else:
                    col_widths = [available_width / num_cols] * num_cols

                t = Table(parsed_rows, colWidths=col_widths, repeatRows=1)
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), navy),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                    ('LEFTPADDING', (0, 0), (-1, -1), 5),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ]))
                story.append(t)
                story.append(Spacer(1, 8))
            continue

        # Markdown Headers
        if line.startswith('# '):
            title_text = line[2:].strip()
            story.append(Paragraph(clean_markdown_text(title_text), title_style))
            i += 1
            continue

        if line.startswith('### *"') or line.startswith('### *"'):
            subtitle_text = line[3:].strip().replace('*', '').replace('"', '')
            story.append(Paragraph(f'"{clean_markdown_text(subtitle_text)}"', subtitle_style))
            i += 1
            continue

        if line.startswith('## '):
            h1_text = line[3:].strip()
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceBefore=10, spaceAfter=8))
            story.append(Paragraph(clean_markdown_text(h1_text), h1_style))
            i += 1
            continue

        if line.startswith('### '):
            h2_text = line[4:].strip()
            story.append(Paragraph(clean_markdown_text(h2_text), h2_style))
            i += 1
            continue

        # Badges line skip
        if '[![' in line or line.strip() == '---':
            i += 1
            continue

        # Bullet points
        if line.strip().startswith('- ') or line.strip().startswith('* '):
            bullet_text = "• " + clean_markdown_text(line.strip()[2:])
            story.append(Paragraph(bullet_text, bullet_style))
            i += 1
            continue

        # Numbered lists (1. 2. etc.)
        num_match = re.match(r'^\s*(\d+)\.\s+(.*)', line)
        if num_match:
            num_str = num_match.group(1)
            item_text = f"<b>{num_str}.</b> " + clean_markdown_text(num_match.group(2))
            story.append(Paragraph(item_text, bullet_style))
            i += 1
            continue

        # Regular non-empty paragraphs
        trimmed = line.strip()
        if trimmed:
            story.append(Paragraph(clean_markdown_text(trimmed), body_style))
        else:
            story.append(Spacer(1, 4))

        i += 1

    print("Building PDF document...")
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {output_pdf_path}")

if __name__ == "__main__":
    readme = r"d:\My Coding Project\Nagar Dristhi\README.md"
    output_pdf = r"d:\My Coding Project\Nagar Dristhi\NAGAR_DRISHTI_DOCUMENTATION.pdf"
    build_pdf_from_readme(readme, output_pdf)
