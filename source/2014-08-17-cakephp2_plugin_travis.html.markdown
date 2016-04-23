---
title: CakePHP2のプラグインをTravis.ciで継続的インテグレーションする
date: 2014-08-17 07:00 UTC
tags:
- PHP
- CakePHP
- 継続的インテグレーション
---

春先ぐらいからBlogの更新が滞っていましたが、その要因となったアレが大分落ち着いてきたので、たまっていたネタを順番に書き出します。

CakePHP2のプラグインを作成／公開していて、継続的インテグレーションってどうするの？と思っていました。
もちろんユニットテスト書いてあるし、素晴らしい協力者の方がPull Requestを送ってくれれば、developブランチに取り込んでテストしたりします。

Githubを徘徊していると、よく見る

![](/images/blog/cakephp2_plugin_ci_1.png)

これを表示したいと思ったのです。

ただCakePHP2のプラグインは当然それだけではユニットテストを実行できません。CakePHPのアプリケーションがあって、テスト用データベースとその設定があって…、ぬーん。
早い話、テスト用のアプリケーション作って、そこからテスト実行すれば良いの？ということをずっと思っていました。

### CakePHPの有名プラグインはどうしているのだろう？

と思い、最初にチェックしたのはCakeDC/searchプラグイン。
大抵のアプリケーションで使う、もっともメジャーなプラグインではないかと思います。
Searchプラグインにも、あのビルド成功やダウンロード数、バージョン番号の画像が表示されています。

![](/images/blog/cakephp2_plugin_ci_2.png)

`.travis.yml` ファイルがあるので、内容を確認してみます。
すると、

```yaml
before_script:
  - git clone https://github.com/burzum/travis.git --depth 1 ../travis
  - ../travis/before_script.sh
  - if [ "$PHPCS" != 1 ]; then
            echo "
                require_once APP . DS . 'vendor' . DS . 'phpunit' . DS . 'phpunit' . DS . 'PHPUnit' . DS . 'Autoload.php';
            " >> ../cakephp/app/Config/bootstrap.php;
    fi
```

`https://github.com/burzum/travis.git`をcloneしてきて、何かやっているようです。

### CakePHPプラグインを簡単にTravis.ciで継続的インテグレーションできる

