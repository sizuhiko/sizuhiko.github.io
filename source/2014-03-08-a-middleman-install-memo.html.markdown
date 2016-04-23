---
title: Middleman インストールメモ
date: 2014-03-08 11:13:26+09:00
slug: middleman-install-memo
tags: 
- middleman
---

<!-- more -->
ブログを Middleman で作る（厳密に言うとmy.opera.comから移行）するにあたり、いくらかハマりポイントがあったので、メモとして残しておきます。

### 参考になったサイト

以下のサイトを参照しながら、作業を実施しました。

- [Middleman公式](http://middlemanapp.com/jp/) 
- [middlemanの設定](http://risin.jp/blog/2013/10/16/middleman/)
- [GitHub Pagesで独自ドメインを使う方法](http://blog.awairo.net/blog/2013/12/14/custom-domain-for-gh-pages/)
- [rbenv を使って ruby をインストールする(CentOS編)](http://qiita.com/inouet/items/478f4228dbbcd442bfe8)

### HTMLジェネレータは何を使うの？

ブログを移行するにあたり、利用可能なフォーマットは WordPress`互換`フォーマット ということで、「WordPressで良くない？」とか、「my.opera作った人がスピンアウトして作ったサービスがあるらしいよ」とか様々な誘惑があったものの、今時は GitHub Pagesでやるんでしょ？という勝手な妄想（実際そういう人が増えているわけですが）から、そうなれば静的サイトジェネレータが必要だなぁと。

最初に思いついたのはChatWorkが作成したPHP製のデザイナ向け静的サイトジェネレーター「Phest」だったのですが、前提となるWordPressフォーマットからの変換どうするかなーと思っているうちに、気持ちは他のものへ....

で、`GitHub Pages ブログ` なんてキーワードで検索すると出てくるページと言えば Octopress jekyll あたりなわけです。もちろん jekyll にしておくと GitHub Pagesの公式にも出てくるぐらいで良いなーと思ったのですが、世の中の流れは Middleman みたいな記事をいくつか見かけるうちにすっかりと方向は Middleman に決まりました。それに WordPress XMLからインポートできるプラグイン [Wordpress to Middleman Exporter](https://github.com/salmansqadeer/wordpress-to-middleman) があるということ。

### Middleman インストール

しばらく ruby の環境とか触ってなかったので、一番最後の記憶を頼りに「まずは RVM + bundler で環境構築やー」と意気込んで Gemfile に middleman を追加して `bundle install`を実行したところ、うんともすんともならずインストールできない....
もう今時はRVMじゃないのかな? と思っていたら、rbenvなんですね。そうですか、そうとわかればすぐに切り替えて参考サイトを参照しながら呆気なく構築は完了。

    gem install middleman

でインストールも楽々完了です。

ブログモジュールを使うので、middleman の Gemfile に

    gem "middleman-blog", "~> 3.5.1"

を追加して

    bundle install
    middleman init blog --template=blog

と実行すると blog ディレクトリに環境が生成されます。

### WorkPress からのインポート

my.opera から WordPress `互換` フォーマットのファイルをダウンロードして、画像やらも全部ダウンロード。
いよいよ先程の変換ツールで実行.... エラーだよ！！（泣）

rubyのエラーだったので、調べて直す事もできたのかもしれないのですが、そのとき思ったのは「要はWordPress.xml をmarkdownに変換すれば良いのだから他にもあるんじゃない？」という誘惑。
イロイロ調べたところ、

- wp2middleman
- wordpress-to-jekyll
- ruby-wpdb
- wp_conversion

などがあるようで、とりあえず1つずつ試みるという泥臭い作戦に。
どれもうまくいかない....

python系のライブラリもあるらしく

- wp2md
- prlican-import
- exitwp

順番に試して行くと、`exitwp` がいくつか失敗するものの良い感じに変換できることがわかった。
しかしいくつか失敗する... なんでだろうと思っていたところで、もう一度my.operaのクローズ本文を読んでいたら WordPress `互換` フォーマットなんですよ。「互換」.....
もしかして、WordPressに取り込んで、そこから再度エクスポートすると「互換」じゃなくて「正式」なXMLになるんじゃないか！と

### WordPress インストール

ちょっと迂回している感じですが、PHPの環境は手元にいくらでもあるのでテキパキとインストールしてXMLをインポート、何もせずそのままエクスポート。2つのファイルを diff で比較してみると確かにちょっと違う。
これを先程一番うまく変換できた exitwp にかけると.......

あらー全部奇麗に変換できるじゃないですかー

### デザイン

ここまで来ると後は erb と css なので、既存のmy.operaから html, css, js やらをすべてダウンロードして erb を html と同じになるように編集し、cssとjsも不要な部分を取り除いて設置。

    middleman server

で見た目を確認しながら調整して CNAME ファイルも設置。

GitHub Pages へデプロイするために Gemfile に

    gem "middleman-deploy"

モジュールを追加して bundle install。

config.rg に

	activate :deploy do |deploy|
	  deploy.build_before = true # default: false
	  deploy.method = :git
	  deploy.branch   = "master" # default: gh-pages
	end

な感じで設定したら 

    middleman deproy

でビルドした内容をgithubへ連携してくれます。

### 今後

ローカル（手元）のmiddleman使えば簡単にデプロイまでできるのですが、たまたま外で自分のPCじゃないときとか、githubにmarkdownをpushしたらビルドしてGitHub Pagesにデプロイしてくれたら良いな、とか思っているので、そのあたりはこれからやっていこうと思います。


