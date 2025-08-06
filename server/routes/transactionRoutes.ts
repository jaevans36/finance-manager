import express from 'express';
import Transaction from '../models/Transaction';

const router = express.Router();

// Bulk import transactions
router.post('/import', async (req, res) => {
  const { transactions, importBatchId } = req.body;
  if (!Array.isArray(transactions) || !importBatchId) {
    return res.status(400).json({ message: 'Invalid payload' });
  }
  const toInsert = transactions.map(tx => ({ ...tx, importBatchId }));
  await Transaction.insertMany(toInsert);
  res.status(201).json({ message: 'Imported', count: toInsert.length });
});

// Get all transactions
router.get('/', async (_, res) => {
  const transactions = await Transaction.find();
  res.json(transactions);
});

router.delete('/clear', async (req, res) => {
  try {
    await Transaction.deleteMany({});
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ message: 'Failed to clear transactions', error: err });
  }
});

export default router;
