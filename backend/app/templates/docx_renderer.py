from __future__ import annotations

import re
from copy import deepcopy
from io import BytesIO
from pathlib import Path
from typing import Any
from zipfile import ZIP_DEFLATED, ZipFile

from fastapi import HTTPException, status


PROJECT_ROOT = Path(__file__).resolve().parents[3]
TEMPLATE_DIR = PROJECT_ROOT / "frontend" / "public" / "assets" / "files"

TEMPLATE_ALIASES = {
    "template_nfe": "autocar_nfe.docx",
    "template_orcamento": "autocar_orcamento.docx",
    "template_relatorio": "autocar_relatorio.docx",
    "autocar_nfe": "autocar_nfe.docx",
    "autocar_orcamento": "autocar_orcamento.docx",
    "autocar_relatorio": "autocar_relatorio.docx",
}


class DocxTemplateError(ValueError):
    pass


def render_template(template_name: str, payload: dict[str, Any]) -> BytesIO:
    template_path = _resolve_template_path(template_name)
    try:
        with ZipFile(template_path, "r") as source_docx:
            output_buffer = BytesIO()
            with ZipFile(output_buffer, "w", ZIP_DEFLATED) as rendered_docx:
                for item in source_docx.infolist():
                    file_bytes = source_docx.read(item.filename)
                    if item.filename.endswith(".xml"):
                        xml = file_bytes.decode("utf-8")
                        xml = _render_xml(xml, payload)
                        rendered_docx.writestr(item, xml.encode("utf-8"))
                    else:
                        rendered_docx.writestr(item, file_bytes)

            output_buffer.seek(0)
            return output_buffer
    except DocxTemplateError:
        raise
    except Exception as exc:  # pragma: no cover - defensive guard for corrupted templates.
        raise DocxTemplateError(f"Falha ao renderizar template {template_name}: {exc}") from exc


def _resolve_template_path(template_name: str) -> Path:
    normalized = template_name.removesuffix(".docx")
    filename = TEMPLATE_ALIASES.get(normalized, f"{normalized}.docx")
    template_path = TEMPLATE_DIR / filename
    if not template_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template {filename} nao encontrado.",
        )
    return template_path


def _render_xml(xml: str, payload: dict[str, Any]) -> str:
    flattened_xml = _join_placeholder_runs(xml)
    rendered = _render_loops(flattened_xml, payload)
    return _replace_placeholders(rendered, payload)


def _join_placeholder_runs(xml: str) -> str:
    # Word often splits text across runs. This collapses tags only inside template
    # placeholders so `{cliente` + XML tags + `_nome}` can still be replaced.
    pattern = re.compile(r"\{[#/]?[A-Za-z0-9_]+(?:<[^>]+>[A-Za-z0-9_]*)*\}")

    def clean_match(match: re.Match[str]) -> str:
        return re.sub(r"<[^>]+>", "", match.group(0))

    previous = None
    current = xml
    while previous != current:
        previous = current
        current = pattern.sub(clean_match, current)
    return current


def _render_loops(xml: str, payload: dict[str, Any]) -> str:
    loop_pattern = re.compile(r"\{#(?P<name>[A-Za-z0-9_]+)\}(?P<body>.*?)\{/(?P=name)\}", re.DOTALL)

    def render_loop(match: re.Match[str]) -> str:
        name = match.group("name")
        body = match.group("body")
        items = payload.get(name, [])
        if not isinstance(items, list):
            raise DocxTemplateError(f"Placeholder de loop '{name}' precisa ser uma lista.")

        rendered_items: list[str] = []
        for item in items:
            item_payload = {**payload, **(item if isinstance(item, dict) else {})}
            rendered_items.append(_replace_placeholders(deepcopy(body), item_payload))
        return "".join(rendered_items)

    previous = None
    current = xml
    while previous != current:
        previous = current
        current = loop_pattern.sub(render_loop, current)
    return current


def _replace_placeholders(xml: str, payload: dict[str, Any]) -> str:
    field_pattern = re.compile(r"\{(?P<name>[A-Za-z0-9_]+)\}")

    def replace_field(match: re.Match[str]) -> str:
        value = payload.get(match.group("name"), "")
        return _escape_xml(str(value))

    return field_pattern.sub(replace_field, xml)


def _escape_xml(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
