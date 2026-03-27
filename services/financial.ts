import { supabase } from '../lib/supabase';
import { Transaction, FinancialComprovante, FinancialAuditLog } from '../types';

export const financialService = {
    async logAudit(transaction_id: string, action: string, detalhes: any = {}) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('financial_audit_log').insert({
            transaction_id,
            user_id: user.id,
            action,
            detalhes
        });
    },

    async getAll(page: number = 0, limit: number = 1000): Promise<Transaction[]> {
        const from = page * limit;
        const to = from + limit - 1;

        const { data, error } = await supabase
            .from('financial_transactions')
            .select('*, financial_comprovantes(id)')
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })
            .range(from, to);

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

        await this.logAudit(data.id, 'CREATE', dbRow);
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

        await this.logAudit(id, 'UPDATE', dbUpdates);
        return mapToFrontend(data);
    },

    async delete(id: string): Promise<void> {
        await this.logAudit(id, 'DELETE');
        
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

        // Log deleting each transaction
        // Ideally we'd log this in bulk, but for simplicity here we can skip or log individual
        for (const id of ids) {
            await this.logAudit(id, 'DELETE', { bulk: true });
        }

        const { error } = await supabase
            .from('financial_transactions')
            .delete()
            .in('id', ids);

        if (error) {
            console.error('SERVER ERROR - deleting multiple transactions:', JSON.stringify(error, null, 2));
            throw error;
        }
    },

    async getSummary() {
        const { data, error } = await supabase
            .from('financial_transactions')
            .select('amount, type, status, date');

        if (error) {
            console.error('Error fetching financial summary:', error);
            throw error;
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return data.reduce((acc, tx) => {
            if (tx.status !== 'COMPLETED') return acc;

            const amount = Number(tx.amount);
            const txDate = new Date(tx.date);
            const isCurrentMonth = txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;

            if (tx.type === 'INCOME') {
                acc.totalBalance += amount;
                if (isCurrentMonth) acc.monthlyIncome += amount;
            } else {
                acc.totalBalance -= amount;
                if (isCurrentMonth) acc.monthlyExpense += amount;
            }

            return acc;
        }, { totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 });
    },

    async uploadComprovante(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('comprovantes-financeiro')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading comprovante:', uploadError);
            throw uploadError;
        }

        return filePath;
    },
    
    async attachComprovante(transaction_id: string, filePath: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { error } = await supabase
            .from('financial_comprovantes')
            .insert({
                transaction_id,
                file_path: filePath,
                created_by: user.id
            });
            
        if (error) {
            console.error('Error attaching comprovante:', error);
            throw error;
        }
        
        await this.logAudit(transaction_id, 'UPLOAD_COMPROVANTE', { file_path: filePath });
    },
    
    async getComprovantes(transaction_id: string): Promise<FinancialComprovante[]> {
        const { data, error } = await supabase
            .from('financial_comprovantes')
            .select(`
                *,
                profiles:created_by (
                    full_name
                )
            `)
            .eq('transaction_id', transaction_id)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Error listing comprovantes:', error);
            return [];
        }
        
        return (data || []).map(item => ({
            id: item.id,
            transaction_id: item.transaction_id,
            file_path: item.file_path,
            created_at: item.created_at,
            created_by: item.created_by,
            user_name: item.profiles?.full_name || 'Usuário Desconhecido'
        }));
    },
    
    async getSignedUrl(filePath: string): Promise<string> {
        // If it looks like a legacy public URL, extract just the path
        let path = (filePath || '').trim();
        if (path.includes('http')) {
             const parts = path.split('/comprovantes-financeiro/');
             if (parts.length > 1) {
                 path = parts[1];
             }
        }
        
        // Clean leading slash if any
        path = path.replace(/^\//, '');
        
        const { data, error } = await supabase.storage
            .from('comprovantes-financeiro')
            .createSignedUrl(path, 60); // 60 seconds expiration
            
        if (error || !data) {
            console.error('Error generating signed URL for path:', path, error);
            throw new Error(`Erro ao acessar o arquivo: ${error?.message || 'Arquivo não encontrado'}`);
        }
        
        return data.signedUrl;
    },

    async deleteComprovante(filePath: string): Promise<void> {
        try {
            let path = (filePath || '').trim();
            if (path.includes('http')) {
                 const parts = path.split('/comprovantes-financeiro/');
                 if (parts.length > 1) {
                     path = parts[1];
                 }
            }
            
            // Clean leading slash
            path = path.replace(/^\//, '');
            
            const { error } = await supabase.storage
                .from('comprovantes-financeiro')
                .remove([path]);

            if (error) {
                console.error('Error deleting comprovante storage object:', error);
                throw error;
            }
        } catch (error) {
           console.error('Failed to delete comprovante from storage', error);
        }
    }
};

// Helpers to map between Frontend Types and Database Columns (snake_case)
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
        registration_id: row.registration_id,
        has_comprovantes: (row.financial_comprovantes && row.financial_comprovantes.length > 0),
        createdAt: row.created_at,
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
    if (tx.registration_id !== undefined) dbRow.registration_id = tx.registration_id;
    return dbRow;
}
