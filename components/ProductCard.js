// components/ProductCard.js
import { useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

export default function ProductCard({ product, onAddToCart, onView }) {
  const [imgError, setImgError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    onAddToCart(product);
    toast.success(`${product.name} ditambahkan ke keranjang!`);
    setTimeout(() => setIsAdding(false), 600);
  };

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  return (
    <div className="product-card group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-amber-brand/8">
      {/* Image */}
      <div className="relative h-56 bg-cream-100 overflow-hidden">
        {product.imageUrl && !imgError ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-108"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: 'linear-gradient(135deg, #FAF0D7, #FDF8EE)' }}>
            🛍️
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-espresso-900/0 group-hover:bg-espresso-900/20 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={() => onView && onView(product)}
            className="p-3 bg-cream-50/90 backdrop-blur-sm rounded-xl text-espresso-900 hover:bg-cream-50 transition-all hover:scale-110 shadow-md">
            <Eye size={18} />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="px-2.5 py-1 text-xs font-mono font-medium bg-amber-brand text-cream-50 rounded-full">
              Baru
            </span>
          )}
          {product.discount > 0 && (
            <span className="px-2.5 py-1 text-xs font-mono font-medium bg-red-500 text-white rounded-full">
              -{product.discount}%
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2.5 py-1 text-xs font-mono font-medium bg-espresso-800/80 text-cream-200 rounded-full">
              Habis
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        {product.category && (
          <span className="text-xs font-mono font-medium text-amber-brand/70 uppercase tracking-wider">
            {product.category}
          </span>
        )}

        {/* Name */}
        <h3 className="font-display text-lg font-semibold text-espresso-900 mt-1 mb-1.5 leading-snug line-clamp-2">
          {product.name}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="font-body text-sm text-espresso-700/60 mb-3 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Rating (dummy) */}
        <div className="flex items-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} className={i < (product.rating || 5) ? 'fill-amber-brand text-amber-brand' : 'text-espresso-200'} />
          ))}
          <span className="text-xs font-mono text-espresso-600/50 ml-1">({product.reviews || 0})</span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-display text-xl font-bold text-espresso-900">
              {formatRupiah(product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price)}
            </div>
            {product.discount > 0 && (
              <div className="text-xs font-body line-through text-espresso-600/40">
                {formatRupiah(product.price)}
              </div>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock || isAdding}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-medium transition-all duration-200 active:scale-95 ${
              isOutOfStock
                ? 'bg-espresso-200/30 text-espresso-600/40 cursor-not-allowed'
                : isAdding
                ? 'bg-sage text-white scale-95'
                : 'bg-amber-brand text-cream-50 hover:bg-amber-dark shadow-sm hover:shadow-md'
            }`}>
            <ShoppingCart size={15} className={isAdding ? 'animate-bounce' : ''} />
            {isAdding ? 'Ditambahkan!' : 'Beli'}
          </button>
        </div>
      </div>
    </div>
  );
}
