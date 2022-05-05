---
title: GitHub Enterprise の Actions で依存関係を S3 にキャッシュする
date: 2022-05-05 02:35 UTC
tags: 
- Dependencies Management
- GitHub Enterprise
- Actions
---

GitHub の Actions で npm などの依存関係パッケージをキャッシュするのは、公式ドキュメント [依存関係をキャッシュしてワークフローのスピードを上げる](https://docs.github.com/ja/actions/using-workflows/caching-dependencies-to-speed-up-workflows) にも書いてあるように、
CIを高速化するのに重要です。

公式 Example だと以下のとおりです。

```yaml
name: Caching with npm

on: push

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Cache node modules
        uses: actions/cache@v3
        env:
          cache-name: cache-node-modules
        with:
          # npm cache files are stored in `~/.npm` on Linux/macOS
          path: ~/.npm
          key: ${{ runner.os }}-build-${{ env.cache-name }}-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-build-${{ env.cache-name }}-
            ${{ runner.os }}-build-
            ${{ runner.os }}-

      - name: Install Dependencies
        run: npm install

      - name: Build
        run: npm build

      - name: Test
        run: npm test
```

`actions/cache` を利用すれば問題なく動くのですが、Enterprise 版の場合は `runs-on` にセルフホストランナーを利用するので、キャッシュがホストランナーのディスクに依存してしまいます。
これだとホストランナーのディスク管理とか大変になるので、少し管理で楽をしたいな、と思ったところ S3 にキャッシュできるものがあり、現在もこれを利用しています。

### actions-s3-cache

[actions-s3-cache](https://github.com/shonansurvivors/actions-s3-cache) は名前のとおり依存関係のキャッシュをS3に保持してくれます。
これならディスク容量を気にすることもないし、管理が楽になりますね。

公式 Example だと、こんな感じです。

```yaml
steps:
  - uses: actions/checkout@v2
  - uses: shonansurvivors/actions-s3-cache@v1.0.1
    env:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      AWS_DEFAULT_REGION: us-east-1
    with:
      s3-bucket: your-s3-bucket-name # required
      cache-key: npm-v1-${{ hashFiles('laravel/package-lock.json') }} # required ('.zip' is unnecessary)
      paths: node_modules # required 
      command: npm ci # required
      zip-option: -ryq # optional (default: -ryq)
      unzip-option: -n # optional (default: -n)
      working-directory: laravel # optional (default: ./)
```

僕らの運用では

- S3バケットは複数リポジトリで共有
- キー名にリポジトリ名を入れる

みたいな決め事を作ったので、こんな感じにしてみました。

```yaml
  - uses: actions/checkout@v2
  - id: get-repository-name
    run: |
      IFS=/
      REPO=${{ github.repository }}
      set -- ${REPO}
      echo "::set-output name=name::$2"
  - uses: shonansurvivors/actions-s3-cache@v1.0.1
    env:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      AWS_DEFAULT_REGION: ap-northeast-1
    with:
      s3-bucket: ci-actions-cache
      cache-key: ${{steps.get-repository-name.outputs.name}}-cache-${{ hashFiles('package-lock.json') }}
      paths: node_modules
      command: npm ci
```

`get-repository-name` でリポジトリ名を抜き出してきて、 `cache-key` で使っています。
`cache-key` に一致するものがあれば、S3からダウンロードしてzipを展開、一致するものがなければ `command` を実行して `paths` にあるファイルを zip アーカイブして S3 に保持といったことをやってくれるので、便利ですね。

あとは S3 のバケットにファイルの有効期限を設定しておくようにすれば、古いキャッシュがいつまでも残ることもなく、とても便利です。
