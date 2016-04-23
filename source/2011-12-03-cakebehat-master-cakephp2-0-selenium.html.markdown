---
author: sizuhiko
comments: true
date: 2011-12-03 08:12:14+00:00
slug: cakebehat-master-cakephp2-0-selenium
title: CakeBehat の master を CakePHP2.0 対応に切り替えました。Seleniumによるテストも簡単に。
wordpress_id: 43
categories:
- 未分類
tags:
- Behat
- CakePHP
- Selenium
---

<!-- more -->

## CakeBehat for CakePHP2.0


PHPMatsuri 2011 で完了させた CakePHP2.0 対応ですが、しばらく 2.0 ブランチで開発バージョンとして扱っていたものを最新のCakePHP,Behat,Minkで動作確認してmasterに昇格させました。
  

[https://github.com/sizuhiko/CakeBehat](https://github.com/sizuhiko/CakeBehat)
  



## はじめに


  

CakeBehatはCakePHPからBehatを呼び出してテストするためのプラグインです。CakePHP1.3対応として公開したのが2011年6月投稿です。  

[http://my.opera.com/sizuhiko/blog/2011/06/20/cakephp-behat](http://my.opera.com/sizuhiko/blog/2011/06/20/cakephp-behat)
  

  



## インストール




### 前提事項


  



  1. gitが利用可能なこと
  2. PHPUnitがインストールされていること
  3. CakePHP2.0.xがインストールされていること
  4. MySQLなどデータベースがインストールされていて、テスト用データベースが準備されていること

  



### 導入


  

CakePHPのルートディレクトリへ移動して、以下のコマンドを実行してください。

    
    
    cd plugins
    git clone git@github.com:sizuhiko/CakeBehat.git
    cd ..
    


すると、plugins 配下に CakeBehat のディレクトリができているはずです。CakeBehatプラグインを有効にするためにbootstrapでプラグインの読み込みを行います。  


    
    
    app/Config/bootstrap.phpの最後に追加します。
    ....
    
    CakePlugin::load('CakeBehat');
    


次に、CakeBehatで必要なBehatやMinkをダウンロードし、featues を初期化します。CakePHPのルートディレクトリに移動して、以下のコマンドを実行します。  


    
    
    lib/Cake/Console/cake CakeBehat.init
    


するとCakePHPのルートディレクトリに featues ディレクトリができているはずです。
その他にplugins/CakeBehat/Console/Command の下に behat.phar と mink.phar がダウンロードされます。
  

  



## 環境設定




### Behat/Mink環境設定


  

app/Config/behat.yml がinitコマンドによって生成されています。  

５行目に

    
    
    base_url: http://test.localhost:8888/application-name/
    


という設定があります。これはアプリケーションのルートパスを設定するもので、ホスト名、ポート番号、アプリケーション名などを指定します。ホスト名はできるだけtest環境と識別可能なものにしておく事がオススメです。
  



## 実行する


  

基本的な環境設定は、ここまでで、behatは実行可能な状況になっています。
具体的にサンプルアプリケーションのコードを使っての解説は、以前のPostと同じなので、以下のURLから確認してください。  

[http://my.opera.com/sizuhiko/blog/2011/06/20/cakephp-behat](http://my.opera.com/sizuhiko/blog/2011/06/20/cakephp-behat)
  

ただし実行コマンドがプラグイン化に伴って変更されています。プラグイン名が付いたので、cake behat というシンプルなものからは少し遠くなってしまいましたが、以下のコマンドを実行してください。

    
    
    lib/Cake/Console/cake CakeBehat.bdd
    


  

  



## Ajaxを利用したページをテストしたい


  

最新版のMinkでは、Ajaxを使ったページをテストできるように、ブラウザエンジンを選択することができるようになっています。


  1. GoutteDriver : Ajaxは使えないがライトなブラウザテストが可能
  2. SahiDriver：ブラウザのプロキシ設定が必要だが、様々なブラウザでテストが可能
  3. ZombieDriver：Node.js を使ったブラウザテストが可能
  4. SeleniumDriver：Mink1.2 からサポートされた、お馴染みのSeleniumによるテストが可能

  

公式のBehatやMinkのドキュメントを参照すると、Seleniumなどを使う場合の方法が書いていませんコードを書いて初期化しないといけませんが、Behat+Minkのインテグレーションでは、behat.ymlに設定するだけで簡単にSeleniumによるテストが実行できるようになります。
  



### JavaScriptセッションエンジンを指定する


  

CakeBehatではデフォルトのJavaScriptセッションエンジンをSeleniumとしています。app/Config/behat.yml の 4行目に

    
    
    javascript_session:   selenium
    


設定を入れてあります。まだ試していませんが、sahiやzombieを使う場合はこの設定を変更すれば動作するはずです。
  



### JavaScriptを使ったページをテストしたいシナリオでは


  

@javascript アノテーションをfeatureに指定します。
  

サンプルアプリケーション（blogチュートリアル）のindex.ctpでDeleteボタンがクリックされたときにtrエレメントを消すだけの実装を追加してみました。[app/View/Posts/index.ctp](https://github.com/sizuhiko/CakeBehat/blob/master/sample/app/View/Posts/index.ctp)で

    
    
    <td><a href="javascript:void(0);" onclick="$(this).closest('tr').remove();">Delete<?php echo $index++; ?></a>
    


のようにしました。  

このリンク「Delete3」をクリックして3行目を削除するfeatureを書きます。

    
    
      @javascript
      シナリオ: 記事を削除できること
        前提 "トップページ" を表示している
        かつ "Title strikes back" と表示されていること
        もし "Delete3" のリンク先へ移動する
        ならば "Title strikes back" と表示されていないこと
    


「リンクをクリックする」みたいなステップへ書き換えた方が本当は直感的なのですが、とりあえず「リンク先へ移動する」を使っています。  

後は、Seleniumを実行しておくだけです。

    
    
    java -jar selenium-server-standalone-2.14.0.jar 
    


これだけです。特にSeleniumを使うと意識しなくても、@javascriptを付けたシナリオだけでFirefoxが起動してテストが実行されます。もちろんこのJavaScriptを使ったテストも成功します。
  

  



## さいごに


  

BehatやMinkは少しのバージョンアップ違いでうまく動かないケースがあります。もしCakeBehatを使ってうまく動作しないケースなどはgithubのissueなどに書き込んでいただければ、改善していきたいと思っていますのでよろしくお願いします。




