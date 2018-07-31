---
title: CHIRIMEN Raspi setup
date: 2018-07-28 04:27 UTC
tags:
- CHIRIMEN
- IoT
- WoT
- MFTokyo2018
---

[Maker Faire Tokyo 2018](http://makezine.jp/event/mft2018/)に[CHIRIMEコミュニティ](http://makezine.jp/event/mft2018/)で参加するためのデモをセットアップしたときのメモ。

## 購入したもの

- [Raspberry Pi 3 model B+](https://www.sengoku.co.jp/mod/sgk_cart/detail.php?code=EEHD-4KC6)
- [Adafruit PiTFT Plus 480x320 3.5インチTFT](https://www.sengoku.co.jp/mod/sgk_cart/detail.php?code=EEHD-55ZD)
- [Adafruit GPIOリボンケーブル - 26ピン](https://www.sengoku.co.jp/mod/sgk_cart/detail.php?code=EEHD-56B6)
- [TOSHIBA microSDHC 16GB](https://www.amazon.co.jp/dp/B078JKJP8D)

## インストール

### イメージファイルのダウンロード

[CHIRIMEN公式サイトのダウンロードページ](http://download.chirimen.org/release/raspberry_pi_3/)から、[CHIRIMEN_Raspberry_pi_3_20180716.zip](http://download.chirimen.org/release/raspberry_pi_3/CHIRIMEN_Raspberry_pi_3_20180716.zip)をダウンロードします。
Raspberry Pi 3 model B+ で利用できる CHIRIMEN のイメージファイルは現時点では評価版です。

### イメージファイルの書き込み

[最近のRaspberry Piイメージ（Raspbian）をインストールするメモ](https://www.1ft-seabass.jp/memo/2018/07/23/raspbian-install-201807-memo/)が参考になります。
[Etcher](https://etcher.io/)を使って、ダウンロードしたイメージファイルをmicroSDカードに書き込みます。

### SSHの有効化

Raspbianはセキュリティを考慮してデフォルトではSSHが無効になっているので、
SDカードをマウントして、以下のコマンドを実行しておきます。

```sh
$ touch /Volumes/boot/ssh
```

## 起動

microSDカードをRaspberry Pi 本体に挿して、起動します。
Raspberry Piにsshで入るため、有線LANをMacと接続しました。
[MacとRaspberry piをインターネット共有でつないでみる](https://qiita.com/fumishitan/items/88bb832cb08fe8016f66)が参考になります。

```sh
$ ssh pi@192.168.2.2
```

初期パスワードは `rasp` になっています。

3.5TFTを有効にするため、[公式サイトのEASY INSTALL](https://learn.adafruit.com/adafruit-pitft-3-dot-5-touch-screen-for-raspberry-pi/easy-install-2)を参考に、ドライバーをインストールします。

```sh
cd ~
wget https://raw.githubusercontent.com/adafruit/Raspberry-Pi-Installer-Scripts/master/adafruit-pitft.sh
chmod +x adafruit-pitft.sh
sudo ./adafruit-pitft.sh
```

で、このままでは X を利用できないので [Raspberry Pi Zero(W)でPiTFTを使う - X Windowsの描画](https://qiita.com/hishi/items/bdd630666277e4f8162a#x-windows%E3%81%AE%E6%8F%8F%E7%94%BB)を参考に、設定の変更とタッチスクリーンの調整を行います。

## ソフトウェアキーボードのインストール

[Raspberry Piでソフトウェアキーボードをインストール&起動する方法](https://darmus.net/raspberry-pi-matchbox-keyboard-install/)を参考に、Matchbox Keyboardをインストールします。

## デモプログラムの作成

Web Components(Polymer) meets REAL WORLD ということで、2年連続 HTML のパーツを組み合わせることで WoT を体験できるようなデモを実施予定です。
昨年は WebGpio タグを作ったので、今年は WebI2c タグを予定しています。
近日コードは公開予定！


