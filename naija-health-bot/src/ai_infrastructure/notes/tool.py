"""
The `generate_notes` function-calling tool.

Exposes the full BlockNote block system so the model can generate rich,
interactive study notes with headings, styled paragraphs, nested lists,
interactive checklists, collapsible toggle items, quotes/exam tips,
code blocks, comparison tables, and visual dividers.
"""

from __future__ import annotations

TOOL_NAME = "generate_notes"

GENERATE_NOTES_TOOL: dict = {
    "type": "function",
    "function": {
        "name": TOOL_NAME,
        "description": (
            "Create comprehensive, beautifully structured study notes aligned with the student's "
            "curriculum (WAEC/WASSCE, NECO, JAMB, etc.). Leverages the full feature set of BlockNote: "
            "headings (levels 1, 2, 3), paragraphs with inline markdown (**bold**, *italic*, `code`), "
            "bulleted lists, step-by-step numbered lists, interactive checklists (checkListItem), "
            "collapsible toggle accordions (toggleListItem with nested children for worked examples and self-tests), "
            "quotes (quote) for key definitions and exam tips, code blocks (codeBlock) for algorithms/formulas, "
            "comparison tables (table), and dividers."
        ),
        "parameters": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "title": {
                    "type": "string",
                    "maxLength": 120,
                    "description": "Specific, engaging title for the study note (e.g. 'Photosynthesis: Light & Dark Reactions').",
                },
                "subject": {
                    "type": "string",
                    "maxLength": 60,
                    "description": "School subject (e.g. 'Biology', 'Chemistry', 'Mathematics', 'Government', 'Physics').",
                },
                "topic": {
                    "type": "string",
                    "maxLength": 120,
                    "description": "Syllabus topic covered.",
                },
                "summary": {
                    "type": "string",
                    "maxLength": 400,
                    "description": "1–2 sentence overview of what this note covers and key exam takeaways.",
                },
                "blocks": {
                    "type": "array",
                    "minItems": 3,
                    "maxItems": 150,
                    "description": "Ordered sequence of BlockNote blocks composing the complete study document.",
                    "items": {
                        "type": "object",
                        "additionalProperties": True,
                        "properties": {
                            "type": {
                                "type": "string",
                                "enum": [
                                    "heading",
                                    "paragraph",
                                    "bulletListItem",
                                    "numberedListItem",
                                    "checkListItem",
                                    "toggleListItem",
                                    "quote",
                                    "codeBlock",
                                    "table",
                                    "divider",
                                ],
                                "description": "BlockNote block type.",
                            },
                            "level": {
                                "type": "integer",
                                "enum": [1, 2, 3],
                                "description": "For heading: level 1 (major unit), level 2 (subtopic), level 3 (subheading).",
                            },
                            "text": {
                                "type": "string",
                                "description": "Text content of the block. Supports inline formatting like **bold**, *italic*, and `code`.",
                            },
                            "textColor": {
                                "type": "string",
                                "enum": ["default", "red", "blue", "green", "yellow", "orange", "purple", "gray"],
                                "description": "Optional text color highlight.",
                            },
                            "checked": {
                                "type": "boolean",
                                "description": "For checkListItem: whether box is checked (default false). Ideal for learning checklists.",
                            },
                            "language": {
                                "type": "string",
                                "description": "For codeBlock: language identifier, e.g. 'python', 'sql', 'pseudocode', 'text'.",
                            },
                            "code": {
                                "type": "string",
                                "description": "For codeBlock: code snippet or mathematical/chemical algorithm text.",
                            },
                            "table": {
                                "type": "object",
                                "description": "For table: comparison or summary grid with headers and rows.",
                                "properties": {
                                    "headers": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                        "description": "Header column titles, e.g. ['Feature', 'Artery', 'Vein'].",
                                    },
                                    "rows": {
                                        "type": "array",
                                        "items": {
                                            "type": "array",
                                            "items": {"type": "string"},
                                        },
                                        "description": "List of rows, each containing cell strings matching the headers.",
                                    },
                                },
                            },
                            "children": {
                                "type": "array",
                                "description": "Nested child blocks. Crucial for toggleListItem to hold expandable solutions/explanations.",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "type": {
                                            "type": "string",
                                            "enum": [
                                                "paragraph",
                                                "bulletListItem",
                                                "numberedListItem",
                                                "quote",
                                                "codeBlock",
                                            ],
                                        },
                                        "text": {"type": "string"},
                                        "language": {"type": "string"},
                                        "code": {"type": "string"},
                                    },
                                    "required": ["type"],
                                },
                            },
                        },
                        "required": ["type"],
                    },
                },
            },
            "required": ["title", "subject", "topic", "blocks"],
        },
    },
}
