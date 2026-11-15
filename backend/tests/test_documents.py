"""Parsing of the malaria knowledge documents."""

from pathlib import Path

import pytest

from knowledge import DocumentError, load_documents, parse_document

SAMPLE = """---
title: Symptoms of malaria
topic: symptoms
region: global
status: draft
---

## What are the first symptoms of malaria?

Fever, headache and chills are common early symptoms.

Source: who-malaria, who-malaria-qa

## What is not ready yet?

This claim has no confirmed source.

Source: PENDING
"""


def test_parse_splits_sections_and_marks_pending():
    sections = parse_document(SAMPLE, "02-symptoms")
    assert len(sections) == 2
    first, second = sections
    assert first.key == "02-symptoms/what-are-the-first-symptoms-of-malaria"
    assert first.source_ids == ("who-malaria", "who-malaria-qa")
    assert "Fever, headache" in first.content
    assert second.pending is True
    assert second.source_ids == ()


def test_parse_rejects_a_section_without_a_source_line():
    bad = SAMPLE.replace("Source: PENDING", "See who-malaria")
    with pytest.raises(DocumentError, match="Source"):
        parse_document(bad, "02-symptoms")


def test_real_documents_parse_and_skip_pending():
    folder = Path(__file__).resolve().parents[1] / "knowledge_base" / "RAGInfo" / "documents"
    sections = load_documents(folder)
    assert len(sections) >= 100
    pending = [s for s in sections if s.pending]
    usable = [s for s in sections if not s.pending]
    assert usable, "expected sourced sections"
    assert all(s.source_ids for s in usable)
    # A handful may still be waiting for citations.
    assert len(pending) <= 10
