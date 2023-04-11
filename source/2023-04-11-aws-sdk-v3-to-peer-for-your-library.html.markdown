---
title: aws-sdk v3 を使うライブラリを作ったときは、なるべく peerDependencies に設定しよう
date: 2023-04-11 07:33 UTC
tags: 
- aws-sdk
- aws-sdk@v3
---

先日 [aws-sdk v2 が 2023 年中にメンテナンスモードになる](/2023/04/06/aws-sdk-v2-will-be-mentenance-mode-in-2023.html) という記事を書いて、実際自分たちで作っていた aws-sdk v2 でできていた CLI ツールも aws-sdk v3 に切り替えました。

### CLIツールを v3 に移行したら、利用するアプリ側がコンパイルエラーになる

で、それを Lambda にデプロイするアプリの devDependencies に反映してみたところ、また型エラーが出るようになりました。

CLIツールでは `@aws-sdk/client-lambda@3.310.0` に依存していて、 Lambda アプリ側は `@aws-sdk/client-lambda@3.254.0` を使っていたためです。

>  error TS2345: Argument of type 'typeof LambdaClient' is not assignable to parameter of type 'InstanceOrClassType<Client<ServiceInputTypes, MetadataBearer, any>>'.
      Type 'typeof LambdaClient' is not assignable to type 'ClassType<Client<ServiceInputTypes, MetadataBearer, any>>'.

で、それぞれの型定義への依存は `"@aws-sdk/types": "*"` になっているので、lock ファイルの状態次第でそれぞれでバージョンが異なるものが入る場合があります。
そこで型が一致しない問題が発生してきます。

CLI ツールでは実行時に aws-sdk が必要になるので、 dependencies に設定していて、CLIツールを使う方のアプリは devDependencies に設定しているわけですが、それぞれの dependencies からインストールされる `@aws-sdk/types` がドッチ？問題になってしまうという...

### 解決策

今回は自分たちで作ったライブラリだったので、CLIツール側の aws-sdk を devDependencies に変更して、CLIツールを使うアプリ側の aws-sdk 利用状況に依存するように変更しました。

```javascript
  "peerDependencies": {
    "@aws-sdk/client-lambda": "^3.0.0"
  },
```

これでアプリ側が `@aws-sdk/client-lambda` を使っていればそのバージョンに依存するようになるし、使っていなければ 3系の最新が入るようになります。

ここで、この aws-sdk v3 シリーズを読んでいただいた懸命な皆様はお気づきだと思いますが [Node.js v18 / aws-sdk v3 の Lambda アプリが突然動かなくなる](/2023/04/05/aws-sdk-v3-changed-enum-to-const.html) でも書いた

> `peerDependencies` が指定されていたら、バージョンを揃えるために自分でインストールする

これが重要になってきます。
なので、自分で作ったライブラリで peerDependencies に指定したら、結局アプリ側で使ってなくてもバージョンを揃えるのに追加でインストールした方が良いということです。

### aws-sdk v3 を安心して使うためには（追記）

- 基本的にバージョンは最新版、もしくは最新に近い同じバージョンに揃える
- `peerDependencies` が指定されていたら、バージョンを揃えるために自分でインストールする
- 関数/クラス以外、たとえば enum の値などは基本的に利用しない
- 自作ライブラリで aws-sdk v3 に依存する場合は `peerDependencies` に指定する

大事なこと4つ目を追加しました。

aws-sdk@v3 のパッケージ管理に日々不安が募りますが、同様の問題に遭遇した人の解決に役立てれば幸いです。
