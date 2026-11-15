"""Notes generation package for Kadet AI."""

from .schemas import (
    ClarifyResponse,
    GeneratedNote,
    GenerateNotesOptions,
    GenerateNotesRequest,
    GenerateNotesResponse,
    GenerateNotesSource,
    NoteResponse,
    RefusedResponse,
)
from .service import GenerationFailed, generate_notes
from .tool import GENERATE_NOTES_TOOL, TOOL_NAME

__all__ = [
    "ClarifyResponse",
    "GENERATE_NOTES_TOOL",
    "GenerateNotesOptions",
    "GenerateNotesRequest",
    "GenerateNotesResponse",
    "GenerateNotesSource",
    "GeneratedNote",
    "GenerationFailed",
    "NoteResponse",
    "RefusedResponse",
    "TOOL_NAME",
    "generate_notes",
]
