---
title: CakePHP3 もくもく会#5 に参加して Model の新機能を試してきた
date: 2014-06-27 05:19 UTC
tags:
- PHP
- CakePHP
- Co-Edo
---

2013/6/16(月) に [コワーキングスペース茅場町 Co-Edo（コエド）](http://www.coworking.tokyo.jp/) で行われた「[CakePHP3 もくもく会 #5](http://coedo-cakephp.doorkeeper.jp/events/12132)」に参加しました。

前回のイベントではBakeすることに成功したので、今回は大きく変更となったモデル周辺についてテストコードから把握してみる目標をたてました。

### 環境構築する（前回との差分）

3回目に参加した記事では

> 環境構築でも利用した Friends Of Cake のリポジトリにはCakePHPのアプリケーションスケルトンを作成する app-template というリポジトリがあります。
すでにCakePHP3用のスケルトンも(cake3ブランチとして)用意されているので、GitHubのREADMEに書いてあるとおりのコマンドでCakePHPのアプリケーション環境を構築します。
> 
>     composer -sdev create-project friendsofcake/app-template app dev-cake3

のように記述したのですが、その後devが上がったところでこちらのスケルトンは最新追従していなかったので、CakePHPの公式スケルトンを使っています。

    composer create-project -s dev cakephp/app dev-cake3

### CakePHP3におけるモデル

CakePHP3では従来モデル（Model）と呼んでいたクラスはなくなり、テーブル（Table）とエンティティ（Entity）という2つのクラスに別れます。従来のモデルがテーブルに変更になりfindなどの責務を持っています。find結果は従来arrayで返却されてきたのですが、CakePHP3からはエンティティと呼ばれるオブジェクトで返却されます。
CakePHP1から2にかけてbasukeさんが作られた[CakeEntity](https://github.com/josegonzalez/cakephp-entity)というプラグインがあります。このプラグインはCakePHP3の新しいモデルのベースになったものでもあり、利用したことがあればそれほど違和感なく移行できるのではないかと思います。

### Bakeされた結果を見てみる

前回bakeコマンドで生成したモデル層のファイルを見てみると

App/Model/Table/PostsTable.php

```php
<?php
namespace App\Model\Table;

use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * Posts Model
 */
class PostsTable extends Table {

/**
 * Initialize method
 *
 * @param array $config The configuration for the Table.
 * @return void
 */
    public function initialize(array $config) {
        $this->table('posts');
        $this->displayField('title');
        $this->primaryKey(['id']);
        $this->addBehavior('Timestamp');

    }

/**
 * Default validation rules.
 *
 * @param \Cake\Validation\Validator $validator
 * @return \Cake\Validation\Validator
 */
    public function validationDefault(Validator $validator) {
        $validator
            ->add('id', 'valid', ['rule' => 'numeric'])
            ->allowEmpty('id', 'create')
            ->allowEmpty('title')
            ->allowEmpty('body');

        return $validator;
    }

}
```

App/Model/Entity/Post.php

```php
<?php
namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * Post Entity.
 */
class Post extends Entity {

/**
 * Fields that can be mass assigned using newEntity() or patchEntity().
 *
 * @var array
 */
    protected $_accessible = [
        'title' => true,
        'body' => true,
    ];

}
```

のようになっています。

PostsTable::initialize()は従来publicプロパティとして定義していたテーブル名などの情報です。
validationDefault()は$validatesで定義していたバリデーション定義です。

Postクラスはエンティティで$_accesibleに利用可能なフィールド名を列挙します。これはRailsでattr_accessorを定義するとプロパティにアクセス可能になるのと同様の効果を持つようになると推測されますが、現時点では何も実装はされていないようです。


### コアのテストコード見てみる

```php
<?php
	public function testRewind() {
		$query = $this->table->find('all');
		$results = $query->all();
		$first = $second = [];
		foreach ($results as $result) {
			$first[] = $result;
		}
		foreach ($results as $result) {
			$second[] = $result;
		}
	}

```

とてもザックリしたところを切り抜きましたが、まぁそういうことです。
これを2系のコードで似せて書くと

```php
<?php
	public function testRewind() {
		$results = $this->Model->find('all');
		$first = $second = [];
		foreach ($results as $result) {
			$first[] = $result;
		}
		foreach ($results as $result) {
			$second[] = $result;
		}
	}

```

えっ！行数3の方が増えてないか？！とかいうツッコミはいらないですよ！！
なんか聞いている程変わってないですよね。

ではもう少し複雑な例を

```php
<?php
    public function testFindAllNoFieldsAndNoHydration() {
        $table = new Table([
            'table' => 'users',
            'connection' => $this->connection,
        ]);
        $results = $table
            ->find('all')
            ->where(['id IN' => [1, 2]])
            ->order('id')
            ->hydrate(false)
            ->toArray();
        $expected = [
            [
                'id' => 1,
                'username' => 'mariano',
                'password' => '$2a$10$u05j8FjsvLBNdfhBhc21LOuVMpzpabVXQ9OpC2wO3pSO0q6t7HHMO',
                'created' => new Carbon('2007-03-17 01:16:23'),
                'updated' => new Carbon('2007-03-17 01:18:31'),
            ],
            [
                'id' => 2,
                'username' => 'nate',
                'password' => '$2a$10$u05j8FjsvLBNdfhBhc21LOuVMpzpabVXQ9OpC2wO3pSO0q6t7HHMO',
                'created' => new Carbon('2008-03-17 01:18:23'),
                'updated' => new Carbon('2008-03-17 01:20:31'),
            ],
        ];
        $this->assertEquals($expected, $results);
    }

```

どうもテーブルには findやwhere,orderなどのメソッドがあり、それをチェインさせてクエリを組み立てるようです。これも他のActiveRecord系の記述とほぼ変わらない形式になります。
hydrate(false)を指定するとエンティティでなく従来の配列形式で値を戻すことができるようになっています。
メソッドチェインの最後のtoArray()はエンティティを配列形式で取得するという意味ではありません。CakePHP3からはfindの戻りがイテレータになります（配列ではないので注意が必要）。なのでイテレータからすべて配列形式で取得するという意味になります。

ではいくつかそれ以外の例を見てみましょう。

```php
<?php
        $query = $table->find('all')
            ->select(['id', 'username'])
            ->where(['created >=' => new Carbon('2010-01-22 00:00')])
            ->hydrate(false)
            ->order('id');
```

たとえば取得するカラムを絞り込むためにはselect()を利用するようです。従来はfieldsで指定していたカラム名の配列です。

```php
<?php
        $query = $table->find('list', ['fields' => ['id', 'username']])
            ->hydrate(false)
            ->order('id');
```

とはいえ、従来っぽい書き方もできるようです。

```php
<?php
        $results = $table->find('all')
            ->find('threaded')
            ->select(['id', 'parent_id', 'name'])
```

！！！！
findがチェインの中で2回呼ばれています。

### これがCakePHP3のモデルだ！

findが2回とはどういうことなのか、ソースを調べてみました。
まずTable::find()とは何者なのか

```php
<?php
    public function find($type = 'all', $options = []) {
        $query = $this->query();
        $query->select();
        return $this->callFinder($type, $query, $options);
    }
```

どうもクエリオブジェクトを取得して、それにselect()をかけて….. callFinder って何ですか？を返すみたいです。

```php
<?php
    public function callFinder($type, Query $query, array $options = []) {
        $query->applyOptions($options);
        $options = $query->getOptions();
        $finder = 'find' . ucfirst($type);          // ココ
        if (method_exists($this, $finder)) {    // とココに注目
            return $this->{$finder}($query, $options);
        }

        if ($this->_behaviors && $this->_behaviors->hasFinder($type)) {
            return $this->_behaviors->callFinder($type, [$query, $options]);
        }

        throw new \BadMethodCallException(
            sprintf('Unknown finder method "%s"', $type)
        );
    }
```

find('all') と呼ぶと`findAll`メソッドがあるかどうか（ビヘイビアも含めて）調べて、なければ例外になる。
ということはTableにfindAllとかあるの？

```php
<?php
    public function findAll(Query $query, array $options) {
        return $query;
    }
```

あるよ！

そういうことか、これがCakePHP3のモデルか。

- 条件やら何やらメソッドチェインである
- 旧来の配列形式に変換できる
- findXxxで独自の条件などをメソッドチェインに組み込める（今ココ）

### 独自の条件をメソッドチェインに組み込む

まずPostsテーブルにfindOrderIdDescというIDの降順で検索するメソッドを作成します。

```php
<?php
    public function findOrderIdDesc(Query $query, array $options) {
        return $query->order(['id'=>'desc']);
    }
```

 でそれを使うときは

```php
<?php
    $this->Posts = TableRegistry::get('Posts', $config); 
    $posts = $this->Posts->find('all')->find('orderIdDesc')->all();
```

みたいに書けるわけです。
もちろんいくつチェインしても良いです。
例えば様々なテーブルで利用できるファインダ（findXxxメソッド）をtraitで共通化するもの面白そうです。

このように新しいモデルはかなり期待の持てる作りにもなっています。
CakePHP3もAlphaになりました。
Alphaを使ってみての感想などはまた書きたいと思います

