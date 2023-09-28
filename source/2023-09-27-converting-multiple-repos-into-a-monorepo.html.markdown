---
title: マルチプルレポをモノレポへコミットログを残しながら移行する
date: 2023-09-27 08:25 UTC
tags: 
- github
- git
- monorepo
- npm
- workspace
---

### 背景

プロジェクトで複数のAPIサーバーや、マイクロサービスなどを展開するのに、OpenAPI の定義を置くリポジトリを個々に作っていたのですが、メンテナンス性を考えてマルチプルレポからモノレポへ移行することにしました。

基本的に OpenAPI の定義（yamlファイル）の内容と、デプロイ先（AWS S3のWebホスティング先バケット）が違うぐらいで、それ以外の内容はまったく一緒であるリポジトリが複数ある感じです。

- app-a-apidoc
- app-b-apidoc
- service-account-apidoc
- service-payment-apidoc

みたいなマルチプルレポを `apidoc` モノレポへまとめていきます。

各 apidoc は [swagger-ui-dist](https://www.npmjs.com/package/swagger-ui-dist) に yaml ファイルを入れて、Webホスティングしている S3 バケットにデプロイしています。
ビルドスクリプトは gulp で、デプロイは serverless framework に serverless-s3-sync プラグインを入れて実行しています。

### リポジトリの移行の準備

リポジトリを移行するにあたり [Keeping git history when converting multiple repos into a monorepo](https://medium.com/@chris_72272/keeping-git-history-when-converting-multiple-repos-into-a-monorepo-97641744d928) という記事がとても役にたったので、こちらの手順を参考にして紹介していきます。

#### ディレクトリ構造決定

まず最初にモノレポ移行後のディレクトリ構造を検討します。
よくある npm のパッケージをモノレポにしている場合だと

```
packages
  +-- package-a
  +-- package-b
```

みたいな階層にすることが多いんじゃないかな？と思います。
参考記事だと `projects/*` のような感じですね。
aws-sdk v3 だと clients や lib, packages など目的別にいろいろ分けているようです。

そこで今回私たちは

```
apps
  +-- a
  +-- b
services
  +-- account
  +-- payment
```

みたいなディレクトリ構造にしました。これはそれぞれのプロジェクトや、まとめたいリポジトリにもよるので、個別に検討しましょう。

#### 既存リポジトリのディレクトリ変更

ディレクトリ構造が決まったら、既存リポジトリをそのディレクトリに合わせて階層を変更します。

```
cd app-a-apidoc
mkdir -p apps/a
git mv -k * apps/a
git mv -k .* apps/a
git commit -m "chore: move all files into apps/a"
```

1. 既存リポジトリをチェックアウトしたディレクトリに移動
2. モノレポにしたときのディレクトリツリーを作成
3. 2のディレクトリ下にすべてのファイルを移動。移動には `git mv` コマンドを使う
4. コミット

この作業を移行対象のすべての既存リポジトリで実施していきます。

#### モノレポの作成

GitHub上でリポジトリを作ってチェックアウトするか、 `git init` コマンドでローカルにモノレポのフォルダを準備します。
続いて、モノレポリポジトリにワークスペースのルートディレクトリを作っておきます。

```
mkdir apps
mkdir services
```

`git remote add` を使ってローカルディレクトリのリポジトリ（既存リポジトリのディレクトリ変更でディレクトリ変更してコミットしたもの）を追加します。

```
git remote add -f app-a-apidoc ../app-a-apidoc
git remote add -f app-b-apidoc ../app-b-apidoc
git remote add -f service-account-apidoc ../service-account-apidoc
git remote add -f service-payment-apidoc ../service-payment-apidoc
```

で、それらをモノレポの中にマージしていきます。マージするブランチが `main` であると仮定します。

```
git merge app-a-apidoc/main --allow-unrelated-histories
git merge app-b-apidoc/main --allow-unrelated-histories
git merge service-account-apidoc/main --allow-unrelated-histories
git merge service-payment-apidoc/main --allow-unrelated-histories
```

最後にリモートを削除しましょう。

```
git remote remove app-a-apidoc
git remote remove app-b-apidoc
git remote remove service-account-apidoc
git remote remove service-payment-apidoc
```

### モノレポの設定

ここまでで既存のリポジトリを1つのモノレポにコミットログ付きで合体できました。
続いて、モノレポで開発作業ができるように環境整備をしましょう。

#### ワークスペースを設定する

モノレポのルートディレクトリで `npm init` コマンドを実行して `package.json` を作ります。
作成した `package.json` にワークスペースに関する設定を追加します。

```javascript
  "private": true,
  "workspaces": [
    "apps/*",
    "services/*"
  ],
```

#### 依存関係の設定

続いて、各リポジトリで使っていた `devDependencies` や `dependencies` の依存関係をモノレポのルートディレクトリにある `package.json` に移動します。
通常は各リポジトリ共通のものだけですが、今回の apidoc ではすべて共通だったので、そのままコピペしました。

ワークスペース（apps や services）にある `package.json` の `devDependencies` や `dependencies` を削除し、 `package-lock.json` も削除します。

最後にルートディレクトリで `npm i` を実行して依存関係をインストールします。

#### 各 apidoc の整理

`.npmrc` や `.gitignore` , `.editorconfig` など必要な設定ファイルをワークスペースからルートディレクトリに移動しておきます。

その他共通になったものはルートディレクトリ下に移動しておくと良いでしょう。

#### GitHub Actions の統合

ワークスペース（apps や services）にある `.github` をどれかルートディレクトリに移動して、ワークスペース側からは削除します。
単に全部のワークスペースをビルドしたりデプロイするだけなら `-ws` オプションを追加するとすべてのワークスペースに対してコマンドを実行するようになります。

```yaml
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run -ws build
      - run: npm run -ws deploy
```

まぁでも通常はそんなことなく、以下のパターンを考慮する必要があります。

- ルートディレクトリの package.json で定義している依存関係にアップデートがあった（dependabotなど）
- ワークスペースのファイルが修正された

前者はすべてのワークスペースに対して Action を実行したほうが良いのですが、後者は変更があったワークスペースだけの実行に絞り込みたいところです。

そこで利用できるのが [Get changed workspaces action](https://github.com/AlexShukel/get-changed-workspaces-action) です。

```yaml
jobs:
  get-changed-workspaces:
    outputs:
      packages: ${{ steps.changed-packages.outputs.packages }}
      empty: ${{ steps.changed-packages.outputs.empty }}
    steps:
      - name: Check out repository code
        uses: actions/checkout@v3
      - name: Find changed workspaces
        uses: AlexShukel/get-changed-workspaces-action@v2.0.0
        id: changed-packages
  deploy:
    needs: [get-changed-workspaces]
    if: ${{ !fromJson(needs.get-changed-workspaces.outputs.empty) }}
    strategy:
      matrix:
        package: ${{ fromJson(needs.get-changed-workspaces.outputs.packages) }}  
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run -w ${{ matrix.package.name }} build
      - run: npm run -w ${{ matrix.package.name }} deploy
```

この Action を使うと変更があったワークスペースの名前を配列型式で取得できます。
ワークスペースに変更がないときは `empty` でわかるので、 `if` 文で制御して何もしないように設定も可能です。

で、特定のワークスペースに対して npm コマンドを実行したい場合は `-w ワークスペース名` オプションを指定します。

そこで、 `.github/workflows` には以下のファイルを設置することにしました。

- build-all.yml
- build.yml

前者は `ルートディレクトリの package.json で定義している依存関係にアップデートがあった（dependabotなど）` を想定していて、以下のような条件で起動したら、 `-ws` オプションですべてのワークスペースで実行されるようにしています。

```yaml
on:
  workflow_dispatch:
  push:
    paths:
      - package.json
      - package-lock.json
    branches:
      - master
jobs:
  deploy:
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run -ws build
      - run: npm run -ws deploy
```

後者は `Get changed workspaces action` を使って個別のワークスペースビルドされるように設定しました。

### さいごに

マルチプルレポ、モノレポ、それぞれに良いところはあると思います。
必ずモノレポが良いというものでもないでしょう。
それぞれのプロジェクトやリポジトリの運用を見極めて選択していきたいですね。

マルチプルレポからモノレポへ移行するときに、本記事が参考になれば幸いです。
