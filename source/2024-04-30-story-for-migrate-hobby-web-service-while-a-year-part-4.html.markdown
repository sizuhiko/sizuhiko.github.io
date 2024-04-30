---
title: GAE gen1 で動いている PHP5.5 で作った個人開発サービスを gen2 PHP8.2 へ移行した1年記 〜 その 4
date: 2024-04-30 04:52 UTC
tags: 
- PHP
- GAE
- toiletevolution
---

この記事は [GAE gen1 で動いている PHP5.5 で作った個人開発サービスを gen2 PHP8.2 へ移行した1年記 〜 その 3](2024/04/30/story-for-migrate-hobby-web-service-while-a-year-part-3.html) の続編となります。

### PHP 8.2 で実行できるように修正していく

ひとまずロジック部分については 8.2 環境で PHPUnit でテストできるようになり、CI も動作するようになったので、アプリケーションを起動して動くのかを試していきたいと思います。

#### Memcache の残りを移行する

Memcache は Redis に移行したのですが、単体テスト外の部分にも少し残っていたので、[こちらのコミット](https://github.com/toiletevolution/toiletevolution-server/pull/20/commits/febd6d51eea461b5aa44504102fcb10d1d746c29) で対応しました。

移行方法は [GAE gen1 で動いている PHP5.5 で作った個人開発サービスを gen2 PHP8.2 へ移行した1年記 〜 その 2](2024/03/20/story-for-migrate-hobby-web-service-while-a-year-part-2.html) でも実施した内容なのですが、DI 部分と設定ファイルのデフォルト値、READMEの説明を修正しました。

#### GAE のアプリケーションバージョンを新しく設定する

GAE では通常のトラフィックを古いバージョンへ向けて、新しいバージョンもデプロイして別のURLから実行できるようにする機能があります。
dev_appserver.py での実行が困難になっているので、新しいバージョンを GAE にデプロイして動作するのかを検証していくことにしました。

今回はバージョン2として[修正](https://github.com/toiletevolution/toiletevolution-server/pull/20/commits/6e8416cf0bf26c06bce2125e357b16d429bdec4e)しました。

GAE で動かすにあたり php.ini も変更が必要だったので、拡張に redis を追加して[修正](https://github.com/toiletevolution/toiletevolution-server/pull/20/commits/5b827d53174e8f3c87ea00afcda4e1a6ee21636d)しました

#### デプロイして動かしてみる

全然動きませんな  (^^;;

まず問題を切り分けるために、まだビジネスロジックに分岐できていなかったデバイス値の取得処理を Google Cloud Storage から取得する処理をテスト可能なサービスとしてリファクタリングしました。

あとセッションの保存場所を設定する必要があったので、いったん `php.ini` に `session.save_path=Google\AppEngine\Api\Memcache\Memcache` を追加しました。

依存のライブラリもいくつか PHP 8.2 環境だと動かないものがあったのでアップデート。

いったんそれらの修正コミットが[こちら](https://github.com/toiletevolution/toiletevolution-server/pull/20/commits/ba9be14f65cc75fdc6604fde328192a3ec125b57)。

で、いろいろやっていくうちに、そもそも slim3 だと PHP 8系で動かないな...という基本的なところに気づきました（さいしょから考えておけよという話）。

### Slim3 から Slim4 に移行していく

幸いなことにこちらに関してはインターネットに移行記事がたくさんあり、とても参考になりました。

今回の移行に関するコミットが[こちら](https://github.com/toiletevolution/toiletevolution-server/pull/20/commits/f0aed649629a24bad6f4dbbf4b0f724415569a33)です。

#### 依存関係の更新

- slim 3.1 を 4.12 に
- monolog のアプデ
- BASIC認証のライブラリ `tuupola/slim-basic-auth` のアプデ
- セッションミドルウェア `akrabat/rka-slim-session-middleware` のアプデ
- PSR7実行が外部依存になったので `slim/psr7` の追加
- DI が外部依存になったので `php-di/php-di` の追加
- Google Cloud Storage がランタイム外になったので `google/cloud-storage` の追加

#### php-di への移行

もともとは Slim3 のアプリケーションコンテナを使っていたので、こんな感じでやっていたのを

```php
// Instantiate the app
$settings = require __DIR__ . '/src/settings.php';
$app = new \Slim\App($settings);
```

以下のように変更しました。

```php
use DI\Container;

$settings = require __DIR__ . '/src/settings.php';
$container = new Container();
$container->set('settings', $settings['settings']);
```

続いてDIコンテナの初期化処理化を

```php
require __DIR__ . '/src/dependencies.php';
```

のように指定していたのを

```php
use Slim\Factory\AppFactory;

$dependencies = require __DIR__ . '/src/dependencies.php';
$container = $dependencies($container);

AppFactory::setContainer($container);
$app = AppFactory::create();
```

このように変更しました。

- コンテナを初期化
- 環境設定の注入やコンテナの初期化を実行
- AppFactory でアプリケーション初期化

のような実装に変わります。

#### Slim4 っぽい書き方に変更

もともとは

```php
// Register middleware
require __DIR__ . '/src/middleware.php';

// Register routes
require __DIR__ . '/src/routes.php';
```

こんな感じでミドルウェアとルーティングの設定を書いていたのですが、

```php
// Register middleware
$middleware = require __DIR__ . '/src/middleware.php';
$middleware($app);

// Register routes
$routes = require __DIR__ . '/src/routes.php';
$routes($app);
```

Slim4アプリを引数で指定して設定するように変更しました。
`$app` をグローバル参照から引数参照するコールバック関数に変わったぐらいです。

#### Basic認証の修正

登録済みのデバイスからデータを受信するAPIでは、Basic認証ミドルウェアを設定していて、 `callback` という処理が呼び出されることになっていました。

```php
//
// For Registered Devices
//
$app->post('/api/devices/{id}/values', '\ToiletEvolution\Controllers\DeviceValuesController:add')
    ->add(new \Slim\Middleware\HttpBasicAuthentication([
        "authenticator" => new ToiletEvolution\Middlewares\HttpBasicAuthentication\DeviceAuthenticator($app->getContainer()->get('DeviceStore')),
        "callback" => function($request, $response, $arguments) {
          $route = $request->getAttribute('route');
          $id = $route->getArgument('id');
          return $id === $arguments['user'];
        },
        "secure" => false
      ]));
```

Slim4でのBasic認証では `before` が呼び出される様に変わっています。

```php
  //
  // For Registered Devices
  //
  $app->post('/api/devices/{id}/values', '\ToiletEvolution\Controllers\DeviceValuesController:add')
      ->add(new \Tuupola\Middleware\HttpBasicAuthentication([
          "authenticator" => new ToiletEvolution\Middlewares\HttpBasicAuthentication\DeviceAuthenticator($app->getContainer()->get('DeviceStore')),
          "before" => function($request, $response, $arguments) {
            $id = $arguments('id');
            return $id === $arguments['user'];
          },
          "secure" => false
        ]));
```

#### コントローラーの修正

APIでJSONを返却するときの処理が標準ではなくなったので、JSON文字列を出力する `JsonRenderer` のようなクラスを作ります。

```php
namespace ToiletEvolution\Renderer;

use Psr\Http\Message\ResponseInterface;

final class JsonRenderer
{
    /**
     * Write JSON to the response body.
     *
     * This method prepares the response object to return an HTTP JSON
     * response to the client.
     *
     * @param ResponseInterface $response The response
     * @param mixed $data The data
     *
     * @return ResponseInterface The response
     */
    public function json(
        ResponseInterface $response,
        mixed $data = null,
    ): ResponseInterface {
        $response = $response->withHeader('Content-Type', 'application/json');

        $response->getBody()->write(
            (string)json_encode(
                $data,
                JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR
            )
        );

        return $response;
    }
}
```

で、それをコントローラのコンストラクタで初期化して、APIメソッドで呼び出します。

```php
class DevicesController
{
  protected ContainerInterface $ci;
  private JsonRenderer $renderer;

  public function __construct(ContainerInterface $ci)
  {
    $this->ci = $ci;
    $this->renderer = new JsonRenderer();
  }

  public function index(ServerRequestInterface $request, ResponseInterface $response, array $args)
  {
    $deviceModel = $this->ci->get(Device::class);

    $data = array_map(function($device) {
      return $device->toArrayWithoutSecret();
    }, $deviceModel->all());

    return $this->renderer->json($response, $data)->withStatus(empty($data)?204:200);
  }
```

Slim3 では以下のようなコードで `$response->withJson` でよかったところが変更になっています。

```php
public function index($request, $response, $args)
{
    $deviceModel = $this->ci->get(Device::class);

    $data = array_map(function($device) {
      return $device->toArrayWithoutSecret();
    }, $deviceModel->all());

    return $response->withJson($data, empty($data)?204:200);
}
```

#### ミドルウェアの修正

PSR の書き方が変わっているので、それに応じて修正しています。



```php
class RequireLoginMiddleware
{
    public function __invoke($request, $response, $next)
  {
    if(empty($this->session->get('current_user')))
    {
      $response = $response
        ->withStatus(302)
        ->withHeader('Location', $this->redirectIfNotLogin);
    }
    else
    {
      $response = $next($request, $response);
    }

    return $response;
  }    
```

こんな感じだったのが、以下のように変更になっています。

```php
class RequireLoginMiddleware
{
  public function __invoke(Request $request, RequestHandler $handler): ResponseInterface
  {
    $response = new Response();
    if(empty($this->session->get('current_user')))
    {
      $response = $response
        ->withStatus(302)
        ->withHeader('Location', $this->redirectIfNotLogin);
    }
    else
    {
      $response = $handler->handle($request);
    }

    return $response;
  }
```

引数が変更になっていて、 `$response` がなくなって、次のミドルウェアへ処理を引き継ぐのが `$next` から `$handler`  に変わっています。

`$response` はミドルウェアごとに作成して設定していきます。
次のミドルウェアに引き継ぐときは、 `$handler->handle` で呼び出してレスポンスを取得します。

### さいごに

Slim3 から Slim4 への移行手順がインターネットに多くあって助かりました。
また Slim 関連の OSS パッケージも 3 から 4 への移行をドキュメントにしてくれていたので、比較的スムーズに移行できたと思います。

ここではその一部を紹介する感じになりましたが、同じような対応をする人に役立つ内容になっていれば嬉しいです。
