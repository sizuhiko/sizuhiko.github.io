---
title: モノレポ構成の Next.js を standalone ビルドして Docker で動かす（404エラー対策）
date: 2026-04-15 08:38 UTC
tags: 
- Next.js
- monorepo
---

このブログは NPM workspaces を使ったモノレポ構成のリポジトリ内にある Next.js アプリを standalone するときに注意すべき点についてまとめた記事です。

## NPM workspaces を使ったモノレポ構成

たとえば以下のようなディレクトリ階層を想定しています。

- apps/webapp : Next.js の web アプリのワークスペース
- infra : AWS CDK など IaC コードのワークスペース
- packages/components : React コンポーネントのワークスペース
- packages/functions/xxxxx : AWS Lambda 関数ごとのワークスペース

これ以外にも packages の下にいろいろなパッケージを入れるような構成はよくあると思います。

## Next.js アプリを standalone ビルドする

`next.config.ts` が以下のような感じで  `standalone` ビルドする想定です。

```typescript
import type { NextConfig } from 'next'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@packages/components'],
  images: { unoptimized: true },
  output: 'standalone',
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackMemoryOptimizations: true,
  },
}
```

一般的に Dockerfile は [Next.js の公式サンプル](https://github.com/vercel/next.js/tree/canary/examples/with-docker)からもってきます。

## コンテナイメージをビルドしてみる

はい、いきなりビルドが通りません。
どうやら、モノレポの上位階層にある node_modules（依存パッケージ）を standalone ディレクトリにコピー対象として含めたいのですが、`apps/webapp` ディレクトリにないのが原因なようです。

これは `next.config.ts` が以下のような感じで  `outputFileTracingRoot` を追加します。それによりルートディレクトリの `node_modules`  を参照してくれます（これがないと、Next.js は自分のディレクトリ（apps/webapp）内しかトレースしてくれません）。

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@packages/components'],
  images: { unoptimized: true },
  outputFileTracingRoot: join(__dirname, '../../'),
  output: 'standalone',
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackMemoryOptimizations: true,
  },
}
```

これでビルドは成功するようになります。

## 動かしてみる

なんか全部のページが404エラーになります。

イメージビルド結果に `public` ディレクトリが入ってないことがまずわかりました。

## ビルド方法を疑って調べてみてわかったこと

ここで Gemini とか生成AIを使って解決策を壁打ちしてたんですが、適切な回答はまったく得られませんでした。
で、それっぽいキーワードでネットを検索していると、良い記事を見つけました。[モノレポ構成のNext.jsプロジェクトをDocker化する方法](https://zenn.dev/glassonion1/articles/734b8db0f5a47e)

大事なのは、記事の中でビルド結果のファイルをコピーしているとことです。

```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
```

で、元の公式サンプルでは以下のようになっていました。

```dockerfile
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
```

差分がわかりやすいですね。つまりモノレポの場合は、モノレポのパスを含めた状態で `.next/static` と `public` のフォルダをコピーする必要があるということです。

今回は `.next/standalone` の中身をこうすることになります：

```
└── apps/
    └── webapp/
        ├── server.js  <-- これを起動する
        ├── public/    <-- ここにコピーが必要
        └── .next/
            └── static/ <-- ここにコピーが必要
```

## これで解決

結果としてできあがった Dockerfile は以下のような感じです

```dockerfile
# syntax=docker.io/docker/dockerfile:1

ARG NODE_VERSION=24.13.0-alpine
FROM node:${NODE_VERSION} AS base

FROM base AS deps
RUN apk update && \
  apk upgrade && \
  apk add --no-cache libc6-compat make gcc g++ python3
WORKDIR /app

COPY . .
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

FROM base AS builder
WORKDIR /app
# モノレポのため、全階層の node_modules が必要。webapp から参照するワークスペースについてはコピーする
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/webapp/node_modules* ./apps/webapp/node_modules/
COPY --from=deps /app/functions/command/node_modules* ./functions/command/node_modules/
COPY --from=deps /app/packages/components/node_modules* ./packages/components/node_modules/
COPY . .

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run -w apps/webapp build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# モノレポのディレクトリパスを含める
COPY --from=builder --chown=nextjs:nodejs /app/apps/webapp/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/webapp/.next/static ./apps/webapp/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/webapp/public ./apps/webapp/public

USER nextjs

EXPOSE 3000

ENV PORT=3000

ENV HOSTNAME="0.0.0.0"
# モノレポのディレクトリパスを含める
CMD ["node",  "apps/webapp/server.js"]
```

### COPY でモノレポの node_modules が必要になる理由

- シンボリックリンクの解決: NPM workspaces は、packages/components などを node_modules 内にシンボリックリンクとして配置します。Docker の COPY プロセスでこのリンク関係が崩れたり、リンク先のパスが正しく参照できなかったりすることがあります。
- 依存関係の分離: 一部のビルドツールや Next.js の outputFileTracing は、各ワークスペース直下の node_modules を探しに行く挙動をすることがあります。

### server.js にモノレポのディレクトリパスを含める理由

Next.js の standalone モードは、デフォルトでは `server.js` をカレントディレクトリとして動作しようとしますが、モノレポだと `outputFileTracingRoot` の影響で `apps/webapp/server.js` のような深い階層に生成されるので、実行パスにも注意が必要です。

## さいごに

意外とよくあるシーンだと思うのですが、意外と情報に辿り着くまでに時間がかかりました。
僕の記事も追加することで、同じ問題で困っている人の解決になればと思います。
