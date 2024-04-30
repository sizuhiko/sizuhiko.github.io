---
title: GAE gen1 で動いている PHP5.5 で作った個人開発サービスを gen2 PHP8.2 へ移行した1年記 〜 その 3
date: 2024-04-30 04:20 UTC
tags: 
- PHP
- GAE
- toiletevolution
---

この記事は [GAE gen1 で動いている PHP5.5 で作った個人開発サービスを gen2 PHP8.2 へ移行した1年記 〜 その 2](2024/03/20/story-for-migrate-hobby-web-service-while-a-year-part-2.html) の続編となります。

前回は PHPUnit を最新化して通過するところまで実施したので、今回は GitHub Actions で CI できるようにしていきます。

### GitHub Actions と Google Cloud を連携する

[Authenticate to Google Cloud from GitHub Actions](https://github.com/google-github-actions/auth) というリポジトリがあって、Actions から gcloud 関係の CLI ツールを動かす前に認証を通過させる方法が書いてあります。

Actionsが通過するようになったPRが[こちら](https://github.com/toiletevolution/toiletevolution-server/pull/18) 。

[GitHub Actions からのキーなしの認証の有効化](https://cloud.google.com/blog/ja/products/identity-security/enabling-keyless-authentication-from-github-actions) という公式ドキュメントに加え、先ほども紹介したリポジトリのREADMEを併せて読むと簡単に環境構築できるようになります。

環境構築ができたら Actions の yaml ファイルを定義していくだけです。

- ソースコードをチェックアウト
- `google-github-actions/auth` で認証
- `google-github-actions/setup-gcloud` で gcloud コマンドをセットアップ
- PHP8.2環境のセットアップ
- composer アクションで依存関係を解決
- gcloud コマンド実行
- PHPUnit 実行

のような手順にしました。

### さいごに

`google-github-actions/auth` の認証方法が変更になっているので最新に追従しないといけないので、おいおい対応していきます。
