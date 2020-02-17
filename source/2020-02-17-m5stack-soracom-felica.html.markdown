---
title: M5stack の Soracom 拡張ボードを使って FeliCa リーダーで読み取った値を送信する
date: 2020-02-17 07:52 UTC
tags:
- M5Stack
- Soracom
- GCP
---

昨年 [Google Cloud Next Tokyo'19 に出展しました](/2019/08/12/google-cloud-next-tokyo.html) でも書いた
勤怠システムを打刻するシステムですが、どこでも簡単に使えるようなデバイスを作ることにしました。

- [M5Stack](https://www.switch-science.com/catalog/3647/)
- [SORACOM M5Stack用 3G 拡張ボード](https://soracom.jp/products/kit/3g_module_m5stack/)
- [M5Stackプロトモジュール](https://www.switch-science.com/catalog/3650/)
- [FeliCa リーダー・ライター RC-S620S](https://www.switch-science.com/catalog/353/)
- [FeliCa RC-S620S/RC-S730 ピッチ変換基板のセット(フラットケーブル付き)](https://www.switch-science.com/catalog/1029/)

あたりを使います。FeliCaに関連する部材は、WiFi版のプロト開発でも使っていたので新しいのはM5StackとSORACOM拡張ボードあたりになります。
プロトモジュールはピッチ変換基板を取り付けるのに利用します。

Cloud Nextで展示したWiFi版からの変更として、以下のような作業を行いました。

- M5Stackでの出退勤画面UI作成
- M5StackとFeliCaリーダーの疎通
- M5StackとSORACOM拡張ボードの疎通とインターネット接続確認

まぁこれだけやれば、あとは組み合わせるだけですね！

### ハードウェアシリアルをどのように利用するか

3G拡張ボードも、FeliCaリーダーもUARTのポートを使って通信するので、リソースの割り当てを考えないといけません。
3G拡張ボードは [M5Stack用3G拡張ボードを使う際、PIN(16,17)を利用するデバイスの対応](https://qiita.com/ma2shita/items/e6f84f1d2e8c94e12e31) の記事でも紹介されているように、16,17固定で
それ以外を使うのは困難なため、FeliCa側を

```c
M5StackGPS.begin(9600, SERIAL_8N1, 13, 5)
```

みたいにして対応予定にしていました。

### なぜかうまく動かない

M5Stackのプログラムのコンパイルも通過し、

- 3G拡張ボードの初期化
- IPアドレスの取得
- FeliCaリーダーの初期化
- FeliCaカードの読み取り

まで動作したのですが、ここでSORACOM Beamに接続しようとするとエラーになりました。

で、ここからATコマンドのデバッグをONにしたり、さまざまなログ出力をしてみたのですが、
さっぱりわからず、2日間ほどかけてしまって心が折れたところで愚痴Tweetしてしまったのです...

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">M5でSORACOMの拡張ボード使って、HTTPだと通信できるのに、BEAM に接続しようと思うと、何やっても接続できなくて、何でこんなの買ったのかな... という気分になる。<br>まぁBEAM通さず直接MQTTSやれば接続できてるんだけど、なんだかなー</p>&mdash; しずひこ (@sizuhiko) <a href="https://twitter.com/sizuhiko/status/1225009444737564673?ref_src=twsrc%5Etfw">February 5, 2020</a></blockquote>

そしたら [Max@ソラコムさん](https://twitter.com/ma2shita) からレスもらってしまって、大変申し訳なくデバッグを続けることに。

### 結論としては解決

で、結論としては解決しました。

dakoku-m5.ino というファイルにメイン処理を書いていて、そこで3G拡張ボードの初期化をしていました。

```c
TinyGsm modem(Serial2); /* 3G board modem */
TinyGsmClient ctx(modem);
```

次に RCS620S.cpp という `FeliCa リーダー・ライター RC-S620S` のArduinoライブラリのコードをローカルに展開するのですが、そこで以下のようにしていました。

```c
/* --------------------------------
 * Variable
 * -------------------------------- */

HardwareSerial RCS620SSerial(2);

// 省略...

int RCS620S::initDevice(void)
{
    int ret;
    uint8_t response[RCS620S_MAX_RW_RESPONSE_LEN];
    uint16_t responseLen;

    RCS620SSerial.begin(115200, SERIAL_8N1, 22, 21);      // for RC-S620/S
```

FeliCaリーダーはコンフリクトを避けるために21/22番ポートを利用しています。

懸命な読者の皆様はすぐに気づきますかね。
まぁこの場所だけ抜き出すとすぐ気づくかもしれないのですが、たくさんのコードからこの問題に気づくのにはとても時間がかかりました。

### 時間がかかった原因

まず

- 3G拡張ボードの初期化
- IPアドレスの取得
- FeliCaリーダーの初期化
- FeliCaカードの読み取り

の動作が正常に動いたことで、どこが悪いのか検討もつかなくなったというのがあります。
たとえばFeliCaリーダーの初期化が失敗したり、IPアドレスが取得できなかったら、
もっと早く気がついたかも。

処理順番としては、まず3G拡張ボードの初期化が動いて、IPアドレス取得まで成功します。
その後でFeliCaリーダーの初期化が動くので、ここでシリアル2の接続を上書きしてしまいます。

最初はシリアル2は16/17番を向いているのですが、途中で21/22番に切り替わります。
なんですべての通信命令はFeliCaリーダーに送信されて、動かないと...

こんな感じでATコマンドのデバッグを入れていたのですが、まぁATコマンドとしてFeliCaリーダーに送信しているので、原因調査の切り口も良くなかった...

```c
#define TINY_GSM_DEBUG Serial
#define TINY_GSM_MODEM_UBLOX
#include <TinyGsmClient.h>
```

### 言い訳

M5Stackはスタックの名前のとおりボードを積み上げていくので、各ボードのポートに電気信号が流れているのか検知が難しいですね。
テスター使ったり、LED光らせるわけにもいかない。

ということで、自分で拡張ボード作るときはM5Stackの穴（ネジ穴？）みたいなところにLED入れて、利用状況を可視化したいなと思いました。

### さいごに

RCS620S.cpp のシリアル番号を1に変更してうまく動作しました。
SORACOM BeamからGoogle IoT Coreにもうまく連携できた。これは簡単！（苦労は忘れました

```c
/* --------------------------------
 * Variable
 * -------------------------------- */

HardwareSerial RCS620SSerial(1);
```

これでどこでもSIMを使った通信で勤怠打刻できるようになった。

<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
