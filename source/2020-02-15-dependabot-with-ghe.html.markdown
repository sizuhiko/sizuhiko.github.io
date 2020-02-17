---
title: DependabotをGHEのプロジェクトに適用する
date: 2020-02-15 02:17 UTC
tags:
- Dependencies Management
- dependabot
---

昨今のWebアプリケーション開発では、多数のOSSライブラリに依存しています。
私たちが開発するアプリケーションの脆弱性対応はもちろんのこと、これらのライブラリもセキュリティアップデートやバグフィックスなどが行われていきます。

では、ライブラリのバージョンを最新に追従するにはどうしたら良いでしょうか？

- ライブラリのソースリポジトリをチェックする。GitHubのことが多いので、Watchしておけば通知が届きます。
- 依存関係をチェックしてくれるBotを入れて、Slackなどに通知する。たとえば [npmcheck2slack](https://github.com/frankthelen/npmcheck2slack)のようなもの
- 依存関係をチェックしてPRを出してくれるツールを導入する。

3つ目のPRを出すツールに関しては、対応する言語ごとに様々なものがありますが、今回は[GitHubに買収された](https://dependabot.com/blog/hello-github/)ことでも有名になった[Dependabot](https://dependabot.com/)を導入してみたので解説します。

でもDependabotって、普通にGitHubから使えるでしょ？

そうなんです。ただ今回はGitHubでも[GitHub Enterprise](https://github.co.jp/enterprise.html)を利用している場合には(まだ？)Dependabotを利用することができないので、CIで実行できるようにしてみたよ！という記事です。

### 想定されるプロジェクト環境

- ソースコードリポジトリはGHE
- CIサーバーに[Drone.io](https://drone.io)をオンプレ利用

ですが、GHEやDroneでなくても、この記事を理解してもらえれば利用可能になると思います。

つまりリポジトリやらCIやらをオンプレしているプライベートな開発環境で、依存関係更新ツールを使ってみようろいうことです。

### Dependabotをオンプレで動かす

Dependabotには[Dependabot Update Script](https://github.com/dependabot/dependabot-script)というものがあり、オンプレ環境で動かせるようになっています。

READMEに書いてあるとおり設定すれば良いのですが、私たちのプロジェクトでは以下のようにしました。

1. `dependabot-drone` というリポジトリをGHEに作成。これをDroneのdaily cronで実行してPRを日次で作成させる
1. Dependabot Update Scriptは `dependabot-drone` に git submodule で追加する
1. Dependabot Update Scriptの更新もチェックしたいので、 `dependabot-drone` 自身の更新もチェックする


これをDrone.ioで実行するには、以下のような `.drone.yml` ファイルを記述します。

```yml
clone:
  git:
    image: plugins/git
    recursive: true # 2のとおり submodule を使う場合指定

pipeline:
  # READMEに書いてあるインストール手順を定義
  install:
    image: dependabot/dependabot-core
    pull: true
    commands:
      - cd dependabot-script
      - bundle install -j 3 --path vendor
    when:
      event: cron
  # 3の自身をアップデートする定義
  dependabot-drone:
    image: dependabot/dependabot-core
    environment:
      - GITHUB_ACCESS_TOKEN=xxxxxxxxxxxxxxxxx
      - GITHUB_ENTERPRISE_HOSTNAME=github.xxxxx.com
      - GITHUB_ENTERPRISE_ACCESS_TOKEN=xxxxxxxxxxxxxxxxx
      - PROJECT_PATH=xxxxxx/dependabot-drone
      - PACKAGE_MANAGER=submodules
    commands:
      - cd dependabot-script
      - bundle exec ruby ./generic-update-script.rb
    when:
      event: cron
```

Dependabotのコア機能は `dependabot/dependabot-core` というDockerイメージで提供されているので、このイメージを使って `dependabot-script` を実行するということです。
このときに環境変数を指定します。

- GITHUB_ACCESS_TOKEN パッケージマネージャ(npmやcomposer, bundlerなど)が参照するリポジトリにGitHub APIを使ってアクセスするため、アクセストークンを設定しないとAPI上限に引っかかってしまいます。このため必ず設定しましょう。
- GITHUB_ENTERPRISE_HOSTNAME GHEのホスト名を指定します
- GITHUB_ENTERPRISE_ACCESS_TOKEN GHEにアクセスするためのアクセストークンを設定します
- PROJECT_PATH GHEのプロジェクトパスを指定します
- PACKAGE_MANAGER ここではsubmodulesを指定しています。他の候補はREADMEに書いてあるとおり[ソースコードを参照](https://github.com/dependabot/dependabot-script/blob/master/generic-update-script.rb#L27)します

### アプリケーションリポジトリをチェックしていく

あとは、先ほど作った `.drone.yml` ファイルにアプリケーションリポジトリを追加してくだけです。

たとえば `frontend-app` というリポジトリをチェックしたい場合は、このようになります。

```yml
# 省略...

pipeline:
  # 省略...
  dependabot-drone:
    # 省略...
  frontend-app:
    image: dependabot/dependabot-core
    environment:
      - GITHUB_ACCESS_TOKEN=xxxxxxxxxxxxxxxxx
      - GITHUB_ENTERPRISE_HOSTNAME=github.xxxxx.com
      - GITHUB_ENTERPRISE_ACCESS_TOKEN=xxxxxxxxxxxxxxxxx
      - PROJECT_PATH=xxxx/frontend-app
      - PACKAGE_MANAGER=npm_and_yarn
    commands:
      - cd dependabot-script
      - bundle exec ruby ./generic-update-script.rb
    when:
      status: [success, failure]
      event: cron
```

`PROJECT_PATH` と `PACKAGE_MANAGER` 、パイプラインの名前が違うだけで他の定義はすべて一緒です。
`status: [success, failure]` を入れているのは、複数リポジトリある場合に、途中で失敗しても継続したいための設定です。

### PRがやってくる日々

daily cron に従って Dependabot からPRが送られてきます。

![](/images/blog/dependabot-drone.png)

これでWatchしてPRしなくて良いし、とても便利ですよね。
PRのコメントに Changelog や Commit など変更のリンクがあるので、内容をチェックすることもできます。

プライベートでも依存関係の更新をちゃんとやれるよ！ということでした。
