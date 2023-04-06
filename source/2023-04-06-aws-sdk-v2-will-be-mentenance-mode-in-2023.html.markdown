---
title: aws-sdk v2 が 2023 年中にメンテナンスモードになる
date: 2023-04-06 09:24 UTC
tags: 
- aws-sdk
- aws-sdk@v2
---

aws-sdk v2 を使っている CLI ツールで aws 環境を操作していたら、見慣れないメッセージが出てきました。

> (node:9129) NOTE: The AWS SDK for JavaScript (v2) will be put into maintenance mode in 2023.

AWS SDK v2 ってメンテナンスモードに入るんだ...

Twitter でも書いている人がいました

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Anyone else seeing this new error from <a href="https://twitter.com/awscloud?ref_src=twsrc%5Etfw">@awscloud</a> sdk? <br><br>This is showing to our CLI users and is... annoying to say the least. <a href="https://t.co/KabEtFDKnl">pic.twitter.com/KabEtFDKnl</a></p>&mdash; David Wells (@DavidWells) <a href="https://twitter.com/DavidWells/status/1626321488742862848?ref_src=twsrc%5Etfw">February 16, 2023</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

これまでも複数回にわたって aws-sdk v3 の記事を書いてきましたが、これは Lambda にデプロイするアプリだから v3 に移行したのであって、CLIツールとかなら v3 に移行するモチベがあるかな....

ぶっちゃけ Lambda とかだとランタイムに追従すると sdk も上げないといけないので対応したけど、ツールなら対応しないですよね。

公式のリポジトリにも、サポートについて書かれています。

https://github.com/aws/aws-sdk-js#version-2x-support

そこにリンクされている [メンテナンスポリシーページ](https://docs.aws.amazon.com/sdkref/latest/guide/maint-policy.html) にいくと、以下のような内容が記入されていました。

> メンテナンス (フェーズ 3) -メンテナンス モードの間、AWS は SDK リリースを制限して、重大なバグ修正とセキュリティ問題のみに対処します。SDK は、新規または既存のサービスの API 更新を受け取ることも、新しいリージョンをサポートするために更新されることもありません。特に指定がない限り、メンテナンス モードのデフォルト期間は 12 か月です。
> 
> サポート終了 (フェーズ 4) - SDK がサポート終了に達すると、更新またはリリースを受け取ることができなくなります。以前に公開されたリリースは引き続きパブリック パッケージ マネージャーから入手でき、コードは GitHub に残ります。GitHub リポジトリはアーカイブされる場合があります。サポートが終了した SDK の使用は、ユーザーの判断で行われます。ユーザーが新しいメジャー バージョンにアップグレードすることをお勧めします。

v2 自体がリポジトリから無くなることはなさそうですが、膨大にありそうな v2 を使った CLI ツール群はどうするのかなぁ...

ちなみに Serverless Framerwork は PR [Suppress AWS SDK v2 deprecation message](https://github.com/serverless/serverless/pull/11769) でいったんメッセージ出力を OFF にしていますが、 v3 移行は大変だろうなぁ、という感想しかないです。

AWS SDK v3 は、これまでの記事でも書いてますが、結構パッケージ管理が残念な感じだったりするのと、書き方もめっちゃ変わっているので Serverless Framework 規模になると書き換えもかなり工数かかりそうだなぁと（いつかはやるんだろうけど）。

AWS さんが簡易にコンバートできるツールを作ってくれると良いんだろうけど、オプションの書き方も変わっているところがあったりするので、単純な変換も大変そうですね。

上記の引用ツイートのレスの中にもあるけど、v3 のドキュメントが不親切だというのは事実だし、良い解決策が 2023 年中に見つかると良いですね。
なんか感想ブログになっちゃいましたが、僕らのプロジェクトも v2 依存している CLI ツールは移行対象にしてなかったので、これから移行計画作らないとな、と思っています。
