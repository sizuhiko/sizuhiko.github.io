---
title: APPSYNC_JS (AppSync JavaScript) で始める GraphQL API サーバー
date: 2024-06-03 05:32 UTC
tags: 
- AWS
- AppSync
- JavaScript
- GraphQL
---

[AppSync](https://aws.amazon.com/jp/appsync/) は、AWS上で GraphQL API をサーバーレスに構築できるサービスです。

[Amplify](https://aws.amazon.com/jp/amplify/) で利用されていることでも有名ですね。
Amplify から DynamoDB にアクセスするときや、通常の CRUD だけでなくクエリ条件を指定したい場合などのカスタマイズをするときは、自動生成されたリゾルバーを修正することになります。
このとき従来は [VTL](https://docs.aws.amazon.com/ja_jp/appsync/latest/devguide/resolver-mapping-template-reference.html) というテンプレート言語を学ぶ必要がありましたが、今日ではJavaScript(TypeScript)を利用できます。

最新の Amplify Gen2 でも TypeScript でリゾルバを指定できます。[Amplify Gen2でNextJSのアプリケーション作成まで](https://dev.classmethod.jp/articles/amplify-gen2-nextjs/) というクラメソの記事が参考になります。

### 公式ドキュメントで学ぶ

AWS のデベロッパーガイドに[リゾルバーチュートリアル (JavaScript)](https://docs.aws.amazon.com/ja_jp/appsync/latest/devguide/tutorials-js.html)があるので、これを読めば理解が進みます。
特に[チュートリアル: DynamoDB JavaScript リゾルバー](https://docs.aws.amazon.com/ja_jp/appsync/latest/devguide/tutorial-dynamodb-resolvers-js.html)を読むと、DynamoDB にアクセスする GraphQL API の作り方が理解できるようになるでしょう。

#### TypeScript を使う

Amplify Gen2 を使っている場合は、すべて TypeScript で記述していて Amplify プロジェクトで管理されている Lint ルールなどを利用しているので、問題ないと思います。
一方で AppSync を直接使う（たとえば Terraform や CDK などを使って AppSync の API をデプロイする）場合は、JavaScript リゾルバーの概要の中にある[バンドル、TypeScript、ソースマップ](https://docs.aws.amazon.com/ja_jp/appsync/latest/devguide/resolver-reference-overview-js.html#additional-utilities)を読むと良いです。

ここを読むと、以下の理解が深まります。

- esbuild を使って TypeScript ファイルをバンドルして 1 つの JavaScript ファイルにする方法
- リゾルバや関数を作るときの TypeScript 設定や記述方法（主に型定義）
- GraphQL スキーマ情報から TypeScript  型定義を生成する方法
- Linter の設定

特に Linter の設定は重要になります。
詳しくは[ユーティリティ](https://docs.aws.amazon.com/ja_jp/appsync/latest/devguide/resolver-reference-overview-js.html#utility-resolvers)の `eslint プラグインの設定` で確認できます。

#### APPSYNC_JS の制約

リゾルバや関数を JavaScript で記述できるようになったのは(VTLを書くことに比べ)嬉しいことなのですが、あくまでも JavaScript の文法が使える程度と思っていた方が良いです。もちろん単体テストコードが書きやすいなどのメリットはありつつも、制約が非常に多いことを理解しなくてはなりません。

- コードサイズ: 32,000文字
- 外部モジュール: npm でインストールされるようなものは、開発ツールを除いてほぼ使えないと思っていたほうが良い
- ネットワークアクセス: できない。すべてのリソースへのアクセスはデータソースを使って行う
- ファイルシステムアクセス: できない

どのようなものが向いているかは、[データソースへの直接アクセスと Lambda データソース経由のプロキシのどちらかを選択する](https://docs.aws.amazon.com/ja_jp/appsync/latest/devguide/resolver-reference-overview-js.html#choosing-data-source)に書かれています。

#### ランタイム制約

次の制約を理解するとき読むべきは[サポートされているランタイム機能](https://docs.aws.amazon.com/ja_jp/appsync/latest/devguide/supported-features.html)です。

さきほど

> あくまでも JavaScript の文法が使える程度と思っていた方が良い

と書きましたが、それがこのランタイム機能を理解した上での感想です。

サポートされていない機能は以下のとおりです。

##### ステートメント

- try / catch / finally
- throw
    - 代わりに `util.error()` 関数を利用する
- continue
- do-while
- for
   - ただし for-in および for-of 式は例外でサポートされている。
- while
- ラベル付きステートメント

##### 数学

- 次の Math 関数はサポートされていません。
  - Math.random()
  - Math.min()
  - Math.max()
  - Math.round()
  - Math.floor()
  - Math.ceil()

##### 関数

- apply、bind call メソッドはサポートされていません。
- 関数コンストラクタはサポートされていません。
- 関数を引数として渡すことはサポートされていません。
- 再帰的な関数呼び出しはサポートされていません。

##### promise

非同期プロセスはサポートされておらず、Promise もサポートされていません。

#### 制約を理解した上で進める

と途中まででも読んだ段階で、これは `JavaScript の文法が使える程度` になるということが理解できたでしょう。
外部ライブラリにこれらの記述を使っていないかというと、大抵どれか1つぐらいは該当してしまいます。
つまり実質的にテストコードを除いてバンドルするコードには、外部モジュールを使うという選択肢はなくなります。
ただ実際にはそれでは困ることが多いので、組み込むユーティリティや、ヘルパー関数などが揃っています。

[リゾルバーおよび関数の JavaScript runtime 機能](https://docs.aws.amazon.com/ja_jp/appsync/latest/devguide/resolver-util-reference-js.html)のページから、それらのユーティリティやヘルパーへのドキュメントページに遷移できるので、確認してください。

ただ一部 VTL のドキュメントには書いてあるユーティリティやヘルパーのうち、 JavaScript のリファレンスには記述されていないけど、利用可能なものもあります。
これらはドキュメントバグと思いますが、TypeScript で作っている場合はインポートで利用する型定義ファイルと、VTLのリファレンスを突き合わせてみると良いでしょう。

たとえば多くの Math 関数がサポートされていない代わりに、mathヘルパーがあるのですが、これは JavaScript 側のドキュメントからは漏れています。もちろん利用可能なので、どのような機能があるかは VTL 側の[$util.math の math ヘルパー](https://docs.aws.amazon.com/ja_jp/appsync/latest/devguide/math-helpers-in-util-math.html)を読むことになります。

### Lambda データソースを使うという選択

もちろん、これは AppSync のリゾルバや関数で JavaScript を利用する場合の制約であって、AppSync のリゾルバから Lambda データソースを呼び出してそちらで処理する分には制約はありません。

AppSync のリゾルバや関数の実行に関する料金が AppSync に全て含まれているのに対し、Lambda データソースで実行される計算リソースは別途 Lambda の料金がかかるので、Lambda でないとできない場合だけとしておくとコストを抑えることができるでしょう。

### 困っていること

AppSync の JavaScript ランタイムには様々な制約があるので、AWS のコンソールからソースコードを書いているとリアルタイムで制約違反を教えてくれます。もちろん手元のエディタを使っていても ESLint のルールでチェックできるようになっています。
とくに TypeScript で記述すると、より厳密に ESLint のルールで確認できるようになっています。

多くのシンプルなリゾルバや関数では、ここで書く困りごとには遭遇しないかもしれません。
しかし運良く？その事象を引き当てたのです。

#### サンプルコード

例として（実際のケースとほぼ一緒ですが）、DynamoDB データソースに対して、複数のテーブルに跨った TransactWriteItem や BatchWriteItem を実行したいと仮定します。

サンプルコードとして[Amazon DynamoDB Item Tagging](https://github.com/aws-samples/amazon-dynamodb-item-tagging/)という、aws-samples オーガナイゼーションにあるリポジトリを利用します。

[DynamoDBに保存するコード例](https://github.com/aws-samples/amazon-dynamodb-item-tagging/blob/main/src/lambda/create.ts#L49) は Lambda の実装ですが、ここでは書き込みのパターンについて注目してください。
このコードは、タスクを保存するときにタグ付けされていた場合は、タグの `WriteRequest` を配列に追加しています（[L88](https://github.com/aws-samples/amazon-dynamodb-item-tagging/blob/main/src/lambda/create.ts#L88)）。

特に何の変哲も無い、DynamoDB で TransactWriteItem や BatchWriteItem を使うときに書きそうなコードですが、ここに落とし穴があります。

このコードは TypeScript で、配列に追加するとき `WriteRequest` 型を指定しています。タグ付けするときも追加する型は `WriteRequest` なので、配列に追加される型が一致するためエラーにはなりません。

#### 同じようなコードを AppSync のリゾルバや関数で書くと TS2322 になる

では同じようなコードを AppSync のリゾルバや関数で書いたとします。
TypeScript で書いていて、 AppSync が指定する ESLint のルールなどがあっても問題なく通過するとします。
では結果を esbuild でバンドルしてデプロイしてみましょう。

なんと、デプロイすると `TS2322` エラーになります。

えっ、AppSync って JavaScript はサポートしているけど、 TypeScript はサポートしてないよね？

というのが、最初の驚きです。
またまたー、と思って先頭行に `// @ts-nocheck` を書くと、デプロイできるようになります。

ふぁぁっ！何だと、 `tsc` が実行されているのか？！という疑惑が生まれてきます。

いずれにせよ、このままではデプロイできないので、神様/AWSサポート様に問い合わせを行いました。
この問い合わせ、めっちゃ最終回答まで時間かかったのです.....

で、現時点これの回避策は、先頭行に `// @ts-nocheck` を書く、が正式回答になります。まじかー....

現時点 AppSync では JavaScript の制約をチェックするため、デプロイ時に JavaScript ファイルを TypeScript コードとしてチェックしているそうです。まじかー....

先ほどのコードを再度確認してみてください。TypeScript のコードをコンパイルして型情報を取り除くと、以下のようなコードになります。

```javascript
    const taskDbItem = {
      PutRequest: {
        Item: {
          // we set the pk and sk to the item id. we prefix both with `task#` to allow filtering by task items
          pk: `task#${item.id}`,
          sk: `task#${item.id}`,
          // we are using a gsi to allow listing all items of a certain type, which in this case is task items
          // task: GSI key sharding
          siKey1: 'task',
          name: item.name,
          description: item.description,
          // tags are duplicated here to simplify retrieval
          tags: item.tags
        }
      }
    };
    params.RequestItems[this.tableName].push(taskDbItem);

    // next we write all the tags as separate DynamoDB items. We use the tag name as the partition key, and the tag value and the TaskItem id as a composite sort key.
    if (item.tags) {
      Object.entries(item.tags).forEach(([tagName, tagValue]) => {
        const tagDbItem = {
          PutRequest: {
            Item: {
              pk: `tag#${tagName}`,
              sk: `${tagValue}#task#${item.id}`,
            }
          }
        };
        params.RequestItems[this.tableName].push(tagDbItem);
      });
    }
```

いうて `DocumentClient.WriteRequest` という型情報が消える程度ですが、これが落とし穴です。
型情報がなくなった `params.RequestItems[this.tableName]` の配列は、TypeScript の型推論が働くために、最初の `taskDbItem` 構造の型の要素を持つことが期待されます。

そこに `item.tags` があったときに構造が異なる `taskDbItem` を配列に追加しようとしたら、どうなるかわかりますね。 `TS2322` です。

おそらく Amplify Gen2 でリゾルバを上書きして書いたときも、同じようなコードを書くとエラーになると推測されます(CDKがesbuildした結果をデプロイするので)。

#### 回避策を入れる

回避策の、先頭行に `// @ts-nocheck` を入れる方法として、esbuild の `banner` オプションを利用します。
バンドルのリンティングで紹介されているサンプルコードに設定を追加します。

```javascript
/* eslint-disable */
import { build } from 'esbuild'
import eslint from 'esbuild-plugin-eslint'
import glob from 'glob'
const files = await glob('src/**/*.ts')

await build({
  format: 'esm',
  target: 'esnext',
  platform: 'node',
  external: ['@aws-appsync/utils'],
  outdir: 'dist/',
  entryPoints: files,
  bundle: true,
  plugins: [eslint({ useEslintrc: true })],
  banner: {
    js: '// @ts-nocheck'
  }
})
```

この例のままだと、全部のファイルに `// @ts-nocheck` が入ってしまうので、特定のファイルだけにしたい場合は、esbuild を2つに分割して特定のリゾルバや関数だけに追加されるようにすると良いでしょう。

なお、AWSサポートへは TypeScript かつデベロッパーガイドに書いてあるとおり `eslint プラグインの設定`  をしてあれば、同じ効果を期待できるそうなので、全ファイルに入っていたとしても大きな問題はないのかな？とも思います。 `// @ts-nocheck` を入れたAPIについては念入りに動作確認をするようにコメントが入っていたこともお伝えしておきます。

### まとめ

AppSync のリゾルバーや関数を JavaScript (TypeScript) で書けるようになって、VTL を書くよりも生産性があがったり、ユニットテストが書けるようになって品質を維持しやすくなるといった効果が期待できます。

一方で TS2322 に遭遇するといった落とし穴もあったりするので、注意は必要ですね。

APPSYNC_JS でそういったトラブルになった記事だったり StackOverflow の投稿だったりはまだ少ないので、問題や回避策がわかったら積極的に記事にしておくと良いかな？というのが今回ブログ記事にするきっかけにもなりました。

僕は JavaScript で書けるようになってすごく嬉しいので、今後も使っていきたいなと思っています。
