function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryWallets(applicantId) {
  await delay(300 + Math.random() * 700);

  const monthlyVolume = 50 + Math.random() * 950;
  const txCount = Math.floor(5 + Math.random() * 95);
  const returnsRate = Math.random() * 0.1;
  const avgTxAmount = monthlyVolume / txCount;

  // Score basado en volumen, frecuencia y tasa de devoluciones
  const volumeScore = Math.min(monthlyVolume / 10, 400);
  const freqScore = Math.min(txCount * 5, 400);
  const returnsPenalty = returnsRate * 200;
  const score = Math.round(Math.max(0, volumeScore + freqScore - returnsPenalty));

  return {
    score,
    monthlyVolume: parseFloat(monthlyVolume.toFixed(2)),
    transactionCount: txCount,
    averageTransactionAmount: parseFloat(avgTxAmount.toFixed(2)),
    returnsRate: parseFloat((returnsRate * 100).toFixed(2)),
    walletsFound: ['YAPE', 'PLIN', 'NEQUI', 'DAVIPLATA'].filter(() => Math.random() > 0.4),
  };
}

module.exports = { queryWallets };
