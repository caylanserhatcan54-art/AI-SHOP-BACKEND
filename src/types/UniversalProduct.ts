export interface UniversalProduct {
  id: string;                 // platform ürün id (asin, trendyol id vs)
  platform: string;           // "Amazon" | "Trendyol" | ...

  title: string;
  description: string;

  url?: string;

  category: string;           // tshirt, mont, bardak, kedi-mamasi...
  categoryPath: string[];     // ["moda","erkek","ust-giyim","tshirt"]

  attributes: {
    brand?: string;
    gender?: "erkek" | "kadin" | "unisex" | "cocuk";
    material?: string;
    color?: string;
    size?: string;
    sizeOptions?: string[];
    capacity?: string;
    ageGroup?: string;
    fit?: string;
    neck?: string;
    [key: string]: any;
  };

  price?: number;
  priceText?: string;
  currency?: string;

  images: string[];

  rating?: number;
  reviewCount?: number;

  keywords: string[];

  importedAt: number;
}
