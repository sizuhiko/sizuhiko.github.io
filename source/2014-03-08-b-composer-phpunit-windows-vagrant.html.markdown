---
title: VagrantでComposerからPHPUnitをインストールするときに注意したいこと
date: 2014-03-08 16:12:00+09:00
slug: composer-phpunit-windows-vagrant
tags: 
- composer
- phpunit
---

<!-- more -->
現在以下のような環境を設置して開発をしています。

- ホストOS: Windows7 
- 仮想環境: Vagrant + VirtualBox
- ゲストOS: CentOS 6.4
- 開発環境: Apache, PHP, MySQL, git, composer, CakePHP, Bdd,  ...

### 事件その1: Bddプラグインがインストールできなくなった

ある日、新しくcomposer installで環境を作っていた人が「Bddプラグインがうまくインストールできないんですけど...」
という事で調べていたら Bddプラグインから依存関係にあったライブラリが行方不明になっていました。

それは phpunit/Object_Freezer です。以前はpearにあって、あるときからgithubに移行していたはずなのに、どこにも痕跡を残さず消滅していました。
で、どこで使っているかというと、Bddプラグインの単体テストモジュールにあたるSpec-PHPです。
現在は Spec-PHP に同梱する形で解決しているのですが、以前はcomposer.jsonに

    "pear-phpunit/Object_Freezer": "*"

のように指定していました。ちょうど金曜日だったので、週末にこれらを解決してBddプラグインがうまくイントールできるようになった（私の自宅Mac OSX環境+BddExampleAppで確認）と安心して月曜日出社したのです。


### 事件その2: PHPUnitがインストールできない!

で、Vagrant環境で更新してみたら....

    composer update sizuhiko/Bdd


失敗....


しかも全然関係ないところ PHPUnit のインストールで失敗するよ！
ちょうどその週末にPHPUnit4.0のコードがGitHubのデフォルトになりはじめたあたりでした。

でcomposer.jsonにはPHPUnitの記述が

    "phpunit/phpunit": "3.7.*"

のように入っています。一見PHPUnit4をインストールするわけではないので関係なさそうですが、 `composer install` を実行すると

	.....
	  - Installing phpunit/php-token-stream (dev-master 292f4d5)
	    Cloning 292f4d5772dad5a12775be69f4a8dd663b20f103

	  - Installing phpunit/php-file-iterator (dev-master acd6903)
	    Cloning acd690379117b042d1c8af1fafd61bde001bf6bb

	  - Installing phpunit/php-code-coverage (1.2.x-dev 3a60a66)
	    Cloning 3a60a660998e8d41d5ea81ff8d96ead546bce150

	[RuntimeException]
	Failed to execute git checkout '3a60a660998e8d41d5ea81ff8d96ead546bce150' &
	& git reset -- hard '3a60a660998e8d41d5ea81ff8d96ead546bce150'

	error: Untracked working tree file 'Tests/PHP/CodeCoverage/FilterTest,php'
	would be overwritten by merge.

のようにエラーになります。

### 事件その3: Issueが光の速さで取り消される

ともかく事は重大そうなので、PHPUnitにIssue登録した方が良いかなと思ったので、投稿したところ、ものの数秒でそれはcomposerとか環境の問題でPHPUnitじゃないよ、と返ってきました。

[Can't install 3.7.x to Linux environment by composer](https://github.com/sebastianbergmann/phpunit/issues/1144)

ちょっと慌てていたので、あまり確認しなかったのも良くないなと思い、ここから検証作業の開始です。

### 原因を調べてみた

まず、その週末にPHPUnitのgithubを見たところで、デフォルトブランチ(master)が4.0系になっているよ、という事に気がついていました。

ここで composer がどのようにライブラリを取得するか考えてみたところ、

- packagist からリポジトリ情報をダウンロード
- phpunit/phpunit と一致するソースコードリポジトリからダウンロード（この場合はgithub）
- `git clone git@github.com:sebastianbergmann/phpunit.git` が実行される
- リリースを指定しているので一致するタグがチェックアウトされる `git checkout ....`

この最後のステップで「Untracked working tree file」になり失敗するのです。

PHPUnitのリポジトリを見てみると、3系まではディレクトリ名が Tests だったのですが、 4系では tests のように小文字に変更となっています。大文字、小文字問題か！と意気たったのが、先程の Issue なわけですが。

自分の環境だけかなーと思って、隣の人にちょっとインストールしてみてもらえないか頼んでみたところ、成功.... えぇぇー！

その環境は Vagrant上のCentOSでなく、素のWindowsでした。
何かがおかしい....

そこで偶然なぜか思ったのが、とりあえずディレクトリ変えてみるか、という事。とりわけ何か理由があった訳でなくたまたまそう思っただけなのです。

composer update （この日は何度実行したろう....）  ...... 成功した！！！！でも、なんで？！

### 違いに悩むと...

成功したところ：

- 素のWindows
- Vagrant仮想環境内の /tmp/work/app

失敗したところ：

- Vagrantのsync_folderである /var/www/html/your_app/app (CentOSから見えるディレクトリ)
    windows上だと c:¥develop¥your_app¥app みたいなところ

もしかしてVagrantでマウントしているWindowsディスク上だと大文字、小文字の変更をトレースできなくなるのでは！！

という結論に至り、他の人で同様にVagrantのsync_folder環境で試したらダメでした。


### まとめ

ホストがwindowsでゲストがLinuxということはあると思うのですが、ディスク同期してそこにソースコードを置いてエディタはホストOS上で実行は仮想環境上みたいな開発するのは今後も増えてくると思います。
その中で今回のような事象に陥ることは composer + PHPUnit に限らず起きそうだなと思いました。

上記のような `Failed to execute git checkout ... ` エラーが出た時に、あぁそういう事かと心構えができていれば慌てず、一旦ホストOS側で作業するとか、仮想環境上のsync_folder以外で作業するなどやりようがあるかな、と思います。

まぁ慌てず騒がず、落ち着いて対応しましょうという良い教訓になりました。twitterなどでお騒がせしてすみませんでした...


