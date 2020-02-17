---
title: Serverless Frameworkでプライベートパッケージを利用するときの注意点
date: 2020-02-16 03:25 UTC
tags:
- Serverless Framework
- GHE
- dependabot
---

この記事は[DependabotをGHEのプロジェクトに適用する](/2020/02/16/dependabot-with-ghe.html)の続編です。
少し前提となる条件があるので、読んでいただけるとスムーズに進みます。

### ある日事件は起こった

毎朝出社すると、dependabotから出てくるPRをチェックしてマージしています。
プロジェクトでGHEにプライベートなnpmパッケージを作っていて、前日その更新をしたのでアプリ側にPRが来ていました。
修正内容は自分たちが実施したものなので、何も疑うことはなくマージ。テストも通過していました。

developブランチにマージすると、開発環境へデプロイするようになっているので、そのままデプロイされました。
特に問題はないように見えます。

#### あのー、サーバーからエラーが戻ってくるんですけど...

目の前にはネイティブアプリチームがいます。

「あのー、サーバーのAPIからエラーが戻ってくるんですけど、何かしました？」

あ、さっきデプロイしたけど、プライベートパッケージ更新しただけだぞ...

#### エラー通知が飛んでくる

ほどなく監視からエラーが。

```json
{
    "errorType": "Runtime.ImportModuleError",
    "errorMessage": "Error: Cannot find module 'psl'",
    "stack": [
        "Runtime.ImportModuleError: Error: Cannot find module 'psl'",
        "    at _loadUserApp (/var/runtime/UserFunction.js:100:13)",
        "    at Object.module.exports.load (/var/runtime/UserFunction.js:140:17)",
        "    at Object.<anonymous> (/var/runtime/index.js:45:30)",
        "    at Module._compile (internal/modules/cjs/loader.js:778:30)",
        "    at Object.Module._extensions..js (internal/modules/cjs/loader.js:789:10)",
        "    at Module.load (internal/modules/cjs/loader.js:653:32)",
        "    at tryModuleLoad (internal/modules/cjs/loader.js:593:12)",
        "    at Function.Module._load (internal/modules/cjs/loader.js:585:3)",
        "    at Function.Module.runMain (internal/modules/cjs/loader.js:831:12)",
        "    at startup (internal/bootstrap/node.js:283:19)"
    ]
}
```

