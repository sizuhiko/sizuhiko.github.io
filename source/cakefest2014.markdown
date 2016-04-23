
イベントスライドまとめ

https://joind.in/event/view/1767


# 09:00 - 09:30 CakePHP Community Keynote

James Watts

キーノート


# 09:30 The road to CakePHP 3.0

Mark Story

http://www.slideshare.net/markstory/road-to-cakephp-30

5.4とcomposer
国際化、mb_string, localize, numberformat, dateformat, 
config、
router 従来の16倍速い
HTMLとかテンプレート
コールバックのイベント、アプリケーションのコールバック、
carbon(datetime). aura/intl(18n), password_compat(5.4で5.5の機能を使う sha1, hash、良くテストされている）
ドクトリンはないわー
HttpFoundationでもない
StackPHPもね

indexがちょっと遅いけど、オブジェクトを作る時間とかね
その他はだいたい良いよ

beta1がリリースされるよ

debugkitとmigrationは途中、migrationは旧バージョンとの整合性もあるとか。
2.6がリリースされ、3年はサポートするよ
1.3は3.0のリリースで終了。だいぶ長かったね。

次の5年のために最新のPHPが必要

# 10:00 Advanced querying with the new CakePHP 3.0 ORM

José Rodríguez

http://www.slideshare.net/josezap1/advanced-querying-with-cakephp-3

CakePHPとMongoのプラグインに始まった
レイヤーをクリアにする、拡張カラムを利用可能にする（GeoとかENUMとか）
callfinderの話し（もくもくでソース読んだから説明よくわかる）
サブクエリも同じように簡単に作れる

eager-join かどうか。基本はぜんぶlazy
key valueで取り出す方法もある（これは旧来のlistですよね）

フォーマッターが複数設定できる
複雑なcountクエリも実行できる

まだあるけど、今日はここまで

# 10:50 CakePHP and Auth

Marc Ypes

friendsofcakeのauthとか
opauth使えばいいよね。ほとんどのSNSに対応している


# 11:30 A/B Testing on a Variety of Platforms

Jose Gonzalez

2日目の 18:30 AJAX and CakePHP Mark Scherer が移動してきて、ここでプレゼン

Ajaxでプルダウンやページネーション、トグルなどやる方法と解説しましたよ、と。

# 12:20 Scaling Your MySQL Instances AND Keeping your Sanity

Dave Stokes

level 0: スロークエリや、インデックスをチェックして、クエリのチューニング
level 1: キャッシュ、セッションなんかはmemcacheで良いよね
level 2: どのくらいのアクセスがあるのか、up timeやレスポンス時間を継続する

- 読み込みを分割する（レプリケーション）
  - PHPとjavaでは簡単
- mysqlservercloneなど
- Mysqlクラスタ（99.999のup time）
- Big Dataとは何なのか？

Calpoint, Inforblight を使って列DBにするとか

Hadoopも検討できる（HDFS）

パーティショニング（facebookとか）

Mysql Fabric（新しい機能、5月にリリースされた）

何を解決するのか？を考えるべき

Boston Mysql User group で virtual classやってるらしい


14:00 Core Team Q&A

15:00 Effective debugging

Andrew dawson

webgrind（xdebug profiler）
インターネットアプリケーションのデバッグ
NAMESERVERの問題とか、DNSの設定とか、サーバ落ちてるとか（502）これはログを見ればわかるね
共通している問題
エラーログ見ない、エラーログの悪い箇所に注目しない、エラーメッセージ読まない、
エラーメッセージを読み上げない

注意しよう
ブラウザがロードしているファイルと一緒かどうか、同じサーバでアプリケーションで同じリクエストか？

デバッグ方法、あるある集


# 15:50 Composer and CakePHP: Development is better with package managers

Justin Yost

Composerの概要、
CakePHPをcomposer.jsonに入れてインストール、bakeするよ
CakePHP3ではもっと簡単になったよ
プライベートリポジトリ使えるし、PHPじゃないもの（シェルスクリプトとか）の依存関係も解決するよ

create-project で簡単にセットアップできるよ
packagistで簡単に検索できるよ
satis使うと自分用Packagist作れるよ

toran（プロキシサーバー） 使ってる？

# 17:00 Bootstrap: Mobile Sites in Minutes

Anna Filina

レスポンシブデザインとか、ブートストラップとか
それcss3とhtml5でできるよ、という内容もある気がするけど、まぁね
こんなところでglyphiconみるとは！

# 17:50 Frontend asset management with Bower and Gulp.js

Fahad Heylaal

Renanが代打でやるっぽい
NPMか、bowerか


# 18:30 Writing code that lasts

Rafael Dohms

improve code
make it easier to comprehend
make it flexible
make it tested
make it easier to reolace, refactor
make it not exist

good design concept

composer PHP開発を変えた
guzzle HTTPクライアントが簡単に作れる
ardent PHPコレクションライブラリ

可読性の高いコード ブロック 空白 とか大事よ


# 19:20 Testing CakePHP app with Selenium on TravisCI

Yusuke Ando

# 20:00 Lightning Talks

Fabricateやった。何人か声をかけてもらったり
平鍋さんの友達の@afilina に会って話たり
サルサ教室が開かれたり

# 09:00 Microsoft Keynote
# 09:30 ntersective Keynote
# 10:00 Profiling and Optimization: A practical approach

Mark Story

オフィスにはいっぱいwifiが飛んでるだろ（笑
とにかく計測しよう
小さく始める
何がコストになるか？
いっぱいツールが紹介されたのでスライド見直した方がよい

最後にこのプレゼンテーションは23分xx秒かかったよという`計測結果`を言って爆笑にて終わり

# 10:50 Payment processing: you are DOING IT WRONG

Mariano Iglesias

支払い系APIの使い方とか

# 11:30 API Pain Points

Phil Sturgeon

RESTとかAPIの正しいやり方、作り方
テキーラソーダ作って飲みながらプレゼンする人とか始めて見たわー
それに暑苦しくて面白いという

# 12:20 Why You Can't Test

Chris Hartjes

テスト難しいよね
教育大事：php mentoring
環境：composerが解決してくれるようになった
依存：DIの考え方を使う（まぁそうなんだけど、考え方は知っておいてそれらしい手段を取るというのもCakeらしいところだと思うのですよ）
とかくHigh level Java Programmerという言葉が出てくるけど、そうねーという感じ
TDDはデザインパターンだとか来たよ。そうかー

https://speakerdeck.com/grumpycanuck/why-you-cant-test


# 14:00 Hour of Contribution - Introduction to Open Source with GitHub

トータスgitを使っております（驚）

# 14:30 Hour of Contribution - The Business of Open Source with Larry Masters

ブライアンが続きでgithubのコンソールからのやりかたを説明しています。あれ？
席に座っているマークが速攻でマージするというPR芸を見たw

そして、ブライアンの最後のセッションをここでやることに

# 19:20 CakePHP Documentation/Contribution

Bryan Crowe


# 15:00 Croogo for business applications

Pierre Martin

# 15:50 Enterprise Cake

James Watts

全体のまとめ感があって良かったのと、
JAMESが作っているプラグインの紹介があって良かった

# 17:00 AngularJS Fundamentals Tutorial

Rosina Bignall

犬を連れた女性の発表
これがまた賢い犬で。

アンギュラーの入門セッションでしたー

# 17:50 Asynchronous data processing

Andrea Giuliano



# 18:30 A/B Testing on a Variety of Platforms

Jose Gonzalez


# 19:20 Croogo for business applications

Pierre Martin

