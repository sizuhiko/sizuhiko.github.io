---
title: Serverless Framework 1.61.3 以上で Alias プラグインが利用できない
date: 2020-02-16 07:07 UTC
tags:
- Serverless Framework
- Alias Plugin
---

Serverless Frameworkのバージョンも dependabot で追従してあげているのですが、
あるとき `sls deploy` がエラーになってしまいました。

Aliasのエラーが出ていたので、[serverless-aws-alias](https://www.npmjs.com/package/serverless-aws-alias)
を調査しようとしたら、ビンゴなissueを見つけました。

[ServerlessError: Export 'project-name-ServerlessAliasReference' does not exist. #181](https://github.com/serverless-heaven/serverless-aws-alias/issues/181)

[Serverless Framework 1.61.3 のコミット](https://github.com/serverless/serverless/commit/f1cc3a899856a12ed251ea4a0947a331861cd8b3)でAliasプラグインがうまく動かなくなることがあるようです。

私たちのプロジェクトでは 1.61.2 に戻して、dependabotから来るPRにはWIPをつけるようにしました。

どのようなときに問題がおきるかというと、

- 1つのServerlessアプリケーションに複数のハンドラがある
- 新しいハンドラが追加になった

ケースです。

複数のハンドラがあるけど、追加がないケースでは新しいバージョンを使っても問題は発生していません。
Aliasプラグイン便利なので、はやく修正されると良いなー（困った人はPRを出そうというのはわかるが、これは難しい問題のようだった