[psl](https://www.npmjs.com/package/psl) というnpmパッケージを使っているのですが、それが見つからないよ、と。

この箇所はユニットテストも通過しているし、なんでだろう？と思い、S3にアップロードされているzipを展開すると確かに node_modules に psl は入っていません...

### Serverless Framework におけるパッケージング

`sls deploy` や `sls package` を使ってzipを作成するとき、node_modules には `dependencies` だけが入り、 `devDependencies` は取り除かれます。
Lambdaなどはzipファイルのサイズに制限があるので、これはとても便利な機能です。

psl の利用箇所を調べるため、 `package-lock.json` を探してみます。

```json
    "xxxx-node-fetch": {
      "version": "git+https://xxxxxxxxxxxxxxxx:x-oauth-basic@github.xxxxx.com/xxxx/xxxx-node-fe
tch.git#22141d66ca58e25b9c6f9d5907004802f55afcc4",
      "from": "git+https://xxxxxxxxxxxxxxxxxxx:x-oauth-basic@github.xxxxx.com/xxxx/xxxx-node-fetch
.git#22141d66ca58e25b9c6f9d5907004802f55afcc4",
      "requires": {
        "psl": "^1.7.0",
        "winston": "^3.2.1",
        "winston-cloudwatch": "^2.3.0"
      }
    },
```

これはプライベートパッケージでGHEのリポジトリを参照しています。
これ以外の利用箇所を探してみました。

```json
    "request": {
      "version": "2.88.0",
      "resolved": "https://registry.npmjs.org/request/-/request-2.88.0.tgz",
      "integrity": "sha512-NAqBSrijGLZdM0WZNsInLJpkJokL72XYjUpnB0iwsRgxh7dB6COrHnTBNwN0E+lHDAJzu7kLAkDeY08z2/A0hg==",
      "dev": true,
      "requires": {
        "aws-sign2": "~0.7.0",
        "aws4": "^1.8.0",
        "caseless": "~0.12.0",
        "combined-stream": "~1.0.6",
        "extend": "~3.0.2",
        "forever-agent": "~0.6.1",
        "form-data": "~2.3.2",
        "har-validator": "~5.1.0",
        "http-signature": "~1.2.0",
        "is-typedarray": "~1.0.0",
        "isstream": "~0.1.2",
        "json-stringify-safe": "~5.0.1",
        "mime-types": "~2.1.19",
        "oauth-sign": "~0.9.0",
        "performance-now": "^2.1.0",
        "qs": "~6.5.2",
        "safe-buffer": "^5.1.2",
        "tough-cookie": "~2.4.3",
        "tunnel-agent": "^0.6.0",
        "uuid": "^3.3.2"
      },
      "dependencies": {
        "punycode": {
          "version": "1.4.1",
          "resolved": "https://registry.npmjs.org/punycode/-/punycode-1.4.1.tgz",
          "integrity": "sha1-wNWmOycYgArY4esPpSachN1BhF4=",
          "dev": true
        },
        "tough-cookie": {
          "version": "2.4.3",
          "resolved": "https://registry.npmjs.org/tough-cookie/-/tough-cookie-2.4.3.tgz",
          "integrity": "sha512-Q5srk/4vDM54WJsJio3XNn6K2sCG+CQ8G5Wz6bZhRZoAe/+TxjWB/GlFAnYEbkYVlON9FMk/fE3h2RLpPXo4lQ=
=",
          "dev": true,
          "requires": {
            "psl": "^1.1.24",
            "punycode": "^1.4.1"
          }
        }
      }
 ```
 
 そうすると、 `request` パッケージが参照する `tough-cookie` が利用しているのがわかります。 `"dev": true,` になっているので、devDependenciesに指定されているということですね。
 
 ただ、このようなケースはまぁまぁある（依存しているパッケージによっては dependencies だったり devDependencies であったりする）ので、Serverless Framework で良しなにしてくれるはずです。
 実際、昨日までは問題なかったのに？？
 
 ### DependabotのPRを見る
 
`package-lock.json` の変更だけで以下のようなdiffになっていました。
 
```diff
-     "version": "git+https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:x-oauth-basic@github.xxxx.com/xxxx/xxxx-node-fetch.git#112cf335236d974538ba02993d5ef7bbbbc3ec4c",
-     "from": "git+https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:x-oauth-basic@github.xxxx.com/xxxx/xxxx-node-fetch.git#develop",
+     "version": "git+https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:x-oauth-basic@github.xxxx.com/xxxx/xxxx-node-fetch.git#a2ad500e4345206e59d06e9112fab8e1ec7517d1",
+     "from": "git+https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:x-oauth-basic@github.xxxx.com/xxxx/xxxx-node-fetch.git#a2ad500e4345206e59d06e9112fab8e1ec7517d1",
```
 
`package.json` には `"xxxx-node-fetch": "git+https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:x-oauth-basic@github.xxxx.com/xxxx/xxxx-node-fetch.git#develop",` のように指定されていて、developから最新を取得するようになっています。

PRでは `version` 以外にも `from` が `#develop` のようなブランチ指定から、コミットハッシュ指定に変わっているのがわかります。

### dependencies ではブランチ指定をやめる

lockファイルの `from` 指定が変わり、package.json の dependencies と釣り合いが取れなくなることで、dependencies に必要のないライブラリと Serverless Framework が認識するようで zip ファイルに含まれなくなっていました。

この状態でも `npm i` や `npm ci` ではパッケージはインストールできるので UnitTest は通過します。

このような事象から、私たちは一旦 `package.json` に記述するときにブランチ指定をやめて、コミットハッシュ指定に変更することとしました（つまり from を合わせるということです）。
この修正で無事 zip に psl が入って問題を解決することができました。

### さいごに

本来であればOSSにできそうなものは普通にnpmにあげるとかした方が良いのですが、調整が困難なのと非常に短期間でプロジェクトが進んでいたのでOSSにはできませんでした。
また、OSSにできないプライベートなパッケージなどを作る場合は、ローカルレジストリ作った方が良いな、とも思いました（ブランチ指定とかコミットハッシュでなく、ちゃんとバージョン管理できるし）。

プライベートなnpmレジストリを作るには、[独自の npm registry を使う](https://qiita.com/propella/items/6f1bb5db5225fba6cd85) が参考になりそうです。

また AWS を使っているのであれば、[新しいクイックスタートを使用して JFrog Artifactory を AWS にデプロイ](https://aws.amazon.com/jp/about-aws/whats-new/2019/09/new-quick-starts-deploy-jfrog-artifactory-on-aws/) という公式記事があるので、参考になりそうです。
