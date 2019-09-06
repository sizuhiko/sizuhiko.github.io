---
title: Maker Faire Tokyo 2019にCHIRIMENコミュニティで参加しました
date: 2019-08-12 01:50 UTC
tags:
- MFTokyo2019
- MFTokyo
- CHIRIMEN
- WebComponents
---

今年もMakers夏の祭典[Maker Faire Tokyo](https://makezine.jp/event/mft2019/)に出展してきました。

昨年の記事はこちら:[Maker Faire Tokyo 2018 に CHIRIMENコミュニティで参加しました](/2018/08/13/maker-faire-tokyo-2018.html)

もうこの準備のため、2ヶ月ぐらい時間を使った(構想から実装まで)ので、長文になります。

## 昨年の反省と今年の想い

昨年は[CHIRIMEN PIANO](http://blog.open.tokyo.jp/chirimen-piano/)を作って、展示したのですが、地味だなーと。
ちゃんとしたピアノ風の見た目を作れば良かったとか、いろいろ思うところがありました。

展示の想いとしては、[CHIRIMENコニュニティ](https://chirimen.org/)のアピールではあるわけで、とにかく足をとめて興味を持ってもらうことが大切です。
昨年はバスがあって、LEDラッピングを光らせるデモがあって、かなりの人が足をとめてくれたのですが、今年はバス無しということがわかっていたのです。

鳴り物と光り物は、足をとめてもらえる要素が多いので、今年も楽器でいこうとは決めていました。
自分でデモプレイできる楽器といえばギターとサックス....
サックスはさすがに作れないなーということで、ギターを選択しました。

昨年の技術を応用して、今年はこんなのかな？みたいなのを初期は想定していました。

<iframe width="560" height="315" src="https://www.youtube.com/embed/Cjk9rVGwkk0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

いわゆるスティールギターです。
ただ構想を重ねていく中で、やっぱり人の興味を引くのには地味かなーと思い始め、どうせなら[ガイコツおじさん](https://fabcross.jp/interview/20190731_gaikotsu_ojisan.html)のように、
より参加者に近い形でコミュニケーションできないかな？と考え普通のギタースタイルへと変えていきました。

## いざ準備開始

いつももっと早く始めてればなぁ、と思うのですが、だいたい6月からです。春のカンファレンス時期なんですよね...
といっても6月は、上記の構想や設計と実際に必要になりそうなセンサー類などの発注作業を行ってました。

[PHPカンファレンス福岡2019で、 標準インターフェースを使ったアプリケーション開発について発表してきました](/2019/06/30/phpconfuk2019.html)にも書いたとおり6月末は福岡での発表がありましたが、
それも終わり7月から本格始動です。

まずセンサー類などが届くまでにWebアプリの作成から。
昨年の[CHIRIMEN PIANO](http://blog.open.tokyo.jp/chirimen-piano/)と同様に、PCでもスマホでも、もちろんCHIRIMENでもプレイ可能なギターアプリを作ります。
もちろん Web Components 技術を使って。

WebI2Cエレメント自体の昨年からのアップデートは少なくて `<chirimen-ads1015>` というタグを追加しただけに終わりました。
[ADS1015搭載 12BitADC 4CH 可変ゲインアンプ付き](https://www.switch-science.com/catalog/1136/)を使うためですが、これをどのように使ったかは後で解説します。

## CHIRIMEN-GUITER

CHIRIMENぎたー

- [ソースコード](https://github.com/sizuhiko/chirimen-guiter)
- [動作URL](http://blog.open.tokyo.jp/chirimen-guiter/docs/)

### PCやスマホでのプレイ方法：

![](/images/blog/chirimen-guiter-screen.png)

PCの場合は、フレットがキーボードにアサインされています。
F3, E2などの音階の下にアサインされているキーを表示しています。
たとえばC3の場合は `q` キーを、F2の場合は `c` キーを押します（同時に複数のキーを押してコードにすることも可能です）。
音を鳴らすには、右側の黒い部分をマウスホバーして上下すると音が鳴ります。

スマホの場合は、タッチ(マルチタッチ)に対応しています。
回転固定アプリなどを使って、横向き、上下反転すると、通常のギターを操作するのと同じようにフレットをおさえることができます。
ピックアップが右の黒い部分なのはPC版と同じですが、スマホ版ではここを擦る（スワイプする）ことで音が鳴ります。

### CHIRIMENでのプレイ方法：

普通のギターっぽく演奏できます！

## ハード制作

ギターを作るために利用したものは以下のとおりです。

- CHIRIMEN piano を作るときに書いた[CHIRIMEN Raspi setup](/2018/07/28/chirimen-raspi-setup.html)の記事でふれたもの
  - Raspberry Pi 3 model B+
  - Adafruit PiTFT Plus 480x320 3.5インチTFT
  - Adafruit GPIOリボンケーブル - 26ピン
  - TOSHIBA microSDHC 16GB
- [GROVE - I2C タッチセンサ](https://www.switch-science.com/catalog/825/)
- [GROVE - ジェスチャー](https://www.switch-science.com/catalog/2645/)
- [GROVE - I2Cハブ](https://www.switch-science.com/catalog/796/)
- [GROVE - 4ピンケーブル 20cm (5本セット)](https://www.switch-science.com/catalog/798/)
- [Grove 4ピンコネクタ - ジャンパーピン変換ケーブル(5本入り)](https://www.sengoku.co.jp/mod/sgk_cart/detail.php?code=EEHD-4K34)
- [ADS1015搭載 12BitADC 4CH 可変ゲインアンプ付き](https://www.switch-science.com/catalog/1136/)
- [JST to Breadboard Jumper (3-pin)](https://www.sengoku.co.jp/mod/sgk_cart/detail.php?code=EEHD-5CEW)
- [SoftPot接触位置センサ200mm](https://www.switch-science.com/catalog/283/)
- [ギターフレットボード](https://www.amazon.co.jp/dp/B07LBTKGGL/)
- ブレッドボード/足長ソケット/ジャンパー(AWG22)
- 木目調シート(100均にあるもの)
- クリアケース(100均にあるもの)
- シルバーラッカー(100均にあるもの)
- チップスターの缶(食べ終わったもの)

### フレット

ギターのフレットには、どこが押されたかを調べるため、 `SoftPot接触位置センサ` を利用することにしました。
このセンサーは曲げセンサーなどと同じで、押した箇所の抵抗が上がることでアナログ値として、起点からの距離を知ることができます。
このセンサーを弦の代わりに6本はれば良いわけですが、センサーの幅が両端をギリギリまでカットしても1cmあります。
ギターのフレットボードは一番幅が狭い箇所が4cmぐらいなので、6本はどうみても無理。
ということで、スクリーンショットなどでもわかるとおり、4弦ギターになっています（それはベースなのでは？とかウクレレで良かったのでは？という話はありますが、私がデモプレイできないので... ry）

![](/images/blog/chirimen-guiter-1.jpg)

まずはCHIRIMENとADS1015を使って、SoftPot接触位置センサから値が取得できるかを調べます。
ADS1015のオンラインサンプルは[Raspi3版のADS1015オンラインサンプル](http://chirimen.org/chirimen-raspi3/gc/i2c/i2c-ADS1015/)があるので、センサーを接続してCHIRIMEN for Raspi3のブラウザで動作確認します。
ちょっとわかりずらいですが、Raspi上のTFTモニタにサンプル画面が表示され、押した場所の値が表示されています。

![](/images/blog/chirimen-guiter-2.jpg)

次に4本接続して値が取得できるかを確認します。
この段階では `<chirimen-ads1015>` タグの仮実装までして、WebI2Cタグで値が取得できるかを確認しています。

SoftPot接触位置センサからは、 `JST to Breadboard Jumper` （厳密には少し違うものなのですが、せんごくオンラインにはなかったので同等のものをリンクしています）を使って、
ジャンパー経由でブレッドボードに落としています。JSTコネクタは2.5mm幅でハンダ付けの必要がなく接触位置センサーと接続できそうだったので、導入しました。
接触位置センサーのはんだ端子が結構微妙なので、この方式が良いと思います（実際にはコネクタ端子の製品もあるらしいけど、店舗やスイッチサイエンスにはないようです）。

![](/images/blog/chirimen-guiter-3.jpg)

あとはセンサー左右の耳の部分をカッターで切り落とし、ギターフレットに貼り付けてみます。
なんとか4本を敷きつめられました。
耳のカットは、まず1本やって、値がちゃんと取れることを確認してから4本実施。
もしカットして値が取れなくなっていたら、戦略の見直しが必要なところでしたが、良かったです。
（実はスリムタイプという製品が販売元のページにあるのを知っていて、カットしたら同じなんじゃない？という感覚があったのも良かったと思います）

![](/images/blog/chirimen-guiter-4.jpg)

最後の仕上げです。

- クリアケースとフレットボードを取り付け
- ブレッドボードでAD変換してGrove端子にするような回路を作成
- フレットボードの裏側に接触位置センサーのケーブルを取り回すように穴あけ

### その他

![](/images/blog/chirimen-guiter-7.jpg)

クリアケースにCHIRIMENとI2Cハブを取り付けます。
そこからchirimen-pianoでも利用したタッチセンサーとジェスチャーセンサーをクリアケースの外側に取り付けます。

この2つのセンサーはプレイ方法に関係します。
フレットに利用した接触位置センサーの値は、PC/スマホ版のキーボードやタッチと同じで、音階を指定するだけです。
タッチとジェスチャーは、PC/スマホ版の黒い部分と連動していて、ジェスチャーは何か動きがあったときにストロークプレイ、
タッチは4弦と連動してアルペジオプレイができるように、アプリケーションを実装しています。

![](/images/blog/chirimen-guiter-6.jpg)

見た目とプレイしやすさから `チップスターの缶` をいい感じにカットしてフレット裏の湾曲を作りました。
これでFコードなどを抑えるのも用意になります。

接触位置センサーは木目調シートで隠して、ちゃんとしたフレット位置にシルバーラッカーで目印を書いておきます。

## 当日

土曜日

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr"><a href="https://twitter.com/hashtag/MFTokyo2019?src=hash&amp;ref_src=twsrc%5Etfw">#MFTokyo2019</a> 出展してます。これ、どっちもMFTokyoじゃん。紛らわしいw (@ 東京ビッグサイト (東京国際展示場) - <a href="https://twitter.com/T_Bigsight?ref_src=twsrc%5Etfw">@t_bigsight</a> in 江東区, 東京都) <a href="https://t.co/pUNHVjNMeS">https://t.co/pUNHVjNMeS</a> <a href="https://t.co/qlwmMuwLfC">pic.twitter.com/qlwmMuwLfC</a></p>&mdash; しずひこ (@sizuhiko) <a href="https://twitter.com/sizuhiko/status/1157468516020293632?ref_src=twsrc%5Etfw">August 3, 2019</a></blockquote>

日曜日

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr"><a href="https://twitter.com/hashtag/MFTokyo2019?src=hash&amp;ref_src=twsrc%5Etfw">#MFTokyo2019</a> 今日もS-02ブースでお待ちしてます (@ 東京ビッグサイト (東京国際展示場) - <a href="https://twitter.com/T_Bigsight?ref_src=twsrc%5Etfw">@t_bigsight</a> in 江東区, 東京都) <a href="https://t.co/N5kyNOB7Tr">https://t.co/N5kyNOB7Tr</a> <a href="https://t.co/k0gecgezSI">pic.twitter.com/k0gecgezSI</a></p>&mdash; しずひこ (@sizuhiko) <a href="https://twitter.com/sizuhiko/status/1157817313946755073?ref_src=twsrc%5Etfw">August 4, 2019</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

![](/images/blog/chirimen-guiter-5.jpg)

Cloud Next Tokyoが終わって直前の2日間ぐらい、制作したギターで練習して当日に挑みました。
ちゃんとギターアンプまで持ち込み。

結果として、たくさんの方の目に留まり、コミュニティの説明をすることができました（パンフレットなくなったし！）
実際に今後どのぐらいの人が

- CHIRIMENをさわってくれたり
- Webとリアルをつなぐアプリを作ってくれたり
- プログラミングを学んでくれたり
- Webの標準化に興味を持ってくれたり

するかはわかりませんが、何かのキッカケを作れたんじゃないかなーと思います。
ギターはまだ分解してませんw ので、ご要望があればどこかに持っていて遊びたいなーと思っています。

来年のMFTokyoは10月開催予定ということで真夏の祭典じゃなくなるけど、また面白い展示を考えて、CHIRIMENを広める活動をしたいなーと思っています。
[CHIRIMENコニュニティ](https://chirimen.org/)は皆様の参加を待っています！
