---
title: CodeCommit と CodeBuild を GitHub と Actions の組み合わせのように使う
date: 2024-05-28 06:44 UTC
tags: 
- AWS
- CodeCommit
- CodeBuild
- StepFunctions
- EventBridge
---

この記事は AWS の CodeCommit と CodeBuild を使って「 GitHub と Actions だったら簡単にできる PR のビルドが成功したときだけマージ可能になる」仕組みを作ってみたので、その手順をまとめました。

### それって標準でできないの？

はい、 AWS の Code 兄弟だけでソースコードを管理している場合、CodeCommit には PR の機能と承認フローの制御はあるけど、ビルド結果と連動した仕組みは用意されていません。
僕も担当するプロジェクトで使うまで、それぐらいあるやろーと思っていたのですが、無いと聞いて衝撃を受けました。

### 前提

CodeCommit 上のリポジトリのブランチ戦略は git-flow で運用しています。
なので、 以下のようなブランチやタグが存在します。

- master
- develop
- release/v9.9.9
- hotfix/v9.9.9
- feature/xxxx-xxx

### CodeCommit と CodeBuild で git-flow を取り扱う

この時点でかなり面倒なのですが、以下のQiita記事が参考になります。

- [AWS CodeシリーズをAWS Step Functionsで実行し継続的デプロイする](https://qiita.com/yoshii0110/items/0eb427cb7331647f2c12)

なんで StepFunctions を使うかというと、Code兄弟を組み合わせて使ったとき、 `feature/*` のような動的ブランチの PR に対してビルドを実行できないといった問題があるためです。 `feature/*` に PUSH されたときに CodeBuild が動くとかはできるんですけど、そういうことじゃないんだよ Code兄弟よ。わかってないな、というとこ。

#### EventBridge -> StepFunctions への連携

CodeCommit への PR や PUSH のイベントを EventBridge で受け取って StepFunctions へ受け流します。

こちらの記事が参考になります。

- [AWS StepFunctionsを使って CodeCommitでプルリク時にそのブランチ名を自動的に既存のCodeBuildの対象ブランチにしてテスト実行する。](https://qiita.com/isamuJazz/items/c8e4a4c27b46b87e01f3)
- [新機能 – Step Functions と AWS CodeBuild を使用した継続的インテグレーションワークフローの構築](https://aws.amazon.com/jp/blogs/news/new-building-a-continuous-integration-workflow-with-step-functions-and-aws-codebuild/)

CodeCommit の PR や PUSH のイベントが発生したら、StepFunctions を呼び出すように設定します。

基本的には事前定義パターンでも問題ないと思いますが、EventBridgeの段階でイベントを絞り込みたい場合は、カスタムで絞り込んでも良いと思います。
対象イベントをどうするかは EventBridge でも StepFunctions で判定してもどちらでも良いでしょう。実行コストを機にするなら EventBridge でフィルタしたほうが良いですね。


たとえば PR の作成とソースの更新時にだけ動かしたい場合は、以下のようなJSONになります。

```json
{
  "detail": {
    "event": ["pullRequestCreated", "pullRequestSourceBranchUpdated"]
  },
  "detail-type": ["CodeCommit Pull Request State Change"],
  "resources": ["CodeCommitのARN"],
  "source": ["aws:codecommit"]
}
```

GitHub Actions に置き換えると、以下のような部分を EventBridge や StepFunctions で設定すると思っていれば間違いないです。

```yaml
on:
  pull_request:
    types: [opened, synchronize]
    branches:
      - 'feature/**'
      - 'release/**'
      - develop
      - master
  push:
    branches:
      - 'release/**'
      - develop
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'
```

#### StepFunctions のフロー

参考記事に StepFunctions から CodeBuild を実行する例が出ているので、そちらを参考にしてください。

フローとしては以下の様な流れを設定しています。

1. PR かどうか判定する `$.detail-type` を `Choise` で判定して分岐
   1. PR だったら CodeBuild の `build` を実行して、 `ResultPath: $.BuildResult` に結果を格納
   2. ビルド結果を CodeCommit に通知する Lambda を実行
2. 1 の ELSE
   1. PUSH になるので、ブランチ `$.detail.sourceReference` が `refs/heads/develop` や `refs/heads/master` , `refs/heads/release` にマッチしていたら CodeBuild の `deploy` を実行して、 `ResultPath: $.BuildResult` に結果を格納

実際はチャットにもビルド結果を通知したりしているので、フローはもう少し複雑ですが、大まかには上記のとおりです。

StepFunctions から CodeBuild を呼び出す時の設定可能なパラメータなど。AWSの公式ドキュメントを見るとわかりやすいです（翻訳のタイトル変だけどw）

[Step AWS CodeBuild Functions による呼び出し](https://docs.aws.amazon.com/ja_jp/step-functions/latest/dg/connect-codebuild.html)

git-flow の CodeBuild プロジェクトを設定するときは、ソースの設定を指定せずに PR のソースブランチに対してビルドするようにします。

[新機能 – Step Functions と AWS CodeBuild を使用した継続的インテグレーションワークフローの構築](https://aws.amazon.com/jp/blogs/news/new-building-a-continuous-integration-workflow-with-step-functions-and-aws-codebuild/)の記事で CodeBuild を実行するときの StepFunctions 定義は以下のようになっています。

```json
    "Trigger CodeBuild Build With Tests": {
        "Type": "Task",
        "Resource": "arn:${AWS::Partition}:states:::codebuild:startBuild.sync",
        "Parameters": {
          "ProjectName": "${projectName}"
        },
        "Next": "Get Test Results"
    },
```

`Parameters` に以下のパラメータを追加して、特定のソースブランチに対してビルドできるように設定します。

- SouceTypeOverride: "CODECOMMIT"
- SourceLocationOverride: CodeCommit のURL
- BuildspecOverride: 実行するビルドスペックのパス
- SourceVersion: ブランチ名（event.detail.sourceReference）

#### CodeBuild でやること

CodeBuild では分岐処理を書くとしてもシェルの if 文を使うことになるので、そういったケース分けは StepFunctions で分岐して、buildspecfile を分けておいて `BuildspecOverride` で切り替える様にしておいた方が良いです。

GitHub Actions でいうと、単純なジョブが1つ書けるだけと思っていたほうが良いです。

#### CodeCommit にビルド結果を通知する

では CodeBuild の結果を CodeCommit に通知してみましょう。
ここは連携の仕組みはないので、 CodeCommit のコメント欄と承認機能を利用します。

まずビルド結果を CodeCommit にコメントして、ビルドが成功していたら承認する Lambda を実装します。

```javascript
import { CodeCommitClient, PostCommentForPullRequestCommand, UpdatePullRequestApprovalStateCommand } from "@aws-sdk/client-codecommit":

export const handler = async (event) => {
    const client = new CodeCommitClient();
    const buildResult = event.BuildResult.Error ? JSON.parse(event.BuildResult.Cause) : event.BuildResult;
    const buildUrl = `https://リージョン.console.aws.amazon.com/codesuite/codebuild/コードビルドID/projects/${buildResult.Build.ProjectName}/build/${buildResult.Build.Id}`;
    const icon = event.BuildResult.Error ? '❌' : '✅';
    const content = `${icon} ビルド [${buildResult.Build.Id}](${buildUrl})`;
    const input = {
        pullRequestId: event.detail.pullRequestId,
        repositoryName: event.detail.repositoryNames[0],
        beforeCommitId: event.detail.sourceCommit,
        afterCommitId: event.detail.destinationCommit,
        content,
    };
    const command = new PostCommentForPullRequestCommandI(input);
    await client.send(command);

    if (!event.BuildResult || event.BuildResult.Error) {
        return;
    }
    const approvalInput = {
        pullRequestId: event.detail.pullRequestId,
        revisionId: event.detail.revisionId,
        approvalState: "APPROVE",
    };
    const approvalCommand = new UpdatePullRequestApprovalStateCommand(approvalInput);
    await client.send(approvalCommand);
}
```

本当は絵文字じゃなくて、バッジを使いたかったのですけど、CodeCommit では利用できる Markdown 記法に制限があって、外部画像は利用できないようです。
CodeBuild にもバッジ機能はありますが、 git-flow のように `feature/*` のワイルドカードブランチで、 StepFunctions からビルド対象ブランチを指定して実行する場合にはバッジが作れないので、それも使えません。
ここは絵文字一択でしょう。
あとは、ビルドが成功していても失敗していても、ビルド結果に飛べるリンクを付けることで確認しやすくなります。

この Lambda からは以下の2つのコマンドを利用するためのポリシーが必要になるので、忘れずにアタッチしましょう。

- PostCommentForPullRequest
- UpdatePullRequestApprovalState

#### ビルドが成功したときだけマージ可能にする

上記の Lambda でビルドに成功したときだけ承認を実行するようにしました。
CodeCommit では「承認ルールテンプレート」を設定できます。

以下のルールを前提とします。

- CI でのビルドが成功している
- PR 作成者以外の人が承認している

まず前者の承認ルールテンプレートを設定してみましょう。

- 必要な承認の数: 1
- 承認プールのメンバー
  - IAMユーザー名または引き受けたロール
  - 値: ビルドが成功していたら承認する Lambda のロール名
- ブランチ名: develop

git-flow では `feature/*` から `develop` に向けて PR を出すので、ブランチフィルターを設定しておくと良いです。
また、Lambda からの承認であることを判定するには、Lambda に割り当てているロール名で判定するのが楽だと思うので、ロール名で判定すると良いでしょう。

続いて後者の承認ルールテンプレートを設定してみましょう。

- 必要な承認の数: 2
- ブランチ名: develop

ここでは承認者の絞り込みはしておらず、2つの承認があったらというルールにしています。
プロジェクトによっては特定の人の承認を必要とする場合もあるでしょうから、そのあ場合は承認プールのメンバーを設定して必要な承認数を指定してください。
ここでは誰かしら1人以上が承認してくれたら、という前提になっています。

ではなぜ必要な承認の数が 2 なのか？というと、CIでの承認数1と人の承認数1を合わせて2以上という形にしています。
人が2人以上承認していてもCIが失敗していた場合は、前者の承認ルールを満たしていないのでマージすることはできません。

ビルド成功で1、人の承認が1つ以上でルールが満たされます。

### さいごに

これらの手順で CodeCommit / CodeBuild を使ったときに GitHub と Actions で簡単にできていたワークフローを実現できます。

面倒だ、面倒すぎる、と思いますよね。

できれば Code兄弟を避けていきたいのですが、プロジェクト事情でそれ以外の選択肢が選べないこともあるでしょう。
そのようなときに、この記事が参考になればと思います。
ここまで全体の手順を解説してくれる記事が見当たらなかったので、細かい設定は置いておいて大まかなら流れをベースに解説しました。
それぞれの部分（たとえばStepFunctionsとCodeBuildの連携）といった記事は検索すると見つかるので、具体的な実装方法はそれぞれの最新情報を確認ください。

Code兄弟さん、もっと便利になってくれないかな、と願う日々です。
