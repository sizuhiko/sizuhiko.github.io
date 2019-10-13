---
title: PHPカンファレンス沖縄2019で、 標準インターフェースを使ったアプリケーション開発について発表してきました
date: 2019-10-13 04:02 UTC
tags:
- PHP
- phpconokinawa
---

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">I&#39;m at 那覇空港 in 那覇市, 沖縄県 <a href="https://t.co/qQxSJmINt4">https://t.co/qQxSJmINt4</a> <a href="https://t.co/nsnIENkcMu">pic.twitter.com/nsnIENkcMu</a></p>&mdash; しずひこ (@sizuhiko) <a href="https://twitter.com/sizuhiko/status/1182554850124615680?ref_src=twsrc%5Etfw">October 11, 2019</a></blockquote>

沖縄久しぶりー。カンファレンスでは初めてです。
昔は年一で来ていた時期もあったのですがね。
今回は、CFPに応募した発表が通過したので `標準インターフェースを使ったアプリケーション開発` というタイトルで発表してきました。
同じセッションを福岡でもやったので、今年2回目の発表です。

福岡の記事はこちら [PHPカンファレンス福岡2019で、 標準インターフェースを使ったアプリケーション開発について発表してきました](/2019/06/30/phpconfuk2019.html)

## 前日入り

今回は会社の経費で来たので、早めに到着して沖縄事務所に出社しました。

<small>[永和システムマネジメント](https://www.esm.co.jp)では、カンファレンスは回数に関係なく経費でますが、若手にたくさん参加して欲しいので、おじさんは自主規制(なるべく自費参加)してます。</small>

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">出社 (@ 永和システムマネジメント 沖縄事務所 in 那覇市, 沖縄県) <a href="https://t.co/egGUE7HRFp">https://t.co/egGUE7HRFp</a></p>&mdash; しずひこ (@sizuhiko) <a href="https://twitter.com/sizuhiko/status/1182565239713390592?ref_src=twsrc%5Etfw">October 11, 2019</a></blockquote>

沖縄事務所で発表のリハをしながら、スライドの最終調整をしてました。

ちゃんと定時まで事務所にいて、ホテルにチェックインしたあとは、軽く（といっても1時ぐらいまで）飲みに行きました。

## 当日

カンファレンス会場は、宜野湾の[CODE BASE OKINAWA](http://www.protosolution.co.jp/codebase/)だったので、交通機関で移動です。
宿泊が那覇なのは、飲みに行くのに便利なオススメプランというのに沿って予約したためです。

[PHPカンファレンス沖縄 全体のスケジュール(仮)](https://hackmd.io/@SSFZ9rLAS8-cz4R0WCwI-w/ryhncTzmH)というページをカンファレンス運営からアドバイスもらえるのは、県外からの参加者に優しくてとても良いですね。
で、このページに那覇からの移動方法も書いてあるので、そのとおりバスで移動します。

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr"><a href="https://twitter.com/hashtag/phpconokinawa?src=hash&amp;ref_src=twsrc%5Etfw">#phpconokinawa</a> 到着。15:20からTrack Cで話します (@ CODE BASE in 宜野湾市, 沖縄県) <a href="https://t.co/nuzhpWwVxJ">https://t.co/nuzhpWwVxJ</a> <a href="https://t.co/mmgYjNyV8J">pic.twitter.com/mmgYjNyV8J</a></p>&mdash; しずひこ (@sizuhiko) <a href="https://twitter.com/sizuhiko/status/1182821158741303296?ref_src=twsrc%5Etfw">October 12, 2019</a></blockquote>

<small>プロトソリューションさんのビルが2つあって、少し迷いましたがw 無事到着しました。</small>

初回開催のPHPカンファレンス沖縄ですが、3トラックあってすごい。会場も広いです。

午前中はメインホールでセッションを見て過ごしました。

ランチセッションのお弁当も美味しかった！
<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">VOVAGE GROUPさま、お弁当ありがとうございます <a href="https://twitter.com/hashtag/phpconokinawa?src=hash&amp;ref_src=twsrc%5Etfw">#phpconokinawa</a> <a href="https://t.co/G9n3Nw3zIl">pic.twitter.com/G9n3Nw3zIl</a></p>&mdash; しずひこ (@sizuhiko) <a href="https://twitter.com/sizuhiko/status/1182857623709728769?ref_src=twsrc%5Etfw">October 12, 2019</a></blockquote>

午後からは私のセッションもあるTrack Cで過ごしました。
他のカンファレンスでもそうですが、自分の発表があるときは同じ部屋で他の人の発表を見てスライドの明るさ、マイクの調子などをチェックしています。

私のセッションのスライドは以下のとおりです。

<script async class="speakerdeck-embed" data-id="87f3469f31bd48b395385d28830db6c2" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>

セッションが始まる前にコード中心か、エモい話中心か、アンケートを取ったらコード中心ということだったので基本的な話をおさらいして作成したサンプルコードの解説をしました。
スライドの中にもURLありますが、こちらにも掲載しておきます。

- [https://github.com/sizuhiko/psr15-requesthandler-examples](https://github.com/sizuhiko/psr15-requesthandler-examples)
- [https://github.com/sizuhiko/php-protocolbuffers-example](https://github.com/sizuhiko/php-protocolbuffers-example)

福岡では間に合わなかった Protocol Buffers のPHPサンプルを追加しておきました。
Protocol Buffers はAPIのリクエスト/レスポンスの課題を解決する方法として最適だと思っているので、もっと流行ってほしいなと思っています。gRPCでも良いけど、サーバーやクラウドの対応状況も難しいので、まずはその中の技術を使うということです。

その後は充電コーナーにいたり、スポンサーブース回ったり、LT聞いたりして、懇親会へ。
懇親会も沖縄っぽい料理たくさんあって、楽しかったです。

OrionビールのSTRONG ZEROっぽい[WATTA STRONG DRY](https://www.orionbeer.co.jp/brand/watta/index.html)というのを飲んだりしました。
<small>これはやばいやつ</small>

懇親会終わったらタクシーで那覇に移動して、二次会、三次会と移動してホテルに戻りました。

## 後日

ホテルの料理が沖縄料理充実していて、2日間とも満足しました。
ちょっと早いランチにはA&Wへ。沖縄来たら間違いないやつ（並んでましたが...）

国際通りでお祭りやっていて、お子様の琉球空手見たり、爆竹の香りを嗅ぎながら散策をしていました。
しかし今日は暑い！

帰京までの時間、 [(非公式)PHPカンファレンス沖縄2019 After Hack!!](https://re-build.connpass.com/event/140020/#feed) に参加して、このブログ記事を書いています。

昨日の発表時間でできなかった `標準インターフェースを使ったアプリケーション開発` のエモ話をしました。

標準とフレームワークのライフサイクルや進め方ってやっぱり違っていて、これはそういうコミュニティだったり関わりをしてないとわからないことなんです。どちらが良いとかではなく、最適な選択をした方が良いんですが、ライフサイクルが長くなるアプリケーションを作るなら標準には寄り添っておきたいなという話です。

今年はフレームワーク乗り換えネタや、バージョンアップネタが少なかった（昨年多かったので、今年の私の発表につながる訳ですが）ので、みんな少し落ち着いている状況なのかな？と思います。
こういう落ち着いているときこそ、次にやるべきことや、自分たちが進んでいく方向性みたいなのを考えるキッカケになるようなことは考えていきたいですね。

PHPカンファレンス沖縄楽しかったし、またあれば是非参加したいなーと思います。

<small>休みを付けて伊良部大橋渡に行きたい...</small>

<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
