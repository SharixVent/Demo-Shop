export interface CategorySection {
  label: string;
  subcategories: string[];
}

export interface Category {
  id: string;
  key: string;
  label: string;
  sections: CategorySection[];
  order: number;
}
