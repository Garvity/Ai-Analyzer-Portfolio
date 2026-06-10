from __future__ import annotations

from typing import Any


class RiskCalculationError(ValueError):
    """Raised when portfolio holdings are not valid for risk calculation."""


def _get_numeric_value(holding: dict[str, Any], key: str) -> float:
    """Read a positive numeric value from one holding."""
    value = holding.get(key)

    if value is None:
        raise RiskCalculationError(f"Missing required holding field: {key}.")

    try:
        numeric_value = float(value)
    except (TypeError, ValueError) as error:
        raise RiskCalculationError(f"Invalid numeric value for {key}: {value}.") from error

    if numeric_value < 0:
        raise RiskCalculationError(f"{key} cannot be negative.")

    return numeric_value


def _calculate_total_current_value(holdings: list[dict[str, Any]]) -> float:
    """Add current values across all holdings."""
    total_value = sum(
        _get_numeric_value(holding, "current_value") for holding in holdings
    )

    if total_value <= 0:
        raise RiskCalculationError("Portfolio current value must be greater than zero.")

    return total_value


def calculate_concentration_score(holdings: list[dict[str, Any]]) -> int:
    """
    Score concentration risk from 1 to 10.

    If one stock is a very large part of the portfolio, risk is higher.
    """
    total_value = _calculate_total_current_value(holdings)
    largest_weight = max(
        _get_numeric_value(holding, "current_value") / total_value
        for holding in holdings
    )

    if largest_weight >= 0.50:
        return 10
    if largest_weight >= 0.40:
        return 8
    if largest_weight >= 0.30:
        return 6
    if largest_weight >= 0.20:
        return 4
    return 2


def calculate_diversification_score(holdings: list[dict[str, Any]]) -> int:
    """
    Score diversification risk from 1 to 10.

    Fewer stocks means one bad stock can hurt the portfolio more.
    """
    stock_count = len(holdings)

    if stock_count <= 1:
        return 10
    if stock_count <= 2:
        return 8
    if stock_count <= 4:
        return 6
    if stock_count <= 7:
        return 4
    return 2


def calculate_sector_score(holdings: list[dict[str, Any]]) -> int:
    """
    Score sector concentration risk from 1 to 10.

    Missing sector data gets a neutral score instead of being treated as risky.
    """
    sectors = [holding.get("sector") for holding in holdings if holding.get("sector")]

    if not sectors:
        return 5

    unique_sector_count = len(set(sectors))

    if unique_sector_count <= 1:
        return 10
    if unique_sector_count <= 2:
        return 8
    if unique_sector_count <= 3:
        return 6
    if unique_sector_count <= 4:
        return 4
    return 2


def calculate_loss_score(holdings: list[dict[str, Any]]) -> int:
    """
    Score loss risk from 1 to 10.

    A portfolio with a large unrealized loss gets a higher risk score.
    """
    total_invested = sum(
        _get_numeric_value(holding, "invested_value") for holding in holdings
    )
    total_current = _calculate_total_current_value(holdings)

    if total_invested <= 0:
        raise RiskCalculationError("Portfolio invested value must be greater than zero.")

    return_percentage = ((total_current - total_invested) / total_invested) * 100

    if return_percentage <= -30:
        return 10
    if return_percentage <= -20:
        return 8
    if return_percentage <= -10:
        return 6
    if return_percentage < 0:
        return 4
    return 2


def calculate_risk_score(holdings: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Calculate an overall risk score and explain the reason.

    The final score is a weighted average:
    - 50% concentration risk
    - 30% diversification risk
    - 20% loss risk
    """
    if not holdings:
        raise RiskCalculationError("At least one holding is required.")

    concentration_score = calculate_concentration_score(holdings)
    sector_score = calculate_sector_score(holdings)
    diversification_score = calculate_diversification_score(holdings)
    loss_score = calculate_loss_score(holdings)

    overall_score = round(
        (concentration_score * 0.40)
        + (sector_score * 0.25)
        + (diversification_score * 0.20)
        + (loss_score * 0.15)
    )

    return {
        "risk_score": min(max(overall_score, 1), 10),
        "breakdown": {
            "concentration": concentration_score,
            "sector": sector_score,
            "diversification": diversification_score,
            "loss": loss_score,
        },
        "summary": _build_risk_summary(
            concentration_score,
            sector_score,
            diversification_score,
            loss_score,
        ),
    }


def _build_risk_summary(
    concentration_score: int,
    sector_score: int,
    diversification_score: int,
    loss_score: int,
) -> list[str]:
    """Create beginner-readable reasons behind the risk score."""
    summary: list[str] = []

    if concentration_score >= 6:
        summary.append("One stock has a large allocation, increasing concentration risk.")
    else:
        summary.append("No single stock dominates the portfolio.")

    if sector_score >= 8:
        summary.append("The portfolio is concentrated in very few sectors.")
    elif sector_score == 5:
        summary.append("Sector data is unavailable, so sector risk is treated as neutral.")
    else:
        summary.append("Sector diversification is reasonably balanced.")

    if diversification_score >= 6:
        summary.append("The portfolio has few stocks, so diversification is limited.")
    else:
        summary.append("The portfolio has a healthier number of holdings.")

    if loss_score >= 6:
        summary.append("The portfolio has a significant unrealized loss.")
    else:
        summary.append("Portfolio losses are currently not the main risk driver.")

    return summary
