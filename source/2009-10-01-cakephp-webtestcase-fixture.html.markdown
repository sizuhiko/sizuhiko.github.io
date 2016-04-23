---
author: sizuhiko
comments: true
date: 2009-10-01 11:10:02+00:00
slug: cakephp-webtestcase-fixture
title: CakePHPのWebTestCaseでfixtureを使う
wordpress_id: 28
categories:
- 未分類
tags:
- CakePHP
- fixture
- phpstudy
- WebTestCase
---

<!-- more -->９／３０に行われた[第46回PHP勉強会](http://events.php.gr.jp/events/show/84)で発表した内容ですが、そのままブログで読めるように展開します。


* * *




### 経緯


CakePHPはユニットテスト実行時にテストデータを投入するfixture機能をサポートしています。CakePHPのユニットテストはSimpleTestをベースにしており、UnitTestCaseと、それを継承してWebブラウザ動作のテストを行うWebTestCase、２つのテストケースを持っています。CakeではそれぞれCakeTestCase、CakeWebTestCaseという名前になります。
ただしCakeWebTestCaseはWebTestCaseを継承しているだけで、何も機能拡張をしていません。

cake/tests/lib/cake_web_test_case.php

    
    
    class CakeWebTestCase extends WebTestCase {
    }
    



CakePHPオフィシャルのCookBookでも、以下のように解説されています。


> CakeWebTestCase は、SimpleTest の WebTestCase をただ拡張したもので、特に機能追加はありません。SimpleTest の Web testing に関する文書中に記載がある全ての機能は、 CakeWebTestCase で利用できます。これはまた、 SimpleTest が持つ機能以外のものは使えないことを意味します。すなわち、 CakeWebTestCase においてフィクスチャは利用できず、テストケースにデータベースに対する更新や保存が含まれていた場合、恒久的にデータベースの値が変更されることを意味します。テストの結果は、しばしばデータベースが持つ値に基づくので、テスト手順の一部としてデータベースが期待した値を持つことを確認してください。


しかし実際に開発の場面では、WebTestCaseを使って、ログインからの操作を試したり、データベースに依存した操作・結果を求めなければならない場面に遭遇します。そこで今回はfixutureを使えるようなWebTestCaseを作ってみます。



### 考察


今回fixtureを使えるWebTestCaseを作る上で、考慮したポイントは以下のとおりです。


  1. なるべく書かない
  2. Cakeのバージョンが変わっても簡単に移行したい
  3. いつかは本体に組み込んで欲しい

そこで、今回はUnitTestCaseを継承している、cake_test_case.php を流用して差分のみ別クラスに作成することにしました。こうすると、後でCakeのバージョンが変わったても問題が少ないし、後で本体に組み込んでもらうときもわかりやすいと思ったからです。



### 実施


実施の手順は以下のとおりです。


  1. cake_test_case.php をコピーして、 fixturable_web_base_test_case.php に変更
  2. 上記ファイルの「CakeTest」 部分を 「FixturableWebBaseTest」に変換
  3. FixturableWebBaseTestのスーパークラスをWebTestCaseに変更
  4. FixturableWebTestCase を作成
  5. bootstrap に初期化コードを追加
  6. 実際のテストケースを記述

それぞれの手順を詳細に解説します。


#### 1.cake_test_case.php をコピーして、 fixturable_web_base_test_case.php に変更


まず流用元のテストケースをコピして、継承する元になるクラスを作成します。

    
    
    cd {アプリケーションのHOMEディレクトリ}
    mkdir app/vendors/webtest
    
    cp cake/tests/lib/cake_test_case.php app/vendors/webtest/fixturable_web_base_test_case.php
    




#### 2.上記ファイルの「CakeTest」 部分を 「FixturableWebBaseTest」に変換


これはお使いのエディタを開いて、置換機能を使えばあっという間に完了です。
app/vendors/webtest/ fixturable_web_base_test_case.php を編集してください。


#### 3.FixturableWebBaseTestのスーパークラスをWebTestCaseに変更


このままでは、単にCakeTestCaseの名前を変更しただけなので、そのスーパークラスをUnitTestCaseからWebTestCaseに変更します。

    
    
    class FixturableWebBaseTestCase extends WebTestCase {
        // extends を変更する
    }
    




#### 4.FixturableWebTestCase を作成


手順3でWebTestCaseを使ったCakeTestCaseと似たものができました。ただしこのままではWebアクセス時にfixtureを読み込むようにはできません。
FixturableWebBaseTestを継承したクラスを作成します。このクラスでは、Webテスト中なのか、通常動作中なのかを判定するロジック（CakeTestCaseからの差分）を記述します。
またWebテスト中なのか、そうでないのかを判定するために、以下の方法を検討しました。


  * tmp/tests 以下のファイルで識別する
  * UserAgentを使って識別する
  * HTTP独自ヘッダで識別する

まずUserAgentでテスト中か判断する方法を思いついたのですが、Webテストの場合UserAgentそのものを判断してビューを切り替えたり（特に携帯など）するので、これは方法としては最適ではないと判断し却下。
HTTP独自ヘッダは、やはり通常運用しているときにセキュリティホールを作る事にも繋がるので、微妙なところです。ただし通常（本番）運用する場合はCakeのデバッグレベルを0にして運用すると思うので、独自ヘッダの判定前にデバッグレベルを判定すれば問題ないということも言えます。
そこで今回は、tmp/tests以下にテンポラリファイルを作って判定するという方法を採用しています。
app/vendors/webtest/fixturable_web_test_case.php

    
    
    <?php
    App::import('Vendor', 'webtest' . DS . 'fixturable_web_base_test_case');
    
    /**
     * FixturableWebTestCase class
     */
    class FixturableWebTestCase extends FixturableWebBaseTestCase {
        /**
         * @overwrite 
         */
        function startCase() {
            $this->_lockWebTesting();
        }
        /**
         * @overwrite 
         */
        function endCase() {
            $this->_unlockWebTesting();
        }
        /**
         * bootstrap.php から呼び出す
         */
        function initIfTestMode() {
            if(file_exists(FixturableWebTestCase::_getLockFileName())) {
                parent::_initDb();
                Configure::write('Acl.database', 'test_suite');
            }
        }
        /**
         * TMPファイルを作成して、Webテスト中であることを宣言
         */
        function _lockWebTesting() {
            touch($this->_getLockFileName());
        }
        /**
         * TMPファイルを削除して、Webテスト中でなくす
         */
        function _unlockWebTesting() {
            unlink($this->_getLockFileName());
        }
        function _getLockFileName() {
            return TMP.'tests'.DS.'fixturable.web.test.tmp';
        }
    }
    




#### 5.bootstrap に初期化コードを追加


最後の準備として、bootstrapに初期化コードを追加します。bootstrapはCakePHPで動作するすべてのアクションが必ず通過する最初のポイントなので、ここで利用するデータベースを切り替えるようにします。
app/config/bootstrap.php

    
    
    if(($_SERVER['PHP_SELF'] != '/webroot/test.php') && Configure::read() > 0) {
      if(App::import('Vendor', 'webtest' . DS . 'fixturable_web_test_case')) {
        FixturableWebTestCase::initIfTestMode();
      }
    }
    


bootstrapはテストコードをtest.phpから実行しようとした場合も通過してしまうので、このURLはフィルタする必要があります。また通常運用で呼ばれないようにデバッグ値が０より大きい場合にデータベースの切り替えを実行するようにします。


#### 6.実際のテストケースを記述


これでWebTestCaseでfixtureが使える準備は整いました。後はテストケースを記述するだけです。
今回サンプルとして、私の執筆した「[CakePHPによる実践Webアプリケーション開発](http://www.amazon.co.jp/CakePHP%E3%81%AB%E3%82%88%E3%82%8B%E5%AE%9F%E8%B7%B5Web%E3%82%A2%E3%83%97%E3%83%AA%E3%82%B1%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3%E9%96%8B%E7%99%BA-%E5%AE%89%E8%97%A4-%E7%A5%90%E4%BB%8B/dp/4839930651/ref=sr_1_1?ie=UTF8&s=books&qid=1254396747&sr=1-1)」で作ったCalendarNoteをテストしてみます。


    
    
    <?php 
    App::import('Vendor', 'webtest' . DS . 'fixturable_web_test_case');
    
    class UsersWebTest extends FixturableWebTestCase {
        var $fixtures = array('app.group', 'app.user', 'app.users_group',     'app.schedule', 'app.schedules_user',
            'app.aco', 'app.aro', 'app.aros_aco'
        );
    
        function startTest($method) {
            parent::startTest($method);
            Configure::write('Acl.database', 'test_suite');
            $this->addHeader('Accept-Language:ja');
        }
        function testLoginAndCheckSchedule() {
            $this->assertTrue($this->get('http://calendarnote.localhost/users/login'));
            $this->assertTitle(new PatternExpectation('/CalendarNote/'));
            $this->assertSubmit('Login');
            
            $this->clickSubmit('Login', array(
                'data[User][username]'=>'hide',
                'data[User][password]'=>'password',
            ));
            $this->assertText('Hidetoshi Nakata');
            $this->assertLink('ログアウト');
            
            $this->assertTrue($this->get('http://calendarnote.localhost/schedules/index/month/2009/01'));
            $this->assertText('2008年12月28日');
            $this->assertTrue($this->clickLink('10:00-12:00 Nengashiki'));
    
            $this->assertFieldByName('data[Schedule][title]', 'Nengashiki');
            $this->assertFieldByName('data[Schedule][contents]', 'In Japan, there are the New Year holidays and a New-Year's-greetings ceremony is performed to the first day of work.');
            
        }
        function endTest($method) {
            parent::endTest($method);
            $this->get('http://calendarnote.localhost/users/logout');
        }
    }
    


このテストシナリオは以下のとおりです。


  1. ログイン画面にアクセスできるか検証する
  2. タイトルがCalendarNoteになっているか検証する
  3. ログインボタンが出ているか検証する
  4. ユーザ名hide、パスワードpasswordでログイン（サブミット）する
  5. 次の画面に、フルネームが表示されていて、ログアウトリンクがあるか検証する。
  6. 2009年1月の月単位スケジュール一覧に遷移できることを検証する。
  7. 2008年12月28日という文字列の表示を検証する。
  8. スケジュール詳細へのリンクが表示されることを検証する。
  9. フォームのタイトルに正しい値が入っていることを検証する。
  10. フォームのコンテンツに正しい値が入っていることを検証する。


テストコードに目を向けると、最初にApp::importでテストケースの親クラスを取り込んで、テストケースの親クラスをFixturableWebTestCaseに指定する以外、ほとんど通常のモデルなどのテストコードと書き方は同じだということに気がつくでしょう。特にfixtureの記法に関しては、まったく同じです。
これは「cake_test_case.php をコピーして、 fixturable_web_base_test_case.php に変更」したために、CakeTestCaseと同じ機能が利用できるようになっているのです。
もちろん記述方法が同じなら、実行方法も同じで、[http://localhost/test.php](http://localhost/test.php)のようにブラウザからの実行や、コンソールからの実行なども問題ありません。CakeMateを使ってTextMate上からもテストが実行できます。もちろんコンソールやTextMateなどCLI環境から実行する場合なども、裏でHTTPアクセスするので、Apacheは動作している必要があります。
Webテストで、どのようなブラウザ動作ができるのかは、本家のSimpleTestサイトか、こちらも私が執筆に参加した「[Webアプリケーションテスト手法](http://www.amazon.co.jp/Web%E3%82%A2%E3%83%97%E3%83%AA%E3%82%B1%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3%E3%83%86%E3%82%B9%E3%83%88%E6%89%8B%E6%B3%95-%E6%B0%B4%E9%87%8E-%E8%B2%B4%E6%98%8E/dp/4839924309/ref=sr_1_2?ie=UTF8&s=books&qid=1254396747&sr=1-2)」にて確認してください。


### 最後に


本カスタマイズはPHP5.2.10、CakePHP1.2.5で検証しています。CakePHP1.2系であれば特に問題なく動作すると思いますが、うまく動作しない場合はコメントいただけると助かります。
今後の展開としては、まずこの記事を英語にしてBakeryにアップしたいと思います。
それをきっかけにコア開発者の目にでもとまったら、本体への組み込みなんか検討してくれるかもしれません。
もしかして一度やろうとしてやめたのかもしれないんですけど、Cake祭り(*1)でコア開発者が日本に来るので、直接聞いてみたいなと思います。


* * *


(*1) Cake祭り：昨年はCakePHPカンファレンスとして実施した、イベントの第２回目。今年もコア開発者が日本に来るので要注目のイベントです。今すぐ申し込みへ。
[http://matsuri.cakephp.jp/](http://matsuri.cakephp.jp/)



<div style="width:425px;text-align:left" id="__ss_2102965">
<a style="font:14px Helvetica,Arial,Sans-serif;display:block;margin:12px 0 3px 0;text-decoration:underline;" href="http://www.slideshare.net/kishida4slideshare/cakephpwebtestcasefixture" title="CakePHPのWebTestCaseでfixtureを使う" rel="nofollow">CakePHPのWebTestCaseでfixtureを使う</a><object style="margin:0px" width="425" height="355"><param name="movie" value="http://static.slidesharecdn.com/swf/ssplayer2.swf?doc=php20090930pub-091001050630-phpapp02&amp;stripped_title=cakephpwebtestcasefixture">
<param name="allowFullScreen" value="true">
<param name="allowScriptAccess" value="never">
<embed src="http://static.slidesharecdn.com/swf/ssplayer2.swf?doc=php20090930pub-091001050630-phpapp02&amp;stripped_title=cakephpwebtestcasefixture" type="application/x-shockwave-flash" allowfullscreen="true" width="425" height="355" allowscriptaccess="never"></object><div style="font-size:11px;font-family:tahoma,arial;height:26px;padding-top:2px;">View more <a style="text-decoration:underline;" href="http://www.slideshare.net/" rel="nofollow">documents</a> from <a style="text-decoration:underline;" href="http://www.slideshare.net/kishida4slideshare" rel="nofollow">kishida4slideshare</a>.</div>
</div>
