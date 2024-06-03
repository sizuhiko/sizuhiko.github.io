---
title: CodeCommit で Renovate を使う
date: 2024-05-30 08:03 UTC
tags: 
- AWS
- CodeCommit
- Renovate
---

[Renovate](https://www.mend.io/renovate/)は依存関係の更新を自動化（PRを生成してくれたり、マージしてくれたり） するツールで、dependabot などと並んで有名なツールです。

CodeCommit で依存関係の更新を公式にサポートしているツールを探していたのですが、Renovate しか見つからなかったので、選択肢を検討することもなく導入してみることにしました。

### 導入方法

[CodeCommit に導入するための公式ドキュメント](https://docs.renovatebot.com/modules/platform/codecommit/)があります。

前回のブログ[CodecCmmit と CodeBuild を GitHub と Actions の組み合わせのように使う](/2024/05/28/using-codecommit-codebuild-like-a-github-and-the-actions.html)で CodeCommit と CodeBuild の環境は設定済みで、かつ PR に対してビルド結果が連携できるようにしてあります。

Renovate を導入するときもこの手順は重要で、ライブラリをアップデートするときにビルドが通過するかわからないものはマージできないので、まず導入前に連携できるように設定しておきましょう。

#### AWS 環境の設定

ドキュメントどおり IAM や Role の設定を行います。
ここはプロジェクトによってやり方がいろいろあると思いますが、結果として CodeBuild から CodeCommit に PR が出せる様な設定になっていれば良いです。
必要なポリシーなども列挙されているので、ドキュメントをよく読んで進めれば大丈夫です。

#### AWS 環境ではできないこと

これもドキュメントに明記されています。

- PR への担当アサイン
- PRの自動マージ
- `rebaseLabel` オプションの有効化

#### 環境設定ファイルを記述する

ドキュメントでは `config.js` で書かれていますが、 `renovate.json` でも大丈夫です。
このあたりはお好きな[設定ファイル形式](https://docs.renovatebot.com/configuration-options/)を利用すると良いでしょう。

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json"
}
```

スキーマ定義やパッケージルールなどを設定しておきます。
Renovate の対象リポジトリごとにリポジトリルートにファイルを設置します。

#### CodeBuild の設定

##### 導入方法の選択

Renovate を導入するときの単位として、2つの選択肢があります。

- Renovate を複数のリポジトリに対して実行する管理リポジトリを1つと、対になる CodeBuild プロジェクトを作成する
- Renovate の対象リポジトリごとに CodeBuild のプロジェクトを作成する

前者の良いところは、Renovate の対象リポジトリが多数あるとき、管理リポジトリに設定している CodeBuild の buildspec ファイルでリポジトリ名を列挙していき、対象リポジトリ側は、リポジトリルートに設定ファイルを入れておくだけで良いことです。
ただしリポジトリごとに実行スケジュールを変更するといったことはできないので、すべての対象リポジトリに対して順番に PR が作成されていきます。

後者の良いところは、リポジトリごとに実行スケジュールを柔軟に変更できることです。ただしリポジトリ数ぶんの CodeBuild プロジェクトが必要になるので対象リポジトリ数が多くなると面倒に感じるかもしれません（IaC で構築していればそうでもないかも？）。

##### buildspec ファイルの設置

今回は導入リポジトリ数も少なかったのと、実行スケジュールをリポジトリごとに変更したいという要望があったので、後者の方式で導入してみました。

どちらの方法でも CodeCommit / CodeBuild では実現可能です。

前回の記事で build.yml や deploy.yml を作っているので、そこに renovate.yml といった名前で buildspec ファイルを記述します。

ドキュメントでは Docker を使う方法と CLI を使う方法が紹介されていますが、私たちは CLI の方式を採用しました。

```yml
version: 0.2
env:
  shell: bash
  git-credential-helper: yes
  variables:
    RENOVATE_PLATFORM: 'codecommit'
    RENOVATE_REPOSITORIES: '["repoName1"]'
    RENOVATE_CONFIG: '{"extends":["config:recommended"]}'
    LOG_LEVEL: 'debug'
    AWS_REGION: 'ap-northeast-1'
phases:
  install:
    runtime-version:
      nodejs: 20
  build:
    on-failure: CONTINUE
    commands:
      - npm install -g renovate
      - renovate
 ```

`RENOVATE_REPOSITORIES` が違うだけで、各リポジトリに入れておきます。

##### CodeBuild プロジェクトの作成して実行スケジュールを設定する

CodeBuild プロジェクトを新規作成してリポジトリを紐づけておきます。
あとは実行スケジュールを EventBridge に設定して、作成した CodeBuild プロジェクトを実行 ( `StartBuild` ) するように設定します。

ここまでで実行スケジュールに応じて PR が生成できるようになります。

### セキュリティアップデートに対応する

Renovate は標準では CVE などに対応するパッチの PR は生成されません。
この機能を有効にするためのオプションは2つあります。

- [vulnerabilityAlerts](https://docs.renovatebot.com/configuration-options/#vulnerabilityalerts)
- [osvVulnerabilityAlerts](https://docs.renovatebot.com/configuration-options/#osvvulnerabilityalerts)

前者は GitHub のみサポートしており CodeCommit では利用できません。
後者は実験的な機能という位置付けのようですが、すべてのプラットフォームで動作する様になっています。

#### osvVulnerabilityAlerts を有効にする

環境設定ファイル（この記事では renovate.json）に設定を追加します。

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "osvVulnerabilityAlerts": true
}
```

#### 実は GitHub が必要なんです

ドキュメントを読むとこれだけで良いのかと思っていたのですが、実際に Renovate を実行しても CVE の PR は生成されません。

おや？っと思ってログを確認したりしたのですが、原因がわからず Renovate のソースコード自体を確認してみました。

すると、なんと OSV のデータソースが GitHub に固定してハードコードされてるじゃないですか。

[該当のコード](https://github.com/renovatebot/renovate/blob/main/lib/workers/repository/process/vulnerabilities.ts#L52)

```javascript
  private async initialize(): Promise<void> {
    // hard-coded logic to use authentication for github.com based on the githubToken for api.github.com
    const token = findGithubToken(
      find({
        hostType: 'github',
        url: 'https://api.github.com/',
      }),
    );

    this.osvOffline = await OsvOffline.create(token);
  }
```

ドキュメントからリンクされている[ディスカッション](https://github.com/renovatebot/renovate/discussions/20542)には、[違うデータソースを使う場合の書き方](https://github.com/renovatebot/renovate/discussions/20542#discussioncomment-8889250)があって、OSVの任意のデータソースを利用する場合は独自にzipファイルをダウンロードしてやるのも良いでしょう。

で、そのまま GitHub のデータソースを利用する場合は、GitHub の PAT を生成して（権限は `public_repo` ぐらいでok） renovate.yml に設定を追加します。

```yml
env:
  secrets-manager:
    GITHUB_COM_TOKEN: "[シークレットの名前]:[シークレットのキー]"
```

CodeBuild の buildspec では環境変数に設定する値を SecretsManager から取得できるので、GitHub で生成した PAT はそこに格納しておいて、CodeBuild から参照できるようにしておきましょう。

プロジェクト都合で GitHub 使えないから CodeCommit 使っているのに！という声はごもっともだと思うので、そういう場合は zip ファイルをダウンロードして実行する手順を試してみることをお勧めします。

### さいごに

できれば CodeCommit も GitHub と Dependabot の関係のように標準で脆弱性の PR 対応して欲しいですよね。
ビルド結果の通知とか脆弱性の対応とか、Code兄弟の機能として不足しているなーという部分の強化に期待しましょう。
