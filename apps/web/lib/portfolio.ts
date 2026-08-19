export type PortfolioPosition = {
  quantity: number;
  paid: number | null;
  market: number | null;
};

export type PortfolioSummary = {
  totalCards: number;
  invested: number;
  currentValue: number;
  profitLoss: number | null;
  roiPercent: number | null;
  costedPositions: number;
  quotedPositions: number;
  comparablePositions: number;
};

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates P/L only for positions with both a recorded cost and a verified
 * market value. A missing quote must never be silently treated as zero.
 */
export function summarizePortfolio(positions: PortfolioPosition[]): PortfolioSummary {
  let totalCards = 0;
  let invested = 0;
  let currentValue = 0;
  let comparableInvested = 0;
  let comparableCurrent = 0;
  let costedPositions = 0;
  let quotedPositions = 0;
  let comparablePositions = 0;

  for (const position of positions) {
    totalCards += position.quantity;
    if (position.paid !== null) {
      invested += position.paid * position.quantity;
      costedPositions += 1;
    }
    if (position.market !== null) {
      currentValue += position.market * position.quantity;
      quotedPositions += 1;
    }
    if (position.paid !== null && position.market !== null) {
      comparableInvested += position.paid * position.quantity;
      comparableCurrent += position.market * position.quantity;
      comparablePositions += 1;
    }
  }

  const profitLoss = comparablePositions ? money(comparableCurrent - comparableInvested) : null;
  return {
    totalCards,
    invested: money(invested),
    currentValue: money(currentValue),
    profitLoss,
    roiPercent: comparableInvested > 0 && profitLoss !== null ? money((profitLoss / comparableInvested) * 100) : null,
    costedPositions,
    quotedPositions,
    comparablePositions,
  };
}
