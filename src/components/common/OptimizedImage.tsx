/**
 * OptimizedImage コンポーネント
 *
 * 最新画像フォーマット(AVIF/WebP)を自動フォールバックするPicture要素ラッパー。
 * ブラウザサポートに応じて最適なフォーマットを配信:
 * - AVIF: -79% (Safari 16.4+, Chrome 85+, Firefox 93+)
 * - WebP: -58% (Chrome 32+, Firefox 65+, Safari 14+)
 * - PNG: フォールバック (全ブラウザ)
 *
 * @example
 * <OptimizedImage
 *   src="/assets/png/cafe_icon.png"
 *   alt="カフェアイコン"
 *   width={48}
 *   height={48}
 * />
 */

import type { ImgHTMLAttributes } from "react";

export interface OptimizedImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  /** 元画像パス (.png/.jpg/.jpeg) */
  src: string;
  /** 代替テキスト (アクセシビリティ必須) */
  alt: string;
  /** 幅 (明示推奨: CLS防止) */
  width?: number | string;
  /** 高さ (明示推奨: CLS防止) */
  height?: number | string;
  /** loading属性 (デフォルト: "lazy") */
  loading?: "lazy" | "eager";
  /** decoding属性 (デフォルト: "async") */
  decoding?: "async" | "sync" | "auto";
}

/**
 * 画像パスから拡張子を除いたベース名を取得
 */
function getBaseName(src: string): string {
  return src.replace(/\.(png|jpg|jpeg)$/i, "");
}

/**
 * OptimizedImage コンポーネント
 *
 * ブラウザが対応する最高圧縮率のフォーマットを自動選択。
 * Picture要素でネイティブフォールバック実装。
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  loading = "lazy",
  decoding = "async",
  className,
  style,
  ...rest
}: OptimizedImageProps) {
  const baseName = getBaseName(src);

  return (
    <picture>
      {/* AVIF: 最高圧縮率 (-79.17%) */}
      <source srcSet={`${baseName}.avif`} type="image/avif" />

      {/* WebP: 広範サポート (-57.77%) */}
      <source srcSet={`${baseName}.webp`} type="image/webp" />

      {/* PNG/JPEG: フォールバック (全ブラウザ) */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        className={className}
        style={style}
        {...rest}
      />
    </picture>
  );
}

// Note: getPreloadLinks()はutils/imageHelpers.tsへ移動予定
// Fast Refresh制約のため、このファイルはコンポーネントのみをエクスポート
