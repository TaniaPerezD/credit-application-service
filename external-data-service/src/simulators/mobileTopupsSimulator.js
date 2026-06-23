function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryMobileTopups(applicantId) {
  await delay(200 + Math.random() * 500);

  const topupsLast3Months = Math.floor(Math.random() * 30);
  const avgTopupAmount = 5 + Math.random() * 45;
  const uniqueNumbers = Math.floor(1 + Math.random() * 5);
  const consistency = Math.random();

  // Recarga constante = comportamiento financiero responsable
  const score = Math.round(
    Math.min(topupsLast3Months * 20, 500) +
    Math.min(avgTopupAmount * 5, 300) +
    consistency * 200
  );

  return {
    score: Math.min(score, 1000),
    topupsLast3Months,
    averageTopupAmount: parseFloat(avgTopupAmount.toFixed(2)),
    uniquePhoneNumbers: uniqueNumbers,
    consistencyIndex: parseFloat(consistency.toFixed(2)),
    carriers: ['CLARO', 'MOVISTAR', 'ENTEL', 'BITEL'].filter(() => Math.random() > 0.5),
  };
}

module.exports = { queryMobileTopups };
