"""
Read the knowledge-base documents in `knowledge_base/RAGInfo/documents/`.

Each file is Markdown with a small header, then sections:

    ---
    title: Symptoms of malaria
    topic: symptoms
    region: global
    status: draft
    ---

    ## What are the first symptoms of malaria?

    The most common early symptoms of malaria are ...

    Source: who-malaria, who-malaria-qa

One `## heading` plus the text under it is one passage the assistant can
retrieve. The final `Source:` line names the approved sources that say it, or
`PENDING` when no source has been confirmed yet.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from pathlib import Path

PENDING = "PENDING"

_HEADER = re.compile(r"\A---\s*\n(?P<header>.*?)\n---\s*\n", re.DOTALL)
_HEADER_FIELD = re.compile(r"^(?P<name>[a-z_]+):\s*(?P<value>.*)$")
_HEADING = re.compile(r"^##\s+(?P<heading>.+?)\s*$", re.MULTILINE)
_SOURCE_LINE = re.compile(r"^Source:\s*(?P<ids>.+?)\s*$", re.MULTILINE)
_SOURCE_ID = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class DocumentError(ValueError):
    """A knowledge document does not follow the format above."""


@dataclass(frozen=True)
class Section:
    # Stable identifier: "<file name>/<heading as a slug>".
    key: str
    document: str
    title: str
    topic: str
    region: str
    # "draft" until a health professional has reviewed the document.
    status: str
    heading: str
    body: str
    # Empty when the section is marked `Source: PENDING`.
    source_ids: tuple[str, ...]

    @property
    def pending(self) -> bool:
        return not self.source_ids

    @property
    def content(self) -> str:
        """What is embedded, searched and shown to the model."""
        return f"{self.heading}\n{self.body}"

    @property
    def content_hash(self) -> str:
        """Changes when anything the assistant could retrieve changes."""
        parts = [self.title, self.topic, self.region, self.content, ",".join(self.source_ids)]
        return hashlib.sha256("\x1f".join(parts).encode("utf-8")).hexdigest()


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def _header_fields(text: str, name: str) -> tuple[dict[str, str], str]:
    match = _HEADER.match(text)
    if not match:
        raise DocumentError(f"{name}: the file must start with a '---' header block")
    fields: dict[str, str] = {}
    for line in match.group("header").splitlines():
        field = _HEADER_FIELD.match(line.strip())
        if field:
            fields[field.group("name")] = field.group("value").strip().strip('"')
    if not fields.get("title"):
        raise DocumentError(f"{name}: the header needs a title")
    return fields, text[match.end() :]


def parse_document(text: str, name: str) -> list[Section]:
    """Split one document into its sections. `name` is the file name without `.md`."""
    fields, rest = _header_fields(text.replace("\r\n", "\n"), name)

    headings = list(_HEADING.finditer(rest))
    if not headings:
        raise DocumentError(f"{name}: no '## ' sections found")

    sections: list[Section] = []
    seen: set[str] = set()
    for index, match in enumerate(headings):
        heading = match.group("heading")
        end = headings[index + 1].start() if index + 1 < len(headings) else len(rest)
        block = rest[match.end() : end].strip()

        source_lines = list(_SOURCE_LINE.finditer(block))
        if len(source_lines) != 1 or block[source_lines[0].end() :].strip():
            raise DocumentError(
                f"{name}: '{heading}' must end with exactly one 'Source:' line"
            )
        body = block[: source_lines[0].start()].strip()
        if not body:
            raise DocumentError(f"{name}: '{heading}' has no text")

        listed = [item.strip() for item in source_lines[0].group("ids").split(",")]
        if listed == [PENDING]:
            source_ids: tuple[str, ...] = ()
        else:
            for item in listed:
                if not _SOURCE_ID.match(item):
                    raise DocumentError(f"{name}: '{heading}' has a bad source id '{item}'")
            source_ids = tuple(dict.fromkeys(listed))

        key = f"{name}/{_slug(heading)}"
        if key in seen:
            raise DocumentError(f"{name}: two sections share the heading '{heading}'")
        seen.add(key)

        sections.append(
            Section(
                key=key,
                document=name,
                title=fields["title"],
                topic=fields.get("topic", ""),
                region=fields.get("region", ""),
                status=fields.get("status", "draft") or "draft",
                heading=heading,
                body=body,
                source_ids=source_ids,
            )
        )
    return sections


def load_documents(folder: Path) -> list[Section]:
    """Every section of every `.md` file in `folder`, in file order."""
    files = sorted(folder.glob("*.md"))
    if not files:
        raise DocumentError(f"no knowledge documents found in {folder}")
    sections: list[Section] = []
    for path in files:
        sections.extend(parse_document(path.read_text(encoding="utf-8"), path.stem))
    return sections
