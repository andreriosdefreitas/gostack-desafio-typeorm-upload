import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    if (type === 'income' || type === 'outcome') {
      if (type === 'outcome') {
        const transactions = await transactionRepository.find();
        const balance = await transactionRepository.getBalance(transactions);
        if (value > balance.total) {
          throw new AppError('This transaction is invalid');
        }
      }
      const categoryRepository = getRepository(Category);

      const checkCategoryExists = await categoryRepository.findOne({
        where: { title: category },
      });

      let category_id;
      if (checkCategoryExists) {
        category_id = checkCategoryExists.id;
      } else {
        const cat = categoryRepository.create({
          title: category,
        });
        await categoryRepository.save(cat);
        category_id = cat.id;
      }

      const transaction = transactionRepository.create({
        title,
        value,
        type,
        category_id,
      });
      await transactionRepository.save(transaction);
      return transaction;
    }
    throw new AppError('Type shoud be income or outcome');
  }
}

export default CreateTransactionService;
