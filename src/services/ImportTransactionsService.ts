import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  fileName: string;
}

interface Line {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute({ fileName }: Request): Promise<Transaction[]> {
    const csvFilePath = path.resolve(__dirname, 'import_template.csv');

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);
    const transactions: Line[] = [];

    parseCSV.on('data', line => {
      transactions.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const createTransactionService = new CreateTransactionService();

    const getTransactions = async (): Promise<Transaction[]> => {
      return Promise.all(
        transactions.map(trx =>
          createTransactionService.execute({
            title: trx.title,
            type: trx.type,
            value: trx.value,
            category: trx.category,
          }),
        ),
      );
    };

    const savedTransactions: Transaction[] = [];

    getTransactions().then(trx => trx.map(t => savedTransactions.push(t)));

    return savedTransactions;
  }
}

export default ImportTransactionsService;
