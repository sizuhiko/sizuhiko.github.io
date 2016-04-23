---
author: sizuhiko
comments: true
date: 2011-06-20 16:06:54+00:00
slug: cakephp-behat
title: CakePHPアプリケーションをBehatでテストする
wordpress_id: 37
categories:
- 未分類
tags:
- BDD
- Behat
- CakePHP
---

<!-- more -->

## はじめに


Behatとは、Ruby on Railsでは有名なBDDフレームワークcucumberのPHP版クローンです。以前私が発表した資料が過去記事にありますので、詳しくはそちらを参照ください。  

利点は、顧客が理解できるシナリオを自然言語（つまり日本語）で記述し、それ自体がテスト実行可能であるということです。  

今までCakePHPアプリケーションのテストは単体テストではSimpleTest、ブラウザベースのテストはSeleniumを使うことが多かったと思いますが、これからはBehat/Minkによってテストの幅が広がるでしょう。  

しかし、BehatはSymfonyベースで、これまでCakePHPのアプリケーションを実行するためのプラグインなどは準備されてきませんでした。そこで、「rake cucumber」に習い「cake behat」として実行できるシェルタスクを用意しました。  

それが「CakeBehat」シェルです。  

[https://github.com/sizuhiko/CakeBehat](https://github.com/sizuhiko/CakeBehat)
  

  



## インストール




### 前提事項


  



  1. gitが利用可能なこと
  2. PHPUnitがインストールされていること
  3. CakePHPがインストールされていること
  4. MySQLなどデータベースがインストールされていて、テスト用データベースが準備されていること

  



### 導入


  

CakePHPのvendorsディレクトリへ移動して、以下のコマンドを実行してください。

    
    
    git clone git@github.com:sizuhiko/CakeBehat.git
    git clone git://github.com/Behat/Behat.git && cd Behat
    git submodule update --init
    cd ..
    git clone git://github.com/Behat/Mink.git && cd Mink
    git submodule update --init
    


すると、vendors 配下に CakeBehat, Behat, Mink の３つのディレクトリができているはずです。  

  

次に、CakeBehat/vendors/shells から behat.php と behat.yml.default を CakePHPのvendors直下へコピーします。  

すると、vendors直下には、behat.php, behat.yml.default, CakeBehat, Behat, Minkがあるはずです。  

続いて、CakeBehat/features を CakePHPのappやcakeと同じディレクトリ階層にコピーします。  

初期導入は以上で終了です。
  

  



## 環境設定




### Behat/Mink環境設定


  

vendors直下にコピーしたbehat.yml.defaultをbehat.ymlにコピーします。  

４行目に

    
          start_url: http://test.localhost:8888/application-name/


という設定があります。これはアプリケーションのルートパスを設定するもので、ホスト名、ポート番号、アプリケーション名などを指定します。ホスト名はできるだけtest環境と識別可能なものにしておく事がオススメです。
  



## これでおわり？


  

基本的な環境設定は、ここまでで、behatは実行可能な状況になっています。では具体的にサンプルアプリケーションのコードを使って解説します。
  

  



## サンプルアプリケーション（ブログ）


CakeBahet/sample の中にCookBookの「[CakePHPブログチュートリアル](http://book.cakephp.org/ja/view/1528/CakePHP%E3%83%96%E3%83%AD%E3%82%B0%E3%83%81%E3%83%A5%E3%83%BC%E3%83%88%E3%83%AA%E3%82%A2%E3%83%AB)」の初期状態（Postの一覧と詳細だけ）のコードを準備しました。  

  

![](/images/blog/images/cakebehat/index.png)![](/images/blog/images/cakebehat/show.png)
  



### データベースの切り替え


config/database.phpはそのまま生成すると$defaultがあります。UnitTestを実施する場合などは$testを作成していることもあるでしょう。Behat/Minkはブラウザアクセスで実行されるので、工夫が必要になります。またテストデータの投入で$testを参照するので、必ず定義が必要になります。
そこで Bakery の「Easy peasy database config」にも書いてるように、環境によってデータベース設定が切り替えられるように対応します。  

このサンプルでは、アクセスされたサーバ名を基準に切り替えるようにしており、test.localhost なら test用データベース、それ以外ならdevelopment用データベースを利用するようにしています。  

hostsファイルに 127.0.0.1 localhost, test.localhost としておけば、test.localhostでアクセス可能になるでしょう。簡単ですね。  

  



### テストシナリオの記述


Behatのシナリオ記述は基本的にcucumberと同じです。もし基本的な記述方法がわからない場合は、[達人出版社「はじめる！ Cucumber」](http://tatsu-zine.com/books/cuke)を読むと良いと思います。  

ブログチュートリアルの一覧表示と、詳細表示のテストとして、以下のようなシナリオを書きました。

    
    
    sample/features/posts.features
    
    # language: ja
    フィーチャ: ブログの記事を閲覧した
      なぜならブログの記事を閲覧することで、最新の情報を入手したいからだ
    
      背景:
        前提 ブログ記事に以下の内容が登録されていること:
          | タイトル | 本文 |
          | タイトル | これは、記事の本文です。 |
          | またタイトル | そこに本文が続きます。 |
          | Title strikes back | こりゃ本当にわくわくする！うそ。 |
    
      シナリオ: 記事一覧を閲覧できること
        前提 トップページ を表示している
        ならば "タイトル" と表示されていること
        かつ "またタイトル" と表示されていること
        かつ "Title strikes back" と表示されていること
    
      シナリオ: 記事の本文を閲覧できること
        前提 トップページ を表示している
        かつ "またタイトル" のリンク先へ移動する
        ならば "そこに本文が続きます" と表示されていること
    


どうですか？最低限の決まりがあるように見えますが、普通のドキュメントとして読む事も可能ですよね？少なくともプログラマでなければ読めないSeleniumのようなテストコードとは違うと思います。これがBehatの特徴でもあります。
  



#### Hint


Behat/Minkでどんなステップ記述が利用可能かどうかは、

    
    cake/console/cake behat --steps --lang ja


のように実行すると一覧表示されます。
  



### テストデータの登録


サンプルでは「ブログ記事に以下の内容が登録されていること:」のように記述しました。これは最初から用意されているものではなく、独自に定義する必要があるステップです。ステップは features/steps の下に phpファイルを作成すれば自動的に読み込まれ、利用可能になります。

    
    
    sample/features/steps/posts_step.php
    
    $steps->Given('/^ブログ記事に以下の内容が登録されていること:$/', function($world, $table) {
      $hash = $table->getHash();
      $world->truncateModel('Post');
      $post = $world->getModel('Post');
      foreach ($hash as $row) {
    	$post->create(array('Post'=>array('title'=>$row['タイトル'], 'body'=>$row['本文'])));
    	$post->save();
      }
    });
    


ステップの雛形自体は、ステップが存在しないときにBehatを実行すると、以下のように画面表示されるので、そのままコピペして作成すると簡単です。![](/images/blog/images/cakebehat/notimplement.png)

CakeBehatではテストデータを登録するのが容易になるように、Modelを取得できるようにしています。またテストデータを消去するためにtruncateできる仕組みも用意しました。


  1. データの削除：$world->truncateModel('Post');
  2. モデルの取得：$post = $world->getModel('Post');

後は、AAで書いた表をそのまま利用できる（１行目が自動的にタイトル行として解釈されています）ので Model->createとModel->saveを利用すれば、いつものCakePHPの感覚でデータを登録できるはずです。
データベースは自動的に$testで定義された宛先に接続するようになっています。  

  



### 実行してみよう


cakeやappのディレクトリに移動して、以下のコマンドを実行します。

    
    cake/console/cake behat


  
![](/images/blog/images/cakebehat/success.png)
  

  



## さいごに


基本的なアプリケーションであれば、テスト可能な状況になっていると思います。  

何かあれば、CakeBehatをforkしてアップデートに参加してもらえればと思います。  

現時点で気になっているのは、


  1. モデルの初期化を shells/behat.php の _loadModels() で実行しているのですが、App::objects('model')でモデルの一覧を取得しているので、プラグインのModelまで初期化できていません。ここで初期化する理由は、Shell(CakePHP) -> Behat(Symfony) -> CakePHPのように呼び出されると、初期化されていないモデルが利用できないので、事前に全てClassRegistry::initしておくことで、この問題を回避しています。プラグイン内のモデルを使う場合は、この記述を変更して、プラグインのモデルも利用可能にする必要があります。
  2. テストデータの削除を明示的にtruncateModelしないといけない。本来は features/support/hook.php のフックポイントでtruncateModelを呼び出せるように仕込んでおきたかったのですが、フックポイントから呼び出すとSTRICTエラーが出てしまい、うまく動作しません。ということから、データ投入ステップで一度データを削除するように記述しています。
  3. GithubのReadmeとWikiがまだ未着手で。。

といったところです。
  

  

このネタで、CakeFestに応募しようと思うのですが、後9日か。。。
