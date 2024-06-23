---

title: PHP カンファレンス福岡2024に参加した
date: 2024-06-23 02:35 UTC
tags: 
- PHP
- PHPcon
- fukuoka
---

[PHP カンファレンス福岡2024](https://phpcon.fukuoka.jp/2024/)に参加しました。

2019年以来の PHP カンファレンス福岡。
そのときの記事が[PHPカンファレンス福岡2019で、 標準インターフェースを使ったアプリケーション開発について発表してきました](/2019/06/30/phpconfuk2019.html)です。

昨年はチケットを購入できず、先に予約していたフライトやホテルをキャンセルするという形になってしまったので、今年はちゃんとチケット購入してから、フライトとホテルを予約しました。昨年の反省が活かされている。
昨年の盛り上がりは X で確認していて、うらやましーと思ってました。そこから今年の月刊 PHP con が始まったと言っても過言ではないわけで、とても楽しみにしていました。

ちなみにプロポーザルはブログ記事にもした[GAE gen1 で動いている PHP5.5 で作った個人開発サービスを gen2 PHP8.2 へ移行した1年記](/2024/03/20/story-for-migrate-hobby-web-service-while-a-year-part-1.html)と[APPSYNC_JS (AppSync JavaScript) で始める GraphQL API サーバー](/2024/06/03/get-started-with-graphql-api-server-with-appsync-js.html)について出したのですが、どちらも落選しました。
プロポーザルの倍率がやばすぎる（僕が普段の仕事 PHP じゃないので、旬な話題じゃないというのは否定できない事実ですがw）。

2019年が3年ぶり2回目だったので、今回は5年ぶり3回目ということになります。

## 前日入り

今回も前日入りしましたが、いきなり飛行機が遅延するというトラブルに。

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">福岡行の飛行機が40分遅延。ラウンジで暇つぶし</p>&mdash; しずひこ (@sizuhiko) <a href="https://twitter.com/sizuhiko/status/1803936271016112448?ref_src=twsrc%5Etfw">June 20, 2024</a></blockquote>

この時点では 9:00 発が 9:40 になっただけだったけど、さらに 15分遅延となって 9:55 発に。
梅雨時期だし雨の影響もあるのでしかたがないですね。前日入りでよかったとポジティブに捉えましょう。

福岡に到着したら [WeWork 大名](https://wework.co.jp/location/fukuoka/daimyo)へ。永和システムマネジメントでは東京支社がWeWork京橋内になったため、今回のように福岡に前日入りしてもWeWork拠点があれば作業できるのでとても便利。夕方からは袋詰めボランティアに申し込んでいたので、それまで作業します。

お昼はWeWork近くにあったウェストへ。

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr"><a href="https://twitter.com/hashtag/phpconfuk?src=hash&amp;ref_src=twsrc%5Etfw">#phpconfuk</a><br>つけ忘れた。ウェスト天神にて <a href="https://t.co/qEIf833QCB">https://t.co/qEIf833QCB</a></p>&mdash; しずひこ (@sizuhiko) <a href="https://twitter.com/sizuhiko/status/1804015303929795068?ref_src=twsrc%5Etfw">June 21, 2024</a></blockquote>

夕方ぐらいになったらWeWorkに知っている人たちが続々来て？？ってなったんですが[【非公式】PHPカンファレンス福岡2024・前日Meetup](https://prtimes.connpass.com/event/319375/) があったようです。気が付いてなかった....

そして袋詰めをやってきました。

<blockquote class="twitter-tweet"><p lang="zxx" dir="ltr"><a href="https://t.co/3yToNsWugm">pic.twitter.com/3yToNsWugm</a></p>&mdash; cakephper ichikawa (@cakephper) <a href="https://twitter.com/cakephper/status/1804161620920406368?ref_src=twsrc%5Etfw">June 21, 2024</a></blockquote>

そのあとは特に予定もなかったので、エールズへ。

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">ウェーイ <a href="https://t.co/gvj1XTXZ5q">pic.twitter.com/gvj1XTXZ5q</a></p>&mdash; しずひこ (@sizuhiko) <a href="https://twitter.com/sizuhiko/status/1804110592988582281?ref_src=twsrc%5Etfw">June 21, 2024</a></blockquote>

野生のPHPerにも出会えたり、帰ろうかなーと思ったら店長から市川さん来るよ、って教えてもらったのでビールを追加して合流。
そのあとは Rummy 行って美味しいラムをいただいて、締めにやまちゃんでラーメンとビールを（3時ちょいに寝ました）。

## 当日

ちゃんと朝起きれて会場へ移動していたのですが、2日続けて朝にトラブルが...

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">祇園駅で出ようと思ったらSUICAが無い。たぶん天神の駅でポケットに入れる前に落としたっぽい</p>&mdash; しずひこ (@sizuhiko) <a href="https://twitter.com/sizuhiko/status/1804311768019431566?ref_src=twsrc%5Etfw">June 22, 2024</a></blockquote>

100円均一で売ってるこの手の定期入れを使ってたんですが、初めて中身だけ落ちました。

![](https://jp.daisonet.com/cdn/shop/products/4549131477177_10_d815145c-9bf2-4c6f-809e-0a7ae83867ef_130x.jpg?v=1619573190)

祇園駅で駅員さんに天神駅へ連絡してもらって確認したら、それっぽいのがあるということでUターンして無事戻ってきました。
日本でよかった。改札通過してすぐポケットに入れた（いつもそう）ので、改札近くに落ちたのではないかと思います。
ギリギリ開始時間には間に合いました。

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">隔月PHPカンファレンスにチェックイン<a href="https://twitter.com/hashtag/phpconfuk?src=hash&amp;ref_src=twsrc%5Etfw">#phpconfuk</a><br><br> <a href="https://t.co/ObAL9Tbeuy">https://t.co/ObAL9Tbeuy</a> <a href="https://t.co/lTfGcPuNX2">pic.twitter.com/lTfGcPuNX2</a></p>&mdash; しずひこ (@sizuhiko) <a href="https://twitter.com/sizuhiko/status/1804321244311150838?ref_src=twsrc%5Etfw">June 22, 2024</a></blockquote> 

今回は午前中はメイン会場でセッションに参加してました。PHP養分がたくさん補充されました。

- [PHP コードの実行モデルを理解する by 新原 雅司](https://fortee.jp/phpcon-fukuoka-2024/proposal/559508e2-68c6-4b59-ab3a-3da6a6cccb0f)
- [Fat Controller は悪か？ ~光のFat Controller・闇のガリController~ by スタヰル](https://fortee.jp/phpcon-fukuoka-2024/proposal/7efe2276-f8e0-4610-8586-e3901230e231)
- [10社以上のCTO/技術顧問を経験して見えた、技術組織に起こる課題と対策 by 大谷 祐司](https://fortee.jp/phpcon-fukuoka-2024/proposal/bdf2f1de-82f0-4468-989a-cb1fb70263c1)
- [有効な使い方を正しく理解して実装するPHP8.3の最新機能 by 清家史郎](https://fortee.jp/phpcon-fukuoka-2024/proposal/c2955129-264c-4807-b840-747c1ba23e08)

お昼は福岡の人と食べたいなーと思って、[@nojimage](https://x.com/nojimage)さんに声をかけてご一緒させてもらいました。

午後はアンカンファレンス会場、スポンサーブース、廊下で交流してました。

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">最新版👀<br> <a href="https://twitter.com/hashtag/phpconfuk?src=hash&amp;ref_src=twsrc%5Etfw">#phpconfuk</a> <a href="https://t.co/Ff4dSAI9jI">pic.twitter.com/Ff4dSAI9jI</a></p>&mdash; Kanon (@samurai_se) <a href="https://twitter.com/samurai_se/status/1804393754780184724?ref_src=twsrc%5Etfw">June 22, 2024</a></blockquote>

16:00からはアンカンファレンス会場で、会社で今月2回Webアクセシビリティのワークショップをやったのを発表しました。

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">さきほどアンカンで話したスライドです。<br>Webアクセシビリティワークショップを社内でやってみた<a href="https://t.co/2jjPp9vFx2">https://t.co/2jjPp9vFx2</a><a href="https://twitter.com/hashtag/phpconfuk?src=hash&amp;ref_src=twsrc%5Etfw">#phpconfuk</a></p>&mdash; しずひこ (@sizuhiko) <a href="https://twitter.com/sizuhiko/status/1804416464855675307?ref_src=twsrc%5Etfw">June 22, 2024</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

専門家じゃなくても良い教材があるので「みんなで勉強会てきにやってみると良いよ」といったメッセージが伝わったら良いなと思っています。

そのあとは懇親会（当日チケットあって嬉しかった）→ 非公式2次会 → やまちゃん の流れでした。
初めましての方、お久しぶりの方とたくさん話せました。楽しかった！

## 後日

帰京までの時間は[6/23(日)「（非公式）PHP Conference Fukuoka After Hack!!」](https://fusic.connpass.com/event/314905/)に参加して、このブログ記事を書いています。

2019年の記事の最後は

> PHPカンファレンス福岡、来年も参加できると良いなー。

で終えていました。
しかし翌年それが当たり前の光景でないことがわかったのです。当時はそんなことになると思っていなかったですよね。
もちろんそういったことだけでなく、当たり前にカンファレンスがある訳でなく、多くの人の努力によって開催されているわけで感謝です。

あとはアンケートとフィードバックを入れてから帰ります。そしてまた参加できるように願っています。
