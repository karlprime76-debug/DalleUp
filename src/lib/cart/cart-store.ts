"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  description: string;
  image: string;
  category?: string;
  productType?: string;
  isAlcohol?: boolean;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  message: string | null;
};

const CART_KEY = "dalleup_cart";
const DELIVERY_FEE = 1200;
let state: CartState = { items: [], message: null };
const listeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined";
}

function emit() {
  listeners.forEach((listener) => listener());
}

function save() {
  if (isBrowser()) window.localStorage.setItem(CART_KEY, JSON.stringify(state.items));
  emit();
}

function load() {
  if (!isBrowser()) return;
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    state = { ...state, items: raw ? JSON.parse(raw) : [] };
  } catch {
    state = { ...state, items: [] };
  }
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return { items: [], message: null };
}

function setMessage(message: string | null) {
  state = { ...state, message };
  emit();
}

function clearMessage() {
  state = { ...state, message: null };
  emit();
}

export const cartStore = {
  addItem(item: Omit<CartItem, "quantity">) {
    const currentRestaurantId = state.items[0]?.restaurantId;
    if (currentRestaurantId && currentRestaurantId !== item.restaurantId) {
      state = { items: [{ ...item, quantity: 1 }], message: "Panier remplacé avec ce restaurant" };
      save();
      return;
    }
    const existing = state.items.find((cartItem) => cartItem.id === item.id);
    state = existing
      ? { ...state, items: state.items.map((cartItem) => cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem), message: `${item.name} ajouté` }
      : { ...state, items: [...state.items, { ...item, quantity: 1 }], message: `${item.name} ajouté` };
    save();
  },
  removeItem(itemId: string) {
    state = { ...state, items: state.items.filter((item) => item.id !== itemId), message: "Article supprimé" };
    save();
  },
  incrementItem(itemId: string) {
    state = { ...state, items: state.items.map((item) => item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item) };
    save();
  },
  decrementItem(itemId: string) {
    state = { ...state, items: state.items.flatMap((item) => item.id !== itemId ? [item] : item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []) };
    save();
  },
  clearCart() {
    state = { items: [], message: "Panier vidé" };
    save();
  },
  getSubtotal(items = state.items) {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
  getDeliveryFee(items = state.items) {
    return items.length > 0 ? DELIVERY_FEE : 0;
  },
  getTotal(items = state.items) {
    return cartStore.getSubtotal(items) + cartStore.getDeliveryFee(items);
  },
  getItemsCount(items = state.items) {
    return items.reduce((total, item) => total + item.quantity, 0);
  },
  setMessage,
  clearMessage,
};

export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    ...snapshot,
    addItem: cartStore.addItem,
    removeItem: cartStore.removeItem,
    incrementItem: cartStore.incrementItem,
    decrementItem: cartStore.decrementItem,
    clearCart: cartStore.clearCart,
    setMessage: cartStore.setMessage,
    clearMessage: cartStore.clearMessage,
    subtotal: cartStore.getSubtotal(snapshot.items),
    deliveryFee: cartStore.getDeliveryFee(snapshot.items),
    total: cartStore.getTotal(snapshot.items),
    itemsCount: cartStore.getItemsCount(snapshot.items)
  };
}
