---
title: Dialogflow V1 API Webhook アプリを V2 対応できるミドルウェアを作った 
date: 2018-02-06 03:41 UTC
tags:
 - Dialogflow
 - GoogleHome
 - ActionsOnGoogle
---

みなさんスマートホーム使っていますか？
これからはスマートホームの時代ですね（棒）

ということで、今日本では一番売れているというGoogleHomeのアプリを(Actions on Googleを使って)作ってみようと思うと以下の選択肢があります。

- Dialogflow
  - GUIから音声対話を構築してアシスタントアプリを作成する
- Smart home
  - IoT機器（家電）を操作するアシスタントアプリを作成する（昔の呼び名で言うところのダイレクトアクション）
- Actions SDK
  - SDKとコマンドラインを使ってアシスタントアプリを作成する
- Converse.AI
  - Dialogflowと似ているけど違うサービスでアシスタントアプリを作成する
- Trivia
  - トリビアアプリを作るためのテンプレート
- Personality Quiz
  - クイズアプリを作るためのテンプレート
- Flash Cards
  - アシスタントアプリ学習用のフラッシュカードテンプレート

まぁおおよそは、以下から選択するわけですが、違いがあります。

- Dialogflow（構文解析/機械学習機能がある）
- Actions SDK（構文解析などは自分でやる必要がある）

後者はガチで、前者は簡単にサービスを開始できます。
この記事は、前者のDialogflowについて書いていきます。

### Dialogflow

もともとは `Api.ai` というサービスで Google が買収しました。

> 参考記事：[Googleに買収された自然言語対話プラットフォーム「API.AI」が「Dialogflow」に名称変更！](https://robotstart.info/2017/10/17/google-dialogflow-api-ai.html)

GoogleHomeのアプリは以下のような流れで実行されます。

1. GoogleHome（マイク）
1. Googleアシスタント（音声→テキスト = Speach to Texxt = STT）
1. Dialogflow（構文解析/学習）
1. Webhook（必須ではないけど、独自のロジックを書くなら呼べる）

で、来た道を戻り、

1. WebhookまたはDialogflowからテキストを返却
1. Googleアシスタント（テキスト→音声 = Text to Speach = TTS）
1. GoogleHome（スピーカー）

で私たちは音声を聞くことができるのです。

Dialogflow単体でいうと、Googleアシスタントだけではなく、LINEやSlackのBOTも作れます。

※より詳しく何ができるのかは [QiitaのDialogflowタグ記事一覧](https://qiita.com/tags/dialogflow) を参照ください。

### Dialogflow API

DialogflowにはAPIがあり、主な利用用途は以下のとおりです。

- GUIを使わずにCLIから操作できる
  - クライアントアプリを作る
  - アプリの設定を自動化する
- Webhookのインターフェース

現在の安定板はV1ですが、V2がbeta1として存在しています。

[V1とV2の違いは公式サイトに書かれています](https://dialogflow.com/docs/reference/v2-comparison)。

また、DialogflowにはEnterprise Edition(現在はベータ版)というのがあって、商用アプリを作る人にはきになるところです。
[Dialogflowの割り当てと制限](https://cloud.google.com/dialogflow-enterprise/quotas?hl=ja)を見るとわかるように、Standard Edition（無料版）には制限があります。
ただし制限だけに限っていうと、先ほどのV1とV2の違いページに書かれているのですが、

> Note: These quotas are not applied to requests coming from Google Assistant integration used with Standard Edition agents.

Googleアシスタント経由で使っている分には、Standard Editionでも制限はないということです。

### なぜV2を使うのか

たとえば以下のような作業はV1ではできません

- Dialogflowプロジェクト設定のimport/exportを自動化する（デプロイを自動化するのに必要）
- Enterprise Editionにとにかく加入して安心したい？（Enterprise Editionは V2 API が必須です）
- LINEやSlackのBOTを作りたいけど、制限を解除したい

また、DialogflowのWebhookアプリを作るのには、以下の2つから選択します。

- JSONを直接やりとりする
- [Node.jsの公式ライブラリ](https://github.com/actions-on-google/actions-on-google-nodejs)を使う

当然、後者の方が簡単にアプリを作成できるので、宗教上の理由でNode.js使いたくないという理由がなければ後者の方が良いですね。
ただしリンク先のGitHubみればわかりますが、現時点は 

>Please note that Dialogflow v2 is not currently supported by this client library.

ということです。

### とりあえず作ってみた

いろいろなことがあって、現時点V2使わないといけないかもしれない。
でもV1にも簡単に戻れるようにしたい、みたいな「ふわっとした」状況ってあるじゃないですか。

Dialogflowのデプロイも自動化したいよね、とか。

ということで簡単に「お試し」できるように、リクエストとレスポンスのJSONをV2/V1変換するミドルウェアを作りました。
ミドルウェアにしたのは簡単に取り外せるようにするためです。

- [NPM: dialogflow-fulfillment-v2-middleware](https://www.npmjs.com/package/dialogflow-fulfillment-v2-middleware)
- [GitHub: dialogflow-fulfillment-v2-middleware](https://github.com/sizuhiko/dialogflow-fulfillment-v2-middleware)

V1のアプリは以下のようなコードになります。

```js
const { DialogflowApp } = require('actions-on-google');
const welcome = require('./actions/welcome');

const actionMap = new Map();
actionMap.set('input.welcome', welcome);

const dialogflow = new DialogflowApp({request: req, response: res});
dialogflow.handleRequest(actionMap);
```

V2のアプリにしたい場合は、エントリポイントのJSだけを変更して、以下のようにすることを想定しています。

```js
const { DialogflowApp } = require('actions-on-google');
const connect = require('connect');
const dialogflowV2 = require('./dialogflow-fulfillment-v2-middleware');
const welcome = require('./actions/welcome');

const actionMap = new Map();
actionMap.set('input.welcome', welcome);

const app = connect();
app.use(dialogflowV2.v2to1());
app.use((req, res) => {
  const dialogflow = new DialogflowApp({request: req, response: res});
  dialogflow.handleRequest(actionMap);
});

app(request, dialogflowV2.v1to2(response));
```

[connect](https://www.npmjs.com/package/connect)というミドルウェアレイヤーを使って、DialogflowのWebhookアプリでミドルウェアを使えるようにしています。
これはGoogle Cloud Functionsを使った場合の想定で、AWS Lambdaを使った場合は、expressとか使うと思うので、expressのミドルウェアとして差し込んでもらえれば大丈夫です。

- v2to1() V2リクエストをV1リクエストに変換するミドルウェア
- v1to2(response) V1レスポンスをV2レスポンスに変換するラッパー

2つのAPIがPublicになっています。

### さいごに

JSONを変換するだけの簡単な実装ですが、手元のアプリではV2に切り替えてもうまく動作しました。

まだテストコードとかないので、Pull Requestお待ちしております（もちろんそのうち書く予定ですが...）。

うまく動作しない！などあれば、Issueで報告ください（日本語でOK）。
