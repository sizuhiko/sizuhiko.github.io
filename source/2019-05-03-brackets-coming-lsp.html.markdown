---
title: BracketsにLSPがやってきた
date: 2019-05-03 13:45 UTC
tags:
- Brackets
- PHP
- LSP
---

やぁやぁやぁ、LSPがやってきたよ！

<blockquote class="twitter-tweet" data-lang="en-gb"><p lang="en" dir="ltr">Brackets 1.14 has landed!<br><br>With v 1.14, Brackets now supports LSP. If you&#39;re writing PHP code, take advantage of code hinting, jump to def, parameter hints, and more. More info here: <a href="https://t.co/0qvLhYbG8l">https://t.co/0qvLhYbG8l</a><br><br>Download now!<a href="https://twitter.com/hashtag/PHP?src=hash&amp;ref_src=twsrc%5Etfw">#PHP</a> <a href="https://twitter.com/hashtag/Web?src=hash&amp;ref_src=twsrc%5Etfw">#Web</a> <a href="https://twitter.com/hashtag/LSP?src=hash&amp;ref_src=twsrc%5Etfw">#LSP</a></p>&mdash; Brackets (@brackets) <a href="https://twitter.com/brackets/status/1123897524618657792?ref_src=twsrc%5Etfw">2 May 2019</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

[Brackets 1.14 has landed!](http://blog.brackets.io/2019/05/02/brackets-1-14-has-landed/)というブログ記事にも書かれているように、今回のリリースの目玉はLSP(Language Server Protocol)のサポートです。

ついにBracketsにもLSP対応が入りましたね。これまでAtomとはVS Codeに遅れをとっていましたが、これで色々なプログラミング言語でも利用しやすくなるはずです。
詳しくは[リリースノート](https://github.com/adobe/brackets/wiki/Release-Notes:-1.14)にも書かれています。

対応したissueを見ると、 `Move vscode-languageserver-protocol to Thirdparty` と書いて有るので、vscodeの実装を参考にしたようです。

[Language Server Protocol Support in Brackets](https://github.com/adobe/brackets/wiki/Language-Server-Protocol-Support-in-Brackets)のページにアーキテクチャの解説や、LSP拡張を実装する場合の方法について解説があるので現時点 PHP, Python, TypeScript だけのサポートのようなので、それ以外の言語にも対応させようと思ったときに役立ちそうです。

私の手元のBracketsもさっそくアップデートしました。

### さっそく使ってみよう

アップデートをインストールしたら、環境設定を開きます。
すると、2ペイン表示になるので、左側(defaultPreferences.json)から `php` で検索します。
以下のようなデフォルト設定になっているはずなので、コピーして右のペイン(brackets.json)に貼り付けます。

```js
	// PHP ツールのデフォルト設定
	"php": {
		// デフォルト: true
		"enablePhpTooling": true,

		// デフォルト: php
		"executablePath": "php",

		// デフォルト: 4095M
		"memoryLimit": "4095M",

		// デフォルト: false
		"validateOnType": "false"
	},
```

右ペインにコピーしたらコメント行は削除してくださいね。忘れるとJSONのパースエラーになります。

ここで重要なのは `executablePath` の設定です。
もしシステム(OS)に入っているPHPが7以上であれば問題ないのですが、デフォルトが7以上でない場合は、ここを書き換える必要があります。

たとえば私はphpbrewで複数バージョン切り替えているので、たまにPHP5.5とかに変更しますので、以下のように固定パスを指定するように変更します。

```js
    "php": {
        "enablePhpTooling": true,
        "executablePath": "/Users/sizuhiko/.phpbrew/php/php-7.3.1/bin/php",
        "memoryLimit": "4095M",
        "validateOnType": "false"
    }
```

これからは、Bracketsを使ったPHPアプリケーション開発も快適になりますね！
