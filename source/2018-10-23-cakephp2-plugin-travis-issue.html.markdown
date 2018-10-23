---
title: CakePHP2プラグインをTravisCIでビルドしているときに気をつけること
date: 2018-10-23 01:58 UTC
tags:
- CakePHP
- CakePHP2
- TravisCI
- CI
- Fabricate
---

先日 [@tenkoma](https://twitter.com/tenkoma) さんが、[Fabricate](https://github.com/sizuhiko/Fabricate) に [PR](https://github.com/sizuhiko/Fabricate/pull/30) をくれました。
しかももう枯れてる [CakePHP2版](https://github.com/sizuhiko/Fabricate/tree/cakephp2) に。ありがたやー、と思っていましたら...


[CIのビルドが失敗](https://travis-ci.org/sizuhiko/Fabricate/builds/443036544)しています。

おや？[直前までは通過](https://travis-ci.org/sizuhiko/Fabricate/jobs/246923803)していて、[READMEのtypoが修正された](https://github.com/sizuhiko/Fabricate/pull/30)だけなんですが...

（ただ直前は1年も前なのだが...）

### ためしにRebuildしてみる

そういう小手先の問題ではないようだ....

### TravisCIに書いてあるスクリプトの手順をローカルで実行してみる

うまく動く...

### ビルド失敗の問題とは

[失敗ビルドの一例](https://travis-ci.org/sizuhiko/Fabricate/jobs/444524331)でわかるとおり、PHPUnitのバージョンが期待値ではありません。

CakaPHP2ではPHPUnit3.7系しか使えません。
[CakeTestSuiteDispatcherでPHPUnitのロード](https://github.com/cakephp/cakephp/blob/2.x/lib/Cake/TestSuite/CakeTestSuiteDispatcher.php#L135)を試みていて、もしロードできないと[TestShellでエラー](https://github.com/cakephp/cakephp/blob/2.x/lib/Cake/Console/Command/TestShell.php#L179)になります。


CakePHP2のプラグインのテストを簡単に実行できるようにするため[FriendsOfCake/travis](https://github.com/FriendsOfCake/travis)を使っています。
このTravis用ツールは、PHPUnit3.7をインストールして、 `Vendor` の下にリンクしてくれるので、うまくPHPUnitは見つかるはずなのですが。

想定される原因としては、以下のような感じです。

- PHPUnitが見つからない
- 新しいPHPUnitが見つかった

### CakePHPの日本語Slackで相談してみる

https://cakesf.slack.com/archives/C1FT02VQA/p1539927224000100

> CakePHP2系のプラグインをTravis CIでテストするのに
> https://github.com/FriendsOfCake/travis
> を使っているのですが、PHPUnitへの参照がうまくできなくなっていて、解決した人っていたりしますか？
> 個人的に修正できそうなんて、試してみようかと思ったのですが、すでに対応済みの人がいたらなーと思い、聞いてみたいです

他のCakePHP2プラグインはビルド通っているのか？

- https://github.com/lampager/lampager-cakephp2 は5ヶ月ぐらい前に[通過している](https://travis-ci.org/lampager/lampager-cakephp2/builds/387421969)。でもPHPUnitのバージョンが新しい
- https://github.com/cakephp/debug_kit/tree/2.2 はPHPUnit3.7使っているけど、 [FriendsOfCake/travis](https://github.com/FriendsOfCake/travis) を使ってない。ビルドは[最近通過](https://travis-ci.org/cakephp/debug_kit/builds/429846172)している
- https://github.com/tsmsogn/Pas/ は [FriendsOfCake/travis](https://github.com/FriendsOfCake/travis) を使っていて、Slackで相談したらビルドまでしていただけた。ありがたや。[通過](https://travis-ci.org/tsmsogn/Pas/builds/249863706)している。

### とにかくいろいろ試す

試すのに、別のブランチを切れば良かったのですが、まぁ簡単になおるだろうと `Fabricate/cakephp2` ブランチで作業したのは、ちょっと後悔しています....

- ◎ [FriendsOfCake/travisのbefore_script.sh](https://github.com/FriendsOfCake/travis/blob/master/before_script.sh) を呼び出す方法が、 `travis_wait` 付きに変わっていたので[追従した](https://github.com/sizuhiko/Fabricate/commit/046548930effc61affab8acd0b64b974d52005d8)。ビルドが不安定なことがあったが安定した
- × [FriendsOfCake/travis](https://github.com/FriendsOfCake/travis) をローカルに fork して、ログを仕込んだりしてビルドを試みた（何も意味はなかった）
- × [FriendsOfCake/travisのbefore_script.sh](https://github.com/FriendsOfCake/travis/blob/master/before_script.sh) で `composer global install` しているPHPUnitを削除して `composer require` で入れてみた（変化なし）
- × `include_path` の先頭にPHPUnitへのパスを設定してみた（変化なし）
- △ Slackで `CAKE_REF` 使うと良いかも？というアドバイスをいただいたので、入れてみた。PHPUnitへの参照としては変化がなかったけど、有用そうなのでそのまま採用した。
- × 既存で `composer.json` があるのが、[FriendsOfCake/travis](https://github.com/FriendsOfCake/travis)を使っている他のプラグインと違ったので、 `.travis.yml` の `before_script` で消してみた（変化なし）

で、TravisCIの画面（のビルド結果コンソールではない部分）を見比べていたら、テストが通過している画面にはワーニングが表示されていて、自分のビルドには出ていないことが判明。
さらに[過去に通過していたビルド](https://travis-ci.org/sizuhiko/Fabricate/jobs/246923803)にもワーニングが表示されていることを確認した。

### 何のワーニング？

> This job ran on our Precise environment, which is in the process of being decommissioned. Please read about the status of the rollout on the blog, and take note that you can explicitly stay on Precise by specifying dist: precise in your .travis.yml.

意訳すると「このビルドは、Precise環境で実行されたけど、廃止予定です。もし続けて使いたければ .travis.yml に `dist：precise` と書いておけばOK。続きはBlogで」みたいなことです。
[the blog](https://blog.travis-ci.com/2017-08-31-trusty-as-default-status)も見ておいてください。

### precise 指定でビルドしてみる

`.travis.yml` に `dist：precise` を追加してみると....

ビルドが通過しました！！

ついでに古い composer.lock と composer.json も更新/削除しておきました。

### 詳しく調べた

現在のTravisでビルドするLinuxイメージは `trusty` なのですが、そこでPHP5.4などを利用しようとすると以下のようなメッセージがビルドコンソール中に表示されます。

> 5.4 is not pre-installed; installing
> Downloading archive: https://s3.amazonaws.com/travis-php-archives/binaries/ubuntu/14.04/x86_64/php-5.4.tar.bz2
> 9.31s$ curl -s -o archive.tar.bz2 $archive_url && tar xjf archive.tar.bz2 --directory /

ということで、PHPのイメージファイルをダウンロード＆解凍してみました。
すると、PHPUnitが同梱されています。
そのバージョンは `PHPUnit 4.8.35` でした。
そこかー、それ参照しちゃいましたか...


### まとめ

CakePHP2プラグインを作ったことがあって、最近ビルドしていない方は漏れなく同様の事象になると思います。
これは[FriendsOfCake/travis](https://github.com/FriendsOfCake/travis)使っている、使っていないに関係なくです。

あなたの `.travis.yml` に `dist：precise` が設定されていなければ、今のうちに追加しておきましょう。

ではステキなCakePHPライフを！
