---
title: PSR-15リクエストハンドラーのライブラリ比較
date: 2019-04-30 12:28 UTC
tags:
- PHP
- PSR
---

平成最後の記事は、PHP。
久々のPHP記事ですが、[PSR-15](https://www.php-fig.org/psr/psr-15)に準拠したリクエストハンドラーライブラリの実装を比較してみようと思います。

### PSR-15とは？

HTTPメッセージを使用するリクエストハンドラーと、ミドルウェアコンポーネントの共通インターフェースです。

それ[PSR-7](http://www.php-fig.org/psr/psr-7/)なのでは？という鋭い人は、
[@tanakahisateru](https://twitter.com/tanakahisateru)さんのスライド
[PHP-FIGのHTTP処理標準の設計はなぜPSR-7/15/17になったのか](https://speakerdeck.com/tanakahisateru/17ninatutafalseka)を参照ください。

PSR-7については、だいぶ知れ渡っていると思うので、PSR-15のリクエストハンドラーに着目していきます。

### PHP-15のリクエストハンドラーに対応したライブラリ

[PackagistでPSR-15を検索](https://packagist.org/?query=PSR-15&tags=psr-15)してみました。
たくさんありますね。ということで独断と偏見（ダウンロード数が多いもの）を選んで比較してみたいと思います。
なお「フレームワーク」と書いてあるものは除外しています。
例えば [zend-expressive](https://github.com/zendframework/zend-expressive)は `minimalist PSR-7 middleware framework for PHP` と書いてあるとおりなので。
[Slim](http://www.slimframework.com/)などのマイクロフレームワークも同様です。

- [league/route](https://github.com/thephpleague/route)
- [northwoods/router](https://github.com/northwoods/router)
- [sunrise/http-router](https://github.com/sunrise-php/http-router)
- [middlewares/request-handler](https://github.com/middlewares/request-handler)

の4つを使って[サンプルプログラム集](https://github.com/sizuhiko/psr15-requesthandler-examples)を作ってみました。

### sizuhiko/psr15-requesthandler-examples

#### PSR-7

まず前提事項として、PSR-7対応のライブラリが必要です。
本サンプルでは、主に [zendframework/zend-diactoros](https://github.com/zendframework/zend-diactoros) を使っています。
[sunrise/http-router](https://github.com/sunrise-php/http-router)の例ついては、同系統に[sunrise/http-message](https://github.com/sunrise-php/http-message)と[sunrise-php/http-server-request](https://github.com/sunrise-php/http-server-request)があるので、それを利用しています。
PSR-7のライブラリが違うと、どのような記述の違いがあるのかわかりやすいでしょう。

#### サンプルの内容

[サンプルプログラム集](https://github.com/sizuhiko/psr15-requesthandler-examples)を `clone` するか、ダウンロードして、READMEの手順に従ってください。

ドキュメントルート(`/`)にアクセスすると、`Hello, World!` 出すだけの簡単なものです。

#### サンプルコードの流れ

で、結局PSR-15とは？みたいな話になるわけですが、どの例も以下のような流れで動いています

- PSR-7 でHTTPリクエスト(`Psr\Http\Message\RequestInterface`)を受け取る
- PSR-15の `Psr\Http\Server\MiddlewareInterface` か `Psr\Http\Server\RequestHandlerInterface` でいい感じに PSR-7のHTTPレスポンス(`Psr\Http\Message\ResponseInterface`) を生成する。
- PSR-7 のHTTPレスポンスをエミットする

つまり、真ん中の部分を処理することになります。

#### リクエストハンドラ

[サンプルのsrcフォルダ](https://github.com/sizuhiko/psr15-requesthandler-examples/tree/master/src)の下には

- Middlewares
- RequestHandlers

があり、それぞれ `Psr\Http\Server\MiddlewareInterface` か `Psr\Http\Server\RequestHandlerInterface` を実装したクラスが置いてあります。
で、それぞれのリクエストハンドラーからは、適したハンドラが呼び出されるようになっています。

このサンプルでは PSR-17 (HTTP Factories) を先行導入し、PSR-11 (Container Interface) に対応したライブラリでDIしてますが、
そのあたりは、次回以降で解説します。

ミドルウエアもリクエストハンドラも同じように`Hello, World!`をレスポンスボディに入れるだけです。

### このサンプルをとおして言いたかったこと

このサンプルでは、ドキュメントルートだけの簡単な実装でしたが、ルーターの設定を追加するだけで、
実際のアプリケーションでも使えるようになることがわかると思います。

もちろん実際にはDBにアクセスする必要もあったりするわけですが、そこには[PHP Data Objects(PDO)](https://www.php.net/manual/ja/intro.pdo.php)があり、
実際のDBの差分を吸収してくれます。
そこで利用するSQLは標準であり、Webの標準よりも長い期間利用されています。

フレームワークを利用してアプリケーションを作ることは、速く簡単に構築できます。
しかしフレームワークに依存せずPHPの標準を使うことで、柔軟にライブラリを変えても、自分のビジネスロジックを流用することができるようになります。

もちろん今日のフレームワークの多くが PSR 対応を進めていますので、フレームワークを使っていても、より互換性が高いアプリケーションを作ることができるようになるかもしれません。

[次回はPSR-17について、いくつかのライブラリを紹介](/2019/05/01/psr-17-libraries.html)します。
