import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';
import uploadConfig from '../config/upload';

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
    const filePath = path.join(uploadConfig.directory, fileName);
    const csvFilePath = path.resolve(filePath);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);
    const lines: Line[] = [];

    parseCSV.on('data', line => {
      lines.push({
        title: line[0],
        type: line[1],
        value: line[2],
        category: line[3],
      });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const createTransactionService = new CreateTransactionService();
    const savedTransactions: Transaction[] = [];

    for (let i = 0; i < lines.length; i++) {
      const { category, title, type, value } = lines[i];
      const transaction = await createTransactionService.execute({
        title,
        type: type as 'income' | 'outcome',
        value,
        category,
      });
      savedTransactions.push(transaction);
    }

    // lines.forEach(
    //   line =>
    //     createTransactionService
    //       .execute({
    //         title: line.title,
    //         type: line.type,
    //         value: line.value,
    //         category: line.category,
    //       })
    //       .then(trx => savedTransactions.push(trx)).catch,
    // );

    return savedTransactions;
  }
}

export default ImportTransactionsService;
