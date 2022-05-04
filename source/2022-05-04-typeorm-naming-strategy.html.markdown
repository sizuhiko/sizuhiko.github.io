---
title: TypeORM でプライマリーキーや外部キーの名前を変更する
date: 2022-05-04 08:17 UTC
tags: 
- TypeScript
- TypeORM
---

TypeORM では、主キーやインデックスはエンティティにデコレータを記述します。
たとえば以下のような感じです。

```javascript
@Entity('テーブル名')
export class UserEntity {
  @PrimaryGenerationColumn()
  id!: string;
}
```

`@PrimaryGenerationColumn` にはインデックス名を指定できないので、この状況で `migration:generate` を実行すると、
TypeORM 独自のルールを使ったインデックス名で SQL が生成されます。

一方でインデックスの場合は、たとえば `email` にユニーク制約を入れるとすると以下のように、インデックス名を指定できます。

```javascript
@Entity('テーブル名')
export class UserEntity {
  @PrimaryGenerationColumn()
  id!: string;
  @Index('UQ_User_email', {unique: true})
  @Column()
  email!: string;
}
```

また関連に関してもそうで、 User - hasMany -> Post のような関連があったとき、外部キー制約の名前も TypeORM ルールになります。

```javascript
@Entity('テーブル名')
export class UserEntity {
  @PrimaryGenerationColumn()
  id!: string;
  @Index('UQ_User_email', {unique: true})
  @Column()
  email!: string;
  @OneToMany(() => PostEntity, (post) => post.user)
  posts?: PostEntity[];
}

@Entity('テーブル名')
export class PostEntity {
  @PrimaryGenerationColumn()
  id!: string;
  @ManyToOne(() => UserEntity, (user) => user.posts)
  user!: UserEntity;
}
```

そこで、 `@Index` 以外で生成されるインデックスの名前をカスタマイズしたい！という場合は `NamingStrategy` を使います。
この `NamingStrategy` ですが、ドキュメントには詳しい解説がないので、この記事を書くことにしました。

### NamingStrategy の作り方

まずはインデックス名をカスタムできるように、 `DefaultNamingStrategy` を継承し、 `NamingStrategyInterface` を実装するクラスを作ります。

```javascript
class CustomNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
}
```

[DefaultNamingStrategyのコード](https://github.com/typeorm/typeorm/blob/master/src/naming-strategy/DefaultNamingStrategy.ts) を参考にカスタマイズすると良いでしょう。

たとえばプライマリーキーの場合は以下のようになっています。

```javascript
  primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
    // sort incoming column names to avoid issue when ["id", "name"] and ["name", "id"] arrays
    const clonedColumnNames = [...columnNames]
    clonedColumnNames.sort()
    const tableName = this.getTableName(tableOrName)
    const replacedTableName = tableName.replace(".", "_")
    const key = `${replacedTableName}_${clonedColumnNames.join("_")}`
    return "PK_" + RandomGenerator.sha1(key).substr(0, 27)
  }
```

プライマリーキーに設定されているカラム名をソートしてから `_` で結合して sha1 に変換したものを利用しています。

たとえばプロジェクトのルールで、プライマリーキーは `PK_テーブル名` で良い場合は、以下のようなコードでオーバーライドして変更します。

```javascript
class CustomNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
    const table = this.getTableName(tableOrName);
    return `PK_${pascalCase(table)}`;
  }
}
```

`pascalCase` は [change-case](https://www.npmjs.com/package/change-case) のようなライブラリ利用を想定しています。

### NamingStrategy で変更できる名前

[NamingStrategyInterfaceのコード](https://github.com/typeorm/typeorm/blob/master/src/naming-strategy/NamingStrategyInterface.ts)を見るとわかります。
よく使いそうなものは、以下のあたりでしょうか。

- primaryKeyName 主キー名。デフォルトでは `PK_{sha1した値}`
- foreignKeyName 外部キー名。デフォルトでは `FK_{sha1した値}`
- indexName 複合キー名。デフォルトでは `IDX_{sha1した値}`

もちろんこれ以外にもたくさんカスタマイズできる名前はあるので、マイグレーションファイルに生成された名称がプロジェクトルールに沿わない場合に
遭遇したら、インターフェースやデフォルトの実装を見てみると良いでしょう。

### カスタム NamingStrategy の指定方法

マイグレーションコマンドから利用する DataSource のオプションに指定します。

```javascript
export const AppDataSource = new DataSource{
  // データベース接続オプション
  migrations: ['db/migrations/*.ts'],
  namingStrategy: new CustomNamingStrategy()
});
```

`namingStrategy` を指定して、 `npm run migration:generate` するとプロジェクトルールに沿った名前でマイグレーションファイルを生成できます。

`package.json` のスクリプト例

```javascript
  "migration:generate": "ts-node ./node_modules/.bin/typeorm migration:generate -d db/datasouce.ts db/migrations",
```

### さいごに

公式ドキュメントの情報が不足しているところなので、この記事が少しでも役立てば幸いです。
