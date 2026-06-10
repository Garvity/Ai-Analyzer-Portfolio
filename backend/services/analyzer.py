from __future__ import annotations

import json
import os
from typing import Any

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI


class AnalyzerError(RuntimeError):
    """Raised when AI analysis cannot be completed."""


def build_portfolio_prompt(
    holdings: list[dict[str, Any]],
    risk_result: dict[str, Any],
) -> str:
    """Build the exact prompt sent to the AI model."""
    holdings_json = json.dumps(holdings, indent=2)
    risk_score = risk_result.get("risk_score")
    risk_summary = risk_result.get("summary", [])

    return f"""
You are a financial advisor helping a beginner investor understand their stock portfolio.

Important rules:
- Do not promise guaranteed returns.
- Do not tell the user to buy or sell blindly.
- Explain risks in simple language.
- Keep the answer practical and internship-project friendly.

Portfolio holdings:
{holdings_json}

Risk score: {risk_score}/10
Risk summary:
{json.dumps(risk_summary, indent=2)}

Provide the response in this format:
1) Risk analysis
2) Rebalancing suggestions
3) Top 3 concerns
""".strip()


def _get_gemini_api_key() -> str:
    """Load GEMINI_API_KEY from environment variables or backend/.env."""
    load_dotenv()
    load_dotenv("backend/.env")

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise AnalyzerError(
            "GEMINI_API_KEY is missing. Add it to backend/.env before running AI analysis."
        )

    return api_key


def call_gemini(prompt: str) -> str:
    """Send the portfolio prompt to Gemini using LangChain."""
    api_key = _get_gemini_api_key()
    model = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        api_key=api_key,
        temperature=0.2,
    )
    response = model.invoke(prompt)

    if not isinstance(response.content, str):
        return str(response.content)

    return response.content


def analyze_portfolio(
    holdings: list[dict[str, Any]],
    risk_result: dict[str, Any],
    *,
    use_ai: bool = True,
) -> dict[str, Any]:
    """
    Create an AI portfolio analysis.

    use_ai=False is useful for offline tests because it avoids calling Gemini.
    """
    prompt = build_portfolio_prompt(holdings, risk_result)

    if use_ai:
        ai_text = call_gemini(prompt)
    else:
        ai_text = _build_offline_analysis(risk_result)

    return {
        "risk_score": risk_result.get("risk_score"),
        "suggestions": _extract_suggestions(ai_text),
        "raw_ai_text": ai_text,
    }


def _build_offline_analysis(risk_result: dict[str, Any]) -> str:
    """Return a deterministic analysis for local tests without an API key."""
    risk_score = risk_result.get("risk_score")
    summary = risk_result.get("summary", [])
    summary_text = "\n".join(f"- {item}" for item in summary)

    return f"""
1) Risk analysis
Your portfolio has a risk score of {risk_score}/10.
{summary_text}

2) Rebalancing suggestions
Review stocks with very high allocation and consider spreading exposure across more holdings or sectors.

3) Top 3 concerns
- Concentration in a small number of stocks
- Limited diversification
- Possible unrealized losses in weak holdings
""".strip()


def _extract_suggestions(ai_text: str) -> list[str]:
    """Create a simple suggestions list from the AI text for frontend display."""
    suggestions: list[str] = []

    for line in ai_text.splitlines():
        cleaned_line = line.strip()
        if cleaned_line.startswith("-"):
            suggestions.append(cleaned_line.removeprefix("-").strip())

    if suggestions:
        return suggestions

    return [ai_text.strip()]
