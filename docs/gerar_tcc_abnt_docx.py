from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import unicodedata
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "TCC_OMNIMARKET_ABNT.md"
OUTPUT = ROOT / "TCC_OmniMarket_Revisado_ABNT.docx"

BODY_INDENT = 709
BODY_SPACING = 360


def normalize_label(value: str) -> str:
    return "".join(
        ch for ch in unicodedata.normalize("NFD", value.upper())
        if unicodedata.category(ch) != "Mn"
    )


def paragraph(text: str, style: str = "Body") -> str:
    safe = escape(text)
    preserve = ' xml:space="preserve"' if text.startswith(" ") or text.endswith(" ") else ""
    return (
        f'<w:p><w:pPr><w:pStyle w:val="{style}"/></w:pPr>'
        f'<w:r><w:t{preserve}>{safe}</w:t></w:r></w:p>'
    )


def empty_paragraph() -> str:
    return "<w:p/>"


def page_break() -> str:
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


def section_break_main() -> str:
    return (
        '<w:p><w:pPr><w:sectPr>'
        '<w:type w:val="nextPage"/>'
        '<w:pgSz w:w="11906" w:h="16838"/>'
        '<w:pgMar w:top="1701" w:right="1134" w:bottom="1134" w:left="1701" w:header="708" w:footer="708" w:gutter="0"/>'
        '</w:sectPr></w:pPr></w:p>'
    )


def toc_paragraph() -> str:
    return (
        '<w:p><w:pPr><w:pStyle w:val="BodyNoIndent"/></w:pPr>'
        '<w:r><w:fldChar w:fldCharType="begin"/></w:r>'
        '<w:r><w:instrText xml:space="preserve"> TOC \\o "1-3" \\h \\z \\u </w:instrText></w:r>'
        '<w:r><w:fldChar w:fldCharType="separate"/></w:r>'
        '<w:r><w:t>Atualize o sumário no Word após abrir o arquivo.</w:t></w:r>'
        '<w:r><w:fldChar w:fldCharType="end"/></w:r>'
        "</w:p>"
    )


def heading_style(line: str) -> str:
    centered_titles = {
        "RESUMO",
        "PALAVRAS-CHAVE",
        "ABSTRACT",
        "KEYWORDS",
        "SUMARIO",
        "REFERENCIAS",
        "ANEXOS",
    }
    if normalize_label(line) in centered_titles:
        return "HeadingCentered"
    return "Heading1"


def table_xml(rows: list[list[str]]) -> str:
    normalized = [[escape(cell.strip()) for cell in row] for row in rows]
    row_xml: list[str] = []

    for row_index, row in enumerate(normalized):
        cell_xml: list[str] = []
        for cell in row:
            style = "TableHeader" if row_index == 0 else "TableCell"
            cell_xml.append(
                "<w:tc>"
                "<w:tcPr>"
                '<w:tcW w:w="4500" w:type="dxa"/>'
                "</w:tcPr>"
                f'<w:p><w:pPr><w:pStyle w:val="{style}"/></w:pPr><w:r><w:t>{cell}</w:t></w:r></w:p>'
                "</w:tc>"
            )
        row_xml.append("<w:tr>" + "".join(cell_xml) + "</w:tr>")

    return (
        "<w:tbl>"
        "<w:tblPr>"
        '<w:tblW w:w="0" w:type="auto"/>'
        "<w:tblBorders>"
        '<w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/>'
        '<w:left w:val="single" w:sz="8" w:space="0" w:color="000000"/>'
        '<w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>'
        '<w:right w:val="single" w:sz="8" w:space="0" w:color="000000"/>'
        '<w:insideH w:val="single" w:sz="8" w:space="0" w:color="000000"/>'
        '<w:insideV w:val="single" w:sz="8" w:space="0" w:color="000000"/>'
        "</w:tblBorders>"
        "</w:tblPr>"
        + "".join(row_xml)
        + "</w:tbl>"
    )


