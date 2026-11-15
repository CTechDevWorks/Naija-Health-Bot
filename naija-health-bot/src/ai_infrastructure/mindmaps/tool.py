"""The `create_mindmap` function-calling tool."""

from __future__ import annotations

from .schemas import MAX_NODES

TOOL_NAME = "create_mindmap"

CREATE_MINDMAP_TOOL: dict = {
    "type": "function",
    "function": {
        "name": TOOL_NAME,
        "description": (
            "Create a hierarchical educational mind map as structured graph data. "
            "Call this ONLY when the topic is specific enough to draw a useful map. "
            "Return concise node labels and meaningful relationships — never a picture description."
        ),
        "parameters": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "title": {
                    "type": "string",
                    "maxLength": 120,
                    "description": "Short map name, e.g. 'Photosynthesis — stages and factors'.",
                },
                "central_topic": {
                    "type": "string",
                    "maxLength": 80,
                    "description": "The single central idea.",
                },
                "nodes": {
                    "type": "array",
                    "minItems": 2,
                    "maxItems": MAX_NODES,
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "id": {"type": "string", "description": "Stable id, e.g. n1."},
                            "label": {"type": "string", "maxLength": 60, "description": "Concise concept label."},
                            "description": {
                                "type": "string",
                                "maxLength": 240,
                                "description": "Optional one-line explanation shown inside the node.",
                            },
                            "parent_id": {"type": ["string", "null"], "description": "Parent node id, or null for the centre."},
                            "importance": {"type": "string", "enum": ["central", "branch", "leaf"]},
                        },
                        "required": ["id", "label", "importance"],
                    },
                },
                "edges": {
                    "type": "array",
                    "maxItems": MAX_NODES * 3,
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "id": {"type": "string"},
                            "source": {"type": "string"},
                            "target": {"type": "string"},
                            "relation": {
                                "type": "string",
                                "enum": [
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
                                ],
                            },
                            "label": {"type": "string", "maxLength": 40},
                        },
                        "required": ["source", "target", "relation"],
                    },
                },
            },
            "required": ["title", "central_topic", "nodes", "edges"],
        },
    },
}
