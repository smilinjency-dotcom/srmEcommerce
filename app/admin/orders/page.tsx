"use client";

/**
 * app/admin/orders/page.tsx
 *
 * Admin Orders Management Screen
 * Features:
 *   - Orders list (customer name, total, status, date, line items)
 *   - Status filter dropdown (All, Pending, Paid, Shipped, Delivered, Cancelled)
 *   - Search input (customer name, order ID, city, razorpay ID)
 *   - Inline status update selector with instant API persistence
 *   - Detailed order drawer/modal for full shipping & item breakdowns
 *   - Responsive desktop table + mobile card layout
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  ShoppingBag,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  RefreshCw,
  Eye,
  MapPin,
  Phone,
  User,
  Calendar,
  CreditCard,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface OrderItemJoined {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: {
    name: string;
    image_url: string;
    slug: string;
  } | null;
}

interface OrderFull {
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
  order_items?: OrderItemJoined[];
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", icon: Clock, colorClass: "bg-warning/15 text-warning border-warning/30" },
  { value: "paid", label: "Paid", icon: CheckCircle2, colorClass: "bg-primary/15 text-primary border-primary/30" },
  { value: "shipped", label: "Shipped", icon: Truck, colorClass: "bg-secondary text-secondary-foreground border-secondary-foreground/20" },
  { value: "delivered", label: "Delivered", icon: PackageCheck, colorClass: "bg-success/15 text-success border-success/30" },
  { value: "cancelled", label: "Cancelled", icon: XCircle, colorClass: "bg-error/15 text-error border-error/30" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Selected order for detailed modal
  const [detailOrder, setDetailOrder] = useState<OrderFull | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ── Fetch all orders ────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load orders.");
      }
      setOrders(json.data || []);
    } catch (err: unknown) {
      console.error("[AdminOrders] fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Handle Inline Status Update ─────────────────────────────────────────
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);

    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (detailOrder?.id === orderId) {
      setDetailOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update status.");
      }

      showToast(`Order status updated to "${newStatus.toUpperCase()}".`);
    } catch (err: unknown) {
      console.error("[AdminOrders] status update error:", err);
      showToast("Failed to update status. Rolling back.");
      // Rollback on error
      fetchOrders();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ── Filtered Orders list ────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        o.shipping_name.toLowerCase().includes(query) ||
        o.id.toLowerCase().includes(query) ||
        o.shipping_city.toLowerCase().includes(query) ||
        (o.razorpay_order_id && o.razorpay_order_id.toLowerCase().includes(query)) ||
        (o.razorpay_payment_id && o.razorpay_payment_id.toLowerCase().includes(query));

      const matchesStatus =
        selectedStatusFilter === "all" ||
        o.status.toLowerCase() === selectedStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, selectedStatusFilter]);

  // Status metrics summary
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    STATUS_OPTIONS.forEach((st) => {
      counts[st.value] = orders.filter((o) => o.status.toLowerCase() === st.value).length;
    });
    return counts;
  }, [orders]);

  return (
    <div className="flex flex-col gap-8">
      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-xl animate-[slideInRight_0.2s_ease-out]">
          <Check size={18} className="text-success" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Orders Management
            </h1>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
              {orders.length} Total Orders
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground/60">
            View customer orders, review payment details, and update fulfillment status inline.
          </p>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground/80 shadow-sm transition-all hover:border-primary/50 hover:text-primary disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Orders
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error">
          <AlertCircle size={20} className="shrink-0" aria-hidden="true" />
          <p className="flex-1 font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchOrders}
            className="rounded-lg bg-error px-3 py-1 text-xs font-semibold text-white hover:opacity-90"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Status Filter Pills ── */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedStatusFilter("all")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
            selectedStatusFilter === "all"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
              : "border border-border bg-surface text-foreground/70 hover:bg-secondary hover:text-primary"
          }`}
        >
          All Orders ({statusCounts.all || 0})
        </button>
        {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => {
          const isSelected = selectedStatusFilter === value;
          const count = statusCounts[value] || 0;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedStatusFilter(value)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "border border-border bg-surface text-foreground/70 hover:bg-secondary hover:text-primary"
              }`}
            >
              <Icon size={14} aria-hidden="true" />
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Search Bar & Filter Controls ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search input */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search by customer name, order ID, city, or payment ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Dropdown status filter */}
        <div className="sm:w-52">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Filter Status: All ({orders.length})</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label} ({statusCounts[st.value] || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Orders List / Table ── */}
      {loading ? (
        /* Loading Skeletons */
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-20 w-full animate-pulse rounded-2xl border border-border bg-surface"
            />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface p-12 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary">
            <ShoppingBag size={28} aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-foreground">No orders found</h2>
          <p className="mt-1 text-sm text-foreground/60 max-w-sm">
            {searchQuery || selectedStatusFilter !== "all"
              ? "No orders match your search criteria or status filter."
              : "No customer orders have been placed yet."}
          </p>
          {(searchQuery || selectedStatusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedStatusFilter("all");
              }}
              className="mt-4 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground/80 hover:text-primary"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (hidden md:table) */}
          <div className="hidden md:block overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-secondary/50 text-xs font-bold uppercase tracking-wider text-foreground/60">
                <tr>
                  <th scope="col" className="px-6 py-4">Order ID & Date</th>
                  <th scope="col" className="px-6 py-4">Customer Details</th>
                  <th scope="col" className="px-6 py-4">Items Summary</th>
                  <th scope="col" className="px-6 py-4">Total Amount</th>
                  <th scope="col" className="px-6 py-4">Status Control</th>
                  <th scope="col" className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-secondary/30"
                  >
                    {/* Order ID & Date */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs font-bold text-foreground">
                          #{order.id.slice(0, 8)}…
                        </span>
                        <span className="text-xs text-foreground/50 flex items-center gap-1">
                          <Calendar size={11} aria-hidden="true" />
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                    </td>

                    {/* Customer Details */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <User size={13} className="text-primary" aria-hidden="true" />
                          {order.shipping_name || "Guest Customer"}
                        </span>
                        <span className="text-xs text-foreground/50 flex items-center gap-1">
                          <MapPin size={11} aria-hidden="true" />
                          {order.shipping_city
                            ? `${order.shipping_city}, ${order.shipping_postal_code}`
                            : "No address specified"}
                        </span>
                      </div>
                    </td>

                    {/* Items Summary */}
                    <td className="px-6 py-4">
                      <div className="text-xs text-foreground/70">
                        {order.order_items && order.order_items.length > 0 ? (
                          <span>
                            <strong className="text-foreground">
                              {order.order_items.reduce((s, i) => s + i.quantity, 0)} items
                            </strong>{" "}
                            (
                            {order.order_items
                              .map((i) => i.products?.name || "Item")
                              .slice(0, 2)
                              .join(", ")}
                            {order.order_items.length > 2 ? "…" : ""})
                          </span>
                        ) : (
                          <span className="text-foreground/40">No items breakdown</span>
                        )}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-foreground text-base">
                        ₹{order.total_amount.toLocaleString("en-IN")}
                      </span>
                    </td>

                    {/* Status Inline Control */}
                    <td className="px-6 py-4">
                      <InlineStatusSelect
                        orderId={order.id}
                        currentStatus={order.status}
                        updating={updatingOrderId === order.id}
                        onChange={(newSt) => handleStatusChange(order.id, newSt)}
                      />
                    </td>

                    {/* Actions / View Details */}
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setDetailOrder(order)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground/80 hover:border-primary hover:text-primary"
                      >
                        <Eye size={13} aria-hidden="true" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (md:hidden) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm"
              >
                {/* Header: ID + Status */}
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-foreground">
                      #{order.id.slice(0, 8)}…
                    </span>
                    <p className="text-xs text-foreground/50 mt-0.5">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <InlineStatusSelect
                    orderId={order.id}
                    currentStatus={order.status}
                    updating={updatingOrderId === order.id}
                    onChange={(newSt) => handleStatusChange(order.id, newSt)}
                  />
                </div>

                {/* Body: Customer & Total */}
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <User size={14} className="text-primary" />
                      {order.shipping_name || "Guest Customer"}
                    </span>
                    <span className="text-base font-extrabold text-primary">
                      ₹{order.total_amount.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <p className="text-xs text-foreground/60 flex items-center gap-1">
                    <MapPin size={12} />
                    {order.shipping_city || "No city"}, {order.shipping_postal_code || ""}
                  </p>

                  {/* Items summary */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="mt-1 rounded-xl bg-secondary/50 p-2.5 text-xs text-foreground/70">
                      <span className="font-semibold text-foreground">
                        {order.order_items.reduce((s, i) => s + i.quantity, 0)} items:
                      </span>{" "}
                      {order.order_items
                        .map((i) => `${i.quantity}× ${i.products?.name || "Item"}`)
                        .join(", ")}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-1 text-right">
                  <button
                    type="button"
                    onClick={() => setDetailOrder(order)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-background py-2 text-xs font-semibold text-foreground/80 hover:text-primary"
                  >
                    <Eye size={14} />
                    View Order Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── ORDER DETAIL MODAL ── */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-order-title"
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-surface p-6 shadow-2xl animate-[scaleUp_0.15s_ease-out]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <ShoppingBag size={20} aria-hidden="true" />
                </div>
                <div>
                  <h2 id="modal-order-title" className="text-lg font-bold text-foreground">
                    Order Details
                  </h2>
                  <p className="text-xs font-mono text-foreground/50">
                    ID: {detailOrder.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/50 hover:bg-secondary hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="mt-4 flex flex-col gap-6 text-sm">
              {/* Order Status & Change */}
              <div className="flex flex-col gap-2 rounded-2xl bg-secondary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground/50">
                    Current Status
                  </span>
                  <div className="mt-1">
                    <StatusBadge status={detailOrder.status} />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <span className="text-xs font-medium text-foreground/60">
                    Change Status:
                  </span>
                  <InlineStatusSelect
                    orderId={detailOrder.id}
                    currentStatus={detailOrder.status}
                    updating={updatingOrderId === detailOrder.id}
                    onChange={(newSt) => handleStatusChange(detailOrder.id, newSt)}
                  />
                </div>
              </div>

              {/* Shipping & Customer Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 flex items-center gap-1.5">
                    <User size={13} className="text-primary" />
                    Customer & Shipping
                  </h3>
                  <p className="font-bold text-foreground">
                    {detailOrder.shipping_name || "N/A"}
                  </p>
                  <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                    {detailOrder.shipping_address || "No street address"}
                    <br />
                    {detailOrder.shipping_city},{" "}
                    {detailOrder.shipping_postal_code}
                  </p>
                  {detailOrder.shipping_phone && (
                    <p className="text-xs font-semibold text-primary mt-2 flex items-center gap-1">
                      <Phone size={12} />
                      {detailOrder.shipping_phone}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2 flex items-center gap-1.5">
                    <CreditCard size={13} className="text-primary" />
                    Payment Info
                  </h3>
                  <p className="text-xs text-foreground/70">
                    <span className="font-semibold text-foreground">Date:</span>{" "}
                    {formatDate(detailOrder.created_at)}
                  </p>
                  <p className="text-xs text-foreground/70 mt-1">
                    <span className="font-semibold text-foreground">Razorpay Order ID:</span>{" "}
                    <span className="font-mono">{detailOrder.razorpay_order_id || "N/A"}</span>
                  </p>
                  <p className="text-xs text-foreground/70 mt-1">
                    <span className="font-semibold text-foreground">Payment ID:</span>{" "}
                    <span className="font-mono">{detailOrder.razorpay_payment_id || "N/A"}</span>
                  </p>
                </div>
              </div>

              {/* Order Items Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-3 flex items-center gap-1.5">
                  <ShoppingBag size={13} className="text-primary" />
                  Order Items ({detailOrder.order_items?.length || 0})
                </h3>

                {detailOrder.order_items && detailOrder.order_items.length > 0 ? (
                  <div className="overflow-hidden rounded-2xl border border-border bg-background">
                    <table className="min-w-full divide-y divide-border text-left text-xs">
                      <thead className="bg-secondary/50 font-bold uppercase text-foreground/60">
                        <tr>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">Price</th>
                          <th className="px-4 py-3 text-center">Qty</th>
                          <th className="px-4 py-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-medium">
                        {detailOrder.order_items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                                  {item.products?.image_url ? (
                                    <Image
                                      src={item.products.image_url}
                                      alt={item.products.name || "Product"}
                                      fill
                                      sizes="40px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-foreground/30">
                                      <ShoppingBag size={16} />
                                    </div>
                                  )}
                                </div>
                                <span className="font-semibold text-foreground">
                                  {item.products?.name || "Product Item"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-foreground/80">
                              ₹{item.price.toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-3 text-center font-bold">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-foreground">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-foreground/50 italic">No line items recorded.</p>
                )}
              </div>

              {/* Total Summary */}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-base font-bold text-foreground">Total Amount</span>
                <span className="text-2xl font-black text-primary">
                  ₹{detailOrder.total_amount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 border-t border-border pt-4 text-right">
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-110"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Status Select Component
// ---------------------------------------------------------------------------

interface InlineStatusSelectProps {
  orderId: string;
  currentStatus: string;
  updating: boolean;
  onChange: (newStatus: string) => void;
}

function InlineStatusSelect({
  currentStatus,
  updating,
  onChange,
}: InlineStatusSelectProps) {
  const normStatus = currentStatus.toLowerCase();

  return (
    <div className="relative inline-flex items-center">
      <select
        value={normStatus}
        disabled={updating}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Change order status"
        className={`appearance-none rounded-full border px-3 py-1.5 pr-7 text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          normStatus === "pending"
            ? "border-warning/40 bg-warning/15 text-warning"
            : normStatus === "paid"
            ? "border-primary/40 bg-primary/15 text-primary"
            : normStatus === "shipped"
            ? "border-secondary-foreground/30 bg-secondary text-secondary-foreground"
            : normStatus === "delivered"
            ? "border-success/40 bg-success/15 text-success"
            : "border-error/40 bg-error/15 text-error"
        }`}
      >
        <option value="pending">Pending</option>
        <option value="paid">Paid</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <ChevronDown
        size={12}
        className="pointer-events-none absolute right-2 text-current opacity-70"
        aria-hidden="true"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Badge Component
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const normStatus = status.toLowerCase();
  const matched = STATUS_OPTIONS.find((s) => s.value === normStatus);
  const Icon = matched?.icon || Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
        matched?.colorClass || "bg-secondary text-secondary-foreground border-border"
      }`}
    >
      <Icon size={12} aria-hidden="true" />
      {matched?.label || status}
    </span>
  );
}

// Helper: Format Date
function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}
