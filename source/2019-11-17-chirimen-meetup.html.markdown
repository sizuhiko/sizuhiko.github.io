---
title: CHIRIMENおさわり＆もくもく会 〜Raspberry Pi 4 ＆ Jetson対応記念〜に参加しました
date: 2019-11-17 07:40 UTC
tags:
- CHIRIMEN
- IoT
- WoT
---

[CHIRIMENおさわり＆もくもく会 〜Raspberry Pi 4 ＆ Jetson対応記念〜](https://chirimen-oh.connpass.com/event/155170/)に参加しました。

## やったこと1 : 新しいハードのお触り

現在公式サポートしているRaspberry Pi 3より、どのくらい速く動くのか確認したかったので、参加しました。
自分の作成した、CHIRIMEN Piano, CHIRIMEN Guitar で検証です。

結果としてはレスポンスが速くなっていて、自作楽器にはもってこいでした。
私のはフロントをWebComponentsで作っているので、スペックの弱いマシンで動かすとモッサリするのですが、これなら良いと思いました。

## やったこと2 : WebGpioエレメントとWebI2Cエレメントのパッケージ化

これまでは楽器アプリ内にて普通のエレメントとして作っていましたが、パッケージ化も進めています。
まずはWebGpio。
とりあえずTypeScript + LitElement + Rollupで。

[sizuhiko/WebGpioElement](https://github.com/sizuhiko/WebGpioElement/tree/develop)で開発を進めています。
まだReadだけ。Write I/Fもそろそろ書きます。

今の所は

```html
<web-gpio>
  <web-gpio-peripheral port="19" mode="out"></web-gpio-peripheral>
  <web-gpio-peripheral port="5" mode="in"></web-gpio-peripheral>
  <div slot="no-web-gpio">
    The device is not CHIRIMEN.
  </div>
</web-gpio>
```

こんな感じなんですが、

```html
<web-gpio>
  <web-gpio-out port="19"></web-gpio-out>
  <web-gpio-in port="5"></web-gpio-in>
  <div slot="no-web-gpio">
    The device is not CHIRIMEN.
  </div>
</web-gpio>
```

みたいなのも悪くないなーと思って検討中です。

何かアップデートあれば、随時記事にしていこうと思います。
