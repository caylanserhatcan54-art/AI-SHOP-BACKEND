export interface UniversalProduct {
  productId: string;
  platform: "trendyol" | "amazon" | "hepsiburada" | "n11" | "ciceksepeti";

  title: string;

  price?: {
    value: number;
    currency: string;
  };

  images: string[];

  variants?: {
    sizes?: string[];
    colors?: string[];
  };

  attributes?: Record<string, string>;
  description?: string;
  usageGuide?: string[];

  reviewSummary?: {
    rating?: number;
    pros?: string[];
    cons?: string[];
  };

  importedAt: number;
}
