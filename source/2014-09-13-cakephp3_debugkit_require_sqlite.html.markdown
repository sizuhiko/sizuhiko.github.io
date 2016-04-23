---
title: CakePHP3(Beta1)のDebugKitではSQLiteが必要になります
date: 2014-09-13 06:43 UTC
tags:
- CakePHP3
- DebugKit
---

[CakePHP 3.0.0 もくもく会（勉強会） #7](http://coedo-cakephp.doorkeeper.jp/events/14670) に参加してCakePHP3ベータ1を早速試しました。

ベータ1はアルファ版からディレクトリの変更も多く、CakePHP本体をcomposer updateしてもダメなので、再度 composer create-project でテンプレートから生成しなおします。

最新の[cakephp/app](https://github.com/cakephp/app)テンプレートにはDebugKitプラグインが依存関係に入っています。


```json
	"require": {
		"php": ">=5.4.19",
		"cakephp/cakephp": "3.0.*-dev",
		"mobiledetect/mobiledetectlib": "2.*",
		"cakephp/debug_kit": "3.0.*-dev"
	},
```

require-devではないのですね、と思ったり。。

以下のコマンドでCakePHP3アプリケーションのプロジェクトスケルトンを作ります。

    composer create-project -s dev cakephp/app dev-cake3 app

ブラウザでアクセスすると、以下のような画面が表示されます。

![](/images/blog/cakephp3_debugkit_sqlite.png)

なんかDebugKitがSQLiteを参照しているみたいなんですよ。

そこで、DebugKitの設定を見てみます

app/plugins/DebugKit/config/bootstrap.php

```php
if (!ConnectionManager::config('debug_kit')) {
	ConnectionManager::config('debug_kit', [
		'className' => 'Cake\Database\Connection',
		'driver' => 'Cake\Database\Driver\Sqlite',
		'database' => TMP . 'debug_kit.sqlite',
		'encoding' => 'utf8',
		'cacheMetadata' => true,
		'quoteIdentifiers' => false,
	]);
}
```

そうですか、そうですか…

[githubのCakePHP3用ブランチ](https://github.com/cakephp/debug_kit/tree/3.0)もチェックしてみました。


> Requirements
> 
> The 3.0 branch has the following requirements:
> 
> CakePHP 3.0.0 or greater.
> PHP 5.4.19 or greater.
> SQLite or another database driver that CakePHP can talk to. By default DebugKit will use SQLite, if you need to use a different database see the Database Configuration section below.

そうですか、そうですか….

でもなんか別のDB接続も可能みたいに書いてあるよ

> Database Configuration
> 
> By default DebugKit will store panel data into a SQLite database in your application's tmp directory. If you cannot install pdo_sqlite, you can configure DebugKit to use a different database by defining a debug_kit connection in your config/app.php file.


ふむふむ

`config/app.php` のDatasourceに以下のような`debug_kit`接続を追加してみます。

```php
		'debug_kit', [
			'className' => 'Cake\Database\Connection',
			'driver' => 'Cake\Database\Driver\Mysql',
			'persistent' => false,
			'host' => 'localhost',
			'login' => 'hoge',
			'password' => 'fuga',
			'database' => 'database_name',
			'prefix' => false,
			'encoding' => 'utf8',
			'timezone' => 'UTC',
			'cacheMetadata' => true,
			'quoteIdentifiers' => false,
		],

```

ブラウザをリロード

![](/images/blog/cakephp3_debugkit_mysql.png)

ぎゃー、DebugKitの該当箇所のコードを見てみると、そんなに変じゃないように見えますが、

```php
		$configs = ConnectionManager::configured();
		foreach ($configs as $name) {
			$connection = ConnectionManager::get($name);
```

このときの`$config`をwatchしてみると

```php
array (size=5)
  0 => string 'default' (length=7)
  1 => string 'test' (length=4)
  2 => int 0
  3 => int 1
  4 => string 'debug_kit' (length=9)
```

上記のようになっています。2と3誰よ….


ということで、まだベータ１だからねー。はははーという事で、現時点はSQLiteのextension入れて試しましょう。

例えば、friendsofcakeのvagrant-chef使っているなら、cookbooks/php/recipes/install.rbに追加します。

```rb
  "php5-mysql",
  "php5-sqlite",

```

mysqlの下あたりに追加します。vagrant destroy/upを実行して環境を作り直したら、もう一度ブラウザをリロードします。

![](/images/blog/cakephp3_beta1_success.png)

おなじみの青いバーの画面が表示されました。画面の右下に出ているCakePHPアイコンがDebugKitです。
アイコンをクリックすると以下のようにデバッグ情報を参照可能になります。

![](/images/blog/cakephp3_beta1_debugkit.png)

DebugKitも使えるし、どんどんCakePHP3のアプリケーション開発がやりやすくなっていると思います。
CakePHP3.0.0 もくもく会で情報交換しながら、楽しく新機能を試してみませんか？




