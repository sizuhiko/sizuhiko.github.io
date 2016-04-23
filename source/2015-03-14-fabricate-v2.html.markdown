---
title: Fabricateのversion2を作成しました
date: 2015-03-14 06:44 UTC
tags:
- PHP
- fablicator
- fixture
- Test
- CakePHP
---

これまでCakePHP2用のデータジェネレータプラグインとして開発を続けてきた[Fabricate](https://github.com/sizuhiko/Fabricate)を`V2`として各種ORMへ対応するようなコアモジュールへと変更しました。
またFabiricateリポジトリのmasterブランチへは統合されていませんが、CakePHP3のリリース時期を合わせて、V2ブランチを本流にする予定です。
これまでのCakePHP2用ライブラリはcakephp2ブランチでメンテナンスを続ける予定です。

データジェネレータって何？誰得？という方は、以下の投稿を一読していただけると理解が深まります。

- [テストデータの作り方 - 第73回 PHP勉強会](http://twileshare.com/bgrg)

FabricateはRubyのFabricationとFactory_Girlに影響された「fixtureはDRYではないので、Fixture replacement を使おう」という流れに乗ったPHPクローンです。

### Version2を作成するきっかけ

このキッカケはいくつかあります。
1つには昨年の CakeFest2014 で Fabricate の LT をした後で、 CodeIgniter の開発者だったことでも知られる[Phil Sturgeon](https://github.com/philsturgeon) から、「これいいね、他のフレームワークでも使えるようにしてよ」と言われたことでした。
他のフレームワークでも使えるようにしたいという思いは、少しあったのですがまだ確約できなかったので「maybe」と返しただけでした。（このときPhilはかなり酔っていたので、私に話した事を覚えているのかどうかも怪しいですがw）

さらにもう1つおおきなキッカケがCakePHP3でのPSR対応によって、namespaceなど外部ライブラリを使いやすくなり、さらに外部ライブラリからフレームワーク本体のコードへのアクセスしやすくなったということがあります。
CakePHP2ではフレームワークへアクセスするにはアプリケーションまたはプラグインでないと困難で、特にORMに依存したライブラリをフレームワークをまたいで作成するのは困難でした。これがPSRの対応でやりやすくなったということ、CakePHP3への対応に合わせてV2を作って、他のフレームワークにも対応できるようにしようと思ったのです。

### Fabricate V2の主な変更点

Fabricateの利用方法はほとんど変わっていませんが、各ORM用にアダプターと呼ばれるORMの差分を吸収するクラスを準備する必要があります。
Fabricateの本体には[Fabricate\Adaptor\FabricateArrayAdaptor](https://github.com/sizuhiko/Fabricate/blob/v2/src/Adaptor/FabricateArrayAdaptor.php)という連想配列構造を返すサンプル用のアダプターを用意しています。これを参考にアダプターを実装すれば[Doctrine](http://www.doctrine-project.org/)や[Propel](https://github.com/propelorm/Propel)、[Yii](http://www.yiiframework.com/)や[CodeIgniter](http://www.codeigniter.com/)でも利用可能になります。

### アダプターの実装方法

とはいえ実際にORMに接続するアダプターもないと、ということでCakePHP3用のアダプター[CakePHP Fabricate Adaptor](https://github.com/sizuhiko/cakephp-fabricate-adaptor)も作成しました。

ここではCakePHP3のアダプター実装を例に、アダプターで何を実装しなくてはいけないのかを解説したいと思います。

#### 作成するクラス

アダプタークラスは[Fabricate\Adaptor\AbstractFabricateAdaptor](https://github.com/sizuhiko/Fabricate/blob/v2/src/Adaptor/AbstractFabricateAdaptor.php)クラスを継承します。

```php
<?php
use Fabricate\Adaptor\AbstractFabricateAdaptor;

class CakeFabricateAdaptor extends AbstractFabricateAdaptor
{
	...
}
```
#### 実装するメソッド

アダプターとして実装する必要があるメソッドは以下の3つです。

- getModel
- create
- build

それぞれのメソッドの実装を確認しましょう。

##### getModel

getModelメソッドは各ORMの差分を吸収するためのモデルインスタンスを返却するデータジェネレータの定義部分です。
データジェネレータとしては最も重要な機能です。	

```php
<?php
use Fabricate\Model\FabricateModel;

public function getModel($modelName)
{
    $model = new FabricateModel($modelName);
    $table = TableRegistry::get($modelName);
    $schema = $table->schema();
    foreach ($schema->columns() as $name) {
        if ($this->filterKey($table, $name)) {
            continue;
        }
        $attrs = $schema->column($name);
        $options = [];
        if (array_key_exists('length', $attrs)) {
            $options['limit'] = $attrs['length'];
        }
        if (array_key_exists('null', $attrs)) {
            $options['null'] = $attrs['null'];
        }
        $model->addColumn($name, $attrs['type'], $options);
    }
    foreach ($table->associations()->keys() as $key) {
        $association = $table->associations()->get($key);
        $target = $association->target();
        $className = get_class($target);
        $alias = $target->alias();
        switch ($association->type()) {
            case Association::ONE_TO_ONE:
                $model->hasOne($alias, $association->foreignKey(), $className);
                break;
            case Association::ONE_TO_MANY:
                $model->hasMany($alias, $association->foreignKey(), $className);
                break;
            case Association::MANY_TO_ONE:
                $model->belongsTo($alias, $association->foreignKey(), $className);
                break;
        }
    }
    return $model;
}
```

getModelはFabricateModelクラスのインスタンスを生成する責務があります。
FabricateModelはPHPのマイグレーションツールである[Phinx](https://phinx.org/)に影響を受けていて、スキーマの定義方法が似ています。

```php
<?php
// Phinx
$users = $this->table('users');
$users->addColumn('username', 'string', array('limit' => 20))
      ->addColumn('password', 'string', array('limit' => 40))
      ->addColumn('password_salt', 'string', array('limit' => 40))
      ->addColumn('email', 'string', array('limit' => 100))
      ->addColumn('first_name', 'string', array('limit' => 30))
      ->addColumn('last_name', 'string', array('limit' => 30))
      ->addColumn('created', 'datetime')
      ->addColumn('updated', 'datetime', array('null' => true))

// FabricateModel
$users = new FabricateModel('users');
$users->addColumn('username', 'string', array('limit' => 20))
      ->addColumn('password', 'string', array('limit' => 40))
      ->addColumn('password_salt', 'string', array('limit' => 40))
      ->addColumn('email', 'string', array('limit' => 100))
      ->addColumn('first_name', 'string', array('limit' => 30))
      ->addColumn('last_name', 'string', array('limit' => 30))
      ->addColumn('created', 'datetime')
      ->addColumn('updated', 'datetime', array('null' => true))
```

利用できるカラム型はPhinxと同様で、オプションについて現時点ではlimit(長さ)のみ対応しています。

CakePHP3では

```php
<?php

$table = TableRegistry::get($modelName);
$schema = $table->schema();
```
という記述でスキーマ情報が連想配列で取得できるので、それを繰り返して`addColumn`を呼び出しています。

スキーマ定義を作成したら、次にモデルの関連を定義します。
モデルの関連定義は、以下のようにassociationを使って関連構造を一度に作成する場合に必要となります。

```php
<?php
Fabricate::create('Users', function($data, $world) {
    return [
        'username' => 'taro',
        'posts' => $world->association('Posts', 3),
    ];
});
```
この例のように関連を設定するには、以下のようにFabricateModel::hasMany()やbelongsTo()を使います。

```php
<?php
$users->hasMany('posts', 'post_id', 'Posts');
$posts->belongsTo('users', 'post_id', 'Users');
```
パラメータの指定方法は、hasManyもhasOneもbelongsToも同じで、(別名、外部キーカラム名、モデル名）を指定します。

##### create

createメソッドは、Fabricateによって生成された連想配列構造のデータを、ORMを使ってDBに保存する機能を実装します。

```php
<?php
public function create($modelName, $attributes, $recordCount)
{
    $table = TableRegistry::get($modelName);
    $entities = $table->newEntities($attributes, ['validate' => $this->options[self::OPTION_VALIDATE]]);
    $table->connection()->transactional(function () use ($table, $entities) {
        foreach ($entities as $entity) {
            $ret = $table->save($entity);
            if (!$ret) {
                return false;
            }
        }
        return true;
    });
    return $entities;
}
```
`$modelName`には`Fabricate::create('Users',`と記述した場合の、`Users`が渡ります。
`$attributes`には生成された連想配列が渡ります。例えば以下のとおりです。

```php
<?php
array (
  0 => 
  array (
    'title' => 'Lorem ipsum dolor sit amet',
    'body' => 'Lorem ipsum dolor sit amet, aliquet feugiat. Convallis morbi fringilla gravida, phasellus feugiat dapibus velit nunc, pulvinar eget sollicitudin venenatis cum nullam, vivamus ut a sed, mollitia lectus. Nulla vestibulum massa neque ut et, id hendrerit sit, feugiat in taciti enim proin nibh, tempor dignissim, rhoncus duis vestibulum nunc mattis convallis.',
    'created' => '2013-10-09 12:40:28',
    'updated' => '2013-10-09 12:40:28',
  ),
  1 => 
  array (
  ....
```
`$recordCount`は生成する件数ですが、この値は`count($attributes)`の値と一致します。
CakePHP3では以下の流れでDBへ保存しています。

- TableRegistry::get()でテーブルインスタンスを取得
- Table::newEntities()で連想配列からエンティティを生成
- Table::save()でエンティティをDBに保存

##### build

buildメソッドは、Fabricateによって生成された連想配列構造のデータから生成したエンティティを返却する機能を実装します。

```php
<?php
public function build($modelName, $data)
{
    $table = TableRegistry::get($modelName);
    $entity = $table->newEntity($data, ['validate' => $this->options[self::OPTION_VALIDATE]]);
    return $entity;
}
```
`$modelName`には`Fabricate::create('Users',`と記述した場合の、`Users`が渡ります。
`$data`には生成された連想配列が1インスタンス分だけ渡ります。例えば以下のとおりです。

```php
<?php
array (
  'title' => 'Lorem ipsum dolor sit amet',
  'body' => 'Lorem ipsum dolor sit amet, aliquet feugiat. Convallis morbi fringilla gravida, phasellus feugiat dapibus velit nunc, pulvinar eget sollicitudin venenatis cum nullam, vivamus ut a sed, mollitia lectus. Nulla vestibulum massa neque ut et, id hendrerit sit, feugiat in taciti enim proin nibh, tempor dignissim, rhoncus duis vestibulum nunc mattis convallis.',
  'created' => '2013-10-09 12:40:28',
  'updated' => '2013-10-09 12:40:28',
)
```

### さいごに

現在CakePHP3用のアダプターしかないので「xxxx ORMについてアダプター実装したよ！」という連絡を待っています。
[Fabricateのcomposer.json](https://github.com/sizuhiko/Fabricate/blob/v2/composer.json)のsuggestに追加してPull Requestをもらえるととても助かります。

```json
    "suggest": {
        "sizuhiko/cake_fabricate": "for integration with CakePHP3"
        // ここに追加したPRをお待ちしています
    }
```

皆様のPull Requestをお待ちしております！！


