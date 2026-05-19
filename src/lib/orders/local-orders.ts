"use client";

import type { CartItem } from "@/lib/cart/cart-store";

export type LocalOrder = {
  id: string;
  reference: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: "CASH_ON_DELIVERY" | "MTN_MOMO" | "MOOV_MONEY" | "CARD";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  orderStatus: "PENDING" | "ACCEPTED" | "PREPARING" | "READY" | "ON_THE_WAY" | "DELIVERED";
  address: string;
  createdAt: string;
};

const ORDERS_KEY = "dalleup_orders";

function readOrders(): LocalOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: LocalOrder[]) {
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function createLocalOrder(input: Omit<LocalOrder, "id" | "reference" | "createdAt" | "paymentStatus" | "orderStatus">) {
  const id = `local-${Date.now()}`;
  const order: LocalOrder = {
    ...input,
    id,
    reference: `DU-${String(Date.now()).slice(-6)}`,
    paymentStatus: "PENDING",
    orderStatus: "PENDING",
    createdAt: new Date().toISOString()
  };
  writeOrders([order, ...readOrders()]);
  return order;
}

export function getLocalOrders() {
  return readOrders();
}

export function getLocalOrderById(id: string) {
  return readOrders().find((order) => order.id === id || order.reference === id);
}

export function updateLocalOrderStatus(id: string, orderStatus: LocalOrder["orderStatus"]) {
  const orders = readOrders().map((order) => order.id === id ? { ...order, orderStatus } : order);
  writeOrders(orders);
  return orders.find((order) => order.id === id);
}
