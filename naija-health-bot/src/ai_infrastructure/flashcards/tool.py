"""
The `generate_flashcard_set` function-calling tool.

Only fields that change the study experience are exposed. `source_context` is
deliberately *not* a tool parameter — the server records where the material
came from; the model shouldn't be able to claim otherwise.
"""

from __future__ import annotations

from .schemas import LIMITS, MAX_CARDS

TOOL_NAME = "generate_flashcard_set"

GENERATE_FLASHCARD_SET_TOOL: dict = {
    "type": "function",
    "function": {
        "name": TOOL_NAME,
        "description": (
            "Create a structured flashcard deck for the student. Call this ONLY when the "
            "subject and topic are clear enough to write good cards. Each card must test one "
            "idea with a short answer. Never exceed the requested number of cards, and never "
            f"more than {MAX_CARDS}."
        ),
        "parameters": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "title": {
                    "type": "string",
                    "maxLength": LIMITS["title"],
                    "description": "Short deck name a student would recognise, e.g. 'Photosynthesis — light and dark reactions'.",
                },
                "subject": {
                    "type": "string",
                    "maxLength": LIMITS["subject"],
                    "description": "School subject, e.g. Biology, Mathematics, Government.",
                },
                "topic": {
                    "type": "string",
                    "maxLength": LIMITS["topic"],
                    "description": "Syllabus topic the deck covers.",
                },
                "description": {
                    "type": "string",
                    "maxLength": LIMITS["description"],
                    "description": "One or two sentences: what the deck covers and who it's for.",
                },
                "difficulty": {
                    "type": "string",
                    "enum": ["easy", "medium", "hard", "mixed"],
                    "description": "Overall pitch of the deck.",
                },
                "cards": {
                    "type": "array",
                    "minItems": 1,
                    "maxItems": MAX_CARDS,
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "front": {
                                "type": "string",
                                "maxLength": LIMITS["front"],
                                "description": "The question or prompt. One clear question, with enough context to be unambiguous.",
                            },
                            "back": {
                                "type": "string",
                                "maxLength": LIMITS["back"],
                                "description": "The answer — as short as possible while still complete. Usually one line.",
                            },
                            "hint": {
                                "type": "string",
                                "maxLength": LIMITS["hint"],
                                "description": "Optional nudge shown before the answer (a first letter, a category, a formula shape). Never the answer itself.",
                            },
                            "explanation": {
                                "type": "string",
                                "maxLength": LIMITS["explanation"],
                                "description": "Optional: why the answer is right, a worked step, or a memory hook. Shown after the answer.",
                            },
                            "difficulty": {"type": "string", "enum": ["easy", "medium", "hard"]},
                            "tags": {
                                "type": "array",
                                "maxItems": LIMITS["tags"],
                                "items": {"type": "string", "maxLength": LIMITS["tag"]},
                                "description": "Short lowercase tags, e.g. ['definitions', 'light reaction'].",
                            },
                        },
                        "required": ["front", "back", "difficulty"],
                    },
                },
            },
            "required": ["title", "subject", "topic", "description", "difficulty", "cards"],
        },
    },
}
