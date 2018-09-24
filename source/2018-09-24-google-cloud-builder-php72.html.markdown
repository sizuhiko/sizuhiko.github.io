---
title: Google Cloud Builder を使って PHP7.2 のアプリケーションを GAE に継続的デプロイする
date: 2018-09-24 09:52 UTC
tags:
- PHP
- GAE
- GoogleCloudBuilder
---

この記事は、[PHPカンファレンス関西2018に参加してGAEに継続的デプロイする方法について発表してきました](/2018/08/03/phpcon-kansai-2018.html)の中で紹介している[Google Cloud Builderを利用してGAEのPHP SEへ自動デプロイするサンプルコード](https://github.com/sizuhiko/gccb-php-se-sample)を最新に更新した解説記事です。

### 何が変わったのか？

PHPカンファレンス関西2018時点では以下のようななっていました。

- GAEのPHPは5.5
- Google Cloud Container Builder を利用

今日では以下のようになっています。

- GAEのPHPで7.2が利用可能に
- Cloud Container Builder は Cloud Build という名前に変更

#### gcloud コマンド利用上での変更

Dockerのバージョンがあがったことで `gcloud` コマンドから `docker` コマンドを実行するときに認証設定が必要になりました。
READMEにも反映していますが、以下のコマンドを実行しておく必要があります。

```
$ gcloud auth configure-docker
```

`gcloud` コマンドをアップデートしてみましたが、「PUSH TO DEPLOY のトリガーをセットする」については、まだできませんでした。
[projects.builds/create API](https://cloud.google.com/cloud-build/docs/api/reference/rest/v1/projects.builds/create)は実装されているようなので、CLIから実行できるようになるのを心待ちにしています。

#### composer イメージの更新

PHP7.2を利用できるようになったので、 `composer/composer:php5` のDockerイメージを `composer/composer:alpine` に変更しました。
`composer/composer` でも良かったのですが、 `alpine` ベースの方が軽量だし、いいですよね。

#### app.yaml の更新

基本的にここがメインなのですが、以下のような変更点があります。

- runtime を `php72` に変更
- `handlers` の `application_readable` は常に `true` に
- `skip_files` でデプロイしないファイルの指定は `.gcloudignore` ファイルへ移行する
- `/` アクセスされたときの `script` 指定は `auto` に（ただし `index.php` か `public/index.php` の場合のみで、他はパスを指定）

こういった変更は、[Compatibility issues between PHP 5.5 and PHP 7.2](https://cloud.google.com/appengine/docs/standard/php7/php-differences)にまとめられています。
※ `skip_files` については書いていないので、実際にマイグレーションして確認は必要です（これは5.5から7.2の変更というよりは `gcloud` コマンドのバージョンアップに伴うものだから書いていないのかもしれないです）。

### デプロイしてみよう

あとは、用意したコマンドを順番に実行してデプロイ環境を整備してから、 `git push` するだけで、PHP7.2のアプリケーションがデプロイできます。
githubのリポジトリが `Cloud Source Repositories ` にミラーされるところなどは変わっていませんでした。


### さいごに

この内容は [プレPHPカンファレンス北海道](https://phpcondo.connpass.com/event/93953/) で発表する予定だったのですが、地震の影響でイベントが中止となったため、このブログにまとめました。

どこかで機会があれば、GAEとPHP7.2について発表してみたいなと思います。
