import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Trade, PerformanceStats, CurrencyType } from '../types/database.types';

export const pdfExportService = {
  /**
   * Generate and download a formatted PDF Trading Statement
   */
  exportTradingReportPDF(
    trades: Trade[],
    stats: PerformanceStats,
    traderEmail?: string,
    currency: CurrencyType = 'USD'
  ) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const currencySymbol = currency === 'INR' ? 'INR ' : '$';

    // Page Background / Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 36, 'F');

    // Title
    doc.setTextColor(245, 158, 11); // Gold-500
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('GOLD TRADING JOURNAL', 14, 15);

    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.setFont('helvetica', 'normal');
    doc.text('XAU/USD Performance Statement & Trade Ledger', 14, 21);

    // Meta details on right
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 13, { align: 'right' });
    doc.text(`Trader: ${traderEmail || 'Authenticated Trader'}`, 196, 18, { align: 'right' });
    doc.text(`Currency: ${currency}`, 196, 23, { align: 'right' });

    // Gold decorative border line
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.8);
    doc.line(14, 30, 196, 30);

    // Executive Performance KPI Box
    doc.setFillColor(248, 250, 252); // light slate
    doc.roundedRect(14, 42, 182, 32, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 42, 182, 32, 2, 2, 'D');

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE PERFORMANCE SUMMARY', 18, 48);

    // KPI Metrics Grid in PDF
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);

    // Row 1
    doc.text('Account Balance:', 18, 55);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${currencySymbol}${stats.currentBalance.toLocaleString()}`, 52, 55);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Net Profit / Loss:', 82, 55);
    doc.setFont('helvetica', 'bold');
    if (stats.totalPnL >= 0) {
      doc.setTextColor(16, 185, 129); // emerald
    } else {
      doc.setTextColor(239, 68, 68); // rose
    }
    doc.text(`${stats.totalPnL >= 0 ? '+' : ''}${currencySymbol}${stats.totalPnL.toLocaleString()}`, 115, 55);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Win Rate:', 145, 55);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${stats.winRate}% (${stats.winTrades}W / ${stats.lossTrades}L / ${stats.breakevenTrades}BE)`, 165, 55);

    // Row 2
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Starting Balance:', 18, 64);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${currencySymbol}${stats.startingBalance.toLocaleString()}`, 52, 64);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Profit Factor:', 82, 64);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${stats.profitFactor}`, 115, 64);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Best / Worst Trade:', 145, 64);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(
      `+${currencySymbol}${stats.bestTrade} / ${currencySymbol}${stats.worstTrade}`,
      174,
      64
    );

    // Table of Trades
    const tableData = trades.map((t) => [
      t.trade_date,
      t.symbol,
      t.direction,
      t.entry_price.toString(),
      t.exit_price ? t.exit_price.toString() : '-',
      t.tp ? t.tp.toString() : '-',
      t.sl ? t.sl.toString() : '-',
      t.lot_size.toString(),
      t.risk_reward_ratio ? `1:${t.risk_reward_ratio}` : '-',
      t.result,
      `${Number(t.pl_amount) >= 0 ? '+' : ''}${currencySymbol}${Number(t.pl_amount).toLocaleString()}`,
      t.notes || '',
    ]);

    autoTable(doc, {
      startY: 80,
      head: [
        [
          'Date',
          'Symbol',
          'Dir',
          'Entry',
          'Exit',
          'TP',
          'SL',
          'Lot',
          'R:R',
          'Result',
          'Net P&L',
          'Notes',
        ],
      ],
      body: tableData.length > 0 ? tableData : [['-', 'No trades recorded', '-', '-', '-', '-', '-', '-', '-', '-', '$0.00', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [245, 158, 11],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 14 },
        2: { cellWidth: 10 },
        3: { cellWidth: 14 },
        4: { cellWidth: 14 },
        5: { cellWidth: 12 },
        6: { cellWidth: 12 },
        7: { cellWidth: 10 },
        8: { cellWidth: 12 },
        9: { cellWidth: 14 },
        10: { cellWidth: 18, fontStyle: 'bold' },
        11: { cellWidth: 'auto' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 10) {
          const val = data.cell.raw as string;
          if (val && val.startsWith('+')) {
            data.cell.styles.textColor = [16, 185, 129];
          } else if (val && val.includes('-') && !val.startsWith('+')) {
            data.cell.styles.textColor = [239, 68, 68];
          }
        }
      },
    });

    // Save File
    doc.save(`gold_trade_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  },
};
