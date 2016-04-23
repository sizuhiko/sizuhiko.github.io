---
author: sizuhiko
comments: true
date: 2012-05-01 06:05:12+00:00
slug: querypath-html
title: QueryPathを使ってHTMLを操作する
wordpress_id: 45
categories:
- 未分類
tags:
- HTML
- PHP
- QueryPath
---

<!-- more -->昨年末phpQueryについて、これはいいね！と取り上げたのですが、その時点でも若干更新が止まっていたり、XHTMLの解釈が微妙だったりとかいくつか不安要因があったのですが、そんな不安を解消するjQueryインターフェースを実装したライブラリを発見しました。  

それが[QueryPath](http://querypath.org/)です。
![](/images/blog/querypath_logo.png) 



### QueryPathが当たり前に良いと思う点

  




  * 日本語が普通に使える
  * XHTMLが普通に使える
  * 更新されている
  * 拡張（extension）が書きやすい
  * テストコードがある
  * jQueryインターフェースがほぼ忠実に再現されている


こういう当たり前にできて欲しい事が、意外と日本語環境だとうまくできなかったりするのですが、特に意識することなくできるのは良いと思います。
もちろんmetaの文字コード指定など、ある程度ちゃんとHTMLが書かれている事は重要です。



### QueryPathが独特と思う点

  


QueryPathは標準で5つの拡張機能（extension）を持っています。


  * QPDB : データベースへのアクセスと、検索結果をテンプレートへの差し込むことができるようになる
  * QPList：配列で渡した内容をtableタグやul、olなどに展開してHTML化できる
  * QPTPL：連想配列のキーをidやclassなどのクエリ情報と解釈して、テンプレート流し込み機能を提供する
  * QPXML：XMLを操作する拡張機能
  * QPXSL：XSLTを利用する拡張機能


独特というのは、拡張機能が簡単に実装できるので、拡張を使えばこんな事、あんな事、jQueryプラグインを書くかのように自由にできますよ、という部分に集約されると思います。



### 使ってみよう

  




#### インストール

  


QueryPathは3つの導入方法に対応しています。


  * PEARパッケージ
  * pharファイル
  * Composer


ここではpharファイルをダウンロードして始めてみます。pharファイル以外の導入方法は[GitHubの公式ページ](https://github.com/technosophos/querypath)を参照してください。  

  

[ダウンロードページ](https://github.com/technosophos/querypath/downloads)より QueryPath-_version_.pharというファイルをダウンロードします。この記事時点での最新versionは2.1.2です。ダウンロードしたファイルの名前をQueryPath.pharにリネームしておきます。



#### サンプルHTMLの取得

  


前回のphpQueryと同じく、WORDPRESSの日本語TOPページのHTMLを使ってみたいと思います。

    
    wget http://ja.wordpress.org/





#### phpshを使って試す

  


こちらも前回と同様に、簡単に試すにはインタラクティブシェルを使うのが便利なので、phpshを使います。


    
    
    bash-3.2$ phpsh
    Starting php
    type 'h' or 'help' to see instructions & feature
    
    php> require 'QueryPath.phar';
    
    php> $html = htmlqp('index.html');
    
    php> = $html->find('#blog .post .entry')->eq(0)->text()
    "ntttttttttWordPress 3.3.2 が利用できるようになりました。これはすべての前バージョンへのセキュリティアップデートです。nWordPress に含まれる3つの外部ライブラリでセキュリティアップデートがありました:n    Plupload (バージョン 1.5.4)、WordPress ではメディアのアップロードに使用しています。n    SWFUpload、WordPress では以前にメディアのアップロードに使用していました。おそらくプラグインによってはまだ使われています。n    SWFObject、WordPress では以前に Flash コンテンツの埋め込みに使用していました。おそらくプラグインやテーマによってはまだ使われています。ntttttttt"
    


  

ブログエントリーの先頭記事を抜き出してみました。phpQueryは配列キーにセレクタを記述する方式だったのですが、QueryPathではPHP言語としての「->」の部分以外はjQueryと同じだとわかるでしょう。
またQueryPathにはqpというコア関数もあるのですが、こちらはXML用で、HTMLを利用する場合はhtmlqpを使っておいた方が良さそうです。  

  

最後に

    
    
    php> = $html->top()->html();
    


  

を実行すると、HTML全文を文字列として取得することができます。日本語がまったく問題ないことを確認できると思います。  

※ $html->top()->innerXHTML(); ではなく、html関数でないと htmlタグとか含まれないので修正しました。(5/7)



### まとめ

  


現時点でもHTMLの取得にはURL指定、ファイル指定など様々な対応がされており、DB連携やテンプレート機能などそのままでも結構つかえるんじゃないかと思っています。  

ただ毎度DOM操作するの？とかいう部分もあるとは思うので、phpQueryっぽいPHP構文が含まれたPHPファイルを出力できるような拡張を作ってみたいなと思っています。まずは素のPHP部分から、その後でCakePHPとの連携も含んでみたいなぁという計画です。拡張名は標準のものを参考にするとQPPHP？なのかな。Pが続くと見づらいなぁ。名前は大事なので何か考えないと。。。
