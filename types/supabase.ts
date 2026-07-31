/**
 * types/supabase.ts
 *
 * Hand-written TypeScript types that mirror the Supabase schema.
 * These can be replaced with auto-generated types from the Supabase CLI:
 *   npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
 */

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: number;
          image_url: string;
          category: string;
          stock: number;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          price: number;
          image_url: string;
          category: string;
          stock?: number;
          slug: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };

      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          quantity: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Insert"]>;
      };

      orders: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          total_amount: number;
          shipping_name: string;
          shipping_address: string;
          shipping_city: string;
          shipping_postal_code: string;
          shipping_phone: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: string;
          total_amount: number;
          shipping_name: string;
          shipping_address: string;
          shipping_city: string;
          shipping_postal_code: string;
          shipping_phone: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };

      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience row-type aliases
export type Product   = Database["public"]["Tables"]["products"]["Row"];
export type CartItem  = Database["public"]["Tables"]["cart_items"]["Row"];
export type Order     = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
