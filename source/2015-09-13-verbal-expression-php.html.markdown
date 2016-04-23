---
title: 正規表現を簡単に作るには
date: 2015-09-13 07:11 UTC
tags:
- PHP
---

皆さんは正規表現好きですか？そして得意ですか？
私は好きですが、得意とは言えません。

### VerbalExpressionという選択肢

そこでVervalExpressionという正規表現を簡単に組むことができる仕組みがあります。

[http://verbalexpressions.github.io/](http://verbalexpressions.github.io/)

サイトに「Regular Expressions made easy」と書いてあるように、簡単に正規表現が作れることを表明しています。
様々な言語にポートされていますが、もちろんPHP版もあります。

[https://github.com/VerbalExpressions/PHPVerbalExpressions](https://github.com/VerbalExpressions/PHPVerbalExpressions)

サイトのサンプルにも書いてあるとおり、以下のようなURLにマッチする正規表現が記述できます。

```php
use VerbalExpressions\PHPVerbalExpressions\VerbalExpressions;

$regex = new VerbalExpressions;
$regex  ->startOfLine()
        ->then("http")
        ->maybe("s")
        ->then("://")
        ->maybe("www.")
        ->anythingBut(" ")
        ->endOfLine();

echo $regex->getRegex() ."\n";
if (preg_match($regex, 'http://github.com')) {
    echo "valid url\n";
} else {
    echo "invalud url\n";
}
```

1つ目のechoの結果は `/^(?:http)(?:s)?(?:\:\/\/)(?:www\.)?(?:[^ ]*)$/m` で、2つ目のechoは `valid url` を表示します。
VerbalExpressionsクラスに `toString` メソッドが実装されているので、 `preg_match` 関数でそのまま使えます。

### 複雑なことはできるか？

例えばRFC3986に書いてあるURLパターンをマッチさせようとすると、どうなるでしょうか？
一旦スキーマ部分だけ記述してみます。

```php
$rfc3986 = new VerbalExpressions;
// scheme
$scheme = new VerbalExpressions;
$scheme->add("http")->maybe("s")->_or("ftp");

$rfc3986->startOfLine()
        ->add($scheme)
        ->add("://");
echo $rfc3986->getRegex() ."\n";
```

結果は `/^(?:\(\?\:http\)\(\?\:s\)\?\)\|\(\?\:ftp)(?:\:\/\/)/m` のようになってしまい、期待通りではありません。
この実装は入れ子には対応していないようです。

### もう１つのVerbalExpression実装

PHPにはもう１つ別のVerbalExpression実装があります。

[https://github.com/markwilson/VerbalExpressionsPhp](https://github.com/markwilson/VerbalExpressionsPhp)

こちらの実装はREADMEに入れ子について記述されているように、入れ子の対応はされているようです。
では早速RFC3986の定義を試してみましょう。

```php
$rfc3986 = new VerbalExpression;
// scheme
$scheme = new VerbalExpression;
$scheme->then("http", false)->maybe("s", false)->orPipe("ftp", false);

$rfc3986->startOfLine()
        ->find($scheme)
        ->find("://")
        ->endOfLine();
echo $rfc3986->compile() ."\n";
```

結果は `^((?:http)(?:s)?()|()(ftp))(\:\/\/)$` のようになってしまい、まぁ不正ではないのですが、かなり無駄があります。

### 現時点結局のところ

どちらの実装も簡単なパターンをやるときには良いのですが、ちょっと複雑なパターンを実装しようと思うと微妙です。
大体、簡単なパターンはそのまま正規表現書けば良いじゃん... という話ですしね。

### 目指したいところ

RubyのVerbalExpressions実装には [HEXPRESS](http://www.kurtisrainboltgreene.name/hexpress/) があります。
これはVerbalExpressionsよりさらに便利なヘルパーを備えて `Human Expressions, a human way to define regular expressions` という標語のとおりより簡単に実装できるように見えます。

これをPHPに移植して使えるようにしようというのが、直近やろうとしていることです。

### さいごに

[日本PHPカンファレンス2015](http://phpcon.php.gr.jp/2015/)が10/3(土)に行われます。
私もスピーカーとして登壇しますので、もしご都合がつく方はよろしくお願いします。	


