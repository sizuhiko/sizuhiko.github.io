---
title: CakePHP3 もくもく会#3 に参加して Bake してきた
date: 2014-04-19 05:04 UTC
tags:
- PHP
- CakePHP
- Co-Edo
---

2013/4/4(金) に [コワーキングスペース茅場町 Co-Edo（コエド）](http://www.coworking.tokyo.jp/) で行われた「[CakePHP3 もくもく会 #3](http://coedo-cakephp.doorkeeper.jp/events/10020)」に参加しました。

CakePHP3もdev preview2、せっかくの機会なので初Cake3を体験しようということです。

### 環境構築する

イベントページからリンクされていたCo-Edo謹製Vagrantを使っても良かったのですが、私はCakePHPのコアデベロッパも参加するコミュニティ [Friends Of Cake](http://friendsofcake.com/) の [Vagrant Chef](https://github.com/FriendsOfCake/vagrant-chef) を使いました。

事前に用意するものは

- [Vagrant](http://www.vagrantup.com/)
- [Virtual Box](https://www.virtualbox.org/)

です。概ね最新版で大丈夫でしょう。
ダウンロード＆インストールしたら、任意のディレクトリに先程のVagrant Chefをクローン（またはダウンロード）します。後は

    cd vagrant-chef
    vagrant up

を実行してしばらく待ちましょう。Chefでインストールされるものは Vagrant Chef のREADMEに書いてあるので、そちらを参照してください。

    INFO: Chef Run complete in 541.542816 seconds
    INFO: Running report handlers
    INFO: Report handlers complete

なメッセージが出て、コンソールが戻ってきたらインストールの完了です。
動作確認として、http://192.168.13.37/ にアクセスしてみてください。

![](/images/blog/cakephp3_vagrant_chef.png)

デフォルト画面が出たら環境構築の完了です。

### CakePHP3をインストールする

Vagrant ChefにはCakePHPをインストールするレシピも入っているのですが、Friends Of CakeにCakePHPの環境を作るスケルトンコマンドが別途用意されているので、レシピの編集は必要ないです。
生成したVagrant環境にログインします。

    vagrant ssh

ログイン直後

    vagrant@precise64:/vagrant$ ls -la
    total 20
    drwxr-xr-x  1 vagrant vagrant  306 Apr 19 05:37 .
    drwxr-xr-x 25 root    root    4096 Apr 19 05:37 ..
    drwxr-xr-x  1 vagrant vagrant  102 Apr 19 05:37 app
    drwxr-xr-x  1 vagrant vagrant  510 Apr 19 05:30 cookbooks
    drwxr-xr-x  1 vagrant vagrant  442 Apr 19 05:30 .git
    -rw-r--r--  1 vagrant vagrant   12 Apr 19 05:30 .gitignore
    -rw-r--r--  1 vagrant vagrant 5489 Apr 19 05:30 README.markdown
    drwxr-xr-x  1 vagrant vagrant  102 Apr 19 05:31 .vagrant
    -rw-r--r--  1 vagrant vagrant 1179 Apr 19 05:30 Vagrantfile

のようになっていて、すでにappディレクトリが存在します。ここには先程のデフォルト画面が入っているのですが、今回は新しくアプリを作成するのでappディレクトリは削除します。

    rm -rf app

環境構築でも利用した Friends Of Cake のリポジトリにはCakePHPのアプリケーションスケルトンを作成する app-template というリポジトリがあります。
すでにCakePHP3用のスケルトンも(cake3ブランチとして)用意されているので、GitHubのREADMEに書いてあるとおりのコマンドでCakePHPのアプリケーション環境を構築します。

    composer -sdev create-project friendsofcake/app-template app dev-cake3

app の部分がアプリケーション名です。Vagrant Chefを使った場合はappを指定してください。

    Do you want to remove the existing VCS (.git, .svn..) history? [Y,n]? 

最後に上記のような確認メッセージが出てくるので、履歴が気にならなければそのままEnterを押して終了します。
インストールの確認として、http://192.168.13.37/ にアクセスしてみてください。

![](/images/blog/cakephp3_installed.png)

おなじみのCakePHP画面が表示されます。tmpディレクトリが書き込みできないと警告されます。これはwebサーバのデフォルトuserがvagrantでなくwww-dataであるためですが、開発環境用なの気にせず

    sudo chmod -R 777 app/tmp

などのコマンドで権限を書き換えてください。

![](/images/blog/cakephp3_tmp_ok.png)

### データベースを設定する

vagrant-chefを使うとデフォルトで database_name, test_database_name というデータベースが生成されています。
ただ文字コードの指定などの問題もあると思うので、ここは自分でデータベースを作成します。

    mysql -u root -p

vagrant-chefのMySQL rootパスワードは、vagrant-chefのREADMEを参照ください（現時点ではbananasです）。

    mysql> CREATE DATABASE cake3_mokumoku CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
    mysql> CREATE DATABASE test_cake3_mokumoku CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;

続けておなじみのpostsテーブルを作成します。

    mysql> use cake3_mokumoku;
    mysql> CREATE TABLE `posts` (
              `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
              `title` varchar(50) DEFAULT NULL,
              `body` text,
              `created` datetime DEFAULT NULL,
              `modified` datetime DEFAULT NULL,
              PRIMARY KEY (`id`)
            ) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

app-templateで作成したCakePHPアプリケーションは、[php-dotenv](https://github.com/josegonzalez/php-dotenv)というライブラリを使って環境設定できるようになっています。
`app/App/Config/.env.default` ファイルをコピーして `app/App/Config/.env`ファイルを作成します。

    // app/App/Config/.env
    export DATABASE_URL="mysql://my_app:secret@localhost/my_app?encoding=utf8"
    export DATABASE_TEST_URL="mysql://my_app:secret@localhost/test_myapp?encoding=utf8"

の部分を

    // mysql://ユーザ名:パスワード@URL/データベース名
    export CAKEDATABASE_URL="mysql://root:bananas@localhost/cake3_mokumoku?encoding=utf8"
    export CAKEDATABASE_TEST_URL="mysql://root:bananas@localhost/test_cake3_mokumoku?encoding=utf8"

のように書き換えます。データベースの詳しい設定方法は [AD7six/php-dsn](https://github.com/AD7six/php-dsn)を参照ください。
exportの名前を変更しているのは、nginxのfastcgiパラメータとしてvagrantインストール時に

    fastcgi_param DATABASE_URL          "mysql://root:<%= node[:mysql][:server_root_password] %>@localhost/database_name?encoding=utf8";
    fastcgi_param DATABASE_TEST_URL     "mysql://root:<%= node[:mysql][:server_root_password] %>@localhost/test_database_name?encoding=utf8";

のような指定がされているため、設定値が重複してしまいfastcgi側が優先される仕組みとなっています。
このため異なる名前に変更しておきます。
合わせて、app.phpでDATABASE_URLを利用している箇所もCAKEDATABASE_URLに変更します。

```PHP
// app/Config/app.php#L211-
/**
 * Connection information used by the ORM to connect
 * to your application's datastores.
 */
    'Datasources' => [
        'default' => DbDsn::parse(env('CAKEDATABASE_URL')),

        /**
         * The test connection is used during the test suite.
         */
        'test' => DbDsn::parse(env('CAKEDATABASE_TEST_URL'))
    ],
```

### Cakeシェルを利用する

コンソールから

    cd app/App
    Console/cake -h

とヘルプを表示してみたいのですが、もし

    Exception: Shell class for "-working" could not be found. in [/vagrant/app/vendor/cakephp/cakephp/src/Console/ShellDispatcher.php, line 178]

というエラーが表示されたら、app/App/Console/cake を編集して

    exec php -q "$CONSOLE"/cake.php -working "$APP" "$@"

の行を

    exec php -q "$CONSOLE"/cake.php "$@"

のように変更してください。現時点では -working オプションがあるとうまく動作しないためです。
うまく動作した場合は

```bash
$ Console/cake -h

Welcome to CakePHP v3.0.0-dev2 Console
---------------------------------------------------------------
App : App
Path: /vagrant/app/App/
---------------------------------------------------------------
Current Paths:

* app: App
* root: /vagrant/app
* core: /vagrant/app/vendor/cakephp/cakephp

Available Shells:

[CORE] bake, i18n, server, test

[app] console

To run an app or core command, type cake shell_name [args]
To run a plugin command, type cake Plugin.shell_name [args]
To get help on a specific command, type cake shell_name --help
```
のように表示されるはずです。

### Bakeする

では早速Bakeしましょう

```
$ Console/cake bake model Posts

Welcome to CakePHP v3.0.0-dev2 Console
---------------------------------------------------------------
App : App
Path: /vagrant/app/App/
---------------------------------------------------------------
One moment while associations are detected.

Baking table class for Posts...

Creating file /vagrant/app/App/Model/Table/PostsTable.php
Wrote `/vagrant/app/App/Model/Table/PostsTable.php`

Baking entity class for Post...

Creating file /vagrant/app/App/Model/Entity/Post.php
Wrote `/vagrant/app/App/Model/Entity/Post.php`

Baking test fixture for Posts...

Creating file /vagrant/app/Test/Fixture/PostFixture.php
Wrote `/vagrant/app/Test/Fixture/PostFixture.php`

Baking test case for App\Model\Table\PostsTable ...

Creating file /vagrant/app/Test/TestCase/Model/Table/PostsTableTest.php
Wrote `/vagrant/app/Test/TestCase/Model/Table/PostsTableTest.php`
```

うまく動きます！！

続けてコントローラとビューも

```
$ Console/cake bake controller Posts
$ Console/cake bake view Posts
```

で生成します。

一通りbakeしたら、http://192.168.13.37/posts/ にアクセスしてみます。

![](/images/blog/cakephp3_baked_posts.png)

おなじみのBake画面が表示されます。追加、変更、削除などもうまく動作するようです（執筆時においては）。

![](/images/blog/cakephp3_baked_saved.png)

### 最後に

このブログはもくもく会から2週間ぐらい経過してしまいましたが、今回再度新しい環境を作って試しています。
もくもく会のときも同様の手順で進めていたのですが、いくらかbake周辺でコードの変更があったようで、うまく動いていた箇所が動かなくなっていたり、動かなかった箇所が動いていたりします。
開発者用のプレビュー2ということで、今後もコードは変わって行くと思いますが、Bakeが動く事で取り急ぎ動作するプログラムのベースは作れるようになっています。
実際にアプリケーションを作ってみてCakePHP3の新機能について感想を書いてみたり、要望を出してみたりすることも実リリースまでの期間としては大切なことだと思うので、今回簡単ではありますがブログとして公開してみました。

Co-Edo では今後も CakePHP3もくもく会が開かれると思うので、イベントページをチェックしておくと良いと思います。私も可能な範囲で参加していこうと思っています。


