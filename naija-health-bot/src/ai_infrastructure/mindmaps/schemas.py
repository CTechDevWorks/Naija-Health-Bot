"""Request / response models for canvas ask and create_mindmap."""

from __future__ import annotations

import json
import re
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from config import settings

MAX_NODES = settings.mindmap_max_nodes
RELATIONS = (
    "related",
    "explains",
    "example",
    "causes",
    "depends",
    "contrasts",
    "part_of",
    "leads_to",
    "evidence",
    "answers",
    "source",
)
SourceKind = Literal["prompt", "notes", "canvas", "research"]


class GenTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class GenerateSource(BaseModel):
    kind: SourceKind = "prompt"
    content: str | None = Field(default=None, max_length=settings.mindmap_max_source_chars)
    label: str | None = Field(default=None, max_length=120)


class GenerateMindmapRequest(BaseModel):
    messages: list[GenTurn] = Field(min_length=1, max_length=20)
    source: GenerateSource = Field(default_factory=GenerateSource)
    context: str = Field(default="", max_length=12_000)


class AskRequest(BaseModel):
    messages: list[GenTurn] = Field(min_length=1, max_length=20)
    context: str = Field(default="", max_length=12_000)


def _clean(value: Any, limit: int) -> str:
    text = str(value or "").strip()
    text = re.sub(r"[ \t]+", " ", text)
    return text[:limit]


class MindNode(BaseModel):
    id: str
    label: str
    description: str = ""
    parent_id: str | None = None
    importance: Literal["central", "branch", "leaf"] = "branch"

    @model_validator(mode="before")
    @classmethod
    def _coerce(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            raise ValueError("node must be an object")
        out = dict(data)
        out["id"] = _clean(out.get("id"), 40) or "n"
        out["label"] = _clean(out.get("label") or out.get("title"), 60)
        out["description"] = _clean(out.get("description"), 240)
        parent = out.get("parent_id")
        out["parent_id"] = _clean(parent, 40) or None if parent is not None else None
        imp = str(out.get("importance") or "branch").strip().lower()
        out["importance"] = imp if imp in ("central", "branch", "leaf") else "branch"
        return out

    @field_validator("label")
    @classmethod
    def _label(cls, v: str) -> str:
        if not v:
            raise ValueError("label required")
        return v


class MindEdge(BaseModel):
    id: str | None = None
    source: str
    target: str
    relation: Literal[
        "related",
        "explains",
        "example",
        "causes",
        "depends",
        "contrasts",
        "part_of",
        "leads_to",
        "evidence",
        "answers",
        "source",
    ] = "part_of"
    label: str = ""

    @model_validator(mode="before")
    @classmethod
    def _coerce(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            raise ValueError("edge must be an object")
        out = dict(data)
        out["source"] = _clean(out.get("source") or out.get("from"), 40)
        out["target"] = _clean(out.get("target") or out.get("to"), 40)
        rel = str(out.get("relation") or "part_of").strip().lower().replace(" ", "_")
        out["relation"] = rel if rel in RELATIONS else "related"
        out["label"] = _clean(out.get("label"), 40)
        out["id"] = _clean(out.get("id"), 40) or None
        return out


class GeneratedMindmap(BaseModel):
    title: str
    central_topic: str
    nodes: list[MindNode]
    edges: list[MindEdge]

    @model_validator(mode="before")
    @classmethod
    def _coerce(cls, data: Any) -> Any:
        if isinstance(data, str):
            data = json.loads(data)
        if not isinstance(data, dict):
            raise ValueError("mindmap must be an object")
        out = dict(data)
        out["title"] = _clean(out.get("title"), 120)
        out["central_topic"] = _clean(out.get("central_topic") or out.get("title"), 80)
        nodes = out.get("nodes")
        if isinstance(nodes, str):
            nodes = json.loads(nodes)
        if not isinstance(nodes, list):
            raise ValueError("nodes must be a list")
        out["nodes"] = nodes
        edges = out.get("edges") or []
        if isinstance(edges, str):
            edges = json.loads(edges)
        if not isinstance(edges, list):
            raise ValueError("edges must be a list")
        out["edges"] = edges
        return out

    @model_validator(mode="after")
    def _lint(self) -> GeneratedMindmap:
        seen: set[str] = set()
        kept: list[MindNode] = []
        for node in self.nodes:
            if not node.label or node.id in seen:
                continue
            seen.add(node.id)
            kept.append(node)
        if len(kept) > MAX_NODES:
            kept = kept[:MAX_NODES]
            seen = {n.id for n in kept}
        if len(kept) < 2:
            raise ValueError("need at least two usable nodes")
        if not any(n.importance == "central" for n in kept):
            kept[0].importance = "central"
            if not self.central_topic:
                self.central_topic = kept[0].label

        edge_kept: list[MindEdge] = []
        pairs: set[tuple[str, str]] = set()
        for i, edge in enumerate(self.edges):
            if edge.source not in seen or edge.target not in seen or edge.source == edge.target:
                continue
            pair = (edge.source, edge.target)
            if pair in pairs:
                continue
            pairs.add(pair)
            if not edge.id:
                edge.id = f"e{i+1}"
            edge_kept.append(edge)
        # If the model forgot edges, synthesise parent links.
        if not edge_kept:
            by_id = {n.id: n for n in kept}
            for node in kept:
                if node.parent_id and node.parent_id in by_id and node.parent_id != node.id:
                    edge_kept.append(
                        MindEdge(id=f"e-{node.parent_id}-{node.id}", source=node.parent_id, target=node.id, relation="part_of")
                    )
        self.nodes = kept
        self.edges = edge_kept
        return self


class MindmapResponse(BaseModel):
    kind: Literal["mindmap"] = "mindmap"
    mindmap: GeneratedMindmap
    model: str


class ClarifyResponse(BaseModel):
    kind: Literal["clarify"] = "clarify"
    message: str
    model: str | None = None


class RefusedResponse(BaseModel):
    kind: Literal["refused"] = "refused"
    message: str


class AskResponse(BaseModel):
    kind: Literal["reply"] = "reply"
    message: str
    model: str | None = None


GenerateMindmapResponse = MindmapResponse | ClarifyResponse | RefusedResponse
