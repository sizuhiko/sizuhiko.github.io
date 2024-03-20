---
title: GAE gen1 で動いている PHP5.5 で作った個人開発サービスを gen2 PHP8.2 へ移行した1年記 〜 その 1
date: 2024-03-20 03:34 UTC
tags: 
- PHP
- GAE
- toiletevolution
---

2023年2月3日にGoogle Cloudからメールが届きました。

![](/images/blog/gae-gen1-support-mail.png)

ここで作っていた個人開発のサービスとは [Toilet Evolution](https://toiletevolution.space/#/about) です。一時期に流行ったトイレ利用状況可視化のIoTサービスです。

PHP + Web Components の SPA 構成でできていて、Google App Engine（以下GAE）の第一世代で動いています。
当時ほぼ無料で動かせるPaaSというのはあまりなくて、GAEばかりを選択していたと記憶しています。
その後 Heroku とか出ましたけど、実質それなりの利用で月100円もかからずに運用しつづけられている状況なのでありがたいです。

[GAEのランタイム サポート スケジュール](https://cloud.google.com/appengine/docs/standard/lifecycle/support-schedule?hl=ja) によると PHP5.5 は 2024年1月30日にサポートの終了で、非推奨が2026年1月31日ということ。廃止は書かれていません。

と同時にまだ使っている人もいるので、簡単にメンテ大変なんでクローズしますというのも違いますね。ユーザー大事。ありがたや。

そこで、サポート終了状態でずっと動かすのもなと思い、最新版のPHPへの移行を検討し始めました。

### 一番最後のメンテナンス

このWebサービスは長いことやっているのですが、直近で記事にしたのは [Toilet EvolutionのフロントエンドをPolymer3対応する(4)](/2019/04/28/toilet-evolution-polymer3-vol4.html) で、2019年4月。あのあとコロナがあっての5年ぶりのメンテになります。

### 移行前の composer.json

以下のような依存バージョンでした。

```json
{
    "php": ">=5.5.0",
    "slim/slim": "^3.1",
    "monolog/monolog": "^1.17",
    "tomwalder/php-gds": "^2.1",
    "tuupola/slim-basic-auth": "^2.0",
    "nesbot/carbon": "^1.21",
    "league/oauth2-client": "^1.4",
    "league/oauth2-google": "^1.0",
    "akrabat/rka-slim-session-middleware": "2.0.0-RC1",
    "sizuhiko/slim3-csrf-utilities": "dev-master",
    "justinrainbow/json-schema": "^2.0",
    "phpunit/phpunit": "^4.8",
    "helmich/phpunit-psr7-assert": "^1.1",
    "gecko-packages/gecko-memcache-mock": "^2.1",
    "google/appengine-php-sdk": "^1.9"    
}
```

歴史を感じますね。

### GAE gen1 から gen2 で何が変わるのか

GAEでの移行ガイドが出ていて、PHPだと [PHP 5.5 と PHP 7 / 8 の違い](https://cloud.google.com/appengine/migration-center/standard/migrate-to-second-gen/php-differences?hl=ja) というドキュメントがあります。

PHP公式ドキュメントの移行ガイドへのリンクと、GAE特有のアップグレードガイドが書かれています。
タイトルだけ拾うと、以下のような移行が必要になるということでした。

- app.yaml ファイルを移行する
- ランタイム制限の緩和
- App Engine の PHP SDK から移行する（レガシーバンドルサービスAPI利用方法）
- ローカルでの実行方法

レガシーバンドルサービスとは [PHP 7 / 8 用の以前のバンドル サービスにアクセスする](https://cloud.google.com/appengine/docs/standard/php-gen2/services/access?hl=ja) で書かれているサービスで、今回のサービスで言うと Memcache とセッションを利用していました。

で、これらは使えるので、使い続けて良いのか？という選択を迫られます。
もう少し関連するドキュメントを読んでみましょう。
[以前のバンドル サービスの概要](https://cloud.google.com/appengine/docs/standard/bundled-services-overview?hl=ja) によると

> レガシー ランタイムの一部はオープンソース コミュニティで管理されなくなったため、App Engine デベロッパーは、新しいランタイムに移行すべきかどうか難しい判断に迫られる可能性があります。こうした移行には時間と労力がかかりますが、レガシー ランタイムの使用を継続すれば、アプリの維持コストが増大する結果になります。
> こうした課題を踏まえ、Google Cloud では新しいランタイムへの移行パスを段階的に提供していく予定です。Google Cloud では、ランタイム移行の複雑さを軽減するために、Python 3、Java 11、Go 1.12 以降、PHP 7 / 8 などの第 2 世代ランタイムで App Engine の従来のバンドル サービスとその関連 API をサポートしています。

移行大変なんで段階的な移行パスを用意するよってことですね。
Memcache はこの移行バスに入ったようでそのままでも利用できたんですが、あとでまた移行するのが面倒そうなんで、このタイミングでやっておきたいと考えました。

レガシーランタイムからの移行に関してのドキュメントは [レガシー バンドル サービスからの移行](https://cloud.google.com/appengine/migration-center/standard/services/migrating-services?hl=ja&tab=php) にあって、参考になります。

### 実行目標

- PHPのバージョンを最新化する
- GAEのレガシーランタイムからの脱却

というのを掲げてみました。

けど、PHP自体あんまり触ってない（たぶん7を少しやったぐらいで、実質5系の知識で止まっている）ため、長期戦は予想していました。当時はまだ1年ぐらいあるから何とかなるやろ、ぐらいに思っていた自分がいました。

そして、その後の1年ぐらいで移行を完了させて、現在は GAE gen2 の PHP8.2 で稼働しています。👏👏

このあと数回にわたって、どうやって移行してきたかをコミットログと共にふりかえっていきたいと思います。
少しでも PHP のバージョンアップや GAE gen2 へ移行する人の助けになればな、と思っています。
