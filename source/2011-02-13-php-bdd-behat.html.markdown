---
author: sizuhiko
comments: true
date: 2011-02-13 02:02:18+00:00
slug: php-bdd-behat
title: PHPのBDDフレームワーク Behat について発表してきました
wordpress_id: 34
categories:
- 未分類
tags:
- BDD
- Behat
- PHP
---

<!-- more -->

### 第55回PHP勉強会＠関東で発表してきました


2011/2/10にPHP勉強会が約半年ぶりに開催されました。以前、発表するぜーと公言していたので、今回は万全を期してと思いきや最近の多忙に負けそうになりました。が、前日（というか当日朝４時）までバタバタしながら準備してました。。。  

  

今回は昨年のPHP祭りで日本語ハックしたBehatの入門編です。あのときはLTという形であまり詳細に触れられなかったので、30分という時間ですが実際に１からやってみました。
ここでは実際に「やってみよう」で実践した手順について解説します。  

  



### はじめに


スライドの「1. インストール」でも書いていますが、まずBehat本体をインストールしてください。私がforkした日本語対応版をcloneすると「3. 日本語環境」の部分をスキップできます。
「2. テスト環境」に関しては、今回behat_webstepsを流用しました。それ以外にもGoutte-for-Behat（[https://github.com/ThePixelDeveloper/Goutte-for-Behat](https://github.com/ThePixelDeveloper/Goutte-for-Behat)）というものもあります。どちらもHTMLクライアントのエンジンとして「Goutte」を使っています。前者はgoutte.pharが含まれていますが、後者は含まれていないので別途Goutteをcloneする必要があります。ただ後者の方がstepsのコードは流用しやすいかもしれません。  

  



### 準備しよう


まず初期状態のディレクトリを以下のようにしました。

    
    
    |-- Behat Behat本体のclone
    |-- behat_websteps behat_webstepsのclone
    


  



### 練習環境を作る


behat_webstepsを土台にして、テスト環境を作ります。といっても、まずは単にコピーするだけです。

    
    
    cp -R behat_websteps sandbox
    


  



### フィーチャーファイルを作成する


スライドでも引用したgihyo.jpでのcucumberについてとてもわかりやすい連載「[第22回　Railsアプリの受け入れテストをCucumberで書こう](http://gihyo.jp/dev/serial/01/ruby/0022)」のフィーチャーを使用します。  


    
    
    vi sandbox/features/sample.feature
    


実際のコードは以下のとおりです。

    
    
    # language: ja
    フィーチャ: ユーザを管理したい
    
      シナリオ: ユーザの登録
        前提 "ユーザ登録"ページを表示している
        もし "email"に"example@example.com"と入力する
        かつ "name"に"赤松 祐希"と入力する
        かつ "age"に"22"と入力する
        かつ "Create"ボタンをクリックする
        ならば "User was successfully created."と表示されていること
        かつ "example@example.com"と表示されていること
        かつ "赤松 祐希"と表示されていること
        かつ "22"と表示されていること
    


ここでcucumberと違うのは1行目（フェーチャの前）に言語指定をするところです。現時点のBehatではこれを書く事でja.xmlを利用してくれます。
  



### 実行してみる


フィーチャーはbin/behatコマンドでテストします。

    
    
    bash-3.2$ Behat/bin/behat sandbox/features/sample.feature 
    


画面には、以下のように出力されます。

    
    <code>
    フィーチャ: ユーザを管理したい
    
      シナリオ: ユーザの登録                                     # features/sample.feature:4
    
    <span style="color: goldenrod">
        前提 "ユーザ登録"ページを表示している
        もし "email"に"example@example.com"と入力する
        かつ "name"に"赤松 祐希"と入力する
        かつ "age"に"22"と入力する
        かつ "Create"ボタンをクリックする
        ならば "User was successfully created."と表示されていること
        かつ "example@example.com"と表示されていること
        かつ "赤松 祐希"と表示されていること
        かつ "22"と表示されていること
    </span>
    1 scenario (<span style="color: goldenrod">1 undefined</span>)
    9 steps (<span style="color: goldenrod">9 undefined</span>)
    0.123s
    <span style="color: goldenrod">
    You can implement step definitions for undefined steps with these snippets:
    
    $steps->前提('/^"([^"]*)"ページを表示している$/', function($world, $arg1) {
        throw new EverzetBehatExceptionPending();
    });
    
    $steps->もし('/^"([^"]*)"に"([^"]*)"と入力する$/', function($world, $arg1, $arg2) {
        throw new EverzetBehatExceptionPending();
    });
    
    $steps->かつ('/^"([^"]*)"ボタンをクリックする$/', function($world, $arg1) {
        throw new EverzetBehatExceptionPending();
    });
    
    $steps->ならば('/^"([^"]*)"と表示されていること$/', function($world, $arg1) {
        throw new EverzetBehatExceptionPending();
    });
    </span>
    </code>


  

ステップ（テストの定義）が記述されていないので、9つの未定義エラーが表示されています。その下にはスケルトンが表示されているので、まずこれをコピペしてstepファイルを作成します。



### ステップファイルの作成


stepファイル「web_test_step.php」に前節のスケルトンを貼付けます。以下のようになるでしょう。

    
    
    <?php
    
    $steps->前提('/^"([^"]*)"ページを表示している$/', function($world, $arg1) {
        throw new EverzetBehatExceptionPending();
    });
    
    $steps->もし('/^"([^"]*)"に"([^"]*)"と入力する$/', function($world, $arg1, $arg2) {
        throw new EverzetBehatExceptionPending();
    });
    
    $steps->かつ('/^"([^"]*)"ボタンをクリックする$/', function($world, $arg1) {
        throw new EverzetBehatExceptionPending();
    });
    
    $steps->ならば('/^"([^"]*)"と表示されていること$/', function($world, $arg1) {
        throw new EverzetBehatExceptionPending();
    });
    


  

また実行してみましょう。

    
    <code>
    bash-3.2$ Behat/bin/behat sandbox/features/sample.feature 
    フィーチャ: ユーザを管理したい
    
      シナリオ: ユーザの登録                                     # features/sample.feature:4
    
    <span style="color: goldenrod">
        前提 "ユーザ登録"ページを表示している                           # features/steps/web_test_step.php:5
          TODO: write pending definition
    </span><span style="color: skyblue">
        もし "email"に"example@example.com"と入力する          # features/steps/web_test_step.php:9
        ...（** 省略 **）
    </span>
    
    1 scenario (<span style="color: goldenrod">1 pending</span>)
    9 steps (<span style="color: skyblue">8 skipped</span>, <span style="color: goldenrod">1 pending</span>)
    0.089s
    </code>


未定義（undefined）から、ペンディングに変わりましたね。これは貼付けたコードが現時点でPending例外を投げているためです。
  



### ステップを記述する


ステップの中身はbehat_webstepsのcommon.phpを流用しました。

    
    
    <?php
    
    $steps->前提('/^"([^"]*)"ページを表示している$/', function($world, $page) {
      $page = $world->__getPath($page);
    
      $world->client->request('GET', $page);
      $world->__getClientProperties();
    });
    
    $steps->もし('/^"([^"]*)"に"([^"]*)"と入力する$/', function($world, $field, $value) {
      assertNotNull($world->page,"No webpage loaded");
      $form = $world->__getForm('Create');
      $form[$field]->setValue($value);
    });
    
    $steps->かつ('/^"([^"]*)"ボタンをクリックする$/', function($world, $button) {
      assertNotNull($world->page,"No webpage loaded");
      $form = $world->__getForm('Create');
      $world->client->submit($form);
      $world->__getClientProperties();
    });
    
    $steps->ならば('/^"([^"]*)"と表示されていること$/', function($world, $text) {
      assertNotNull($world->page,"No webpage loaded");
      assertContains($text,$world->output);
    });
    


  

実行してみましょう。

    
    <code>
    bash-3.2$ Behat/bin/behat sandbox/features/sample.feature 
    フィーチャ: ユーザを管理したい
    
      シナリオ: ユーザの登録                                     # features/sample.feature:4
    
    <span style="color: firebrick">    前提 "ユーザ登録"ページを表示している                           # features/steps/web_test_step.php:8
          Unknown path 'ユーザ登録'. You can define it in [features_folder]/support/paths.php
          Failed asserting that an array has the key <string:ユーザ登録>.
    </span><span style="color: skyblue">    もし "email"に"example@example.com"と入力する          # features/steps/web_test_step.php:14
        ...（** 省略 **）
    </span>
    
    1 scenario (<span style="color: firebrick">1 failed</span>)
    9 steps (<span style="color: skyblue">8 skipped</span>), <span style="color: firebrick">1 failed</span>)
    0.355s
    </code>


  

すると「ユーザ登録」なんてURLは見つからないというエラーになります。まぁそうですね。URLに関しては画面名と実際のhttpリクエストするURLを関連づけておく必要があります。これはgoutte以外のHTTPクライアントを使っても同じことです。ベースとしたbehat_webstepsではsupport/paths.phpにそのマッピングを書くようにしていますので、追加します。

    
    
    <?php
    $world->paths = array();
    $world->paths['ユーザ登録'] = "http://localhost/user_regist.php";
    


  



### テストを失敗させる


ここまでで、初期段階の準備は完了です。ではまたテストを実行してみましょう。

    
    <code>
    bash-3.2$ Behat/bin/behat sandbox/features/sample.feature 
    フィーチャ: ユーザを管理したい
    
      シナリオ: ユーザの登録                                     # features/sample.feature:4
    
        <span style="color: green">前提 "ユーザ登録"ページを表示している                           # features/steps/web_test_step.php:8</span>
        <span style="color: firebrick">もし "email"に"example@example.com"と入力する          # features/steps/web_test_step.php:14
          The current node list is empty.</span>
        <span style="color: skyblue">...（** 省略 **）</span>
    
    1 scenario (<span style="color: firebrick">1 failed</span>)
    9 steps (<span style="color: green">1 passed</span>, <span style="color: skyblue">7 skipped</span>, <span style="color: firebrick">1 failed</span>)
    0.114s
    </code>


  

テストを実行してみると、最初に入力フォームに値をセットしようとするところで失敗します。まだユーザ登録画面を表示するプログラムはありません。  

それでは実際に動作するコードを書いてみましょう。  



### 実装する


ここではあくまでテストを通過させる簡単なコードを書いてみます。画面の入力フォームから入力された値を表示するuser_regist.phpを書いてみましょう。

    
    
    <!DOCTYPE html>
    <html>
        <head>
          <title>ユーザ登録</title>
        </head>
        <body>
            <div><?
                if ($_POST["submit"]) {
                    echo "User was successfully created.". "<br />";
                    echo "name = "     . $_POST['name']  . "<br />";
                    echo "e-mail = "   . $_POST['email'] . "<br />";
                    echo "age = "      . $_POST['age']   . "<br />";
                }
            ?></div>
            <form method="post" action="user_regist.php">
                <div>
                    <label>名前:</label><input type="text" name="name" value="">
                </div>
                <div>
                    <label>e-mail:</label><input type="text" name="email" value="">
                </div>
                <div>
                    <label>年齢:</label><input type="text" name="age" value="">
                </div>
                <div>
                    <input type="submit" name="submit" value="Create">
                </div>
            </form>
        </body>
    </html>
    


※まぁなんとも安直なコードですが、ご勘弁を・・・
  
  

作成したファイルをドキュメントルートに設置してテストを実行しましょう。

    
    <code>
    bash-3.2$ Behat/bin/behat sandbox/features/sample.feature 
    フィーチャ: ユーザを管理したい
    
      シナリオ: ユーザの登録                                     # features/sample.feature:4
    
    <span style="color: green">    前提 "ユーザ登録"ページを表示している                           # features/steps/web_test_step.php:8
        もし "email"に"example@example.com"と入力する          # features/steps/web_test_step.php:14
        かつ "name"に"赤松 祐希"と入力する                         # features/steps/web_test_step.php:14
        かつ "age"に"22"と入力する                             # features/steps/web_test_step.php:14
        かつ "Create"ボタンをクリックする                          # features/steps/web_test_step.php:21
        ならば "User was successfully created."と表示されていること # features/steps/web_test_step.php:26
        かつ "example@example.com"と表示されていること             # features/steps/web_test_step.php:26
        かつ "赤松 祐希"と表示されていること                           # features/steps/web_test_step.php:26
        かつ "22"と表示されていること                              # features/steps/web_test_step.php:26
    </span>
    1 scenario (<span style="color: green">1 passed</span>)
    9 steps (<span style="color: green">9 passed</span>)
    0.389s
    </code>


やったー、グリーンでテスト成功です。  

  



### さいごに


今回はbehat_webstepsをベースにしましたが、HTTPクライアントは何でも大丈夫です。今回goutteでしたが、BehatはPHPUnitを使うのでPHPUnitのPHPUnit_Extensions_SeleniumTestCaseを使うのも１つでしょう。Javascriptが使われているサイトなどでは、こちらの選択になりますね。  

大事なことはアジャイルでドキュメントを書く事と、無駄なドキュメントでなく実行可能なドキュメントである、ということですね。プレーンテキストなのでプログラマじゃなくても、お客さんでも読めるし、書いてもらう事も可能かもしれません。打ち合わせでフィーチャファイルを議事録的に書きながら進めることもできると思います。  

今後の展開としては、一般的なwebstepに関してはgoutteを使った日本語版を、私のgithubアカウントで公開予定です。4/2のPHPカンファレンス関西までには公開して何かしゃべりたいなーと思っていますが、ちょっとテーマと違うか。。LT狙いで何か。。  

Behat RC1も期待して待ちましょう！！  




<div style="width:425px" id="__ss_6907127">
<strong style="display:block;margin:12px 0 4px"><a href="http://www.slideshare.net/kishida4slideshare/behat" title="Behat入門" rel="nofollow">Behat入門</a></strong><object id="__sse6907127" width="425" height="355"><param name="movie" value="http://static.slidesharecdn.com/swf/ssplayer2.swf?doc=phpstudy201102-110212212213-phpapp02&amp;stripped_title=behat&amp;userName=kishida4slideshare">
<param name="allowFullScreen" value="true">
<param name="allowScriptAccess" value="never">
<embed name="__sse6907127" src="http://static.slidesharecdn.com/swf/ssplayer2.swf?doc=phpstudy201102-110212212213-phpapp02&amp;stripped_title=behat&amp;userName=kishida4slideshare" type="application/x-shockwave-flash" allowfullscreen="true" width="425" height="355" allowscriptaccess="never"></object><div style="padding:5px 0 12px">View more <a href="http://www.slideshare.net/" rel="nofollow">presentations</a> from <a href="http://www.slideshare.net/kishida4slideshare" rel="nofollow">kishida4slideshare</a>.</div>
</div>

  
  

懇親会でも話題になったのですが、PHPSpecはどこへ行ってしまったのか・・・  

それと、pharファイルが使えないよ！という方（当日朝3時までのオレ）、は[こちらの「Pharは便利だけど `--enalbe-zend-multibyte`が有効だと文字化けしてしまう」](http://d.hatena.ne.jp/brtRiver/20101029/1288342181)を参考にしてください！！