def build_document_body(lines: list[str]) -> str:
    parts: list[str] = []
    i = 0
    in_references = False

    while i < len(lines):
        line = lines[i].rstrip("\n")

        if not line.strip():
            parts.append(empty_paragraph())
            i += 1
            continue

        if line == "{{PAGE_BREAK}}":
            parts.append(page_break())
            i += 1
            continue

        if line == "{{SECTION_MAIN}}":
            parts.append(section_break_main())
            i += 1
            continue

        if line == "{{TOC}}":
            parts.append(toc_paragraph())
            i += 1
            continue

        if line.startswith("{{SPACER:") and line.endswith("}}"):
            count = int(line.removeprefix("{{SPACER:").removesuffix("}}"))
            parts.extend(empty_paragraph() for _ in range(max(count, 0)))
            i += 1
            continue

        if line.startswith("{{CENTER}}"):
            parts.append(paragraph(line.removeprefix("{{CENTER}}").strip(), "Centered"))
            i += 1
            continue

        if line.startswith("{{RIGHT}}"):
            parts.append(paragraph(line.removeprefix("{{RIGHT}}").strip(), "RightBlock"))
            i += 1
            continue

        if line.startswith("# "):
            title = line[2:].strip()
            in_references = normalize_label(title) == "REFERENCIAS"
            parts.append(paragraph(title, heading_style(title)))
            i += 1
            continue

        if line.startswith("## "):
            parts.append(paragraph(line[3:].strip(), "Heading2"))
            i += 1
            continue

        if line.startswith("### "):
            parts.append(paragraph(line[4:].strip(), "Heading3"))
            i += 1
            continue

        if line.startswith("- "):
            parts.append(paragraph("• " + line[2:].strip(), "ListBullet"))
            i += 1
            continue

        if line.startswith("|"):
            table_lines: list[str] = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i].strip())
                i += 1

            rows: list[list[str]] = []
            for table_line in table_lines:
                cells = [cell.strip() for cell in table_line.strip().strip("|").split("|")]
                if all(set(cell) <= {"-", ":", " "} for cell in cells):
                    continue
                rows.append(cells)

            if rows:
                parts.append(table_xml(rows))
                parts.append(empty_paragraph())
            continue

        if line.startswith("Palavras-chave:") or line.startswith("Keywords:"):
            parts.append(paragraph(line, "BodyNoIndent"))
            i += 1
            continue

        parts.append(paragraph(line, "ReferenceEntry" if in_references else "Body"))
        i += 1

    return "\n".join(parts)


