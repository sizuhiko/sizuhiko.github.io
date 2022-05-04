---
title: TypeORM を 0.3 系にアップグレードする
date: 2022-05-04 02:34 UTC
tags: 
- TypeScript
- TypeORM
---

TypeORM 0.2 系をずっと使ってきて、 2022/03/23 の Dependabot 更新で、 0.3 系へのアップデートを確認しました。
CIのテストが失敗していたので、何か大きな変更があるのか Release notes を確認してみました。

すると、 [0.3.0](https://github.com/typeorm/typeorm/blob/master/CHANGELOG.md#030-2022-03-17) と [0.3.1](https://github.com/typeorm/typeorm/blob/master/CHANGELOG.md#031-2022-03-21) の2度に BREAKING CHANGES があることがわかりました。
ただし後者 `0.3.1` の BREAKING CHANGES については、 [0.3.2](https://github.com/typeorm/typeorm/blob/master/CHANGELOG.md#032-2022-03-22) で元に戻されているので `0.3.0` の変更点を見ていきましょう。

### 0.3 系での変更点

- ormconfig のような接続オブションファイル利用は非推奨になった
- 非推奨の migrations:* コマンドが削除された
- CLI コマンドの前面見直し
- 未実行のマイグレーションとスキーマ同期の両方がある場合、マイグレーションがスキーマ同期の前に実行されるようになった
- aurora-data-api が aurora-mysql に変更
- aurora-data-api-pg が aurora-postgres に変更
- EntityManager.connection が EntityManager.dataSource に変更
- Repository のコンストラクタが新しくなった。カスタムクラスリポジトリは使えなくなった
- @TransactionRepository、@TransactionManager、@Transaction デコレータが削除された
- ジャンクションテーブル名だけが短縮されるようになった（@Entityデコレータでカスタム名を指定するのが理想的
- パラメータなしの findOne() は廃止
- findOne(id) は削除
- findOne, findOneOrFail, find, count, findAndCount メソッドは FindOptions パラメータのみに変更。その代わり FindOptions を使わずに where 条件を直接与えるために、新しいメソッドが追加された: findOneBy, findOneByOrFail, findBy, countBy, findAndCountBy
- findByIdsは非推奨となり、代わりにIn演算子と組み合わせてfindByメソッドを使用することが推奨となる
- findOne と QueryBuilder.getOne() は、データベースで何も見つからなかった場合、undefined ではなく null を返すようになった
- find* メソッドで使用される where の値として null はサポートされず、IsNull() 演算子を明示的に使用するようになった
- すべてのCLIコマンドはormconfigをサポートしなくなった
- DataSourceOptions 内のエンティティ、マイグレーション、サブスクライバのオプションにディレクトリ文字列を指定するのは非推奨になった
- すべてのコンテナ関連の機能 (UseContainerOptions, ContainedType, ContainerInterface, defaultContainer, useContainer, getFromContainer) は非推奨となった
- トランザクション内で使用される EntityManager の getCustomRepository は、非推奨となった。代わりに withRepository メソッドを使用する
- Connection.isConnected は非推奨になった。代わりに .isInitialized を使用する
- FindOptions (find* メソッドで使用) の select や relations でプロパティ名の配列指定は非推奨となった。代わりにオブジェクトリテラル表記を使用する
- FindOptions の join (find* メソッドで使用されます) は非推奨になった。結合を含むクエリを作成するには、QueryBuilder を使用する
- Connection、ConnectionOptions は非推奨になった。DataSource と DataSourceOptions を使用する
- createConnection(), createConnections() は非推奨になった。Connection は DataSource になった
- getConnection() は非推奨になった。グローバルな接続を持つには、データソースをエクスポートして必要な場所でそれを使用する
- getManager(), getMongoManager(), getSqljsManager(), getRepository(), getTreeRepository(), getMongoRepository(), createQueryBuilder() はすべて非推奨になった。これらは DataSource から取得する
- getConnectionManager() と ConnectionManager は非推奨になった。Connection は DataSource になり、各データソースは変数としてエクスポートできる
- getConnectionOptions() は非推奨になった
- AbstractRepository は非推奨になった
- Connection.name と BaseConnectionOptions.name は非推奨になった

めっちゃ、いっぱいありますね。

### 修正箇所の確認

修正箇所に関して、型が変わったものに関しては、 `tsc` でコンパイルすればエラーになるので、対応箇所は明確です。
findオプションが変わったり、メソッド自体が無くなったりしたものが中心です。

コンパイルエラーが修正できたら、あとは単体テストでの失敗箇所の確認ですね。

### 非推奨になった部分にも目を向ける

最新のドキュメントは非推奨になった記述がすべてなくなり（そりゃそうですが）、新しい記述方法に変わっているのと、いつ `0.4.0` になっても良いように、
どのように修正したら対応できるかを考えておく必要があります。

また、最近新しいAPIサーバーを作ることになったので、その実装は `0.3` 系で始めるようにしました（あえて古いバージョンを使う必要はないですしね）。
で、そこで問題になるのが、周辺ライブラリの対応状況です。
TypeORM に対応したテストデータ作成のライブラリはいくつかあるのですが、そういったものが `0.3` 系に追従してくるまで待つか、そもそも依存ライブラリを使わずに [faker-ts](https://www.npmjs.com/package/faker-ts) のような TypeScript のモックデータを作れるライブラリと TypeORM の create/save を組み合わせて使うかの選択になります。
今回の新しいAPIサーバーでは、後者のやり方で進めることにしました。いずれライブラリの対応が進んだとして切り替えるか、そのままにするかは検討の余地がありますが、それほど手間は変わっていない印象です。

ここからは、昨日の記事でもふれたのですが、私が関わっているプロジェクトでは DI フレームワークとして [tsyringe](https://github.com/microsoft/tsyringe) を、 ORM で [typeorm](https://typeorm.io/) を使っていますので、その範囲でどのように記述しているかを紹介していきます。

### Connection から DataSource への変更に対応する

TypeORM 0.2 系では以下の書き方が一般的でした。

```javascript
if (getConnectionManager().has('default')) {
  const conn = getConnectionManager().get('default');
  if (conn.isConnected === false) {
    await conn.connect();
  }
} else {
  await createConnection({ /* 接続オプションの指定 */ });
}
```

これが 0.3 系では以下のようになります。

```javascript
let ds: DataSource;
if (container.isRegistered('DataSource')) {
  ds = container.resolve('DataSource');
} else {
  ds = new DataSource({ /* 接続オプションの指定 */});
  container.register('DataSource', { useValue: ds });
}
if (!ds.isInitialized) {
  await ds.initialize();
}
```

データソースのオブジェクトは tsyringe の DI コンテナに登録して利用できるようにしておきます。
さらに DB（リポジトリ）を、ユースケースクラスで DI できるようにします。

TypeORM 0.2 系では以下のようにしていました。

```javascript
container.register('UserRepository', {
  useFactory: instanceCachingFactory(() => getCustomRepository(UserDatabase))
})
```

TypeORM がグローバルにアクセスできる `getCustomRepository` を用意してくれていたので、カスタムリポジトリクラスを指定するだけで良かったのですが、
ここでは `getCustomRepository` が非推奨になったのと、クラスベースのカスタムリポジトリが非推奨になった、という2つの非推奨の影響を受け、書き方がだいぶ変わりました。

0.3 系では以下のようにしてみました。データソースを DI コンテナから取得して新しいカスタムリポジトリの書き方 `extend` を使っています。

```javascript
container.register('UserRepository', {
  useFactory: instanceCachingFactory(() => {
    const ds = container.resolve('DataSource');
    return ds.getRepository(UserEntity).extend(UserDatabase);
  }
})
```

### クラスベースのカスタムリポジトリからオブジェクトベースへの変更に対応する

で、 0.2 系でのカスタムリポジトリは以下のようにクラスベースになっていたのです。

```javascript
@EntityRepository(UserEntity)
export class UserDatabase extends Repository<UserEntity> implements UserRepository {
  async findByEmail(email: string): Promise<UserEntity | undefined> {
    // 検索処理
  }
}
```

これを 0.3系では、クラスベースでなくオブジェクトベースに変更します。

```javascript
export const UserDatabase: UserRepository & ThisType<Repository<UserEntity> & UserRepository> =
{
  async findByEmail(email: string): Promise<UserEntity | null> {
    // 検索処理
  },
} 
```

クラスベースからオブジェクトベースになって、とても困ったことがあります。
上記の変更では簡略化しましたが、実は find 系メソッドにはデコレータをつけていて、ロギングできるような仕組みを入れていました。

```javascript
@EntityRepository(UserEntity)
export class UserDatabase extends Repository<UserEntity> implements UserRepository {
  @Logging()
  async findByEmail(email: string): Promise<UserEntity | undefined> {
    // 検索処理
  }
}
```

こんな感じです。
これがオブジェクトベースになると、デコレータが使えなくなります。
いい感じの解決策はあまりなかったので、AOPのライブラリ [ts-aspect](https://www.npmjs.com/package/ts-aspect) を使うことにしました。
AOPのライブラリはnpmレジストリにたくさんあるので、どれか自分の好みにあうものを利用すれば良いと思います。

で、0.3 系ではデコレータを使わず、AOPで以下のように対応しました。

```javascript
container.register('UserRepository', {
  useFactory: instanceCachingFactory(() => {
    const ds = container.resolve('DataSource');
    const repository = ds.getRepository(UserEntity).extend(UserDatabase);
    addAspect(repository, 'findByEmail', Advice.Around, new LoggingAspect());
    return repository;
  }
})
```

カスタムリポジトリをインスタンス化するときに、いったん変数 `repository` にしてから `ts-aspect` を使って、メソッド単位で仕込んでいきます。

### マイグレーションやCLIの変更に対応する

CLIオプションが変更になっているので、マイグレーションの書き方も変更が必要です。
0.2 系では `package.json` の `scripts` にこんな感じで書いていたと思います。

```javascript
  "migration:generate": "ts-node ./node_modules/.bin/typeorm migration:generate -f db/ormconfig.ts -n Migration",
```

ormconfig.ts の中身は以下のような感じでした。

```javascript
module.exports = {
  // データベース接続オプション
  migrations: ['db/migrations/*.ts']
  cli: {
    entitiesDir: 'domain/entities',
    migrationsDir: 'db/migrations',
    subscribersDir: 'db/subscribers',
  }
};
```

0.3 系では、まずスクリプトが以下のように変更になります。

```javascript
  "migration:generate": "ts-node ./node_modules/.bin/typeorm migration:generate -d db/datasouce.ts db/migrations",
```

`-f` オプションがデータソース `-d` 指定となり、マイグレーションファイルの出力先を最後に指定するようになりました。
`datasource.ts` は以下のようになります。データソースに変わった関係で、 `cli` オプションはなくなっています。

```javascript
export const AppDataSource = new DataSource{
  // データベース接続オプション
  migrations: ['db/migrations/*.ts']
});
```

migration:run や migration:show は、データソースに指定した `migrations` のパスからファイルを探索してくれるので、 `-f` が `-d` に変わったぐらいの影響範囲で大丈夫です。

### さいごに

typeorm は 0.2 -> 0.3 -> 0.4 と 0.x 系なので 0.1 ごとに破壊的変更が実施されてきます。
バージョン 2.0 -> 3.0 -> 4.0 にすれば良いのに... とか思いますが。

次の 0.4 系に備えて、修正の方針を見つけていきたいですね。
もしこの記事が参考になれば幸いです。
