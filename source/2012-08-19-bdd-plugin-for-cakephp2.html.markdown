---
author: sizuhiko
comments: true
date: 2012-08-19 07:08:15+00:00
slug: bdd-plugin-for-cakephp2
title: BDD Plugin for CakePHP2を公開しました
wordpress_id: 48
categories:
- 未分類
tags:
- BDD
- Behat
- CakePHP
- Spec for PHP
---

<!-- more -->![](/images/blog/bdd.png)   
  
BDD Plugin for CakePHP ([https://github.com/sizuhiko/Bdd](https://github.com/sizuhiko/Bdd)) はCakePHPからRuby on Railsのように2つのBDDフレームワークを実行できるようにするインテグレーション・プラグインです。  
2つのBDDフレームワークは  


  * スペック・フレームワークは Spec for PHP
  * ストーリー・フレームワークは Behat
を利用しています。  
それぞれのフレームワークの特徴は、共に外側のインターフェースを自然言語で記述できることでコミュニケーション・ツールとしての役割を持っています。  
  
BehatをCakePHPから利用するためのプラグインとしてCakeBehatを公開してきました。  
そういう意味で、これはCakeBehatの改良版と言って間違いありません。  
CakeBehatからの進化ポイントは以下のとおりです。  


  * スペックフレームワーク Spec for PHP を実行可能に
  * 依存関係の解決に Composer を利用
  
詳しくは github のREADMEで書いているのですが、英語（あっているか不安がたっぷりですが）で書いてあるので、安心の日本語で解説したいと思います。  
今回はサンプルアプリケーション BddExampleApp ([https://github.com/sizuhiko/BddExampleApp](https://github.com/sizuhiko/BddExampleApp)) に簡単なチュートリアルを書いているので、こちらの流れを中心に説明していきます。  
  


### インストール

  
  


  * CakePHP2 をインストール （2.2以降を推奨）
  * PHPUnit をインストール（pearなどを利用）
  * git cloneを使うかgithubのサイトからサンプルアプリケーションBddExampleAppをCakePHPのルートディレクトリに展開。このとき app, feature, spec ディレクトリが必要になります。
  * テストデータを投入するのにfixture以外の仕組みとして fixture-factory([https://github.com/rodrigorm/fixture-factory](https://github.com/rodrigorm/fixture-factory)) を使っています。リンク先の installation を参考にインストールして欲しいのですが、ディレクトリ名が解決できない問題(?)があるのでvendorsディレクトリをvendorにリネームしてください。  

    
    $ mv app/Plugin/fixture_factory/vendors app/Plugin/fixture_factory/vendor

  * データベースを作成して、テーブルを作成してください。データベースはテスト用、開発用の2つが必要で、その両方に app/Config/sql/posts_ja.sql のSQLを実行してください。
  * 環境設定ファイル app/Config/core.php と database.php を環境に合わせて変更してください。database.phpのデータベース名やログイン、パスワードなどは前項で設定した値に変更してください。またブラウザ経由のテストでテスト用データベースを参照するために test.localhost のようなテスト時のホスト名が必要なので、そのままhostsに設定するか違う名前に変更してください。
  * BDDプラグインをインストールします。CakePHPのプラグインディレクトリ (/plugins) 　に移動して git clone するか、githubのサイトからダウンロードして展開してください。
  * そうすると /plugings/Bdd のようなディレクトリ階層になるので、その /plugings/Bdd に移動してください。Composerをインストールして依存関係を解決します。  

    
    
    curl -s https://getcomposer.org/installer | php
    php composer.phar install --dev
    

  * 最後にbehatが利用するテスト用URLを設定します。app/Config/behat.ymlの設定値はひとまず「base_url:  '[http://test.localhost:8888/bdd/](http://test.localhost:8888/bdd/)'」のようになっているので、実際にインストールしたアクセス可能なURLに変更してください。このときdatabase.phpで設定したテスト用のホスト名になってることが重要です。
  
インストールが完了したら、[http://localhost:8888/bdd/posts/](http://localhost:8888/bdd/posts/) にアクセスして3件のリストが表示されていれば大丈夫です。  
  


### テストを実行してみる

  
  
CakePHPのルートディレクトリに移動して以下のようにコマンドを実行します。behatのテストでseleniumを利用しているので、可能であればコチラ([http://www.phpunit.de/manual/3.6/ja/selenium.html](http://www.phpunit.de/manual/3.6/ja/selenium.html))を参考にseleniumをダウンロードして実行しておいてください。  
  

    
    
    $ lib/Cake/Console/cake Bdd.spec
    
    Welcome to CakePHP v2.x.x Console
    ---------------------------------------------------------------
    App : app
    Path: /your CakePHP root/app/
    ---------------------------------------------------------------
    •••••••••••••••••••••••••••••••••••••••••••••••••
    ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
    ✔ OK ❯ Passed 49 of 49 (0.17s 22Mb)
    ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
    
    $ lib/Cake/Console/cake Bdd.story
    
    Welcome to CakePHP v2.x.x Console
    ---------------------------------------------------------------
    App : app
    Path: /your CakePHP root/app/
    ---------------------------------------------------------------
    Feature:
      In order to tell the masses what's on my mind
      As a user
      I want to read articles on the site
    
      Background:              # /your CakePHP root/features/posts.feature:7
        Given there is a post: # /your CakePHP root/features/steps/posts_step.php:3
          | Title              | Body                          |
          | The title          | This is the post body.        |
          | A title once again | And the post body follows.    |
          | Title strikes back | This is really exciting! Not. |
    
      Scenario: Show articles                 # /your CakePHP root/features/posts.feature:14
        When I am on "TopPage"                # FeatureContext::visit()
        Then I should see "The title"         # FeatureContext::assertPageContainsText()
        And I should see "A title once again" # FeatureContext::assertPageContainsText()
        And I should see "Title strikes back" # FeatureContext::assertPageContainsText()
    
    ....
    

  
  


### スペックフレームワークの使い方

  
  
基本的なコマンドラインのオプションなどはSpec for PHP([https://github.com/drslump/Spec-PHP](https://github.com/drslump/Spec-PHP)) に対して透過的になっていて、意味もPHPUnitと似ている（実際内部はPHPUnitである）ので、感覚は掴みやすいと思います。  
前のコマンド実行例では Bdd.spec にオプションがない状況でしたが、代表的な使い方は以下のとおりです。  
  

    
    
    # デフォルトディレクトリ（spec）にあるspecファイルをすべて実行
    lib/Cake/Console/cake Bdd.spec
    
    # 指定したディレクトリ（spec）にあるspecファイルをすべて実行
    lib/Cake/Console/cake Bdd.spec spec
    
    # 指定したファイルだけを実行
    lib/Cake/Console/cake Bdd.spec spec/post.spec.php
    
    # オプションの詳細を見る
    lib/Cake/Console/cake Bdd.spec --help
    

  
  
スペックファイルの命名ルールは以下のようにspec.phpで終わる3通りです。  


  * post.spec.php
  * post_spec.php
  * PostSpec.php
  


#### モデルをテストする

  
  
  
  
モデルをテストするためにCakeTestCaseを継承したCakeSpecというPHPUnitのテストケースを用意しています。これを classアノテーションで指定します。  
  
あとはフィクスチャですが、これはCake本来のテストで利用するものと同じで、宣言する場所と意味がちょっと変わってきます。  
Cakeのユニットテストでは、テストケースクラスのメンバ変数として$fixuresを宣言するのですが、スペックでは$W（ワールド）インスタンスのfixtures変数にセットします。arrayの書き方は同じです。ただしスペックコードではitブロックの度にfixturesが解決されるのでitの前のbeforeやbefore_eachブロックで書いておけば1ファイル中に何度出て来ても問題ありません。ちょうどloadFixtures()のような動きなのですが、この場合もCakeTestCaseではfixturesにテストケース内で利用するすべてのフィクスチャを書いておく必要がありますが、スペックでは下位階層で利用する分だけでOKです。これはスペックコードのスコープによることろなのですが、これを詳しく知るには、Spec for PHPがどのようにDSLで解釈してPHPコードをPHPUnitに実行させるかを見た方が良いでしょう。  

    
    
    # スペックコードをPHPコードに変換して出力
    $ lib/Cake/Console/Bdd.spec spec/post.spec.php --dump
    

  
  
  
  
Spec for PHP はPHPUnitのTestSuiteとTestCaseを利用しています。このうちitブロックがTestCaseに該当します。その他のdescribe、contextやbeforeはTestSuiteになっています。つまりitブロックで $this 変数を使うと TestCase のインスタンスになります。それ以外のbeforeなどは実際にはTestSuiteにマッピングされるので、実行中のテストケースインスタンスを取得したい場合は DrSlumpSpec::test() を呼び出す事で利用可能になります。このスコープが重要になってくるのが、次のコントローラのテストです。  
  


#### コントローラをテストする

  
  
  
  
コントローラをテストするためにControllerTestCaseを継承したControllerSpecというPHPUnitのテストケースを用意しています。モデルと同様にclassアノテーションで指定します。ControllerTestCaseを継承しているのでもちろんtestAction()が利用可能なのですが、ここで重要になるのが、スコープです。it以外でtestActionはControllerTestCase($this)から呼び出せないので、DrSlumpSpec::test()->testAction のように記述します。fixturesに関してはモデルと同じく下位階層に対して有効になります。  
  


#### Spec for PHPを使いこなすには

  
  
Spec for PHPの評価（マッチング）はHamcrestを利用しているので自然言語で書く事が可能です。私はPHPUnitのassertXXXXXを覚えるよりも直感的で、こう書いたらできそう（実際できる!!）というのが良いと思っています。  
どんな書き方があるかは、サンプルアプリケーションの spec 下に post 以外のテストコードも使い方例として入れてあるので、それを読むとわかるのではないかと思います。  
  


### ストーリーフレームワークを利用する

  
  
こちらもスペックと同じく基本的なコマンドラインのオプションなどはBehat([http://behat.org/](http://behat.org/)) に対して透過的になっているので、詳しくは公式のドキュメントかhelpで見るのが良いでしょう。  
先のコマンド実行例では Bdd.stoy にオプションがない状況でしたが、代表的な使い方は以下のとおりです。  
  

    
    
    # デフォルトディレクトリ（features）にあるfeatureファイルをすべて実行
    lib/Cake/Console/cake Bdd.story
    
    # 指定されたfeatureファイルを実行
    lib/Cake/Console/cake Bdd.story features/posts_ja.feature
    
    # より詳しいヘルプを見る
    lib/Cake/Console/cake Bdd.story --help
    

  
  
これ以外に関していえばCakeBehatと基本的な仕組みは変わっていません。  
  


#### フィーチャーを書く

  
  
公式ドキュメントの "Define your Feature in Quick Intro to Behat" : [http://docs.behat.org/quick_intro.html#define-your-feature](http://docs.behat.org/quick_intro.html#define-your-feature) を見ると良いかな....（手抜きですみません）  
  
実際のサンプルには日本語記述も入っています。  
  
  


#### ステップを書く

  
  
これも公式ドキュメント(See "Writing your Step definitions in Quick Intro to Behat" : [http://docs.behat.org/quick_intro.html#writing-your-step-definitions](http://docs.behat.org/quick_intro.html#writing-your-step-definitions))を読むといいね、ってことなんですが、Behatのドキュメントで最初に出会えるステップの書き方は、FeatureContextにステップを追加していく書き方です。これだと独自ステップが少ないうちは良いのですが、増えて来たら分割するのか、どういう単位で分割するのか、そのままビッククラスにするのか...という分岐点にたたされます。  
それぐらいなら最初から分けておこうということで、例えばフィーチャの単位であったり自分たちで決めたルールでステップファイルを分割できる方式にしておきましょう。Behatではクロージャ定義も可能なので [http://docs.behat.org/guides/5.closures.html](http://docs.behat.org/guides/5.closures.html) の書き方に従って書いてみましょう。サンプルアプリケーションもこの流れに沿っています。  
基本的にステップをstepディレクトリ以下に書くようにすることで、FeatureContextを弄る必要はなくなるはずで、将来プラグインのバージョンが上がってFeatureContextが書き変わっても問題はおきません。  
  


#### CakePHPとの関係

  
  
まぁこのままだとただのBehatなので、プラグインは何をしてくれるの？というとCakeBehatと同じくapp/Config/database.phpの設定を元にテストデータを投入するためのインターフェースを用意しています。まぁそれだけなんですが（それを言うとスペックもアノテーション部分ぐらいしか.... ）  
  
  
  
先の日本語フィーチャでテストデータを登録するステップで、以下の2つのCakePHP連携APIが利用可能です。  


  * truncateModel(モデル名) : 指定されたモデル名のテストデータを削除します
  * getModel(モデル名) : テストデータを登録するモデルのインスタンスを取得します（ClassRegistory::init(モデル名)と同じです）
  
テストデータは自動で削除されないので、このように必要なタイミングにてtruncateModelを呼び出すようにしてください。  
  


#### ちょっと便利な機能

  
  
Behatは表面的には「前提 "トップページ" を表示している」のように表示するページを指定する場合はURLを書くようにガイドされています。しかし内部的には別名をURLに置き換える事も可能なので、BDDプラグインでは features/support/env.php にページ別名を書けるようにしています。この方がフィーチャファイルの可読性があがると覆います。  
  


### 今後の展開

  
  
このプラグインを使ったBDDについてCakeFest2012の30分枠で話します。  
その後、CakeBehatは完全にこちらへ移行となり（マイグレーションもそれほど難しくないと思う）ます。  
Spec for PHPについては、私のdevelopブランチを利用しています。こちらは本家にはない機能（subjectもその1つ）を実装していたりします（そのうちPRするかも）。  
Behat/Minkについても日本語問題をチェックしていたりしますので、統合的にメンテしていきたいと思っています。  
また、これらで発生した問題についてもgithubのissueに日本語で構わないので指摘していただければと思います。  
  
  
  

