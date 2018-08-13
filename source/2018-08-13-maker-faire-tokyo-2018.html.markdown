---
title: Maker Faire Tokyo 2018 に CHIRIMENコミュニティで参加しました
date: 2018-08-13 07:17 UTC
tags:
- MakerFaire
- MFTokyo
- CHIRIMEN
- WebComponents
---

MFTokyo（昨年まではMFTと省略していましたが、今年からこのように変更となりました）のデモ準備として、
先日 [CHIRIMEN Raspi setup](/2018/07/28/chirimen-raspi-setup.html)という記事を書きましたが、これはその結果報告です。

### デモ準備

実際にソースを書いて、動かしてみると **開封したばかりのGroveタッチセンサーが4つのうち1つだけ反応しません** 。
ハブ側の裏にあるハンダ部分を触って通電させるとタッチ状態になるので、静電側が異常だということを認識し、
処理不良だから書い直せば大丈夫...と思い、前日の金曜日に秋葉原へ向かいしました。

実は8/3は半透明なブギーボード BB-11 の発売日で、翌日にMFTokyoへ持って行くなら量販店で買うしかない！と思いアキヨドにも行くつもりだったのです。
参考:[13.8インチで半透明、ブギーボード新モデルが8月3日発売](https://k-tai.watch.impress.co.jp/docs/news/1130909.html)

### 何を作ったか

[chirimen-piano](https://github.com/sizuhiko/chirimen-piano) という、ピアノアプリを作りました。

このアプリの特徴は以下のとおりです。

- Polymer3で作られていて、以下のCustomElementsの実装評価を兼ねていた
    - web-i2c タグ
    - grove-gesture タグ
    - grove-touch タグ
- CHIRIMENでなくても動作するWebアプリである
- 4鍵(タッチセンサーの4つが対応)しかないが、左右に手を振ることでジェスチャーセンサーが反応し、音階が移動する。CHIRIMENでない場合は左右ボタンで移動

ちなみに昨年は Echigo という B2G OS ベースのボードで web-gpio エレメントを検証するために [polymerchirimen](https://github.com/sizuhiko/polymerchirimen) というサンプルを作っていました。
これは人感センサーに反応すると、LEDが点灯するというものでした。

先日購入したものに追加して、以下の部品が必要になります。

- [Grove - I2Cタッチセンサー](https://www.sengoku.co.jp/mod/sgk_cart/detail.php?code=EEHD-0DPT)
- [Grove - I2C Hub](https://www.sengoku.co.jp/mod/sgk_cart/detail.php?code=EEHD-0DPW)
- [GROVE - ジェスチャー](https://www.switch-science.com/catalog/2645/)
- [Grove 4ピンコネクタ - ジャンパーピン変換ケーブル](https://www.sengoku.co.jp/mod/sgk_cart/detail.php?code=EEHD-4K34)
- ラズパイに接続できるスピーカー, USBマウス(ちょっとした操作用), 電源アダプター

完成画像は以下のとおりです。

![](/images/blog/chirimen-piano.jpg)


### 苦労したこと

`CHIRIMENでなくても動作するWebアプリ` を目指して作り始めたら、Raspberry Pi版のpolyfillにいくつか問題があることがわかって、それを修正しながら進めたのでギリギリまで時間がかかりました。
こちら、まだchirimen-pianoにしか入っていませんが、近いうちに公式版へPRを送る予定です。

あとはセンサーの初期不良は、まぁあるものと思っていた方が良いですね。
最近あんまりハズレを引かなかったので忘れていました。

### web-i2c-element はどうなの？

現時点はまだデモプログラム内での評価用ですが、今回思ったよりもうまく動作しそうなので、こちらもちゃんとエレメントとして分割したいです。
いくつか改善したいポイントがあります。

#### no-web-i2c 対応

まず CHIRIMEN 以外で動作させていたとき、 `noscript` タグみたいにして書けるようにする予定です。

現在は `web-i2c.js` にベタ打ちになっていますが

```html
<div class="message">
  このデバイスはCHIRIMENではありませんが、ピアノ演奏はお楽しみいただけます。
</div>
```

これを利用側から指定できるようにしたいと思います。

```html
<web-i2c>
  <div slot="no-web-i2c">
    このデバイスはCHIRIMENではありませんが、ピアノ演奏はお楽しみいただけます。
  </div>
</web-i2c>
```

#### WebI2cSensorElement 対応

センサーのタグは `PolymerElement` を継承して作るようにしていますが、これを WebI2cSensorElement のように親クラスを作って、センサータグ実装を楽にしたいと思っています。

[現在のgrove-touchエレメントのソースコード](https://github.com/sizuhiko/chirimen-piano/blob/master/src/chirimen-piano-app/grove-touch.js) を、以下のように書けるようにしたいと思っています。

```js
class GroveTouch extends WebI2cSensorElement {
  async init(i2cSlave) {
    await i2cSlave.write8(0x2b,0x01);
    await i2cSlave.write8(0x2c,0x01);
    await i2cSlave.write8(0x2d,0x01);
    await i2cSlave.write8(0x2e,0x01);
    await i2cSlave.write8(0x2f,0x01);
    await i2cSlave.write8(0x30,0x01);
    await i2cSlave.write8(0x31,0xff);
    await i2cSlave.write8(0x32,0x02);
    for(var i=0;i<12*2;i+=2){
      var address = 0x41+i;
      await i2cSlave.write8(address,0x0f);
      await i2cSlave.write8(address+1,0x0a);
    }
    await i2cSlave.write8(0x5d,0x04);
    await i2cSlave.write8(0x5e,0x0c);
  }

  read(i2cSlave) {
    i2cSlave.read16(0x00).then((v)=>{
      var array = [];
      for(var cnt = 0;cnt < 12;cnt ++){
        array.push(((v & (1 << cnt)) != 0)?true:false);
      }
      if (!this.value || (JSON.stringify(array) != JSON.stringify(this.value))) {
        this.set('value', array);
      }
    })
  }

  defaultInterval() {
    return 1000;
  }
}
window.customElements.define('grove-touch', GroveTouch);
```

共通化のポイントは以下のような感じです。

- 値のプロパティを `value` で共通化
- エレメントのプロパティをWebI2cSensorElementで定義
- ポートのオープンや、web-i2cエレメントとやりとりしてポートを設定するところなどをWebI2cSensorElementで定義
- 値読み込みのインターバル制御をWebI2cSensorElementに移譲

2つのI2Cセンサータグを作ってみて、このぐらいは共通化しても大丈夫そうだし、便利そうだなと思っています。

#### on-change 対応

現時点はアプリもPolymerで書いているので、値の変更はデータバインディングでできているのですが、最終的にはタグから `change` イベントを飛ばすようにする予定です。

つまり利用者はPolymerを使わなくても、以下のようなHTMLコードを追加するだけで利用可能になることを想定しています。

```html
<html lang="en">
  <head>
    <script src="node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
    <script src="node_modules/@chirimen/polyfill/polyfill.js"></script>
    <script type="module" src="node_modules/@chirimen/web-i2c/web-i2c.js"></script>
    <script type="module" src="node_modules/@chirimen/grove-touch/grove-touch.js"></script>
    <script type="module" src="node_modules/@chirimen/grove-gesture/grove-gesture.js"></script>
  </head>
  <body>
    何かしらのアプリ
    

    <web-i2c>
      <div slot="no-web-i2c">
        このデバイスはCHIRIMENではありませんが、xxxxx。
      </div>
      <grove-touch slave-address="0x5a"></grove-touch>
      <grove-gesture slave-address="0x73"></grove-gesture>
    </web-i2c>
    
    <script>
      window.addEventListener('WebComponentsReady', e => {
        document.querySelector('grove-touch').addEventListener('change', e => {
          // 値が変わったときの処理
        });
      });
    </script>
  </body>
</html>
```

## さいごに

WebComponentsを作るためのPolymerについては、 [PolymerJapan](https://polymer-jp.org/) コミュニティで活動しています。
毎月の集まりを [Polymer.co-edo](https://polymercoedo.doorkeeper.jp/)でも開催しているので、参加を待っています。

また[CHIRIMEN](https://chirimen.org/)で、ブラウザからセンサーを動かしたいというような活動に興味があれば、コミュニティに参加ください。

どちらもユーザー主導で活動していますので、みなさまの参加をお待ちしております。
