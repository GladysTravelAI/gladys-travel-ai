import { ShoppingCart, X, Calendar, User, CreditCard, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CartItem {
  type: 'flight' | 'hotel';
  id: string;
  name: string;
  details: string;
  price: number;
  date?: string;
}

interface BookingCartProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export default function BookingCart({ items, onRemoveItem, onCheckout }: BookingCartProps) {
  const [isOpen, setIsOpen] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const serviceFee = subtotal * 0.05; // 5% service fee
  const total = subtotal + serviceFee;

  if (!isOpen && items.length === 0) return null;

  return (
    <>
      {/* Floating Cart Button */}
      {items.length > 0 && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-transform"
        >
          <ShoppingCart size={24} />
          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
            {items.length}
          </Badge>
        </button>
      )}

      {/* Cart Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="text-white" size={24} />
                  <h2 className="text-2xl font-bold text-white">Your Trip</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="text-white" size={24} />
                </button>
              </div>
              <p className="text-white/80 text-sm mt-2">{items.length} items selected</p>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">Your cart is empty</p>
                  <p className="text-sm text-gray-400 mt-2">Add flights and hotels to get started</p>
                </div>
              ) : (
                items.map((item) => (
                  <Card key={item.id} className="p-4 border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge className={item.type === 'flight' ? 'bg-blue-500' : 'bg-green-500'}>
                          {item.type === 'flight' ? '✈️ Flight' : '🏨 Hotel'}
                        </Badge>
                        <h3 className="font-semibold text-gray-800 mt-2">{item.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{item.details}</p>
                        {item.date && (
                          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                            <Calendar size={14} />
                            <span>{item.date}</span>
                          </div>
                        )}
                        <p className="text-lg font-bold text-blue-600 mt-2">${item.price}</p>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-2 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <X className="text-red-500" size={18} />
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Summary & Checkout */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Service Fee (5%)</span>
                    <span className="font-semibold">${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-gray-300" />
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-blue-600">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={onCheckout}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-semibold"
                >
                  <CreditCard size={20} className="mr-2" />
                  Proceed to Checkout
                </Button>

                <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
                  <Check size={14} className="text-green-500" />
                  <span>Secure payment • Instant confirmation</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}