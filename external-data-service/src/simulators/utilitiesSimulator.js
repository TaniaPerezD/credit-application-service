function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryUtilities(applicantId) {
  await delay(500 + Math.random() * 1000);

  const seed = applicantId.replace(/-/g, '').slice(0, 8);
  const base = parseInt(seed, 16) % 100;

  const monthlyPayments = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    service: ['LUZ', 'AGUA', 'GAS', 'TELEFONIA'][i % 4],
    paid: Math.random() > 0.15,
    daysLate: Math.random() > 0.8 ? Math.floor(Math.random() * 30) : 0,
  }));

  const paidCount = monthlyPayments.filter((p) => p.paid).length;
  const score = Math.round((paidCount / 12) * 1000);

  return {
    score,
    paymentRate: `${Math.round((paidCount / 12) * 100)}%`,
    monthlyPayments,
    servicesEvaluated: ['LUZ', 'AGUA', 'GAS', 'TELEFONIA'],
  };
}

module.exports = { queryUtilities };
