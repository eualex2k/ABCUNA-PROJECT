import { supabase } from '../lib/supabase';
import { Transaction } from '../types';

export const financialService = {
    async getAll(): Promise<Transaction[]> {
        const { data, error } = await supabase
            .from('financial_transactions')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }

        return data.map(mapToFrontend);
    },

    async create(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
        const dbRow = mapToDb(transaction);
        const { data, error } = await supabase
            .from('financial_transactions')
            .insert(dbRow)
            .select()
            .single();

        if (error) {
            console.error('Error creating transaction full obj:', JSON.stringify(error, null, 2));
            console.error('Error creating transaction:', error);
            throw error;
        }

        return mapToFrontend(data);
    },

    async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
        const dbUpdates = mapToDb(updates);
        const { data, error } = await supabase
            .from('financial_transactions')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating transaction full obj:', JSON.stringify(error, null, 2));
            console.error('Error updating transaction:', error);
            throw error;
        }

        return mapToFrontend(data);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('financial_transactions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting transaction:', error);
            throw error;
        }
    },

    async deleteBulk(ids: string[]): Promise<void> {
        if (!ids || ids.length === 0) return;

        const { error } = await supabase
            .from('financial_transactions')
            .delete()
            .in('id', ids);

        if (error) {
            console.error('SERVER ERROR - deleting multiple transactions:', JSON.stringify(error, null, 2));
            throw error;
        }
    }
};

// Helpers to map between Frontend Types and Database Columns (snake_case)
// Assuming DB Columns: id, description, amount, type, category, date, status
function mapToFrontend(row: any): Transaction {
    return {
        id: row.id,
        description: row.description,
        amount: Number(row.amount),
        type: row.type,
        category: row.category,
        date: row.date,
        status: row.status,
        payer_id: row.payer_id,
        recipient_id: row.recipient_id,
        notes: row.notes,
    };
}

function mapToDb(tx: Partial<Transaction>): any {
    const dbRow: any = {};
    if (tx.description !== undefined) dbRow.description = tx.description;
    if (tx.amount !== undefined) dbRow.amount = tx.amount;
    if (tx.type !== undefined) dbRow.type = tx.type;
    if (tx.category !== undefined) dbRow.category = tx.category;
    if (tx.date !== undefined) dbRow.date = tx.date;
    if (tx.status !== undefined) dbRow.status = tx.status;
    if (tx.payer_id !== undefined) dbRow.payer_id = tx.payer_id;
    if (tx.recipient_id !== undefined) dbRow.recipient_id = tx.recipient_id;
    if (tx.notes !== undefined) dbRow.notes = tx.notes;
    return dbRow;
}
