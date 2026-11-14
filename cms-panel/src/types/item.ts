export interface Item {
	id: string;
	name: string;
	category: string;
	subcategory: string;
	images: string[];
	sizes: string[];
	price: number;
	description?: string | null;
    material?: string | null;
    
    sale_price?: number;
    sale_end_date?: string;
  }
  