---
title: GAE gen1 で動いている PHP5.5 で作った個人開発サービスを gen2 PHP8.2 へ移行した1年記 〜 その 2
date: 2024-03-20 05:58 UTC
tags: 
- PHP
- GAE
- toiletevolution
---

この記事は [GAE gen1 で動いている PHP5.5 で作った個人開発サービスを gen2 PHP8.2 へ移行した1年記 〜 その 1](2024/03/20/story-for-migrate-hobby-web-service-while-a-year-part-1.html) の続編となります。

### 単体テストを通過するようにアップグレード

やることは多そうだなというのは想像していたのですが、いざ取り掛かろうとしたとき頼りになるのは単体テストだな、ということでPHPUnitとPHPのバージョンを上げて、テストが通過するように修正していきます。

テストが通過するようになったコミットが[こちら](https://github.com/toiletevolution/toiletevolution-server/pull/20/commits/0a73d2d12bd05bd4a67e80a60e9f64f682416529) 。

#### composer の依存バージョンを変更

- PHPのバージョンを8.2以上へ
- PHPUnitのバージョンを10.1.3（当時最新）へ

その関連で合わせてあげないといけない依存もバージョンup。

#### PHPUnit の実行方法を変更

以前は GAE の内部コンポーネントに依存していたので、PHPUnitを実行するのも dev_appserver.py を起動してからそのインスタンス内の PHPUnit 実行スクリプトを経由して実行していたのですが、GAE gen2 ではPHPスクリプトの起動自体が `php -S` に変わったりしたこともあり、PHPUnitもComposer スクリプトから直接実行するように変更しました。

以前は dev_appserver 経由で起動されていたデータストアとキャッシュについては、docker と gcloud emulator で起動してから PHPUnit を実行するように変更しました。

実行手順をREADMEにも記述。

ここで、レガシーランタイム脱却のため Memcache を Redis に変更する対応も入っています。
当初は Memcache を変更せずに PHPUnit が通過してから移行する予定だったのですが、 `GeckoPackages\MemcacheMock` が終了していて、最新のPHP/PHPUnitで動作しないことがわかったのでこのタイミングで一緒に移行を決断しました。

#### 簡単なアーキテクチャと既存テストコード

Toilet Evolution は PHP Slim Framework に、Google Datastore を使用（[DatastoreモードのFirestoreを使用](https://cloud.google.com/appengine/docs/standard/using-firestore-in-datastore-mode?hl=ja&tab=php)）しています。
REST API を通じてデバイスからトイレの利用状況をデータストアやキャッシュに格納したり、Webアプリから利用状況を閲覧できるAPI が用意されています。

テストコードは、データストアとキャッシュのI/O、PSRのミドルウェア部分にあって、主なロジックはこのあたりに集中しています。

#### テストコードの記述を修正

PHPUnit のテストケース（クラス）の宣言を修正

```php
// PHP5.5 / PHPUnit 4.8
class DeviceTest extends \PHPUnit_Framework_TestCase {}

// PHP8.2 / PHPUnit 10.1.3
use PHPUnit\Framework\TestCase;

class DeviceTest extends TestCase {}
```

setUp を before に変更

```php
// PHP5.5 / PHPUnit 4.8
public function setUp()

// PHP8.2 / PHPUnit 10.1.3
/**
 * @before
 */
public function before()
```

assert を `$this` 経由で呼び出すように変更

```php
// PHP5.5 / PHPUnit 4.8
assertEquals('username', $results->name);

// PHP8.2 / PHPUnit 10.1.3
$this->assertEquals('username', $results->name);
```

#### Memcache から Redis への記述を修正

インスタンスはDIしているので、変数名を memcache から redis に変更した。
メソッドは get / set で同じになるけど、データがオブジェクト形式から文字列に変わるので以下のような対応となった

```php
// GAE gen1
$this->memcache->set("device:id:{$device->getKeyId()}", $device);

// GAE gen2
$this->redis->set("device:id:{$device->getKeyId()}", serialize($device));
```

データを set するときは `serialize` して、 get するときは `unserialize` するように変更している。

#### このぐらいで PHPUnit がうごくようになった

Warining は出てるんですが、PHPUnit がエラーで落ちることはなくなりました。
これはバージョンアップ意外と楽チンなのでは？！と勘違いしたのは言うまでもなく、この連載もまだ続きます。

ここで勘違いしたので、心も折れず続けられたというのはあるかもしれないと振り返り思うのでした。
