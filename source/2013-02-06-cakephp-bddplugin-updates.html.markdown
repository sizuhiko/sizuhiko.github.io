---
author: sizuhiko
comments: true
date: 2013-02-06 08:02:04+00:00
slug: cakephp-bddplugin-updates
title: CakePHP BddPlugin updates
wordpress_id: 52
categories:
- 未分類
tags:
- BddPlugin
- Behat
- CakePHP
- PHP
- Spec
---

<!-- more -->

### v0.9.2リリース


  

CakePHPのBddプラグインも少しずつ浸透し、国内外より利用者様の声が届いて、いくつか不具合＆機能改善などを取り込んできました。  

本日リリースしたv0.9.2としては、数回にわたり[@kaz_29](http://twitter.com/kaz_29)さんと、もくもく会を重ねた結果が入っています。  

  



  * selenium2 webdriver対応（これは0.9.1.xで対応済みでしたが）
  * spec(単体テスト)でコードカバレッジを出力できるようにした
  * story(Behat)のステップ翻訳ファイルを置き換えられるようにした
  * プラグイン内のコードインデントを4tabに統一

  



#### 0.9.2よりちょっと前の改修について


  

v0.9.1においては、Authコンポーネントを利用した場合にうまく動作しないというポレートを海外から受けました。  

これはAuthの問題というよりも、Authでログインした結果リダイレクトが動くので、リダイレクト先が正しいか検証したい、ということでした。  

これはBehat&Mink側の問題だけど、使ってくれているのでMLとか漁ったところ、goutte&guzzleではパラメータを指定しろ、という変更が入っていることがわかり、behat.yml.defaultに以下の設定を追加しました。


    
    
          goutte:
            guzzle_parameters:
              request.params:
                redirect.disable: true
    



その上で、サンプルアプリにAuthのケースを追加し、動作検証後にリリース。質問者に返信を打ってIssueをCloseしました。  

リダイレクトURLを検証する方法としては、以下のサンプルシナリオのようになります。


    
    
      シナリオ: 記事を追加できること
        前提 "トップページ" を表示している
        もし "追加" のリンク先へ移動する
        かつ "bob"、"obo"でログインする
        かつ I do not follow redirects
        かつ 記事投稿フォームに以下の内容を登録すること:
          | ラベル  | 値                |
          | タイトル | 今日は歓送迎会      |
          | 本文    | 19:30からせかいいち |
        かつ "投稿" ボタンをクリックする
        もし I should be redirected to "/posts"
        ならば "今日は歓送迎会" と表示されていること
    





  * I do not follow redirects と宣言することで、リダイレクトがHTTPヘッダに入っていても自動ではリダクレクとしなくなります（redirect.disable: trueが有効になる）。
  * 「"投稿" ボタンをクリックする」の後で一覧画面にリダイレクトされるので、I should be redirected to "/posts" のように指定したURLにリダイレクトしようとしているか検証します。検証結果が正しければ、そのURLに遷移してテストが継続します。


つまり自動リダイレクトをOFFにして、検証が成功したら遷移して継続という流れです。  
日本語のステップにはなっていませんが、必要であれば独自のステップ定義を作っていただき、そこから英語ステップを呼び出すという方式でもできると思います。ただ、ここまでテクニカルというか内部動作をシナリオに書くのはユーザーストーリーとしては微妙だと思うので、ステップ定義内で使えるステップぐらいの認識で利用していただければと思います。サンプルアプリのストーリーは、問い合わせのあった形式に合わせているので、そこはあまり意識されていません。
  

  



#### 0.9.2ハイライト


  



##### コードカバレッジ


  

みんな大好きJenkinsなどでCI環境を作ってコードカバレッジなどを計測している現場では、PHPUnitではカバレッジレポートが出せるのに、BddPluginでは出ないのはアレだよね、ということで対応しました。

    
    
    lib/Cake/Console/cake Bdd.spec --coverage-html report
    


でコードカバレッジを出力できるようになっています。


  * 出力できるレポートはPHPUnitがサポートしている coverage-html, coverage-clover, coverage-php, coverage-textの4つです。
  * カバレッジ対象のディレクトリは app 以下です（ただしapp/Pluginおよびapp/Vendor, app/Testは対象外です）。

Bdd.story側はseleniumとの兼ね合いがあって単純ではないので、shin1x1さんの「[コードカバレッジ測定ツールPHP_CodeCoverageをCakePHPで使ってみた](http://www.1x1.jp/blog/2011/06/php_codecoverage_cakephp.html)」を参照にすると良いかなと思います。細かいコードの利用方法などはPHPUnitのバージョンによって微妙に異なるのでPHPUnitの公式ドキュメントを一度確認した方が良いと思います。  

CakePHP2.3からはPHP5.4のサーバ機能が動くのでそれを絡めるとカバレッジレポートが取りやすくなるのかな？などと思ったりしておりますが。。。
  

  



##### mink-extensionのi18nステップファイルの置き換えを可能に


  

Behat&MinkをBddPluginから利用する場合、シナリオに「前提 "トップページ" を表示している」のように書けたりするわけですが、これらはすべてmink-extensionのi18n機構で翻訳されています。例えばこのステップは

    
    
            <trans-unit id="i-go-to-page">
                <source><![CDATA[/^(?:|I )go to "(?P<page>[^"]+)"$/]]></source>
                <target><![CDATA[/^(?:|ユーザーが )"(?P<page>[^s]+)" へ移動する$/]]></target>
            </trans-unit>
    


というxmlで変換定義されているのですが、見て分かる通り正規表現です。PHPで正規表現、それに日本語というと、まぁ考慮しないといけませんね。preg_match にUTF-8オプションを付けないと「s」が変なところでマッチして期待どおりに動きません。@kaz_29さんから指摘を受けたのは「"管理者画面"へ移動する」みたいに「者」が入っているとステップが認識されないというものでした。  

現時点 mink-extension へ [Pull Request ](https://github.com/Behat/MinkExtension/pull/66)しているので、そのうち新しいmink-extensionのバージョンで有効になると思います。  

Mink-ExtensionはComposerで依存関係を解決しているので、そこのバージョンが新しくなるまでしばらく時間がかかると思います。
  

それまでの対策（もしくは別の言語ファイルを入れたい場合など）として、/features/steps の下に i18n ディレクトリを作成することで、そのディレクトリを翻訳ファイルの置き場にすることができます。  

上記の問題で対応版のxliffを入れたい場合、必要なファイル（例えば [ja.xliff](https://github.com/Behat/MinkExtension/blob/master/i18n/ja.xliff) )を features/steps/i18n/ja.xliff といったパスになるように入れておいてください。これは差分インストールではなく置き換えになりますので、必要な言語ファイルはすべて配置する必要があります。
  

  



#### さいごに


  

このように、地道に修正も行っていますので、たまにGithubのリポジトリを訪れてもらえればと思います。  

もしBddPluginを使ってみたいけど、よくわからない！！という場合は、twitterなどで@sizuhikoにメンションもらえればと思います。時間を調整してお会いしたり、もくもく会や勉強会のようなイベントを企画したりします。  

うまく動かない！！というケースは、Githubのissueに書いてもらえると助かります。もちろん日本語でOKです。  

これBehatやSpec4PHPの問題っぽいよね、と思ってもOKです。どしどしご意見＆ご感想をください。  

  

ボクは連携部分を作っただけですが、BddPluginのまとまりとしては中々良いものだと思いますので（手前味噌ですが）、少しでも多くの方にご体験いただければと思っています。



