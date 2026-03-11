"""Tests for the _extract_json helper in openai_provider."""
from __future__ import annotations

import pytest

from app.providers.openai_provider import _extract_json


class TestExtractJsonCodeFences:
    """Cases where the input contains markdown code fences."""

    def test_json_language_tag(self) -> None:
        text = '```json\n{"key": "value"}\n```'
        assert _extract_json(text) == '{"key": "value"}'

    def test_no_language_tag(self) -> None:
        text = '```\n{"key": "value"}\n```'
        assert _extract_json(text) == '{"key": "value"}'

    def test_prose_before_and_after_fence(self) -> None:
        text = 'Here is the result:\n```json\n{"score": 42}\n```\nDone.'
        assert _extract_json(text) == '{"score": 42}'

    def test_fence_with_leading_trailing_whitespace_inside(self) -> None:
        text = "```json\n\n  {\"a\": 1}  \n\n```"
        assert _extract_json(text) == '{"a": 1}'

    def test_whitespace_only_around_fence_markers(self) -> None:
        # Extra blank lines before and after the fences
        text = "\n\n```json\n{\"x\": true}\n```\n\n"
        assert _extract_json(text) == '{"x": true}'

    def test_multiple_code_blocks_returns_first(self) -> None:
        text = '```json\n{"first": 1}\n```\nsome text\n```json\n{"second": 2}\n```'
        assert _extract_json(text) == '{"first": 1}'

    def test_nested_braces_inside_fence(self) -> None:
        text = '```json\n{"outer": {"inner": [1, 2, 3]}}\n```'
        assert _extract_json(text) == '{"outer": {"inner": [1, 2, 3]}}'

    def test_multiline_json_inside_fence(self) -> None:
        text = '```json\n{\n  "key": "value",\n  "num": 99\n}\n```'
        assert _extract_json(text) == '{\n  "key": "value",\n  "num": 99\n}'


class TestExtractJsonRawBraces:
    """Cases where there are no code fences; extraction uses brace heuristic."""

    def test_plain_json_object(self) -> None:
        text = '{"name": "Alice", "age": 30}'
        assert _extract_json(text) == '{"name": "Alice", "age": 30}'

    def test_prose_surrounding_json(self) -> None:
        text = 'The analysis result is {"status": "ok"} as expected.'
        assert _extract_json(text) == '{"status": "ok"}'

    def test_prose_before_json_only(self) -> None:
        text = 'Result: {"found": true}'
        assert _extract_json(text) == '{"found": true}'

    def test_prose_after_json_only(self) -> None:
        text = '{"done": false} — that is all.'
        assert _extract_json(text) == '{"done": false}'

    def test_nested_braces_raw(self) -> None:
        text = '{"outer": {"a": {"b": 1}}}'
        assert _extract_json(text) == '{"outer": {"a": {"b": 1}}}'

    def test_last_closing_brace_used(self) -> None:
        # rfind("}") must reach the outermost closing brace
        text = 'prefix {"k": {"v": 1}} suffix'
        assert _extract_json(text) == '{"k": {"v": 1}}'

    def test_leading_whitespace_stripped_before_search(self) -> None:
        text = '   {"trimmed": true}   '
        assert _extract_json(text) == '{"trimmed": true}'


class TestExtractJsonFallthrough:
    """Cases where no JSON markers exist; original text is returned."""

    def test_plain_string_no_braces(self) -> None:
        text = "no json here at all"
        assert _extract_json(text) == "no json here at all"

    def test_only_opening_brace(self) -> None:
        # start != -1 but end == -1 → falls through
        text = "{ incomplete"
        assert _extract_json(text) == "{ incomplete"

    def test_only_closing_brace(self) -> None:
        # start == -1 → falls through
        text = "incomplete }"
        assert _extract_json(text) == "incomplete }"

    def test_closing_before_opening_brace(self) -> None:
        # end < start → condition `end > start` is False → falls through
        text = "} then {"
        assert _extract_json(text) == "} then {"

    def test_empty_string(self) -> None:
        result = _extract_json("")
        assert result == ""

    def test_whitespace_only_string(self) -> None:
        # strip() leaves empty string; no braces found
        result = _extract_json("   ")
        assert result == ""


class TestExtractJsonReturnType:
    """Invariant: _extract_json always returns a str."""

    @pytest.mark.parametrize(
        "text",
        [
            "",
            "no markers",
            '{"valid": "json"}',
            '```json\n{"fenced": true}\n```',
            '```\n{"fenced": true}\n```',
        ],
    )
    def test_always_returns_str(self, text: str) -> None:
        assert isinstance(_extract_json(text), str)
