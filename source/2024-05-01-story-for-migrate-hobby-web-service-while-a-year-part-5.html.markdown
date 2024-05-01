---
title: GAE gen1 で動いている PHP5.5 で作った個人開発サービスを gen2 PHP8.2 へ移行した1年記 〜 その 5
date: 2024-05-01 09:32 UTC
tags: 
- PHP
- GAE
- toiletevolution
---

この記事は [GAE gen1 で動いている PHP5.5 で作った個人開発サービスを gen2 PHP8.2 へ移行した1年記 〜 その 4](2024/04/30/story-for-migrate-hobby-web-service-while-a-year-part-4.html) の続編となります。

### GAEにデプロイして動作確認しながら修正

前回で Slim4 へ移行でき、少し動く様になってきたので動作確認しながら微修正していきます。

#### GAE 2nd gen 用の設定変更

`app.yml` ファイルに定義していたデプロイ対象外ファイルの一覧 `skip_files` は別のファイル `.gcloudignore` に記述するように変更になったので、定義を移行しました。その[コミット](https://github.com/toiletevolution/toiletevolution-server/pull/20/commits/98ec0f6157778a1b37807664193d1ee0afc56ec1)。

#### Carbon のバージョンアップ

8.2 環境で動くように Carbon を 1.21 から 2.72 にアプデしました。その[コミット](https://github.com/toiletevolution/toiletevolution-server/pull/20/commits/f33a78013a00996a30de76849abe76d40e404b1b)。

#### composer ファイルをデプロイ対象に追加

GAE 2nd gen からは composer での依存関係はGAEデプロイ時に解決されるので、デプロイ対象ファイルに composer.json と composer.lock ファイルを追加しました。その[コミット](https://github.com/toiletevolution/toiletevolution-server/pull/20/commits/33bfe6f232d1b4794a6a27cfc0ceed139159615b)。

#### ミドルウェアの定義を変更

ミドルウェアがうまく動作していないことがわかったので、調べていると書き方が変わっていることに気づきました。すでにパラメータは変更していたのですが、実行メソッド名も変更になっていました。

そこでt PHP5.5 のときは interface を実装するコードになっていなかったので、ちゃんと `MiddlewareInterface` を実装するようなコードに修正。

```php
use Psr\Http\Server\MiddlewareInterface;

class AllowedProvidersMiddleware
class AllowedProvidersMiddleware implements MiddlewareInterface
{
```

そうすると、以前は `__invoke` メソッドで定義していたところを `process` に変更する必要があることがわかりました。
その修正[コミット](https://github.com/toiletevolution/toiletevolution-server/pull/20/commits/6e737549267d4f231cc5894f88f00bd91cbf9862)。

#### セッションの処理も修正

さきほどのコミットでは、セッション保持の Memcache がうまく動作していなかったので、いったん `session_set_save_handler` はコメントアウトして、デフォルトの tmp 管理にしています。ただ複数インスタンス起動するとうまく動作しなくなるので、いったん動作確認を進める上での暫定対応です。

またセッションミドルウェアも全体に対して有効にするのでなく、セッションが必要なAPI（ここでいうと管理画面のログイン周辺）についてだけ有効にするようにルーティングを変更しています。

その後、Google Cloud の Cloud Datastore に `DatastoreSessionHandler` というものがあるのがわかり、以下のように設定を変更しました。その[コミット](https://github.com/toiletevolution/toiletevolution-server/pull/20/commits/d85b82286d6ec844c6e73144cbcd889d3ae8ff52)。

```php
use Google\Cloud\Datastore\DatastoreClient;
use Google\Cloud\Datastore\DatastoreSessionHandler;

    $datastore = new DatastoreClient();
    $handler = new DatastoreSessionHandler($datastore);
    session_set_save_handler($handler, true);
    session_save_path('sessions');
```

#### POST のボディに JSON を渡す場合の対応

Slim4 では `addBodyParsingMiddleware` を利用する必要があったので、修正しました。その[コミット](https://github.com/toiletevolution/toiletevolution-server/pull/20/commits/376485104e1ac12a28b749dfc911506f57bcc27d)。

併せて BASIC 認証時の before 処理も不要であることがわかったので削除しています。

### GAE へのデプロイ方法を README に追記

GAE 2nd gen からはビルド結果を以下のコマンドでデプロイします。

```
gcloud app deploy --project toiletevolution --version 2 --no-promote --appyaml=app.yml
```

`version` を指定して新しいバージョンで動作確認を可能にして、 `--no-promote` をつけることで従来のURLからのアクセスは、新しいバージョンに振り分けられない様にします。

### そしてどうなったか

この記事は PHP のバージョンアップをメインにしているのですが、実際には WebComponents 側も修正しています。

そしてシュミレータで一ヶ月ぐらいの稼働テストを実施して、問題なさそうだったので某日に正式リリースを実施しました。
その後、新しいバージョンでの問題も発生せず順調に動いています。

これでしばらくは落ち着くのと、バージョンアップ追従もどんどんできるようになっていくので安心です。

ブログの記事にまとめてみると、そんなに大変な修正でもなかったな？という感じですが、当時は久々に PHP 触ったりするのもあり、結構大変でした。

今後は phpstan とか入れたりして、コードの品質も上げていければなと思っています。
