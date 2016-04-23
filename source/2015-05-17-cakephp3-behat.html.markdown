---
title: CakePHP3 のアプリケーションを Behat でテストする
date: 2015-05-17 08:21 UTC
tags:
- CakePHP3
- BDD
- Behat
---

![](/images/blog/cakephp3_behat.png)

CakePHP3の変更点として大きく取り上げられるのが、モデル層の変更でしょう。
しかしそれ以上に私たちが受けられる恩恵で大きいのが、PSR-2の採択です。

[CakePHP3 is fully adopt PSR-2](http://bakery.cakephp.org/2014/12/16/CakePHP-3-to-fully-adopt-PSR-2.html)

例えばCakePHP2で単体テストを実行するときは、以下のように`cake`コマンドを使って実行する必要がありました。

```
Console/cake test app Model/Articles
```

cakeコマンド内でPHPUnitへの依存関係を解決し、PHPUnitからCakePHPのクラスが参照可能になるように作られていました。

ところがCakePHP3からは、以下のように`phpunit`コマンドを使って実行します。

```
vendor/bin/phpunit
```

PSR-0のオートロードに対応したことで、PHPUnitからCakePHP3のクラスが参照可能になるのです。

### はじめてみよう

同様の理由で、CakePHP2のアプリケーションをBehatでテストしたい場合は、私が作成した[Bdd Plugin](https://github.com/sizuhiko/Bdd)を使ってBehatのステップ記述からCakePHPのクラスを参照可能になるようにしていました。

しかしBehatにおいても直接実行したステップ定義から、CakePHP3のクラスが参照可能になるのです。

CakePHP3のアプリケーションをどのようにBehatからアクセスするのか、CakePHP3のブログチュートリアルを例にサンプルアプリを作成しました。

[cakephp3-bdd-example](https://github.com/sizuhiko/cakephp3-bdd-example)    

サンプルアプリケーションは[以前記事](/2015/04/19/cakebox-is-awesome.html)にもした[Cakebox](https://github.com/alt3/cakebox)を使って構築しました。
またサンプルアプリケーションの実行にもCakeboxを使うと簡単に実行環境を構築することができます。

サンプルアプリケーションのGithubページに書いてあるとおりの手順で進むことができます。
本ブログでは日本語で補足します。

#### 必要なアプリケーションのインストール

以下のアプリケーションをホストOSにインストールします。

- VirtualBox
- Vagrant
- Cakebox

詳しくは[Cakebox を使ってCakePHP3アプリケーションを作ってみよう](/2015/04/19/cakebox-is-awesome.html)の記事を参照してください。

#### サンプルアプリケーションのインストール

CakeboxのゲストOSにログインして、cakeboxコマンドでアプリケーションをインストールします。

```
localhost:cakebox $ vagrant ssh
Welcome to Ubuntu 14.04.1 LTS (GNU/Linux 3.13.0-24-generic x86_64)

vagrant@cakebox $ cakebox application add blog-tutorial.app --source https://github.com/sizuhiko/cakephp3-bdd-example.git --webroot blog-tutorial.app
```

すると、以下のように表示されます。

```
Creating application http://blog-tutorial.app

Configuring installer
Creating installation directory
Git installing user specified application sources
Creating virtual host
* Successfully created PHP-FPM virtual host
Creating databases
* Successfully created main database
* Successfully created test database
Configuring permissions
Updating configuration files
Application created using:
  database => blog-tutorial_app
  framework_human => user specified
  framework_short => custom
  installation_method => git
  path => /home/vagrant/Apps/blog-tutorial.app
  source => https://github.com/sizuhiko/cakephp3-bdd-example.git
  url => blog-tutorial.app
  webroot => blog-tutorial.app
Please note:
  => Configuration files are not automatically updated for user specified applications.
  => Make sure to manually update your database credentials, plugins, etc.

Remember to update your hosts file with: 10.33.10.10 http://blog-tutorial.app

Installation completed successfully
```

新規アプリケーションの構築と同じように、データベースやNginxの設定ファイルも生成してくれるので、すぐにアプリケーションを実行できる環境が整います。

あとはアプリケーションのルートディレクトリに移動して、不足しているディレクトリを作ってcomposerでライブラリをインストールします。

```
vagrant@cakebox $ cd Apps/blog-tutorial.app
vagrant@cakebox:~/Apps/blog-tutorial.app$ mkdir tmp 
vagrant@cakebox:~/Apps/blog-tutorial.app$ mkdir logs
vagrant@cakebox:~/Apps/blog-tutorial.app$ cp config/app.default.php config/app.php
vagrant@cakebox:~/Apps/blog-tutorial.app$ composer install 
```

#### サンプルアプリケーションの環境設定

##### データベース接続設定の変更

`config/app.php`のデータベース接続設定をCakeboxで生成された内容に変更します。
以下のとおり`username`と`database`の部分のみ変更します（それ以外はそのまま）。

```php
    'Datasources' => [
        'default' => [
            // 省略
            'username' => 'cakebox',
            'database' => 'blog-tutorial_app',
            // 省略
        ],
        'test' => [
            // 省略
            'username' => 'cakebox',
            'database' => 'test_blog-tutorial_app',
            // 省略
        ],
```

##### ホストOSのhostsファイルの変更

ホストOSのhostsファイルに指示されたように `10.33.10.10 blog-tutorial.app` の行を追加します。

##### Cakebox環境のチューニング

Cakeboxのデフォルト設定ではBehatを使ってアプリケーションをテストしようとすると、いくつか動かない箇所があったので、設定値をチューニングします。
まずボックスファイルのメモリを2048Mにアップします（デフォルトは1024M）。
次にxdebug.iniのxdebug.max_nesting_levelの値を調整します。READMEでは`500`を設定しています。もう少し値は小さくても大丈夫かもしれないですが、とりあえず500あれば大丈夫です。

具体的な設定例は、githubのREADMEを参照してください。

##### Webサーバの設定

Behatからアプリケーションをテストするときは、ブラウザから通常操作するのと同じようにWebサーバを通過します。
そのため、アプリケーションが通常操作としてアクセスされたのか、Behatのテストでアクセスされたのかを識別して環境を切り替えてあげないと、データベースのデータがテストによって変更するので、通常操作のデータが失われてしまいます。

このあたりの話（理由や手法）は、過去に何度か記事にしていたり、書籍[CakePHPで学ぶ継続的インテグレーション](http://www.amazon.co.jp/CakePHP%E3%81%A7%E5%AD%A6%E3%81%B6%E7%B6%99%E7%B6%9A%E7%9A%84%E3%82%A4%E3%83%B3%E3%83%86%E3%82%B0%E3%83%AC%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3-%E6%B8%A1%E8%BE%BA-%E4%B8%80%E5%AE%8F/dp/4844336789/ref=la_B004LVAF8Q_1_1?s=books&ie=UTF8&qid=1410066610&sr=1-1)でも詳しく解説していますので、CakePHP2の内容ですが、一度手に取ってみてください。

で、このサンプルはnginx用の設定ファイルを`blog-tutorial.app.test`というファイルで用意しておいたので、これをCakeboxのnginxの設定ディレクトリにコピーして再起動するだけで大丈夫です。

環境切り替え用に`blog-tutorial.app.test`というホスト名でアクセスされたら、nginxで環境変数`CAKE_ENV`に`test`という文字列を設定するようにしています。
CakePHP3のアプリケーションでは`config/bootstrap.php`で環境変数の設定値を見てDBの接続先が`test`になるように設定します。

```php
if (getenv('CAKE_ENV') === 'test') {
    ConnectionManager::alias('test', 'default');
}
```

CakePHP3ではConnectionManagerのaliasという機能でdefaultへ接続しようとしたときに、実際はtestの接続内容を参照するように設定することができるので、この機能を利用し、間違ってdefaultのテーブルが書き変わらないようにしています。

より詳しい手順や、設定ファイルの内容はgithubのREADMEや設定ファイルを参照してください。

Behatから参照可能なホスト名として`blog-tutorial.app.test`をCakeboxのVM側の`/etc/hosts`に追加します。

#### データベースのマイグレーション

データベースの生成はマイグレーションコマンドで一発です。

```
bin/cake migrations migrate
```

#### Behatのテストを実行する

ここまで設定できれば、後はテストを実行するだけです。

```
vagrant@cakebox:~/Apps/blog-tutorial.app$ vendor/bin/behat
```

おそらくすべてグリーンで成功するはずです。
うまくいかなかったら、お気軽にgithubのissueに`日本語で`書いてください。

### どうやったのか？

まずCakePHP3で最初に注目したのは、単体テストがPHPUnitのコマンドから実行できるようになっていたことです。
これは過去に外部の様々なツールやアプリケーションとCakePHPを結合するときに一番悩んでいたところでした。

PHPUnitからCakePHP3にどのように連動しているのか？を調べることから始めました。
PHPUnitは実行すると、カレントディレクトリのphpunit.xml（もしくはphpunit.xml.dist）を参照します。

#### PHPUnitがCakePHP3を呼び出す仕組みを知る

CakePHP3ではアプリケーションスケルトンを生成すると、ルートディレクトリに`phpunit.xml.dist`が生成されます。

```xml
<!-- phpunit.xml.dist -->
<phpunit
    colors="true"
    processIsolation="false"
    stopOnFailure="false"
    syntaxCheck="false"
    bootstrap="./tests/bootstrap.php"  // (1)
    >
    <php>
        <ini name="memory_limit" value="-1"/>
        <ini name="apc.enable_cli" value="1"/>
    </php>

    <!-- Add any additional test suites you want to run here -->
    <testsuites>
        <testsuite name="App Test Suite">
            <directory>./tests/TestCase</directory>
        </testsuite>
        <!-- Add plugin test suites here. -->
    </testsuites>

    <!-- Setup a listener for fixtures (2) -->
    <listeners>
        <listener
        class="\Cake\TestSuite\Fixture\FixtureInjector"
        file="./vendor/cakephp/cakephp/src/TestSuite/Fixture/FixtureInjector.php">
            <arguments>
                <object class="\Cake\TestSuite\Fixture\FixtureManager" />
            </arguments>
        </listener>
    </listeners>
</phpunit>
```

このファイルを読むと、2つ重要な箇所があるのに気がつきます。

まず(1)の `bootstrap="./tests/bootstrap.php"` という部分。
bootstrap属性にはPHPUnitが実行されるとき呼び出されるPHPコードを指定することができます。
ここからCakePHP3アプリケーションをテスト用にロードする場合、このファイルを呼び出せば外部ツールからCakePHP3が操作できるようになることがわかります。

実はこのファイルを実際に見てみると、以下の1行しかありません。

```php
require dirname(__DIR__) . '/config/bootstrap.php';
```

テストとは関係なく、アプリケーションの`config/bootstrap.php`をロードしています。
おそらく将来テストに関する何か差分が必要になったときに、テスト側にだけ変更が発生すると思うので、テスト用にCakePHP3をロードする場合は`tests/bootstrap.php`をロードしておいた方が良いでしょう。

次に(2)のリスナー設定です。
PHPUnitのリスナーはPHPUnitのフックポイントでコールバックされる処理を記述できるクラスです。
CakePHP3ではフィクスチャ（DBのテストテーブルとデータを準備する仕組み）を投入するのに利用しています。
以下のように`FixtureInjector`クラスのstartTestとendTestでテストケース開始／終了ごとにフィクスチャのロードとアンロードが対応するようになっています。

```php
class FixtureInjector implements PHPUnit_Framework_TestListener
{

    /**
     * Adds fixtures to a test case when it starts.
     *
     * @param \PHPUnit_Framework_Test $test The test case
     * @return void
     */
    public function startTest(PHPUnit_Framework_Test $test)
    {
        $test->fixtureManager = $this->_fixtureManager;
        if ($test instanceof TestCase) {
            $this->_fixtureManager->fixturize($test);
            $this->_fixtureManager->load($test);
        }
    }

    /**
     * Unloads fixtures from the test case.
     *
     * @param \PHPUnit_Framework_Test $test The test case
     * @param float $time current time
     * @return void
     */
    public function endTest(PHPUnit_Framework_Test $test, $time)
    {
        if ($test instanceof TestCase) {
            $this->_fixtureManager->unload($test);
        }
    }

}
```

#### BehatからCakePHP3を呼び出す仕組みに流用する

ここまでの内容が外部ツールからCakePHP3のアプリケーションをテストするのに重要な部分です。
PHPUnitがCakePHP3を呼び出すのと同じようにする仕組みをBehatのFeatureContextクラスに用意します。

`features/bootstrap/FeatureContext.php`というBehatが読み込むファイルに記述します。
CakePHP2とBDDプラグインによるインテグレーションではBehatのバージョンが2系でしたが、CakePHP3との連携では最新の3系を利用しています。
Behat3からはBehat1系、2系で利用していたファイル構成と異なっています。従来、`support/bootstrap.php`や`support/hooks.php`あたりに書いていたコードはすべてContextクラス内に記述することになります。

Behat3からはFeatureContextにブートストラップ記述を、それ以外のコンテキストは用途に応じて別のコンテキストクラスに分割する方がスマートに記述できそうです。
Behat2では複数のコンテキストクラスを使う場合、FeatureContextでインクルードしないといけなかったのですが、Behat3では`behat.yml`上で記述できるのでより簡単になっています。

```php
class FeatureContext implements Context, SnippetAcceptingContext
{
    public function __construct()
    {
        require_once dirname(dirname(__DIR__)) . '/tests/bootstrap.php'; // (1)

        // Always connect test database
        ConnectionManager::alias('test', 'default'); // (2)

        Fabricate::config(function($config) { // (3)
            $config->adaptor = new CakeFabricateAdaptor([
                CakeFabricateAdaptor::OPTION_FILTER_KEY => true,
                CakeFabricateAdaptor::OPTION_VALIDATE   => false
            ]);
        });

        $this->fixtureInjector = new FixtureInjector(new FixtureManager()); //(4)
        $this->fixture = new BddAllFixture();
    }
}
```

- (1)は、phpunit.xmlのbootstrapと同様にCakePHP3の`tests/bootstrap.php`を呼び出します。
- (2)は、Behatのステップ定義からテストデータを投入するときに、testの接続設定を参照するようにエイリアスを設定します。
- (3)は、テストデータジェネレータ[Fabricate](https://github.com/sizuhiko/cakephp-fabricate-adaptor)の初期設定です。FabricateもCakePHP3対応されています。
- (4)は、phpunit.xmlのリスナー部分を模して、Behatのシナリオ毎にフィクスチャが動くようにFixtureInjectorのインスタンスを生成しています。

#### BehatからCakePHP3のフィクスチャを利用する

(4)で書いたとおり、FixtureInjectorのインスタンスを生成したので、Behatのフックポイントを使ってシナリオ開始時にフィクスチャをロードし、シナリオ終了時にフィクスチャをアンロードするようにします。

```php
    /** @BeforeScenario */
     public function beforeScenario(BeforeScenarioScope $scope)
     {
        $this->fixtureInjector->startTest($this->fixture);
     }

     /** @AfterScenario */
     public function afterScenario(AfterScenarioScope $scope)
     {
        $this->fixtureInjector->endTest($this->fixture, time());
     }
```

実際にフィクスチャを利用するためには、`$this->fixture`のクラスがCakePHP3のTestCaseでなければならないので、`$fixtures`という利用するフィクスチャファイルの配列を定義しただけのクラスを用意してFixtureInjectorに渡すようにします。

```php
class BddAllFixture extends TestCase {
    public $fixtures = [
        'Categories' => 'app.categories',
        'Articles'   => 'app.articles',
        'Users'      => 'app.users',
        'Categories' => 'app.categories'
    ];
}
```

このあたりの話も、書籍[CakePHPで学ぶ継続的インテグレーション](http://www.amazon.co.jp/CakePHP%E3%81%A7%E5%AD%A6%E3%81%B6%E7%B6%99%E7%B6%9A%E7%9A%84%E3%82%A4%E3%83%B3%E3%83%86%E3%82%B0%E3%83%AC%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3-%E6%B8%A1%E8%BE%BA-%E4%B8%80%E5%AE%8F/dp/4844336789/ref=la_B004LVAF8Q_1_1?s=books&ie=UTF8&qid=1410066610&sr=1-1)でも詳しく解説していますので、CakePHP2の内容ですが、一度手に取ってみてください。
CakePHP3になって、メソッドやクラスが一部変わりましたが、BehatとCakePHPをインテグレーションするためにおさえておかないといけないポイントはほとんど変わっていません。

後はBehat3のドキュメント、CakePHP3のドキュメントを見ながら進めていくと、エンド to エンドのテストが容易に記述できるようになります。

### さいごに

GithubのREADMEに書いた内容をすべて日本語にした訳ではないのですが、要所をかいつまんで重要な部分を解説しました。
より詳しい内容などはREADMEを見ていただければと思います。

また、BDDプラグインのサンプルアプリにはあった、日本語のシナリオや、JavaScriptを使ったテストなど、Behat3になって大きく変わってはいませんが、サンプルアプリケーションに少しずつ載せられたらなぁと思っています。
何かうまく動かないなどあれば、気軽にGithubのissueに投稿お願いします（日本語でOKです）。

