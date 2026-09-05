/**
 * Mock for @prisma/client used in unit tests.
 * Provides a chainable mock that mimics PrismaClient's query API.
 */

function createMockChain() {
  const chain: Record<string, unknown> = {};
  return new Proxy(chain, {
    get(_target, prop: string) {
      if (prop === 'then') return undefined; // prevent promise-like behavior
      if (!(prop in chain)) {
        chain[prop] = jest.fn().mockReturnValue(new Proxy({}, {
          get(_t, p: string) {
            if (p === 'then') return undefined;
            return jest.fn().mockReturnValue(new Proxy({}, {
              get(_t2, p2: string) {
                if (p2 === 'then') return undefined;
                if (p2 === 'then') return undefined;
                return jest.fn().mockResolvedValue(null);
              },
            }));
          },
        }));
      }
      return chain[prop];
    },
  });
}

export class PrismaClient {
  // Model accessors that return chainable mocks
  accountNature = createMockChain();
  accountGroup = createMockChain();
  ledger = createMockChain();
  voucherType = createMockChain();
  voucher = createMockChain();
  journalType = createMockChain();
  journal = createMockChain();
  journalLine = createMockChain();
  voucherReference = createMockChain();
  financialYear = createMockChain();
  bill = createMockChain();
  payment = createMockChain();
  patient = createMockChain();
  appointment = createMockChain();
  medicine = createMockChain();
  doctor = createMockChain();
  prescription = createMockChain();

  $transaction = jest.fn().mockImplementation(async (fn: (tx: PrismaClient) => Promise<unknown>) => {
    const txClient = new PrismaClient();
    return fn(txClient);
  });
}

export default PrismaClient;
