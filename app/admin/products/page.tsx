"use client";

/**
 * app/admin/products/page.tsx
 *
 * Admin Products Management Screen
 * Features:
 *   - Products table (name, price, category, stock) with Edit and Delete actions
 *   - Search & Category filtering
 *   - Responsive desktop table + mobile card layout
 *   - Add & Edit Product Modal for all fields (name, slug, category, price, stock, image_url, description)
 *   - Delete Confirmation Step modal before deletion
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  AlertTriangle,
  RefreshCw,
  Tag,
  Layers,
  Check,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { Product } from "@/types/supabase";

const CATEGORY_OPTIONS = [
  "Electronics",
  "Beauty",
  "Footwear",
  "Home & Office",
  "Sports & Fitness",
  "Bags & Accessories",
  "Kitchen",
  "Apparel",
  "Other",
];

interface ProductFormData {
  name: string;
  slug: string;
  category: string;
  price: string;
  stock: string;
  image_url: string;
  description: string;
}

const DEFAULT_FORM_DATA: ProductFormData = {
  name: "",
  slug: "",
  category: "Electronics",
  price: "",
  stock: "10",
  image_url: "",
  description: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM_DATA);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ── Fetch all products ──────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load products.");
      }
      setProducts(json.data || []);
    } catch (err: unknown) {
      console.error("[AdminProducts] fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Auto-generate slug when name changes in Add mode ────────────────────
  const handleNameChange = (name: string) => {
    setFormData((prev) => {
      // Only auto-generate slug if user hasn't custom-edited it or if editing in add mode
      const isAutoSlug =
        !editingProduct &&
        (prev.slug === "" ||
          prev.slug ===
            prev.name
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/[\s-]+/g, "-"));

      const newSlug = isAutoSlug
        ? name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/[\s-]+/g, "-")
        : prev.slug;

      return { ...prev, name, slug: newSlug };
    });
  };

  // ── Open Add Modal ──────────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData(DEFAULT_FORM_DATA);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // ── Open Edit Modal ─────────────────────────────────────────────────────
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      image_url: product.image_url,
      description: product.description,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // ── Submit Form (Create or Update) ──────────────────────────────────────
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const priceNum = parseFloat(formData.price);
    const stockNum = parseInt(formData.stock, 10);

    if (!formData.name.trim()) {
      setFormError("Product name is required.");
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("Price must be a valid non-negative number.");
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError("Stock must be a valid non-negative integer.");
      return;
    }
    if (!formData.category.trim()) {
      setFormError("Category is required.");
      return;
    }

    setFormSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        category: formData.category.trim(),
        price: priceNum,
        stock: stockNum,
        image_url: formData.image_url.trim(),
        description: formData.description.trim(),
      };

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";
      const method = editingProduct ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save product.");
      }

      setIsFormModalOpen(false);
      showToast(
        editingProduct
          ? `Product "${payload.name}" updated successfully.`
          : `Product "${payload.name}" created successfully.`
      );
      fetchProducts();
    } catch (err: unknown) {
      console.error("[AdminProducts] submit error:", err);
      setFormError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Handle Delete Confirmation ─────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setDeleteSubmitting(true);

    try {
      const res = await fetch(`/api/admin/products/${deletingProduct.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete product.");
      }

      const deletedName = deletingProduct.name;
      setDeletingProduct(null);
      showToast(`Product "${deletedName}" was deleted.`);
      fetchProducts();
    } catch (err: unknown) {
      console.error("[AdminProducts] delete error:", err);
      alert(err instanceof Error ? err.message : "Failed to delete product.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // ── Filtered Products list ──────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return Array.from(cats).sort();
  }, [products]);

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
              Products Management
            </h1>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
              {products.length} Items
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground/60">
            Create, edit, search, and manage catalog items and inventory.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleOpenAddModal}
          id="admin-add-product-btn"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5"
        >
          <Plus size={18} aria-hidden="true" />
          Add Product
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error">
          <AlertCircle size={20} className="shrink-0" aria-hidden="true" />
          <p className="flex-1 font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchProducts}
            className="rounded-lg bg-error px-3 py-1 text-xs font-semibold text-white hover:opacity-90"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Search & Filter Controls ── */}
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
            placeholder="Search by product name, category, or slug…"
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

        {/* Category filter */}
        <div className="sm:w-56">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} (
                {products.filter((p) => p.category === cat).length})
              </option>
            ))}
          </select>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={fetchProducts}
          disabled={loading}
          aria-label="Refresh product list"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground/60 transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ── Products List / Table ── */}
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
      ) : filteredProducts.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface p-12 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary">
            <Package size={28} aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-foreground">No products found</h2>
          <p className="mt-1 text-sm text-foreground/60 max-w-sm">
            {searchQuery || selectedCategory !== "all"
              ? "Try adjusting your search criteria or category filter."
              : "Get started by adding your first product to the catalog."}
          </p>
          {searchQuery || selectedCategory !== "all" ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-4 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground/80 hover:text-primary"
            >
              Clear Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
            >
              <Plus size={14} />
              Add Product
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (md:block) */}
          <div className="hidden md:block overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-secondary/50 text-xs font-bold uppercase tracking-wider text-foreground/60">
                <tr>
                  <th scope="col" className="px-6 py-4">Product</th>
                  <th scope="col" className="px-6 py-4">Category</th>
                  <th scope="col" className="px-6 py-4">Price</th>
                  <th scope="col" className="px-6 py-4">Stock Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="transition-colors hover:bg-secondary/30"
                  >
                    {/* Name & Image */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-foreground/30">
                              <Package size={20} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-foreground">
                            {product.name}
                          </p>
                          <p className="truncate text-xs text-foreground/50 font-mono">
                            /{product.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/80 px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                        <Tag size={11} aria-hidden="true" />
                        {product.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 font-bold text-foreground">
                      ₹{product.price.toLocaleString("en-IN")}
                    </td>

                    {/* Stock */}
                    <td className="px-6 py-4">
                      <StockBadge stock={product.stock} />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(product)}
                          aria-label={`Edit ${product.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:border-primary hover:bg-secondary hover:text-primary"
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProduct(product)}
                          aria-label={`Delete ${product.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:border-error hover:bg-error/10 hover:text-error"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (md:hidden) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-foreground/30">
                        <Package size={24} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-foreground/50 truncate font-mono">
                      /{product.slug}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-extrabold text-primary">
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>
                      <StockBadge stock={product.stock} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                    <Tag size={10} />
                    {product.category}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(product)}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground/80 hover:text-primary"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingProduct(product)}
                      className="inline-flex items-center gap-1 rounded-full border border-error/30 bg-error/10 px-3 py-1.5 text-xs font-semibold text-error hover:bg-error hover:text-white"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── ADD / EDIT PRODUCT MODAL ── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-product-title"
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-surface p-6 shadow-2xl animate-[scaleUp_0.15s_ease-out]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Package size={20} aria-hidden="true" />
                </div>
                <h2 id="modal-product-title" className="text-lg font-bold text-foreground">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/50 hover:bg-secondary hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Error */}
            {formError && (
              <div className="mt-4 rounded-xl border border-error/30 bg-error/10 p-3 text-xs font-medium text-error flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Body */}
            <form onSubmit={handleFormSubmit} className="mt-4 flex flex-col gap-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-1">
                  Product Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AuraSound Pro Headphones"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Slug & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Slug */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    placeholder="aurasound-pro-headphones"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-1">
                    Category <span className="text-error">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Stock Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-1">
                    Price (₹) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    placeholder="2999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-1">
                    Stock Quantity <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    placeholder="10"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground/70 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed product features, specifications, and details…"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Form Actions */}
              <div className="mt-2 flex items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={formSubmitting}
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground/70 hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 hover:brightness-110 disabled:opacity-50"
                >
                  {formSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  {formSubmitting
                    ? "Saving…"
                    : editingProduct
                    ? "Save Changes"
                    : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-delete-title"
            className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl text-center animate-[scaleUp_0.15s_ease-out]"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error/10 text-error">
              <AlertTriangle size={28} aria-hidden="true" />
            </div>

            <h2 id="modal-delete-title" className="mt-4 text-xl font-bold text-foreground">
              Delete Product?
            </h2>

            <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-bold text-foreground">
                &quot;{deletingProduct.name}&quot;
              </span>
              ? This product will be permanently removed from your catalog.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={deleteSubmitting}
                className="w-1/2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground/70 hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
                className="w-1/2 inline-flex items-center justify-center gap-2 rounded-full bg-error px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-error/25 hover:brightness-110 disabled:opacity-50"
              >
                {deleteSubmitting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {deleteSubmitting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stock Badge Helper
// ---------------------------------------------------------------------------

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-error/15 px-2.5 py-0.5 text-xs font-semibold text-error">
        Out of Stock (0)
      </span>
    );
  }
  if (stock <= 10) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">
        Low Stock ({stock})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
      In Stock ({stock})
    </span>
  );
}
