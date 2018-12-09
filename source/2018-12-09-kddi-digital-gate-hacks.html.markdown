---
title: KDDI DIGITAL GATE HACKSのお手伝いをしてきました
date: 2018-12-09 09:11 UTC
tags:
- IoT
---

KDDI学生向けハッカソン[KDDI DIGITAL GATE HACKS 2018](https://www.kdghacks.com/)でチューターとしてお手伝いをしてきました。
どんなハッカソンなのかは[TECH PLAYのイベントサイト](https://techplay.jp/event/697271)の方がわかりやすいかも。

[SORACOMのWio LTE M1/NB1](https://soracom.jp/products/module/wio_lte_m1_nb1/)を使って、家での生活をワクワクさせるIoTサービスを創るイベントです。

たくさんの大学生/大学院生が参加されて、みなさん優秀だったのでチューターとしては特にやることも少なくて、とにかく楽しいという感想が残るイベントでした。

詳細はイベント主催であるKDDIさんからブログが公開されるのではないかと思うので、準備秘話というか「Wio LTE M1/NB1」(以後WioLTE青)のつらさを書いておきます。

WioLTEとはSeeedが開発しSORACOMで販売しているボードです。
これまでに

* [Wio LTE JP Version](https://soracom.jp/products/module/wio_lte) 以降WioLTE赤
* [Wio 3G SORACOM Edition](https://soracom.jp/products/module/wio_3g_soracom_edition)

が発売されています。WioLTE青はKDDIのSIMが利用できるのが特徴です。

ということで、チューターはサンプルプログラムを作ったりといった準備をしていました。
私は個人的にWioLTE赤を購入して使っていたので、その感覚でWioLTE青を使い始めたのですが、似ているのですが、だいぶ違うものなので、これから触る人は少し注意が必要です。

### WioLTE青の良いところ

- KDDIのSIMが使える
- DFUモードが不要なので、Arduino IDEからのプログラムの書き込みが簡単

### WioLTE青の困ったところ

- サンプルが少ない。でも今回たくさん作ったので[kdg-hacks-examples](https://github.com/kdg-hacks/kdg-hacks-examples)が役に立つと良いな、と思っています。
- I2C通信にWireが使えない。WireI2Cを使うので既存のArduino向けライブラリを簡単に使えない。
- WioLTE赤と違って使っている人が少ないのでノウハウが少ない
- WioLTE赤は5Vセンサーでも電源だけ5Vを給電すれば5Vセンサー値も読み取れたが、どうもそれはできないっぽい
- interrupts/noInterruptsメソッドがArduino-Coreに実装されていないので、タイミング重要なNeoPixelといったテープLEDが使えなかった（ライブラリ使うとコンパイルとおらない）
- [STM32F405/407のArduinoCore](https://github.com/SeeedJP/stm32f4ArduinoCore)の実装がプアなので、Arduinoだと思うとハマる

ということでGroveのセンサーだいたい使える、と思っていると5V必要だったりするセンサーが絶望的に動きません。

### でも良いボード

IoTでWiFiとかかなりつらいし、LTE使えるだけでも魅力てきなので、例えば苦手な部分はArduinoで実装してI2Cスレーブとして、WioLTEから操作するのはアリかな、というか、そういう使い方が良いと思っています。悩まなくて良いし、開発スピードも増します。

### まとめ

学生向けハッカソンへの参加はとても新鮮で楽しかったです。
また機会があればイベントに協力していきたいなと思います。
