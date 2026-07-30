// TODO: CartContext — global cart state
"use client";

import { createContext, useContext } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  return <CartContext.Provider value={null}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
