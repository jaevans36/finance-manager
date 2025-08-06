import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    date: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    importBatchId: { type: String, required: true },
    importedAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
