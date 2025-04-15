---
title: Next.js を standalone ビルドしたアプリで New Relic エージェントを動かす
date: 2025-04-15 01:36 UTC
tags: 
- Next.js
- AppRunner
- NewRelic
---

こちらの記事は [Next.js で作ったアプリケーションを AppRunner にデプロイする](/2025/04/11/next-js-deploy-to-apprunner.html) の続編となります。
前編を読まないとわからない内容ではないですが、もし良ければ事前に確認してください。

前の記事で Next.js を standalone ビルドしたアプリを App Runner にデプロイするところまで書きました。

そのアプリでテスト環境のとき New Relic エージェントを入れたいということでやってみたんですが、ものすごいハマりどころが多かったので誰かの役に立てばと思い記事にします。

### エージェントのインストールと起動方法

New Relic の Node.js エージェントは [node-newrelic](https://github.com/newrelic/node-newrelic) というリポジトリにある OSS ライブラリです。
利用するときは以下のように [Node.js の --require module](https://nodejs.org/api/cli.html#-r---require-module) オプションを使って起動するようです。

```sh
$ node -r newrelic your-program.js
```

Next.js で利用する場合の例として [Next.js example projects](https://github.com/newrelic/node-newrelic/tree/main?tab=readme-ov-file#nextjs-instrumentation) というのも用意されていますが、今回は standalone モードでビルドされてますので、 `Custom Next.js servers` というところのやり方と一緒で結局 `--require module` モードで起動することになります。

### やってみる

まず `npm install newrelic` でパッケージを追加しておいて、 Next.js のリポジトリにある standalone ビルドの Dockerfile で起動スクリプトを以下のように変更します。

```dockerfile
# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "-r", "newrelic", "server.js"]
```

はい、起動しません。

> Error: Cannot find module '/app/node_modules/lodash/lodash.js'. Please verify that the package.json has a valid "main" entry
> at Object.<anonymous> (/app/node_modules/@newrelic/security-agent/lib/nr-security-agent/lib/core/commonUtils.js:20:16)

### 調べよう

[newrelic/csec-node-agent という依存モジュールの package,json](https://github.com/newrelic/csec-node-agent/blob/main/package.json) の中に `lodash` があるのを見つけました。

で、使っている場所は[この行](https://github.com/newrelic/csec-node-agent/blob/main/lib/nr-security-agent/lib/core/commonUtils.js#L20)なんですが、いやな使い方をしていますね。

```javascript
const lodash = require('lodash')
// ここを
const isEmpty = require('lodash/isEmpty')
```

下のように記述してくれていれば良い（実際 `isEmpty` しか使ってない）のですけど...
まぁとはいえ動きません。

まず何でかっていうと、そもそも Next.js は standalone モードでビルドされていて、コンテナサイズを小さくするために Next.js から依存関係にないパッケージは入りません。
つまり New Relic のエージェントを `--require module` モードで起動すると、依存しているパッケージがないので動かないという、まぁ至極その通りな感じであります。

で、いろいろネットの情報を調べていたら、サーバー起動する直前で `npm i newrelic` すると良いよというのを見つけました。
[以下のソース](https://gist.github.com/bizob2828/0fa170a9194838cab5dc8fbb00109425)

```dockerfile
# Install the next.js plugin after it copies the standalone server and static bits to workdir
# I cannot figure out why If I just install `@newrelic/next` and add to project's package.json
# why it does not copy them over but it does not for some reason so we will add it after all the copying
# occurs
RUN npm i newrelic

USER nextjs

EXPOSE 3000

ENV PORT 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENV HOSTNAME="0.0.0.0"

CMD ["node", "-r", "newrelic", "server.js"]
```

なるほどねー、ってことでやってみました。

.... 動かない....

なんでかって言うと、僕らのアプリでは、依存関係で（厳密にいうと依存の依存に）すでに lodash があったんですね。つまりこの状況( `/app/node_modules/lodash/` が存在する )で依存の依存で lodash 入れようと思ってもすでに入っているので、追加(上書き)では入りません。
まぁそうですよね。npm とはそういうものです。で、その lodash は standalone モードで使ってないモジュールは消されているので `lodash.js` という一等地の全部インポートファイルはありません。せめて ` require('lodash/isEmpty')` なっていれば...（isEmptyはあった）。
とはいえ、他にも依存モジュールあったんで、lodash だけの問題とも言い切れませんね。

### 先人が通った道

[Next.js に New Relic 導入し、docker コンテナの起動に失敗した話](https://zenn.dev/collabostyle/articles/c13ca438a37874) に出会いました。
`node_modules` の下のファイルをコピーする....。まぁ動きそうな気はするけど、コピーはいやだなぁ....ということで違う方法を模索します。

過去には、Next.js 用のライブラリがあったようで、そのときの issue も見つけました。

- [[Node] Next.js with @newrelic/next and outputStandalone](https://forum.newrelic.com/s/hubtopic/aAX8W0000008d6sWAA/node-nextjs-with-newrelicnext-and-outputstandalone)

でそのときの対応が `node-newrelic` リポジトリになるときのマイグレーション issue も見つけました。

- [Migrate @newrelic/next into repo](https://github.com/newrelic/node-newrelic/issues/2127#issuecomment-2125591318)

ということで、何だか standalone モードへの対応は考慮されているようですが、前述のとおり Web アプリ側でも依存関係にあってエージェント側でも使っているみたいなケースでは失敗してしまうこともありえます。
僕がソースコードを見回った結果は lodash だけっぽかったので、そこだけ修正すれば大丈夫なのかもですけど。

### グローバルインストールという脇道（ハック）

アプリケーションの下の node_modules だと入らないので、別のところでクリーンインストールすれば良いのでは？という結論に至りました。
とりあえずアプリと別のディレクトリを掘ってやってもよかったんですけど、面倒だったのでグローバルインストールを使います。

```dockerfile
# Install dependencies only when needed
FROM base AS deps

# 長いので省略 一番下に追加
RUN npm i -g newrelic
```

マルチステージビルドの  `deps` の最後でグローバルインストールします。
続いて standalone ビルドしたファイルをコピーした後で、グローバルインストールフォルダを丸っとコピーして持ってきます。
で、そこに `NODE_PATH` 環境変数を通すというハックを入れました。

```dockerfile
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=deps /usr/local/lib/node_modules /usr/local/lib/node_modules
ENV NODE_PATH=/usr/local/lib/node_modules
```

おそらく gist の例とかは newrelic が依存しているライブラリを Next.js のアプリが使っていない前提で書かれていると思われる。

結局 newrelic が依存しているものを Next が良い感じに standalone ビルドすると当然 newrelic なんぞ？みたいになって動かないからな。ライブラリ作者はそこまで気が回ってないのだろう

グローバルはハックな方法だと思うけど、正しいやり方をサポートは対応してくれるんかな....

ライブラリは OSS なんで issue 書いてよ、というのは、まぁそのとおり（まだやってません、すみません）。

### やってみる（2回目）

動きません..... 😭

> Cannot find module '@newrelic/native-metrics'\nRequire stack:\n- /usr/local/lib/node_modules/newrelic/lib/sampler.js\n- /usr/local/lib/node_modules/newrelic/lib/agent.js\n- /usr/local/lib/node_modules/newrelic/index.js\n- internal/preload

`Cannot find module` ？？なんですって？

```json
"optionalDependencies": {
    "@contrast/fn-inspect": "^4.2.0",
    "@newrelic/native-metrics": "^11.0.0",
    "@prisma/prisma-fmt-wasm": "^4.17.0-16.27eb2449f178cd9fe1a4b892d732cc4795f75085"
},
```

なんか [optionalDependencies](https://github.com/newrelic/node-newrelic/blob/main/package.json#L221-L224) があるんですけど、 `npm i newrelic` だけじゃないの？ドキュメントに書いてあった？

### 調べよう（2回目）

ありましたよ、ドキュメント。
[Node.jsのVM測定](https://docs.newrelic.com/jp/docs/apm/agents/nodejs-agent/extend-your-instrumentation/nodejs-vm-measurements/#install-modules)

> New Relic Node.js エージェントの v2.0.0 以降、ネイティブモジュールはオプションの依存関係となり、自動的にインストールされるようになりました。

じゃぁインストールされんのかな？と思うじゃないですか。ダメです。

> 展開プラットフォームでネイティブ モジュールをコンパイルするには、 node-gypパッケージの手順に従います。ネイティブ Node.js モジュールをインストールするための前提条件は次のとおりです。
> プラットフォーム 前提条件
> Unix/Linux Python（v2.7推奨、v3.x.xは未サポート）、make、C/C++コンパイラ（GCCなど）

いやいや、 Python 必要なん？ （`node-gyp` だから当然だけど）。
つまり自動インストールしようとした結果、インストールに必要なもの（今回でいうとgccとかPytnonとか）がインストールされてないので、自動インストール自体が失敗するということになります。

[Node.jsエージェントのインストール](https://docs.newrelic.com/jp/docs/apm/agents/nodejs-agent/installation-configuration/install-nodejs-agent/) という公式ドキュメントをみると

> オプション：追加のNode.jsランタイムレベル統計情報を取得するため、@newrelic/native-metricsパッケージがインストールされていることを確認してください。

ってことで、まぁこれは必要なようです。

結局のところの `deps` は以下のようになりました。

```dockerfile
# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# RUN apk add --no-cache libc6-compat
RUN apk update && \
  apk upgrade && \
  apk add --no-cache libc6-compat make gcc g++ python3
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

RUN npm i -g newrelic
RUN npm i -g @newrelic/native-metrics
```

### やってみる（3回目）

動いたー🎉

### まとめ

以下、苦労したところ

- ドキュメントが分散していてわかりずらい（最初から github でなく公式 Docs みておいた方が良かったかも）
- Next.js の standalone モードとは驚くほど相性が悪い

前者は改善の余地ありそうだけど、後者は何ともならなそうですね。
今回は別の場所で入れて `NODE_PATH` するというハックを使いましたが、結局エージェントとWebアプリで依存関係の競合が起きたときに困ると言うことには違いないです。たとえば違うバージョン使っていたら？とかそれが原因で動かなかったら？ということは今後容易に起きそうです。
希望としてはエージェントは1ファイルにパッキングしておいて欲しいということですね。というか `require module` で動くんだから自分が必要なパッケージは固めておいて欲しいですよね。Node.js のアプリだったらみんながみんなフルセットの node_modules を使っていないことがあるのは Node.js 使っている人ならわかりそうなのになぁという気分です。

ちゃんと時間が取れて、良い感じの英文が書けたら issue 出そうかな。それも OSS への貢献ですね。
この記事で同じような境遇になった人が、解決の助けになったら、と思います。
