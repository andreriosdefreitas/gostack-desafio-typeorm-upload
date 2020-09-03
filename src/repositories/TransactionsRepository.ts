import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(transactions: Transaction[]): Promise<Balance> {
    if (Array.isArray(transactions) && transactions.length) {
      const reducer = (accumulator: number, currentValue: number): number =>
        accumulator + currentValue;
      const income = transactions
        .map(transaction => {
          if (transaction.type === 'income') {
            return transaction.value;
          }
          return 0;
        })
        .reduce(reducer);

      const outcome = transactions
        .map(transaction => {
          if (transaction.type === 'outcome') {
            return transaction.value;
          }
          return 0;
        })
        .reduce(reducer);

      const total = income - outcome;

      const balance: Balance = { income, outcome, total };

      return balance;
    }
    return { income: 0, outcome: 0, total: 0 };
  }
}

export default TransactionsRepository;
