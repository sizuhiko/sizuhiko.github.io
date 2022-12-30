---
title: AWS Lambda の Node.js 14 を 18 に移行する（CI/CD環境移行編）
date: 2022-12-30 06:39 UTC
tags: 
- AWS
- Lambda
- Node.js
---

クラメソさんの [[アップデート] AWS Lambdaが Node.js 18をサポートしました](https://dev.classmethod.jp/articles/aws-lambda-support-node-js-18/) 記事のとおり、やっと AWS Lambda でも Node.js 18 が使えるようになりました。

現在 Node.js 14 を使って AWS Lambda で API サーバーを構築しているのですが、 Node.js 16 の LTS が 9ヶ月終了が早まったこともあり、
このタイミングで Node.js 18 へ移行することにしました。

本稿では CI/CD 環境を Node.js 14 から Node.js 18 へ移行するときに実施した作業を振り返って、まとめておきます。

現在の構成はこんな感じです。

- Node.js 14 / TypeScript
- CI/CD に GitHub Actions を利用
- Amazonlinux ベースの [amazon/aws-cli](https://hub.docker.com/r/amazon/aws-cli) コンテナをベースにパッケージを追加した独自コンテナイメージで CI/CD を実施
- Serverless Framework でビルド/デプロイ

## CI/CD イメージの Node.js を 18 にする

まずはビルド/デプロイをするコンテナイメージを Node.js 18 にしていきます。
実際に Node.js 18 をインストールしようとしたのですが、エラーになってしまいます。

具体的なエラーは [/lib64/libc.so.6: version `GLIBC_2.14' not found. Why am I getting this error?](https://stackoverflow.com/questions/50564999/lib64-libc-so-6-version-glibc-2-14-not-found-why-am-i-getting-this-error) と一緒で、調べていくと Amazonlinux2 ベースである CentOS7 と Node.js 18 は [nodeのv18を使ったらエラーになった（CentOS7）](https://it.ama2pro.net/2022/05/31/node%E3%81%AEv18%E3%82%92%E4%BD%BF%E3%81%A3%E3%81%9F%E3%82%89%E3%82%A8%E3%83%A9%E3%83%BC%E3%81%AB%E3%81%AA%E3%81%A3%E3%81%9F%EF%BC%88centos7%EF%BC%89/) などにもあるように単純な話ではないようです。

おや？でも Lambda は Node.js 18 が使えるんですよね？どういうこと？と思いますよね。

Node.js のディストリビューション issue を確認すると [distribution package Amazon Linux 2022 not supported](https://github.com/nodesource/distributions/issues/1367) なんてのがありました。

### で、Amazon Linux 2022 って何なん？！ 

[amazonlinux のコンテナイメージ](https://hub.docker.com/_/amazonlinux)をみると、 `latest` は `amazonlinux2` なんですが、タグをみていくと確かに `2022` があります。
あと現時点では aws-cli のイメージは 2022 には追従していません。

そこで、 amazonlinux2022 をベースにして Node.js 18 をインストールするのを試してみます。

しかし、ここでプロビジョニングツールが amazonlinux 2022 に対応していないことがわかります（グルグル循環して脳が溶けてくる... 溶けてやがる、まだ早すぎたんだ....）。違うプロビジョニングツールも調べてみたのですが、どれも 2022 には対応していませんでした。ここでプロビジョニングツールを捨てる選択となりました。

（実際僕らは Chef を使っているんですが、Chef Workstation 自体に amazonlinux 2022 の対応は入っていました（[Omnitruck artifact does not exist for version 17 on platform Amazon Linux 2022 ](https://github.com/chef/omnitruck/issues/569)）。ただまだリリースパッケージに含まれていないので、いずれリリースされるバージョンでは対応されているでしょう。Ansibleも調べましたが、同様にまだリリースパッケージには含まれていませんでした。）

調べていたら、[AmazonLinux3じゃなくってAmazon Linux 2022 (AL2022) だってさ。](https://www.geekfeed.co.jp/geekblog/amazonlinx3-amazonlinux2022-al2022) という記事が見つかりました。
そんで 

> AmazonLinux2022以降はメジャーバージョンが2年ごとにリリースされる

まじかー。まぁ今までの AmazonLinux2 が長かったですね。そのぐらいで OS イメージを最新にしていかないとですよね。
ということで、今後も踏まえて CI/CD のフローを含め利用するコンテナイメージを検討しなおすことにしました。
（2年ごとの変更がプロビジョニングツールを捨てる決定的な要因になったのは間違いない）

## CI/CD フローの変更

現時点のフローを整理してみました

1. チェックアウト
1. ビルド
1. デプロイが必要な場合
  1. 環境のスイッチロール
  1. デプロイ

だいたいこんな感じです。
これを今までは全部1つのコンテナでやっていたのですが、それぞれ分割していくことにしました。

1. チェックアウト -> alpine/git
1. ビルド -> amazon/aws-lambda-nodejs:18 ベースに zip/unzip を追加したもの
1. デプロイが必要な場合
  1. 環境のスイッチロール -> amazon/aws-cli ベースに jq を追加したもの
  1. デプロイ -> node:18

ビルドに関しては `node:18` でも良かったのですが、ここは以前と同じく稼働する OS イメージと合わせています。
今後 OS イメージを追従するというより、実際の Lambda 実行コンテナイメージを使うことで、 Node.js ランタイムにあった OS バージョンを気にせず利用できるメリットがあると考えました（サイズ大きいけど）。

それ以外は必要な部分に最低限のコンテナという感じですね。

## さいごに

LTS に合わせて開発環境をアップデートしていくのは、とても大事ですね。
記事にすると、さらっと解決したように見えますが、それぞれのツールのソースコードや issue を確認しながら進んでいたので、かなり時間を取られてしまいました。
ただ、今後同じようにな環境でアップデートしていこうと思う人の助けになればと思います。
