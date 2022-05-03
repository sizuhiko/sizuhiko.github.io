---
title: DependabotをGHEのActionsとPackagesで利用する
date: 2022-05-03 05:40 UTC
tags: 
- Dependencies Management
- dependabot
- GitHub Enterprise
- Actions
- Packages
---

以前に [DependabotをGHEのプロジェクトに適用する](/2020/02/15/dependabot-with-ghe.html) という記事を書きましたが
それから状況は変わり CI は drone.io から GHE の Actions を使うように、プロジェクト内のプライベートパッケージは Packages に入れるようになりました。

すべて GHE のプラットフォームに寄せられたのは良かったのですが、現時点まだ Dependabot はβ版のようなので、ひとまずセルフホストランナーを使って実行できるようにしてみました。

```yaml
name: dependabot
on:
  workflow_dispatch:
  schedule:
    - cron: 'お好みのスケジュールで'
jobs:
  dependabot:
    runs-on: self-hosted
    env:
      PROJECT_PATH: ${{ github.repository }}
      BRANCH: develop
      PACKAGE_MANAGER: npm_and_yarn
      GITHUB_ACCESS_TOKEN: ${{ secrets.GITHUB_ACCESS_TOKEN }}
      GITHUB_ENTERPRISE_ACCESS_TOKEN: ${{ secrets.GITHUB_ENTERPRISE_ACCESS_TOKEN }}
      GITHUB_ENTERPRISE_HOSTNAME: ${{ secrets.GITHUB_ENTERPRISE_HOSTNAME }}
      NPM_REGISTRY_URL: npm.github.hoge.com
      NPM_TOKEN: ${{ secrets.PACKAGES_DOWNLOAD_TOKEN }}
    steps:
      - run: docker pull dependabot/dependabot-core
      - name: run dependabot
        run: |
          rm -rf dependabot-script
          git clone https://foo:${GITHUB_ACCESS_TOKEN}@github.com/sizuhiko/dependabot-script.git
          cd dependabot-script
          docker run -v "$(pwd):/home/dependabot/dependabot-script" \
          -w /home/dependabot/dependabot-script dependabot/dependabot-core bundle install -j 3 --path vendor
          docker run --rm -v "$(pwd):/home/dependabot/dependabot-script" \
          -w /home/dependabot/dependabot-script \
          -e PROJECT_PATH=${PROJECT_PATH} \
          -e BRANCH=${BRANCH} \
          -e PACKAGE_MANAGER=${PACKAGE_MANAGER} \
          -e GITHUB_ACCESS_TOKEN=${GITHUB_ACCESS_TOKEN} \
          -e GITHUB_ENTERPRISE_ACCESS_TOKEN=${GITHUB_ENTERPRISE_ACCESS_TOKEN} \
          -e GITHUB_ENTERPRISE_HOSTNAME=${GITHUB_ENTERPRISE_HOSTNAME} \
          -e NPM_REGISTRY_URL=${NPM_REGISTRY_URL} \
          -e NPM_TOKEN=${NPM_TOKEN} \
          dependabot/dependabot-core bundle exec ruby ./generic-update-script.rb
```

GHE では `self-hosted` ランナーを使うのが一般的なのですが、そこに dependabot を入れるのではなく、 `dependabot-core` の Docker イメージを使って実行できるようにします。
これは以前の記事と同じ実行方法ですね。

で、drone.io の場合と異なり Actions で該当のリポジトリで cron ビルドするようにしています。
cron のスケジュールは日次なり、週次なりで良いでしょう。

### 設定する環境変数

以下の環境変数でコントロールしています。

- BRANCH PRの向き先のブランチ名。git flow の場合は develop
- PACKAGE_MANAGER パッケージマネージャ名。npmやyarnの場合は npm_and_yarn
- GITHUB_ACCESS_TOKEN GitHubのアクセストークン。GHEのシークレットに入れておくと良いです
- GITHUB_ENTERPRISE_ACCESS_TOKEN GHEのアクセストークン。GHEのシークレットに入れておくと良いです
- GITHUB_ENTERPRISE_HOSTNAME GHEのホスト名。GHEのシークレットに入れておくと良いです
- NPM_REGISTRY_URL プライベートレジストリのURL
- NPM_TOKEN パッケージダウンロード権限のあるPAT(GHEのPersonal Access Token)。GHEのシークレットに入れておくと良いです

### dependabot-script を fork してみた

さて、あとは `dependabot-core` のイメージ内で `dependabot-script` を動かせば良いのですが、 `dependabot-script` が Github Pakages への参照ができないため、 fork して少し修正をしています。

`dependabot-core` はプライベートレジストリの認証に対応しているので、 [scriptを少し修正して](https://github.com/sizuhiko/dependabot-script/commit/ac81dc8bbeb6538344c73a28795f8c4513d1a818)対応しています。

なお、 `dependabot-script` にも同様の対応のPR [Read private repository credentials from environment](https://github.com/dependabot/dependabot-script/pull/632/files) が出ているので、いずれ公式に対応されるかもしれないです。

とくに GitHub Packages みたいなプライベートレジストリを使っていないのであれば、公式の `dependabot-script` を使ってもらえば良いと思います。
