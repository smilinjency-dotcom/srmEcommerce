"use client";

/**
 * app/admin/page.tsx
 *
 * Admin Dashboard Home
 * Displays summary cards for:
 *   - Total Orders
 *   - Total Pending Orders
 *   - Total Paid Orders
 *   - Total Products
 *
 * Data is fetched from Supabase via lib/supabase.ts.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Package,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SummaryStats {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  totalProducts: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch orders and products in parallel
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from("orders").select("id, status"),
        supabase.from("products").select("id"),
      ]);

      if (ordersRes.error) {
        throw new Error(`Failed to fetch orders: ${ordersRes.error.message}`);
      }
      if (productsRes.error) {
        throw new Error(`Failed to fetch products: ${productsRes.error.message}`);
      }

      const ordersData = (ordersRes.data ?? []) as { id: string; status: string }[];
      const productsData = (productsRes.data ?? []) as { id: string }[];

      const pendingCount = ordersData.filter(
        (o) => o.status?.toLowerCase() === "pending"
      ).length;
      const paidCount = ordersData.filter(
        (o) => o.status?.toLowerCase() === "paid"
      ).length;

      setStats({
        totalOrders: ordersData.length,
        pendingOrders: pendingCount,
        paidOrders: paidCount,
        totalProducts: productsData.length,
      });
    } catch (err: unknown) {
      console.error("[AdminDashboard] fetchStats error:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to load dashboard statistics.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="flex flex-col gap-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Real-time metric summary of your store products and customer orders.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchStats(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-border
              bg-surface px-4 py-2 text-xs font-semibold text-foreground/80
              shadow-sm transition-all duration-200
              hover:border-primary/50 hover:text-primary hover:-translate-y-px
              disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin text-primary" : ""}
              aria-hidden="true"
            />
            {refreshing ? "Refreshing…" : "Refresh Stats"}
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error">
          <AlertCircle size={20} className="shrink-0" aria-hidden="true" />
          <p className="flex-1 font-medium">{error}</p>
          <button
            type="button"
            onClick={() => fetchStats()}
            className="rounded-lg bg-error px-3 py-1 text-xs font-semibold text-white hover:opacity-90"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Orders */}
        <SummaryCard
          title="Total Orders"
          value={stats?.totalOrders}
          loading={loading}
          description="All-time placed orders"
          icon={ShoppingBag}
          iconColor="text-primary"
          bgColor="bg-secondary"
          badgeText="Orders"
          href="/admin/orders"
        />

        {/* Card 2: Pending Orders */}
        <SummaryCard
          title="Pending Orders"
          value={stats?.pendingOrders}
          loading={loading}
          description="Awaiting processing or payment"
          icon={Clock}
          iconColor="text-warning"
          bgColor="bg-warning/15"
          badgeText="Pending"
          href="/admin/orders?status=pending"
        />

        {/* Card 3: Paid Orders */}
        <SummaryCard
          title="Paid Orders"
          value={stats?.paidOrders}
          loading={loading}
          description="Successfully completed sales"
          icon={CheckCircle2}
          iconColor="text-success"
          bgColor="bg-success/15"
          badgeText="Completed"
          href="/admin/orders?status=paid"
        />

        {/* Card 4: Total Products */}
        <SummaryCard
          title="Total Products"
          value={stats?.totalProducts}
          loading={loading}
          description="Active items in store catalog"
          icon={Package}
          iconColor="text-primary"
          bgColor="bg-secondary"
          badgeText="Catalog"
          href="/admin/products"
        />
      </div>

      {/* ── Quick Nav & Management Section ── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Manage Products Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Package size={24} aria-hidden="true" />
            </div>
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground/60">
              Catalog Management
            </span>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-bold text-foreground">Products Section</h2>
            <p className="mt-1 text-sm text-foreground/60">
              View catalog items, manage inventory, add new products, or update existing product details.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:brightness-110 hover:-translate-y-0.5"
            >
              Go to Products
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Manage Orders Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <ShoppingBag size={24} aria-hidden="true" />
            </div>
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground/60">
              Fulfillment
            </span>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-bold text-foreground">Orders Section</h2>
            <p className="mt-1 text-sm text-foreground/60">
              Monitor incoming customer purchases, review payment status, and track order fulfillment.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:brightness-110 hover:-translate-y-0.5"
            >
              Go to Orders
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Status Breakdown Bar ── */}
      {stats && stats.totalOrders > 0 && (
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" aria-hidden="true" />
              <h3 className="text-base font-bold text-foreground">Order Status Breakdown</h3>
            </div>
            <span className="text-xs font-semibold text-foreground/50">
              {stats.totalOrders} Total
            </span>
          </div>

          {/* Progress Bar */}
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="bg-success transition-all duration-500"
              style={{
                width: `${(stats.paidOrders / stats.totalOrders) * 100}%`,
              }}
              title={`Paid Orders: ${stats.paidOrders}`}
            />
            <div
              className="bg-warning transition-all duration-500"
              style={{
                width: `${(stats.pendingOrders / stats.totalOrders) * 100}%`,
              }}
              title={`Pending Orders: ${stats.pendingOrders}`}
            />
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-6 text-xs font-medium text-foreground/70">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              <span>Paid ({stats.paidOrders})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-warning" />
              <span>Pending ({stats.pendingOrders})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
              <span>Other ({stats.totalOrders - stats.paidOrders - stats.pendingOrders})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary Card Component
// ---------------------------------------------------------------------------

interface SummaryCardProps {
  title: string;
  value?: number;
  loading: boolean;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  badgeText: string;
  href: string;
}

function SummaryCard({
  title,
  value,
  loading,
  description,
  icon: Icon,
  iconColor,
  bgColor,
  badgeText,
  href,
}: SummaryCardProps) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
      <div>
        {/* Icon & Badge */}
        <div className="flex items-center justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bgColor} ${iconColor}`}>
            <Icon size={22} aria-hidden="true" />
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-secondary-foreground">
            {badgeText}
          </span>
        </div>

        {/* Title */}
        <h2 className="mt-4 text-xs font-bold uppercase tracking-wider text-foreground/50">
          {title}
        </h2>

        {/* Value */}
        <div className="mt-1">
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
          ) : (
            <p className="text-3xl font-extrabold tracking-tight text-foreground">
              {value?.toLocaleString() ?? 0}
            </p>
          )}
        </div>

        {/* Description */}
        <p className="mt-2 text-xs text-foreground/60 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Card footer link */}
      <div className="mt-5 border-t border-border pt-3">
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
        >
          View details
          <ArrowRight size={13} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