def build_styles() -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
        <w:lang w:val="pt-BR"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="{BODY_SPACING}" w:lineRule="auto" w:after="0"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>

  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Body">
    <w:name w:val="Body"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:jc w:val="both"/>
      <w:spacing w:line="{BODY_SPACING}" w:lineRule="auto" w:after="0"/>
      <w:ind w:firstLine="{BODY_INDENT}"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="BodyNoIndent">
    <w:name w:val="BodyNoIndent"/>
    <w:basedOn w:val="Body"/>
    <w:pPr>
      <w:jc w:val="both"/>
      <w:spacing w:line="{BODY_SPACING}" w:lineRule="auto" w:after="0"/>
      <w:ind w:firstLine="0"/>
    </w:pPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="ReferenceEntry">
    <w:name w:val="ReferenceEntry"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:jc w:val="left"/>
      <w:spacing w:line="240" w:lineRule="auto" w:after="120"/>
      <w:ind w:firstLine="0"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Centered">
    <w:name w:val="Centered"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:line="{BODY_SPACING}" w:lineRule="auto" w:after="0"/>
      <w:ind w:firstLine="0"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="RightBlock">
    <w:name w:val="RightBlock"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:jc w:val="right"/>
      <w:spacing w:line="{BODY_SPACING}" w:lineRule="auto" w:after="0"/>
      <w:ind w:left="3402" w:firstLine="0"/>
    </w:pPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="ListBullet">
    <w:name w:val="ListBullet"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:jc w:val="both"/>
      <w:spacing w:line="{BODY_SPACING}" w:lineRule="auto" w:after="0"/>
      <w:ind w:left="720" w:hanging="360"/>
    </w:pPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Body"/>
    <w:qFormat/>
    <w:pPr>
      <w:jc w:val="left"/>
      <w:spacing w:before="240" w:after="120" w:line="{BODY_SPACING}" w:lineRule="auto"/>
      <w:ind w:firstLine="0"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="HeadingCentered">
    <w:name w:val="HeadingCentered"/>
    <w:basedOn w:val="Heading1"/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="240" w:after="120" w:line="{BODY_SPACING}" w:lineRule="auto"/>
      <w:ind w:firstLine="0"/>
    </w:pPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Body"/>
    <w:qFormat/>
    <w:pPr>
      <w:jc w:val="left"/>
      <w:spacing w:before="180" w:after="80" w:line="{BODY_SPACING}" w:lineRule="auto"/>
      <w:ind w:firstLine="0"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Body"/>
    <w:qFormat/>
    <w:pPr>
      <w:jc w:val="left"/>
      <w:spacing w:before="120" w:after="40" w:line="{BODY_SPACING}" w:lineRule="auto"/>
      <w:ind w:firstLine="0"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:i/>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="TableHeader">
    <w:name w:val="TableHeader"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:line="240" w:lineRule="auto" w:after="0"/>
      <w:ind w:firstLine="0"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="22"/>
      <w:szCs w:val="22"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="TableCell">
    <w:name w:val="TableCell"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr>
      <w:jc w:val="left"/>
      <w:spacing w:line="240" w:lineRule="auto" w:after="0"/>
      <w:ind w:firstLine="0"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="22"/>
      <w:szCs w:val="22"/>
    </w:rPr>
  </w:style>
</w:styles>
"""


def build_document_xml(body_xml: str) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
    xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
    xmlns:v="urn:schemas-microsoft-com:vml"
    xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
    xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
    xmlns:w10="urn:schemas-microsoft-com:office:word"
    xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
    xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
    xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
    xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
    xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
    mc:Ignorable="w14 wp14">
  <w:body>
{body_xml}
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId1"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1701" w:right="1134" w:bottom="1134" w:left="1701" w:header="708" w:footer="708" w:gutter="0"/>
      <w:pgNumType w:start="1"/>
    </w:sectPr>
  </w:body>
</w:document>
"""


def build_content_types() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
"""


def build_root_rels() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"""


def build_document_rels() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
</Relationships>
"""


def build_core_props() -> str:
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:dcterms="http://purl.org/dc/terms/"
    xmlns:dcmitype="http://purl.org/dc/dcmitype/"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>TCC OmniMarket Revisado ABNT</dc:title>
  <dc:subject>Trabalho de Conclusão de Curso</dc:subject>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>
</cp:coreProperties>
"""


def build_app_props() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
    xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Office Word</Application>
</Properties>
"""


def build_header() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:jc w:val="right"/>
    </w:pPr>
    <w:r><w:fldChar w:fldCharType="begin"/></w:r>
    <w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
    <w:r><w:fldChar w:fldCharType="separate"/></w:r>
    <w:r><w:t>1</w:t></w:r>
    <w:r><w:fldChar w:fldCharType="end"/></w:r>
  </w:p>
</w:hdr>
"""


def main() -> None:
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    body_xml = build_document_body(lines)
    document_xml = build_document_xml(body_xml)

    with ZipFile(OUTPUT, "w", compression=ZIP_DEFLATED) as docx:
        docx.writestr("[Content_Types].xml", build_content_types())
        docx.writestr("_rels/.rels", build_root_rels())
        docx.writestr("docProps/core.xml", build_core_props())
        docx.writestr("docProps/app.xml", build_app_props())
        docx.writestr("word/document.xml", document_xml)
        docx.writestr("word/styles.xml", build_styles())
        docx.writestr("word/_rels/document.xml.rels", build_document_rels())
        docx.writestr("word/header1.xml", build_header())

    print(OUTPUT)


if __name__ == "__main__":
    main()
