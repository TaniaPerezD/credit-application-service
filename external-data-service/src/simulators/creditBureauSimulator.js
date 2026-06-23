const { CircuitBreaker, CircuitOpenError } = require('./circuitBreaker');

// Cache inteligente: evita golpear el mainframe si ya consultamos recientemente
const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

const breaker = new CircuitBreaker('credit-bureau');

// Simula la latencia real del mainframe IBM Z (8-15 segundos según enunciado)
function simulateMainframeDelay() {
  const ms = 8000 + Math.random() * 7000;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Simula fallo ocasional del mainframe (20% de probabilidad)
function simulateMainframeCall(documentNumber) {
  return new Promise((resolve, reject) => {
    if (Math.random() < 0.2) {
      reject(new Error('SOAP Fault: mainframe timeout'));
      return;
    }
    // Genera score determinístico por documento (reproducible en tests)
    const seed = documentNumber.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const score = 300 + (seed % 700); // entre 300 y 999
    resolve(score);
  });
}

async function queryCreditBureau(documentNumber) {
  const cacheKey = `bureau:${documentNumber}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[CreditBureau] Cache hit para documento ${documentNumber}`);
    return { ...cached.data, fromCache: true };
  }

  const score = await breaker.call(async () => {
    console.log('[CreditBureau] Consultando mainframe IBM Z...');
    await simulateMainframeDelay();
    return simulateMainframeCall(documentNumber);
  });

  const result = {
    score,
    documentNumber,
    reportDate: new Date().toISOString(),
    hasDelinquency: score < 500,
    riskCategory: score >= 700 ? 'BAJO' : score >= 500 ? 'MEDIO' : 'ALTO',
    fromCache: false,
  };

  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

function getBreakerStatus() {
  return breaker.getStatus();
}

module.exports = { queryCreditBureau, getBreakerStatus, CircuitOpenError };
