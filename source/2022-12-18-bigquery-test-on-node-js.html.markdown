---

title: Node.js で BigQuery を使ったコードの自動テストを記述する
date: 2022-12-18 02:15 UTC
tags: 
- TypeScript
- Jest
- JavaScript
- BigQuery
---

BigQuery へクエリするコードを書くとき、どうしていますか？
ORM を使って RDB を使うコードを書いている場合などは、 SQLite などを使って UnitTest を書いていることもあるでしょう。
BigQuery についても、何かそういったことができないかな？と思い、調べていました。

## BigQuery Emulator

そんなとき、ちょうど [BigQuery Emulator](https://github.com/goccy/bigquery-emulator) の存在を知り、試してみることにしました。

作者の goccy さんのスライドです。

<iframe class="speakerdeck-iframe" frameborder="0" src="https://speakerdeck.com/player/ef6e21eded3440edafa7a8d59ec6ffef" title="BigQueryエミュレータの作り方" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true" style="border: 0px; background: padding-box padding-box rgba(0, 0, 0, 0.1); margin: 0px; padding: 0px; border-radius: 6px; box-shadow: rgba(0, 0, 0, 0.2) 0px 5px 40px; width: 560px; height: 315px;" data-ratio="1.7777777777777777"></iframe>

GitHub の README によると Docker コンテナでも動かせるようですので、私たちはそれを利用することにしました。

```bash
$ docker pull ghcr.io/goccy/bigquery-emulator:latest
```

コードのサンプルとしては Python と Golang での書き方は提供されていたので、 Node.js でも何とかなるんじゃない？...
と思いやり始めたのです。

## Node.js -- BigQuery Emulator

Node.js で BigQuery を利用するには、[公式のクライアント](https://cloud.google.com/nodejs/docs/reference/bigquery/latest)をインストールします。

```bash
$ npm i @google-cloud/bigquery
```

接続の方法は Python のクライアントを見る限り、

- エンドポイント
- プロジェクトID
- 匿名接続（AnonymousCredentials）

を指定すれば良さそうです。

```python
client_options = ClientOptions(api_endpoint="http://0.0.0.0:9050")
client = bigquery.Client(
  "test",
  client_options=client_options,
  credentials=AnonymousCredentials(),
)
```

Node.js だとこんな感じでしょうか？

```javascript
new BigQuery({
  projectId: 'test',
  apiEndpoint: 'http://0.0.0.0:9050',
  credentials: /* 何を指定すれば良いんだ？ */
});
```

ここで、 `credentials` の指定に `AnonymousCredentials` みたいなものが無いことに気がつきます。
JavaScript 以外のクライアント、上記の Python や Go には、匿名接続のオプションがあるようです。

現時点の credentials に指定できるのは、[公式ドキュメント](https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest/google-auth-library/googleauthoptions)によると

```Javascript
credentials?: CredentialBody | ExternalAccountClientOptions;
```

だけです。
`ExternalAccountClientOptions` は外部のアカウント連携を使った認証をする場合のオプションになっています。

## @google-cloud/bigquery のコードを調べる

クライアントの言語違いで接続が変わるわけではないので、 BigQuery のサーバー側は匿名接続できるようになっているが、クライアント側の実装がサポートしていない、ということは想定できるでしょう。
こういうときは、クライアントのソースコードを調べるしかありません。
正面突破は無理でも、何かハックできる方法があるかもしれません。

### BigQuery クラス

GitHubのリポジトリ[Google BigQuery: Node.js Client](https://github.com/googleapis/nodejs-bigquery)です。
まず、 [BigQuery クラスのコンストラクタ](https://github.com/googleapis/nodejs-bigquery/blob/main/src/bigquery.ts#L305)を調べます。

[このあたり](https://github.com/googleapis/nodejs-bigquery/blob/main/src/bigquery.ts#L324-L331)で、オプションを作り直して親クラスのコンストラクタを呼び出すみたいです。

```javascript
    const config = {
      apiEndpoint: options.apiEndpoint!,
      baseUrl,
      scopes: ['https://www.googleapis.com/auth/bigquery'],
      packageJson: require('../../package.json'),
      autoRetry: options.autoRetry,
      maxRetries: options.maxRetries,
    };

    if (options.scopes) {
      config.scopes = config.scopes.concat(options.scopes);
    }

    super(config, options);
```

`credentials` は `options` の中に入ったままなので、 BigQuery 特有のオプションを `config` に置き換えて親クラスである `@google-cloud/common/Service` を呼び出す感じでしょうか。

### Service クラス

`Service` クラスは `@google-cloud/common` という共有パッケージにあるので、[そこのリポジトリ](https://github.com/googleapis/nodejs-common)を調べます。
[Serviceクラスのコード](https://github.com/googleapis/nodejs-common/blob/main/src/service.ts)です。

[このあたり](https://github.com/googleapis/nodejs-common/blob/main/src/service.ts#L115-L123)で、リクエストコンフィグを作って、ユーティリティクラスのクレデンシャルファクトリを呼び出すみたいです。

```javascript
    const reqCfg = extend({}, config, {
      projectIdRequired: this.projectIdRequired,
      projectId: this.projectId,
      authClient: options.authClient,
      credentials: options.credentials,
      keyFile: options.keyFilename,
      email: options.email,
      token: options.token,
    });

    this.makeAuthenticatedRequest =
      util.makeAuthenticatedRequestFactory(reqCfg);
    this.authClient = this.makeAuthenticatedRequest.authClient;
    this.getCredentials = this.makeAuthenticatedRequest.getCredentials;
```

なるほど、なるほど。

### makeAuthenticatedRequestFactory

続いて、 [makeAuthenticatedRequestFactory](https://github.com/googleapis/nodejs-common/blob/ca054ed89cd5ab046df45ebd70bef625d1e79bd3/src/util.ts#L596) を見てみましょう。

コードには関数定義がいろいろあって、最終的には `makeAuthenticatedRequest` という関数をファクトリメソッドは戻すようです。
ふむふむ。

```javascript
    const mar = makeAuthenticatedRequest as MakeAuthenticatedRequest;
    mar.getCredentials = authClient.getCredentials.bind(authClient);
    mar.authClient = authClient;
    return mar;
```

つまり `BigQuery` クラスのインスタンスを生成すると、認証クライアントまでは生成するけど、接続などにはいかないことがわかります。
続いて[ファクトリメソッドの引数](https://googleapis.dev/nodejs/common/latest/interfaces/MakeAuthenticatedRequestFactoryConfig.html)を調べてみましょう。

興味深いオプションが2つありますね。

- [customEndpoint](https://googleapis.dev/nodejs/common/latest/interfaces/MakeAuthenticatedRequestFactoryConfig.html#customEndpoint)
- [useAuthWithCustomEndpoint](https://googleapis.dev/nodejs/common/latest/interfaces/MakeAuthenticatedRequestFactoryConfig.html#useAuthWithCustomEndpoint)

認証エンドポイントをカスタマイズできるようです。
では、ファクトリでは、このオプションをどうやって使っているのか見てみましょう。

[ここ](https://github.com/googleapis/nodejs-common/blob/ca054ed89cd5ab046df45ebd70bef625d1e79bd3/src/util.ts#L766-L777)にありました。

```javascript
          const authorizeRequest = async () => {
            if (
              reqConfig.customEndpoint &&
              !reqConfig.useAuthWithCustomEndpoint
            ) {
              // Using a custom API override. Do not use `google-auth-library` for
              // authentication. (ex: connecting to a local Datastore server)
              return reqOpts;
            } else {
              return authClient.authorizeRequest(reqOpts);
            }
          };
```

コメントを読んでください。 

> ex: connecting to a local Datastore server

「例えば、ローカルのサーバーとかに接続するときな」って、今回の用途じゃないですか！

## どうやったら指定できるのか？

さて、ここまでの調査を振り返りましょう。

- BigQuery クラスで Service クラスのコンストラクタを呼び出す
- Service クラスでリクエストコンフィグを作って、ユーティリティクラスのクレデンシャルファクトリを呼び出す

BigQuery クラスからのオプションでは `customEndpoint` を指定する方法がない！という結論。

ちょっと待てよ？

サービスクラスで生成したファクトリどこに入れてたっけ？

```javascript
    this.makeAuthenticatedRequest =
      util.makeAuthenticatedRequestFactory(reqCfg);
```

`this` (=== BigQuery クラスのインスタンス) ですね。

[サービスクラスの定義](https://github.com/googleapis/nodejs-common/blob/main/src/service.ts#L83)を見てみましょう。

```javascript
  makeAuthenticatedRequest: MakeAuthenticatedRequest;
```

private じゃないってことは、オーバーライドできるじゃないですか。

## ハックする

```javascript
import { BigQuery } from '@google-cloud/bigquery';
import { util } from '@google-cloud/common';

let bigQuery: BigQuery;

beforeAll(() => {
  const options = {
    projectId: 'test',
    apiEndpoint: 'http://0.0.0.0:9050',
    baseUrl: 'http://0.0.0.0:9050',
    scopes: ['https://www.googleapis.com/auth/bigquery'],
    packageJson: require('@google-cloud/bigquery/package.json'),
    customEndpoint: true,
  };
  bigQuery = new BigQuery(options);
  bigQuery.makeAuthenticatedRequest = util.makeAuthenticatedRequestFactory(options);
});
```

options の基本項目は、 BigQuery クラスのコンストラクタで指定されていた項目をそのまま流用しています。
それに `customEndpoint` を指定して `makeAuthenticatedRequestFactory` を呼び出しインスタンス変数の値を上書きします。

## うまくいきましたよね！

これで Node.js の UnitTest から BigQuery Emulator を使ってクエリのテストコードを書くことができるようになりました。
BigQuery Emulator があって良かった！
