---
title: Cakebox を使ってCakePHP3アプリケーションを作ってみよう
date: 2015-04-19 06:19 UTC
tags:
- Cakebox
- CakePHP3
- CakePHP
- PHP
---

CakePHP3の開発環境を構築するのは、以前にも書いたとおり [FriendsOfCake/vagrant-chef](https://github.com/FriendsOfCake/vagrant-chef) を便利に使っていたのですが、先日 Twitter の TL に流れてきた [Cakebox](https://github.com/alt3/cakebox) というのが気になっていたので、使ってみました。

結論としては「`CakePHPで何かつくってみたいなら、使わない理由がない`」ということです。

### Cakeboxとは

CakeboxはAlt<3 Because projects need loveというオランダのプロジェクトのリポジトリにあり、アムステルダムの[bravo-kernel](https://github.com/bravo-kernel)氏が中心になって作っているようです。またCakePHPのコアデベロッパでもある[ceeram](https://github.com/ceeram)氏もcontributeしているので、アムステルダムでは著名なプロジェクトなのかもしれません。

[Cakeboxの詳しいドキュメント](http://cakebox.readthedocs.org/en/latest/features/)に書いてあるとおり、chefでubuntuベースのboxファイルを生成し、cakeboxではそれを使ってvagrantとvirtualboxで起動する流れです。

後で説明しますが、便利なコンソールアプリがあり、それ自体がCakePHP3でできているので、CakePHP3のアプリケーションサンプルとしても役立つのではないかと思います。

boxファイルに入っているソフトウェアは上記ドキュメントに詳しく書いてあるので、そちらを参照してください。

### なんと簡単、環境構築

#### Cakeboxのインストール

最初にCakeboxをダウンロード（クローン）します。以下はCakeboxのREADMEに書いてあるままの内容です。
注意点として、以下の前提条件が必要となります。

- VirtualBox 4.0 以上
- Vagrant 1.6.0 以上

どちらかが満たされていないと、まったく起動しないので注意してください（私は踏みましたw）。

```sh
git clone https://github.com/alt3/cakebox.git
cd cakebox
cp Cakebox.yaml.default Cakebox.yaml
vagrant up
```

設定ファイル（yaml）には、詳細な設定を指定できるようですが、いったん何も設定しなくても問題はありませんでした。
以下のようなログが出力されます。
最初はCakeboxのboxファイルをCDNからダウンロードするので時間がかかります。
予め時間があり、回線に余裕があるときにvagrant upだけは済ませておくと良いですね。

```sh
Bringing machine 'default' up with 'virtualbox' provider...
==> default: Importing base box 'cakebox'...
# ... 省略
==> default: ---------------------------------------------------------------
==> default: Please wait... installing Cakebox Commands and Dashboard
==> default: ---------------------------------------------------------------
==> default: * Self-updating Composer
==> default: * Updating Composer cache permissions
==> default: * Creating project
==> default: * Composer installing
==> default: Installation completed successfully!
==> default: Running provisioner: shell...
    default: Running: inline script
==> default: ---------------------------------------------------------------
==> default: CakePHP v3.0.0 Console
==> default: ---------------------------------------------------------------
==> default: Self-updating cakebox
==> default: Self-updating Composer
==> default: * Updating cache permissions
==> default: Updating Cakebox Commands and Dashboard
==> default: * Detecting branch
==> default: * Updating git repository
==> default: * Updating composer packages
==> default: Updating CakePHP Code Sniffer
==> default: * Composer updating
==> default: Updating HHVM configuration
==> default: * Creating system start/stop links
==> default: * Correcting HHVM session.save_path
==> default: * Restarting service
==> default: Updating Elasticsearch configuration
==> default: * Decreasing required memory
==> default: * Updating initialization script
==> default: * Stopping service
==> default: Self-update completed successfully
==> default: Running provisioner: shell...
    default: Running: inline script
==> default: ---------------------------------------------------------------
==> default: CakePHP v3.0.0 Console
==> default: ---------------------------------------------------------------
==> default: Setting Cakebox Dashboard protocol to http
==> default: Command completed successfully
==> default: Running provisioner: shell...
    default: Running: inline script
# ... 省略

==> default: Machine 'default' has a post `vagrant up` message. This is a message
==> default: from the creator of the Vagrantfile, and not from Vagrant itself:
==> default: 
==> default: Your box is ready and waiting.
==> default: 
==> default: => Login to your Dashboard by browsing to http://10.33.10.10
==> default: => Login to your virtual machine by running: vagrant ssh
```

boxファイルのインストールが終わると、ダッシュボードアプリをインストールし、そのアプリのCLIを使ってアプリ自身と、各種モジュールを設定するようです。

ここまで終わったら、指示どおり `http://10.33.10.10` にアクセスしてみましょう。

![](/images/blog/cakebox_init.png)

かっこいいダッシュボード画面が表示されました。こういうのがあるとテンション上がりますよね！

#### アプリケーションの構築

Cakeboxを使って開発環境が構築できたら、CakePHP3アプリケーションを構築してみましょう。`vagrant ssh`でCakeboxにログインします。

```sh
localhost:cakebox $ vagrant ssh
Welcome to Ubuntu 14.04.1 LTS (GNU/Linux 3.13.0-24-generic x86_64)
```

CakeboxのREADMEに書いてあるとおり、`cakebox`コマンドを使ってアプリケーションを生成します。とりあえずCakePHP3のブログチュートリアルを作ってみたいと思います。

```sh
vagrant@cakebox:~$ cakebox application add blog-tutorial.app
---------------------------------------------------------------
CakePHP v3.0.0 Console
---------------------------------------------------------------
Creating application http://blog-tutorial.app

Configuring installer
Creating installation directory
Composer installing CakePHP 3.x application sources
Creating virtual host
* Successfully created PHP-FPM virtual host
Creating databases
* Successfully created main database
* Successfully created test database
Configuring permissions
Updating configuration files
Application created using:
  database => blog-tutorial_app
  framework => cakephp
  framework_human => CakePHP 3.x
  framework_short => cakephp3
  installation_method => composer
  majorversion => 3
  path => /home/vagrant/Apps/blog-tutorial.app
  source => cakephp/app
  url => blog-tutorial.app
  webroot => /home/vagrant/Apps/blog-tutorial.app/webroot

Remember to update your hosts file with: 10.33.10.10 http://blog-tutorial.app

Installation completed successfully
```

はい、終わり。`hostsファイルに追加してね` というメッセージが出ているので、hostsファイルに追加します。

```
$ vim /etc/hosts

# この行を追加します
10.33.10.10 blog-tutorial.app
```

さっそく `http://blog-tutorial.app` にアクセスしてみましょう。

![](/images/blog/cakebox_createapp.png)

うわー、すげー。
ディレクトリの権限とか、DBの設定とか全部できちゃっているよ。
CakePHP3で `composer create-project` やったことあればわかると思うのですが、ここまで設定するのもちょっと面倒です。

Cakeboxのダッシュボード画面も見てみましょう。

![](/images/blog/cakebox_createdapp_dashbord.png)

アプリケーションが1つ、データベースが2つ、バーチャルホストが2つ（最初は1なので1つ増えてます）になっています。
つまり `cakebox application add` 実行すると

- CakePHP3の `composer create-project` でスケルトン作って
- nginxのsite-availablesにバーチャルホスト追加して
- DB（mysql）にdefaultとtestの2つのDBを作って
- CakePHP3のconfigをモロモロ設定、パーミッションも設定

してくれるというわけです。なんと便利、そして簡単なんでしょう。
[blogチュートリアルの1ページ目](http://book.cakephp.org/3.0/en/tutorials-and-examples/blog/blog.html)のうち、`Creating the Blog Database` のテーブル生成以外のステップは（nginxの設定まで）コマンド一つで終わりです。

### ブログチュートリアルのテーブル作成

せっかくなので、マイグレーションプラグインを使って、テーブルを生成します。

```
vagrant@cakebox:~$ cd Apps/blog-tutorial.app/
vagrant@cakebox:~/Apps/blog-tutorial.app$ ./bin/cake migrations create CreateArticles
Welcome to CakePHP v3.0.1 Console
---------------------------------------------------------------
App : src
Path: /home/vagrant/Apps/blog-tutorial.app/src/
---------------------------------------------------------------
using migration path /home/vagrant/Apps/blog-tutorial.app/config/Migrations
using migration base class Phinx\Migration\AbstractMigration
using default template
created ./config/Migrations/20150419074519_create_articles.php
```

upとdownを以下のように記述します。

```php
<?php
    public function up()
    {
        $table = $this->table('articles');
        $table->addColumn('title', 'string', ['limit' => 50])
              ->addColumn('body', 'text')
              ->addColumn('created', 'datetime')
              ->addColumn('modified', 'datetime')
              ->create();
    }
    public function down()
    {
        $this->dropTable('articles');
    }
    ?>
```

マイグレーションを実行してテーブルを作成します。

```
vagrant@cakebox:~/Apps/blog-tutorial.app$ ./bin/cake migrations migrate

Welcome to CakePHP v3.0.1 Console
---------------------------------------------------------------
App : src
Path: /home/vagrant/Apps/blog-tutorial.app/src/
---------------------------------------------------------------
using migration path /home/vagrant/Apps/blog-tutorial.app/config/Migrations
using environment default
using adapter mysql
using database blog-tutorial_app

 == 20150419074519 CreateArticles: migrating
 == 20150419074519 CreateArticles: migrated 0.1178s

All Done. Took 0.1780s
```

これでチュートリアルの1ページ目は終了です。

### ブログチュートリアルを進めよう

チュートリアルって環境構築ではまるケースが多い（特に今まで使ったことないフレームワークとか特に）のですが、このように簡単に始められるのは大きいですね。
あとは[パート２](http://book.cakephp.org/3.0/en/tutorials-and-examples/blog/part-two.html)の内容を、進めていけば大丈夫です。
ここではチュートリアルそのものを解説するわけではないので、ワープします。
指定されたファイルに、そのままコピペしていけば大丈夫です。

コピペしたあとにテストという投稿を追加してみた結果が以下のとおりです。

![](/images/blog/cakebox_tutorial_part2.png)

### さいごに

Cakeboxを使ってブログチュートリアルを進めてみましたが、もし今までCakePHPを使ったことがなくても、CakePHP2は使っていたけど、3はまだ、という人にも環境構築のステップが簡略されているのは、とても大きいと思います。

実はCakebox `Multi-Framework PHP Development Environment` と書いてあるとおり、CakePHP3だけのためにあるわけではないようです。

```sh
# Fresh preconfigured PHP framework applications
$ cakebox application add mycake3.app
$ cakebox application add mycake2.app --majorversion 2
$ cakebox application add mylaravel.app --framework laravel
```

なんとCakePHP2もいけるし、今話題の laravel5 の環境も作れるみたいですよ！
これは現時点でのサポート状況ということで、今後増えていくことも想定されます。
これはもう Cakebox を試してみるしかないですね。

そんなCakePHP3ですが、[CakePHP3 もくもく会（勉強会） #14](https://coedo-cakephp.doorkeeper.jp/events/23199) が 2015-04-28（火）19:00 - 21:30　に Co-Edoで開催されます。
PHP勉強会と日程かぶっていますが、もしCakePHP3に興味があればこちらにも参加してみてください。
