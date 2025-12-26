import { supabase } from '../lib/supabase';
import { InventoryItem } from '../types';

export const inventoryService = {
    async getAll(): Promise<InventoryItem[]> {
        const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching inventory:', error);
            throw error;
        }

        return data.map(mapToFrontend);
    },

    async create(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
        const dbRow = mapToDb(item);
        const { data, error } = await supabase
            .from('inventory_items')
            .insert(dbRow)
            .select()
            .single();

        if (error) {
            console.error('Error creating inventory item:', error);
            throw error;
        }

        return mapToFrontend(data);
    },

    async update(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
        const dbUpdates = mapToDb(updates);
        const { data, error } = await supabase
            .from('inventory_items')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating inventory item:', error);
            throw error;
        }

        return mapToFrontend(data);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('inventory_items')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting inventory item:', error);
            throw error;
        }
    }
};

function mapToFrontend(row: any): InventoryItem {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        quantity: row.quantity,
        condition: row.status as any, // DB uses 'status'
        location: row.location || 'Sede',
        lastInspection: row.last_audit_date, // DB uses 'last_audit_date'
        unit: row.unit,
        price: Number(row.price || 0),
        supplier: row.supplier,
        description: row.description,
        expirationDate: row.expiration_date,
    };
}

function mapToDb(item: Partial<InventoryItem>): any {
    const dbRow: any = {};
    if (item.name !== undefined) dbRow.name = item.name;
    if (item.category !== undefined) dbRow.category = item.category;
    if (item.quantity !== undefined) dbRow.quantity = item.quantity;
    if (item.condition !== undefined) dbRow.status = item.condition;
    if (item.location !== undefined) dbRow.location = item.location;
    if (item.lastInspection !== undefined) dbRow.last_audit_date = item.lastInspection;
    if (item.unit !== undefined) dbRow.unit = item.unit;
    if (item.price !== undefined) dbRow.price = item.price;
    if (item.supplier !== undefined) dbRow.supplier = item.supplier;
    if (item.description !== undefined) dbRow.description = item.description;
    if (item.expirationDate !== undefined) dbRow.expiration_date = item.expirationDate;
    return dbRow;
}
