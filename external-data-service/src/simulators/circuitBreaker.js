const STATE = { CLOSED: 'CLOSED', OPEN: 'OPEN', HALF_OPEN: 'HALF_OPEN' };

class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.state = STATE.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;

    this.failureThreshold = options.failureThreshold || parseInt(process.env.CREDIT_BUREAU_FAILURE_THRESHOLD) || 5;
    this.resetTimeoutMs = options.resetTimeoutMs || parseInt(process.env.CREDIT_BUREAU_RESET_TIMEOUT_MS) || 30000;
  }

  async call(fn) {
    if (this.state === STATE.OPEN) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.resetTimeoutMs) {
        this.state = STATE.HALF_OPEN;
        console.log(`[CircuitBreaker:${this.name}] → HALF_OPEN, probando recuperación`);
      } else {
        const remainingSec = Math.ceil((this.resetTimeoutMs - elapsed) / 1000);
        throw new CircuitOpenError(
          `Buró de crédito no disponible. Reintentando en ${remainingSec}s.`
        );
      }
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (err) {
      if (err instanceof CircuitOpenError) throw err;
      this._onFailure();
      throw err;
    }
  }

  _onSuccess() {
    this.failureCount = 0;
    if (this.state === STATE.HALF_OPEN) {
      this.state = STATE.CLOSED;
      console.log(`[CircuitBreaker:${this.name}] → CLOSED, servicio recuperado`);
    }
  }

  _onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = STATE.OPEN;
      console.warn(`[CircuitBreaker:${this.name}] → OPEN tras ${this.failureCount} fallos`);
    }
  }

  getStatus() {
    return { name: this.name, state: this.state, failureCount: this.failureCount };
  }
}

class CircuitOpenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

module.exports = { CircuitBreaker, CircuitOpenError };
