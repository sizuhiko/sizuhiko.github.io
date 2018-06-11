---
title: Brackets prettier 拡張を作ってみた
date: 2018-06-11 04:49 UTC
tags:
- Editor
- Brackets
- Prettier
---

JavaScriptでコードを書くときは [JS Beautifier](https://www.npmjs.com/package/js-beautify) を使ってフォーマットしていたのですが、
[mizchi's blog](http://mizchi.hatenablog.com/)の[最近のフロントエンドのエディタ事情](http://mizchi.hatenablog.com/entry/2018/05/31/233220)で

> フォーマッタは当然のように prettier が入る。もう選択肢はなくて、猫も杓子もprettier。すでに勝負は決している。

と書かれていたので、じゃぁ[prettier](https://prettier.io/)入れようと思ったのがきっかけです。

### prettier を使うには

私がメインで使っているエディタは [Adobe Brackets](http://brackets.io) です。
vs-code にも atom にも拡張があるので、Bracketsでも誰か作ってるだろう... と思ったらありませんでした。
ここで考えたのが、以下アイデアです。

- gulp-watch 使って、ファイルに変更があったら自動的に変換する
- git の commit フックに仕込む
- Bracketsの拡張作る
- vs-code にエディタを変える

### Brackets 愛が強すぎて拡張を作ってみることにした

まぁアレですよ。エディタの機能拡張といえば古くは（これはものすごく古い話）Emacsの拡張作ったり、Sublime使っていたころはpython使って拡張書いたりしていたので「エディタ拡張を作るとは」みたいな流儀はわかっていたつもり、でした。
そもそもBracketsの拡張ってatomやvs-codeとどう違うのか？と思って、[atom版](https://github.com/prettier/prettier-atom)と[vs-code版](https://github.com/prettier/prettier-vscode)のコードを見比べましたが「お・おぅ」となって、断念しました。
まぁBracketsって[CEF](https://bitbucket.org/chromiumembedded/cef)ベースだからなー（[electron](https://electronjs.org)ベースではない）、そもそもコードを流用とか考えない方が良さそうだ。

#### Brackets 拡張を作るのに参考になるサイト

とりあえず調べられた範囲が以下のとおり

- [初めてのBRACKETS拡張機能の作成](https://www.adobe.com/jp/devnet/edge-code/articles/building-your-first-brackets-extension.html)
    - 記事が2012年で大丈夫かぁ？と思ったが、終わってみれば何も変わっていなかった
- [How to write extensions](https://github.com/adobe/brackets/wiki/How-to-write-extensions)
    - こちらは2015年に更新されていて、情報のメンテはされているようだ
- [Brackets API](http://brackets.io/docs/current/index.html)
    - 詳しいAPIの使い方が書いてある `Show code` が便利というか、それ見ないとわからないよ！

#### どうやって作るか

公式サイトにも書いてあります

> For a quick start, you can paste in the Simple "Hello World" extension or the code from an existing extension that is similar to what you want to do.

「既存の機能が似ている拡張のコードを参考にすると良いよ！」（おまえドキュメントを書くということを放棄しているんじゃないだろうな...

#### 参考にするもの

[Brackets Beautify](https://github.com/brackets-beautify/brackets-beautify)という、最初にも紹介した [JS Beautifier](https://www.npmjs.com/package/js-beautify) を使えるようにする Brackets拡張です。
普段この拡張を使っているので、参考にするにはもってこいです（機能もコードフォーマットという部分では似ている）。

#### いくつかの壁

[Brackets Beautify](https://github.com/brackets-beautify/brackets-beautify)のコードは難しくなく、簡単に読めたのですが

- これテストコードとか書けないの？（まぁ書けないに近い
- ES6とか使えないの？
- ファイル分割するベストプラクティスとかないの？

という部分が気になりました。
他の拡張のコードをいくつかみたりしましたが、まぁエディタの拡張って、ちょこっとした機能だから分割するまでもないんですよね、「わかる」みたいな感じ。

結果として

- テストコードは諦めた（モックのテストになりそうだったので
- ES6というとアレですが、 `const` `let` あたりは使えた。allow functionはエラーになってしまった
- ファイル分割してみた！（ベストではないかもしれないが!!

### Brackets Prettier 作ったよ！

そんなこんなで、[Brackets Beautify](https://github.com/brackets-beautify/brackets-beautify)のコードを ~~パクって~~ 参考に、[Brackets Prettier](https://github.com/sizuhiko/brackets-prettier) を作りました。

#### Brackets 拡張を作ったらやること

[Brackets Extension Registry](http://brackets-registry.aboutweb.com/)というところに登録しておくと、エディタの `拡張機能マネージャ` からインストールできるので、世界中のBracketsユーザーが `prettier` と検索したら出てくるようになります。
で、レジストリへの登録方法は、[公式WikiのExtension Registry Help](https://github.com/adobe/brackets/wiki/Extension-Registry-Help)に書いてあるので、そのとおり作業を進めます。

で、登録するとBrackets拡張のBotアカウントがツイートしてくるんですね。知らなかった。

<blockquote class="twitter-tweet" data-lang="en-gb"><p lang="en" dir="ltr">Brackets Prettier - 1.0.0 (NEW) <a href="https://t.co/axTV7nu5xB">https://t.co/axTV7nu5xB</a> <a href="https://t.co/3KQ31k1dED">https://t.co/3KQ31k1dED</a> <a href="https://twitter.com/brackets?ref_src=twsrc%5Etfw">@brackets</a></p>&mdash; Brackets Extensions (@brktsextensions) <a href="https://twitter.com/brktsextensions/status/1004603877402873856?ref_src=twsrc%5Etfw">7 June 2018</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

### 今後は

Brackets拡張の作り方わかったので、これからは俺得な拡張をもっと作っていこうと思います！
とりあえずPolymer関係を作ろうかなー
