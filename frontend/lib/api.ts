const API_BASE_URL = '/api';

export const api = {
    async supabase(action: string, table: string, query?: any) {
        const response = await fetch(`${API_BASE_URL}/supabase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, table, query }),
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        return response.json();
    },

    // Convenience methods for common operations
    async select(table: string, select?: string) {
        return this.supabase('select', table, { select });
    },

    async insert(table: string, data: any) {
        return this.supabase('insert', table, { data });
    },

    async update(table: string, column: string, value: any, data: any) {
        return this.supabase('update', table, { column, value, data });
    },

    async delete(table: string, column: string, value: any) {
        return this.supabase('delete', table, { column, value });
    },
}; 