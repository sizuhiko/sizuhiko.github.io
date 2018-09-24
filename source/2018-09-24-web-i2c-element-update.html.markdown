---
title: web-i2cエレメントをより使いやすくしました。
date: 2018-09-24 06:41 UTC
tags:
- CHIRIMEN
- WebComponents
---

先日の[Maker Faire Tokyo 2018 に CHIRIMENコミュニティで参加しました](/2018/08/13/maker-faire-tokyo-2018.html)で `web-i2c-element はどうなの？` 
に記述した改良ポイントを使った[chirimen-piano](https://github.com/sizuhiko/chirimen-piano)をアップしました。

### 変更したポイント：

変更の概要は以下のとおりです。

- `no-web-i2c` スロットを指定すると、非対応メッセージを表示できるようになった
- `WebI2cSensorElement` を使って、センサー毎の共通実装をなくし、より簡単にセンサーのカスタムエレメントが実装できるようになった
- Polymer使ってなくても、タグだけを使ってセンサーの値が取得できるようなサンプルに変更した

では、それぞれの変更を詳しく見ていきましょう。

### 非対応メッセージの表示

[chirimen-piano](https://github.com/sizuhiko/chirimen-piano)のリポジトリにある[index.html](https://github.com/sizuhiko/chirimen-piano/blob/master/index.html)ファイルを見てましょう。

```html
<web-i2c>
  <grove-touch slave-address="0x5a"></grove-touch>
  <grove-gesture slave-address="0x73"></grove-gesture>
  <div slot="no-web-i2c">
    このデバイスはCHIRIMENではありませんが、ピアノ演奏はお楽しみいただけます。
  </div>
</web-i2c>
```

`web-i2c` タグの内側に `no-web-i2c` というslot名のタグを記述することで、
もしCHIRIMEN以外のデバイス（例えばPCなど）から、このページを表示するとメッセージを表示することができるようになります。
試しに、PCから[chirimen-pianoのデモページ](http://blog.open.tokyo.jp/chirimen-piano/)にアクセスしてみてください。

### WebI2cSensorElementを利用したカスタムエレメントの記述

最初のバージョンでは、 `PolymerElement` を使っていたため共通的な実装が多くなっていたのですが、
いくつかのセンサー実装をしてみて共通化できそうな箇所もわかってきたので、I2C用の親クラスを作ることにしました。

`WebI2cSensorElement` を使ったセンサーのクラスとして、GROVEタッチとGROVEジェスチャーのカスタムエレメントを作りました。

例として[chirimen-piano](https://github.com/sizuhiko/chirimen-piano)のリポジトリにある[grove-touch.js](https://github.com/sizuhiko/chirimen-piano/blob/master/src/chirimen-piano-app/grove-touch.js)ファイルを見てましょう。

```js
class GroveTouch extends WebI2cSensorElement {
  async init() {
    this._autoRead = true;
    await this._i2cSlave.write8(0x2b,0x01);
    await this._i2cSlave.write8(0x2c,0x01);
    await this._i2cSlave.write8(0x2d,0x01);
    await this._i2cSlave.write8(0x2e,0x01);
    await this._i2cSlave.write8(0x2f,0x01);
    await this._i2cSlave.write8(0x30,0x01);
    await this._i2cSlave.write8(0x31,0xff);
    await this._i2cSlave.write8(0x32,0x02);
    for(var i=0;i<12*2;i+=2){
      // console.log(i);
      var address = 0x41+i;
      // console.log(address);
      await this._i2cSlave.write8(address,0x0f);
      await this._i2cSlave.write8(address+1,0x0a);
    }
    await this._i2cSlave.write8(0x5d,0x04);
    await this._i2cSlave.write8(0x5e,0x0c);
  }
    
  async read() {
    const value = await this._i2cSlave.read16(0x00);
    // console.log(value);
    var array = [];
    for(var cnt = 0; cnt < 12; cnt ++){
      array.push(((value & (1 << cnt)) != 0)?true:false);
    }
    if (!this.value || (JSON.stringify(array) != JSON.stringify(this.value))) {
      this._setValue(array);
    }
  }
}

window.customElements.define('grove-touch', GroveTouch);
```

まず `WebI2cSensorElement` を継承したクラスを定義します。
このクラスには2つのオーバライド可能なメソッドがあります。

- init
- read

どちらも `async` メソッドにすることで I2Cスレーブデバイスからの応答を待ち合わせる(`await`)ことができるようになっています。

`WebI2cSensorElement` は、 `init` 呼び出し時にメンバー変数として `_i2cSlave` が利用可能になっています。
これはWeb I2Cのスレーブオブジェクトで、どんなメソッドが使えるかは[Web I2C API Specification](https://rawgit.com/browserobo/WebI2C/master/index.html)の `4.6 Reading the value` や `4.8 Writing a value` を参照ください。
サンプルコードの `slaveDevice` が `_i2cSlave` と同じものになります。

#### init を実装する

init ではI2Cデバイスの初期化コードを記述します。
とくに戻り値は必要ありません。

もしセンサーが読み取り可能なら、 `this._autoRead = true;` のように設定してください。
これを設定すると、インターバル間隔(デフォルトは100ミリ秒)ごとに `read` メソッドを呼び出してくれます。

#### read を実装する

init で `_autoRead` を `true` に設定した場合、インターバル間隔ごとに呼び出されます。
センサーの値を読み取って、値が変わった場合は `this._setValue(value)` を呼び出してください。
エレメントの `value` プロパティに値が保持されると同時に、 `value-changed` イベントが発行されます。

### 普通のHTMLからセンサーを取り扱う

ふたたび[chirimen-piano](https://github.com/sizuhiko/chirimen-piano)のリポジトリにある[index.html](https://github.com/sizuhiko/chirimen-piano/blob/master/index.html)ファイルを見てましょう。

```html
<script>
  document.querySelector('grove-touch').addEventListener('value-changed', e => {
    document.querySelector('chirimen-piano-app').touchChanged(e.detail.value);
  });
  document.querySelector('grove-gesture').addEventListener('value-changed', e => {
    document.querySelector('chirimen-piano-app').gestureChanged(e.detail.value);
  });
</script>
```

センサー値の変更を受け取るには、センサーエレメントに対して `value-changed` イベントのリスナーを設定します。
値はイベントオブジェクトの `detail.value` に入っていて、センサーによってセットされる値（型も含め）が違います。

たとえば `grouve-touch` エレメントは、タッチセンサーの数分のBoolean配列がセットされ、 `grove-gesture` エレメントは、発生したジェスチャー名がセットされます。

### さいごに

このようにHTMLからセンサーの値をコントロールできたり、センサーのエレメントを簡単に実装できるようになりました。
今後は、それぞれのエレメントやベースクラスを `npm install` で取得できるようにしたいと思っています。

また、以前作った `WebGpioElement` も `Polymer3` で書き換えていきたいなと思っています。

WebComponents と CHIRIMEN の融合は、私がそれぞれのコミュニティに参加して得られたもののアウトプットです。
もしこれらの活動に興味がありましたら、[Polymer Japan](https://polymer-jp.org/) [CHIRIMEN Open Hardware](https://chirimen.org/) [Polymer.co-edo](https://polymercoedo.doorkeeper.jp/) などの活動に参加ください。
