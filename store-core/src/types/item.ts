export interface Item {
    id: string;
    name: string;
    category: string;
    subcategory: string;
    images: string[];
    sizes: string[];
    price: number;
    description?: string;
    material?: string;
        
        
    sale_price?: number;
    sale_end_date?: string;
}
