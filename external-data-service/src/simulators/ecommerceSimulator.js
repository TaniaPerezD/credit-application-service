function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryEcommerce(applicantId) {
  await delay(400 + Math.random() * 600);

  const ordersLast6Months = Math.floor(Math.random() * 50);
  const completedOrders = Math.floor(ordersLast6Months * (0.8 + Math.random() * 0.2));
  const returnedOrders = ordersLast6Months - completedOrders;
  const avgOrderValue = 20 + Math.random() * 180;
  const accountAgeMonths = Math.floor(3 + Math.random() * 60);

  const completionRate = ordersLast6Months > 0 ? completedOrders / ordersLast6Months : 0;
  const score = Math.round(
    completionRate * 500 +
    Math.min(accountAgeMonths * 5, 300) +
    Math.min(ordersLast6Months * 4, 200)
  );

  return {
    score: Math.min(score, 1000),
    ordersLast6Months,
    completedOrders,
    returnedOrders,
    averageOrderValue: parseFloat(avgOrderValue.toFixed(2)),
    accountAgeMonths,
    platforms: ['MERCADOLIBRE', 'AMAZON', 'SHOPIFY'].filter(() => Math.random() > 0.5),
  };
}

module.exports = { queryEcommerce };
