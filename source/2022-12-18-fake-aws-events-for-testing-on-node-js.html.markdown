---
title: Node.js で Lambda ハンドラのテストを書くときに AWS イベントを生成する
date: 2022-12-18 07:04 UTC
tags: 
- TypeScript
- Jest
- JavaScript
- AWS
- Faker
- JsonSchema
---

AWS Lambda ハンドラをテストしたいとき、多くはリクエストのバリデーションの結果で 400 エラーを返すのか、ロジックが正常終了したとき 200 を戻すのか、みたいなことを書きたいことがあると思います。

TypeScript で Lambda ハンドラを記述する場合は、以下のようになると思います。

```javascript
import { APIGatewayProxyHandler } from 'aws-lambda';

export const hello: APIGatewayProxyHandler = async (event) => {
  // バリデーションやロジックの呼び出し
}
```

このとき `event` は `APIGatewayProxyEvent` 型になるのですが、項目がたくさんあります。
自分で定義した interface などの場合、 [factory.ts](https://github.com/willryan/factory.ts) だったり、[factory-bot](https://github.com/ratson/factory-bot) みたいなライブラリを使って書けば良いのですが、 Lambda ハンドラのイベントはとても項目が多いので、 factory 定義を書くのも大変です。

## faker-ts の利用

そこで以前は [faker-ts](https://www.npmjs.com/package/faker-ts) というライブラリを使っていて `@types/aws-lambda` から適当な値を生成していました。

```javascript
import { tsMock } from 'faker-ts';

const mocker = tsMock(['/node_modules/@types/aws-lambda/index.d.ts']);
const event = mocker.generateMock('APIGatewayProxyEvent');
```

しばらくこの方法で問題はなかったのですが、 Node.js v16 と jest の組み合わせになり、メモリ不足エラーが出るようになってしまったので、見直しが必要になりました。

### faker-ts の仕組み

faker-ts は以下の2つのステップから構成されていました。

- [typescript-json-schema](https://www.npmjs.com/package/typescript-json-schema) で TypeScript コードからJSONスキーマの生成
- [json-schema-faker](https://www.npmjs.com/package/json-schema-faker) でJSONスキーマからJSONオブジェクトの生成

これを別々に実行して試していくプランとしました。

## typescript-json-schema の利用

まずはJSONスキーマの生成から。
このNPMパッケージには CLI ツールも付いているので、npm script でスキーマファイルを生成できるようにしました。

```javascript
"scripts": {
  "tjs": "typescript-json-schema --required"
}
```

のように package.json に記述したら、コマンドを実行して JSONスキーマファイルを生成します。

```bash
$ npm run tjs -- -o test/schema/APIGatewayProxyEvent.json node_modules/@types/aws-lambda/index.d.ts APIGatewayProxyEvent
```

このようにして、必要な型のJSONスキーマを `test/schema` の下に生成していきます。

## json-schema-faker の利用

テストコードでは、以下のようにすることでJSONオブジェクトを生成します。

```javascript
import { JSONSchemaFaker } from 'json-schema-faker';
import { faker } from '@faker-js/faker/locale/ja';

JSONSchemaFaker.option('useExamplesValue', true);
JSONSchemaFaker.option('useDefaultValue', true);
JSONSchemaFaker.option('faker', () => faker);

const event = <APIGatewayProxyEvent>JSONSchemaFaker.generate(require('test/schema/APIGatewayProxyEvent.json'));
event.body = /** テストで使う入力値 */
```

## さいごに

これで TypeScript Interface から型定義に従った Fake オブジェクトが作れるようになりました。
`faker-ts` はあまりメンテされていなかったので、コードを fork してライブラリを最新追従したりして使っていたのですが、その手間も不要となりました。

2つに処理を分割してわかったのは、 `typescript-json-schema` が結構時間がかかっていたので、これを CLI にすることでメモリの利用状況も少なくなりました。
そのため、毎回JSONスキーマを生成しなくなった分、テストも速くなり良いことが多かったです。
この方法だと自分で作った TypeScript の型などでも一度 JSONスキーマを生成しておけば、複数の factory ライブラリを使わなくても良くなるので、良いかもしれません。（ただ現時点では factory-bot とかの方が使い勝手が良いとは思います。たとえば buildList みたいなことができないので）
