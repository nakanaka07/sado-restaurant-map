# Dockerfile.app - Node.js アプリケーションサーバー
FROM node:22-alpine3.20

LABEL maintainer="sado-restaurant-map-team"
LABEL description="Vite React application server"
LABEL security="Updated to latest Node.js for security patches"

# セキュリティアップデート
RUN apk update && apk upgrade

# セキュリティ強化
RUN apk add --no-cache \
  ca-certificates \
  tzdata

# 非rootユーザー作成
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 作業ディレクトリ設定
WORKDIR /app

# システム依存関係
RUN apk add --no-cache \
  git \
  python3 \
  make \
  g++ \
  curl

# パッケージファイルコピー
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# pnpm インストール
RUN npm install -g pnpm@latest

# 依存関係インストール
RUN pnpm install --frozen-lockfile

# アプリケーションコードコピー
COPY . .

# 権限設定
RUN chown -R nextjs:nodejs /app
USER nextjs

# ビルド実行
RUN pnpm build

# 静的ファイル提供用nginx設定
FROM nginx:alpine AS production

# セキュリティアップデート
RUN apk update && apk upgrade

# ビルド済みファイルコピー
COPY --from=0 /app/dist /usr/share/nginx/html

# nginx設定
COPY config/nginx/app.conf /etc/nginx/conf.d/default.conf

# ポート公開
EXPOSE 3000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# nginx起動
CMD ["nginx", "-g", "daemon off;"]
