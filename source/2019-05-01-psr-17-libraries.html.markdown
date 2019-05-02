---
title: PSR-17 HTTP Factories のライブラリ
date: 2019-05-01 11:15 UTC
tags:
- PHP
- PSR
---

令和最初の記事も、PHP。
この記事は[PSR-15リクエストハンドラーのライブラリ比較](/2019/04/30/psr-15-libraries.html)の続編です。

前回のサンプルプログラムでは [zendframework/zend-diactoros](https://github.com/zendframework/zend-diactoros) の [HTTP Message Factories](https://docs.zendframework.com/zend-diactoros/v2/factories/) を使って PSR-7のHTTPレスポンス(`Psr\Http\Message\ResponseInterface`)を作っていました。

今回は、他のライブラリを使っても大丈夫か考えてみたいと思います。

### PHP-17 の HTTP Factories に対応したライブラリ

[PackagistでPSR-17を検索](https://packagist.org/?query=factory&tags=psr-17)してみました。
PSR-15ほどはないようです。ということで独断と偏見（ダウンロード数が多いもの）を選んで比較してみたいと思います。
なお「フレームワーク」と書いてあるものや、特定のPSR-7ライブラリ **だけ** に依存したもの（たとえば`http-factory-guzzle`など）は除外しています。

- [tuupola/http-factory](https://github.com/tuupola/http-factory)
- [tebe/http-factory](https://github.com/tbreuss/http-factory)

それぞれのライブラリの説明を読んで気づくでしょう。

`PSR-17 HTTP-Factory with auto-discovery support`

そう先ほど「特定のPSR-7ライブラリ **だけ** に依存したもの」と書きましたが、実は特定のライブラリに依存します。
それはそうですよね。PSR-7のHTTPレスポンスインターフェースの実装インスタンスを **生成** しないといけないので、何かしらに依存します。

ただ、こういった `auto-discovery` してくれるライブラリを使っておくと、PSR-7のライブラリを変更したときも影響が少ないですね。
でもそれ、さっきのサンプルで DI してたから、それで良くない？というのは、まさにそのとおりです。

### で、結局どうすると良いの？

- PSR-7/PSR-11/PSR-15/PSR-17 を使うアーキテクチャにするなら、FactoryInterfaceをDIすれば影響範囲は設定箇所だけになります
- PSR-7/PSR-15/PSR-17 を使う(PSR-11を使わない)アーキテクチャにするなら、上記のような PSR-7 を自動判定してくれるライブラリを使うと良い

ということになると思います。

それならPSR-7のライブラリも使い分けたサンプルが見たかった！とかあるかもしれませんが、それはまた今度！（機会があれば）

### おまけ

さて、PSR-7/PSR-15/PSR-17 の話は面白かったですか？
これに加えて、フロントエンドも含めてフレームワークに依存しないアプリケーションとは？
みたいな話を[PHPカンファレンス福岡2019](http://phpcon.fukuoka.jp/2019)でします。
午後一のセッション。また [@soudai1025](https://twitter.com/soudai1025) の裏になりましたが、私の方がマニアックな話なのかな。

では6月に福岡でお会いしましょう！
