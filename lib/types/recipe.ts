export type TagColor =
  | 'gray'
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'green'
  | 'emerald'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'pink';

export interface Tag {
  id: number;
  name: string;
  color: TagColor;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TagInput {
  name: string;
  color: TagColor;
}

export interface Ingredient {
  id?: number;
  name: string;
  amount: string | null;
  unit: string | null;
  sortOrder?: number;
}

export interface Recipe {
  id: string;
  title: string;
  instructions: string;
  servings: number;
  imageData: string | null;
  sourceUrl: string | null;
  ingredients: Ingredient[];
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeInput {
  title: string;
  instructions: string;
  servings: number;
  imageData?: string | null;
  sourceUrl?: string | null;
  ingredients: Omit<Ingredient, 'id' | 'sortOrder'>[];
  tagIds?: number[];
}

export interface RecipeListItem {
  id: string;
  title: string;
  imageData: string | null;
  servings: number;
  tags: Tag[];
  createdAt: Date;
}
