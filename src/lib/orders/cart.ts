export type CartItem = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function cartTotal(items: CartItem[], deliveryFee: number) {
  return cartSubtotal(items) + deliveryFee;
}
