import { Trade, PerformanceStats, UserSettings, BalanceLog } from '../types/database.types';
import { format, isToday, parseISO } from 'date-fns';

export const analyticsService = {
  /**
   * Compute full performance metrics from trades and settings
   */
  calculateStats(
    trades: Trade[],
    settings: UserSettings | null,
    balanceLogs: BalanceLog[] = []
  ): PerformanceStats {
    const startingBalance = settings?.starting_balance ?? 1000;
    const currency = settings?.currency ?? 'USD';

    if (!trades || trades.length === 0) {
      // Calculate net deposit/withdrawal adjustments
      const adjustments = balanceLogs.reduce((acc, log) => acc + Number(log.amount || 0), 0);
      return {
        totalTrades: 0,
        winTrades: 0,
        lossTrades: 0,
        breakevenTrades: 0,
        winRate: 0,
        totalPnL: 0,
        todayPnL: 0,
        profitFactor: 0,
        bestTrade: 0,
        worstTrade: 0,
        startingBalance,
        currentBalance: startingBalance + adjustments,
        currency,
        averageWin: 0,
        averageLoss: 0,
        buyWinRate: 0,
        sellWinRate: 0,
      };
    }

    let winTrades = 0;
    let lossTrades = 0;
    let breakevenTrades = 0;
    let totalPnL = 0;
    let todayPnL = 0;
    let bestTrade = -Infinity;
    let worstTrade = Infinity;
    let totalGrossProfit = 0;
    let totalGrossLoss = 0;

    let buyTrades = 0;
    let buyWins = 0;
    let sellTrades = 0;
    let sellWins = 0;

    trades.forEach((trade) => {
      const pl = Number(trade.pl_amount);
      totalPnL += pl;

      // Check if trade is today
      try {
        const tDate = parseISO(trade.trade_date);
        if (isToday(tDate)) {
          todayPnL += pl;
        }
      } catch (e) {
        // fallback date check
        const todayStr = new Date().toISOString().slice(0, 10);
        if (trade.trade_date === todayStr) {
          todayPnL += pl;
        }
      }

      if (pl > bestTrade) bestTrade = pl;
      if (pl < worstTrade) worstTrade = pl;

      if (trade.result === 'PROFIT' || pl > 0) {
        winTrades++;
        totalGrossProfit += pl;
      } else if (trade.result === 'LOSS' || pl < 0) {
        lossTrades++;
        totalGrossLoss += Math.abs(pl);
      } else {
        breakevenTrades++;
      }

      if (trade.direction === 'BUY') {
        buyTrades++;
        if (trade.result === 'PROFIT' || pl > 0) buyWins++;
      } else if (trade.direction === 'SELL') {
        sellTrades++;
        if (trade.result === 'PROFIT' || pl > 0) sellWins++;
      }
    });

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;
    const profitFactor = totalGrossLoss > 0 ? totalGrossProfit / totalGrossLoss : totalGrossProfit > 0 ? 99.9 : 0;
    const averageWin = winTrades > 0 ? totalGrossProfit / winTrades : 0;
    const averageLoss = lossTrades > 0 ? totalGrossLoss / lossTrades : 0;
    const buyWinRate = buyTrades > 0 ? (buyWins / buyTrades) * 100 : 0;
    const sellWinRate = sellTrades > 0 ? (sellWins / sellTrades) * 100 : 0;

    const adjustments = balanceLogs.reduce((acc, log) => acc + Number(log.amount || 0), 0);
    const currentBalance = startingBalance + totalPnL + adjustments;

    return {
      totalTrades,
      winTrades,
      lossTrades,
      breakevenTrades,
      winRate: Math.round(winRate * 10) / 10,
      totalPnL: Math.round(totalPnL * 100) / 100,
      todayPnL: Math.round(todayPnL * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
      worstTrade: worstTrade === Infinity ? 0 : worstTrade,
      startingBalance,
      currentBalance: Math.round(currentBalance * 100) / 100,
      currency,
      averageWin: Math.round(averageWin * 100) / 100,
      averageLoss: Math.round(averageLoss * 100) / 100,
      buyWinRate: Math.round(buyWinRate * 10) / 10,
      sellWinRate: Math.round(sellWinRate * 10) / 10,
    };
  },

  /**
   * Build chronological Equity Curve data points for Recharts
   */
  buildEquityCurve(trades: Trade[], startingBalance: number = 1000) {
    if (!trades || trades.length === 0) {
      return [{ date: 'Start', balance: startingBalance, tradeNo: 0, pnl: 0 }];
    }

    // Sort trades chronologically (oldest to newest)
    const sorted = [...trades].sort((a, b) => {
      const d1 = new Date(`${a.trade_date}T${a.trade_time || '00:00:00'}`).getTime();
      const d2 = new Date(`${b.trade_date}T${b.trade_time || '00:00:00'}`).getTime();
      return d1 - d2;
    });

    let runningBalance = startingBalance;
    const data = [
      {
        date: 'Start',
        balance: startingBalance,
        tradeNo: 0,
        pnl: 0,
        symbol: 'Initial'
      }
    ];

    sorted.forEach((trade, idx) => {
      runningBalance += Number(trade.pl_amount);
      data.push({
        date: trade.trade_date,
        balance: Math.round(runningBalance * 100) / 100,
        tradeNo: idx + 1,
        pnl: Number(trade.pl_amount),
        symbol: trade.symbol
      });
    });

    return data;
  },

  /**
   * Build Daily PnL distribution data points
   */
  buildDailyPnL(trades: Trade[]) {
    const dailyMap = new Map<string, { date: string; profit: number; loss: number; net: number; tradesCount: number }>();

    // Sort chronologically
    const sorted = [...trades].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());

    sorted.forEach((trade) => {
      const d = trade.trade_date;
      const pl = Number(trade.pl_amount);
      const existing = dailyMap.get(d) || { date: d, profit: 0, loss: 0, net: 0, tradesCount: 0 };

      if (pl >= 0) {
        existing.profit += pl;
      } else {
        existing.loss += Math.abs(pl);
      }
      existing.net += pl;
      existing.tradesCount += 1;
      dailyMap.set(d, existing);
    });

    return Array.from(dailyMap.values()).map(item => ({
      ...item,
      profit: Math.round(item.profit * 100) / 100,
      loss: Math.round(item.loss * 100) / 100,
      net: Math.round(item.net * 100) / 100,
    }));
  }
};