早速、ページにアクセスしてみると、どうもそれはあの`FriendsOfCake`からForkされたもののようです。
`FriendsOfCake`の[元リポジトリ](https://github.com/FriendsOfCake/travis)を確認します。

> Easy travis setup for CakePHP plugins
> This repository helps easy travis integration for CakePHP plugins, primarily focused on FriendsOfCake projects, but can be used within any plugin when satisfying the requirements.

おぉ、正に私の求めていたもの。

#### Fabricateに導入してみた

最近作った中で、最も思い入れのあるCakePHPプラグイン`Fabricate`を継続的インテグレーションするため、上記の`FriendsOfCake/travis`を導入してみます。

`Quick Install`に書いてるとおり、以下の手順で進めます。

```sh
cd ~/develop/fabricate

git clone https://github.com/FriendsOfCake/travis.git

export PLUGIN_NAME="Fabricate"

travis/setup.sh

rm -rf travis
```

私がやったときはこの手順ではなかったのですが、最近変わったみたいです…
まぁ細かい事は気にせずですね。

実行すると、以下のファイルが自動生成されます。

- .travis.yml : Travis.ciで継続的インテグレーションを実行するための設定ファイル
- Test/Case/AllFabricateTest.php : プラグインのユニットテストをすべて実行するテストスイート。すでにこの命名規則で生成されていれば作られません。

以前のバージョンでは

- `.editorconfig`
- `.semver`
- `.travis.yml`
- `.AllPluginNameTest.php`
- `composer.json`
- `CONTRIBUTING.markdown`
- `LICENSE.txt`
- `README.markdown`

が生成されていましたが、継続的インテグレーションには必要がないファイルも混在していたので、整理されたものと思います。

後はTravis.ciにサインアップして、リポジトリを追加するだけです。

![](/images/blog/cakephp2_plugin_ci_3.png)

実は、これが最初のビルド。`PLUGIN_NAME`をexportしていなかったので、正しくテストの実行が動いていませんでした。`PLUGIN_NAME`はちゃんとexportするようにした方が良いです。
.travis.ymlの`PLUGIN_NAME`を`Fabricate`に設定して実行した結果が以下の画面です。

![](/images/blog/cakephp2_plugin_ci_4.png)

現在のtravis.gitではPHP5.4以上のようなので、問題ないのですが、当時（と言っても数ヶ月前）はPHP5.3もテスト対象になっていたので、ショートArrayシンタックスを使っている私のコードはテストが失敗していました。.travis,ymlのPHP部分を以下のように変更して

```yml
php:
  - 5.4
  - 5.5
```

pushすると、ビルド結果は以下のようになります。

![](/images/blog/cakephp2_plugin_ci_5.png)

PHPCS以外は成功しています。

PHPCSではCakePHPのコード標準がチェックされます。
CakePHPの標準コードチェックだと厳しい部分だったり、パラメータを変更してチェックさせたくないディレクトリがあったりすると思うので、`PHPCS_ARGS`でphpcsを実行するときのパラメータを上書きできるようになっています。

```yml
matrix:
  include:
    - php: 5.4
      env:
        - COVERALLS=1
    - php: 5.4
      env:
        - PHPCS=1
        - PHPCS_ARGS="-p -s --extensions=php --standard=ruleset.xml --ignore='*/Test/*,*/Vendor/*' ."

```

拡張子phpのファイルを対象とし、TestやVendorのディレクトリを対象外として実行します。
ruleset.xmlは以下のようにしました。

```xml
<ruleset name="Custom Standard">
	<rule ref="CakePHP">
		<exclude name="CakePHP.NamingConventions.ValidVariableName.PrivateNoUnderscore" />
		<exclude name="CakePHP.NamingConventions.ValidFunctionName.PrivateNoUnderscore" />
		<exclude name="CakePHP.NamingConventions.ValidVariableName.ProtectedNoUnderscore" />
		<exclude name="CakePHP.NamingConventions.ValidFunctionName.ProtectedNoUnderscore" />
		<exclude name="CakePHP.NamingConventions.ValidFunctionName.ScopeNotCamelCaps" />
		<exclude name="CakePHP.NamingConventions.ValidVariableName.MemberVarNotCamelCaps" />
		<exclude name="CakePHP.WhiteSpace.TabAndSpace" />
	</rule>
</ruleset>

```

CakePHPのコード標準ではprivateやprotectedの変数、関数の先頭にアンダースコアが求められるので、それを無効にしたのと、キャメルケースではない変数や関数名を使いたい箇所があったので、それを無効にしています。
最後の`CakePHP.WhiteSpace.TabAndSpace`では、以下のように`=`のインデント位置を合わせたコードがエラーになってしまうので、無効にしています（わかりづらいですが、=の位置が揃っています）。

```php
public function __construct($name) {
    $this->name  = $name;
    $this->items = [];
}
```

### どうなっているのか？

プラグインのリポジトリには`.travis.yml`が追加されるぐらいです。
この設定内で、FriendsOfCakeのtravisリポジトリがcloneされ、以下に記述されている手順が実行されます。

```yml
before_script:
  - git clone -b master https://github.com/FriendsOfCake/travis.git --depth 1 ../travis
  - ../travis/before_script.sh

script:
  - ../travis/script.sh

after_success:
  - ../travis/after_success.sh
```

実行されるパターンは.travis.ymlに記述されている`php`と`env-matrix`の組み合わせと、`matrix`のパターンになります。

- PHP5.4, DB=mysql CAKE_VERSION=2.4
- PHP5,4, DB=mysql CAKE_VERSION=2.5
- PHP5.5, DB=mysql CAKE_VERSION=2.4
- PHP5,5, DB=mysql CAKE_VERSION=2.5
- PHP5.4, COVERALLS=1
- PHP5.4, PHPCS=1

この6パターン毎に、`before_script`、`script`、`after_success`が呼び出されます。

#### 事前準備

`before_script.sh`は実行準備のためのスクリプトで、PHPCSが1にセットされている場合は、以下のとおりpearチャンネルからCakePHPのコード標準とphpcsが依存関係としてインストールされます。

```sh
if [ "$PHPCS" = '1' ]; then
	pear channel-discover pear.cakephp.org
	pear install --alldeps cakephp/CakePHP_CodeSniffer
	phpenv rehash
	exit 0
fi
```

続いて、CakePHP本体が1つ親のディレクトリにインストールされます。Travis.ciではプラグインのリポジトリが最初にcloneされるのですが、結果として以下のようなディレクトリ構成となります。

- $HOME/sizuhiko/Fabricate : プラグイン本体
- $HOME/sizuhiko/travis : FriendsOfCakeのtravis.gitクローン先
- $HOME/sizuhiko/cakephp : CakePHP本体
- $HOME/sizuhiko/cakephp/app/Plugin/$PLUGIN_NAME : プラグイン本体がコピーされる先

上記ディレクトリ構成ができた後で、composer で依存関係を解決します。COVERALLS用のカバレッジレポートも生成されるようにファイルが準備されます。

#### 実行

`script.sh`がPHPCSが1の場合はphpcsを、それ以外の場合はユニットテストを実行します。

#### 実行が成功したら

`after_success.sh`がCOVERALLSのカバレッジレポートを生成します。

### そして現在

最初のスクリーンショットがFabricateの現在の状態です。すべて成功しています。

最後にREADMEにバッジを表示させる方法を紹介します。

#### Travis.ciのバッジを表示する

Travis.ciの画面にアクセスして

![](/images/blog/cakephp2_plugin_ci_6.png)

`build:failing`のように表示されている画像をクリックします。

![](/images/blog/cakephp2_plugin_ci_7.png)

ブランチを選択して、表示形式からマークダウンを選択したら、表示内容をREADME.mdに貼り付けます。

#### カバレッジのバッジを表示する

カバレッジは[COVERALLS](https://coveralls.io/)というサービスを使って表示します。

![](/images/blog/cakephp2_plugin_ci_8.png)

サイトにアクセスして、サインアップはGithubのアカウントでできるの簡単です。

![](/images/blog/cakephp2_plugin_ci_9.png)

サインアップ後に、上部のメニュー表示から`REPOS`を選択して、

![](/images/blog/cakephp2_plugin_ci_10.png)

`ADD REPO`をクリックしてリポジトリを追加します。
その後、追加したリポジトリのページを表示します。

![](/images/blog/cakephp2_plugin_ci_11.png)

今度は表示される画像ではなく、`GET BADGE URL`というボタンをクリックします。このあたりのUIは統一されると嬉しいですね...

![](/images/blog/cakephp2_plugin_ci_12.png)

いろいろな記述形式のコードが表示されるのでマークダウンのコードを選択してREADME.mdに貼り付けます。

#### ダウンロード数、バージョンを表示する

ここからはCIとは関係ないのですが、よく見るバッジであるダウンロード数とバージョン番号も表示してみたいと思います。

[Badge Poser](https://poser.pugx.org)というサイトにアクセスします。

![](/images/blog/cakephp2_plugin_ci_13.png)

ダウンロード数やバージョン番号は、Packagistで表示されている情報を画像に変換するので、リポジトリがPackagistに登録されていることが条件となります。
`Show the markdown for your Badges`にダウンロード数を表示したいPackagistのパッケージ名を入力します。

![](/images/blog/cakephp2_plugin_ci_14.png)

表示形式からマークダウンを選択して、コードをREADME.mdに貼り付けます。

### 最後に

CakePHPのプラグインを継続的インテグレーションする方法は、実はとても簡単でした。
これを機に、まだプラグインを継続的インテグレーションしていない`そこのあなた`も、Travis.ciとCOVERALLSを使って継続的インテグレーションをしてみましょう。


