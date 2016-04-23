---
author: sizuhiko
comments: true
date: 2008-04-22 07:04:25+00:00
slug: flex2-coverflow-2-ide
title: Flex2でCoverFlowクローンを作る (2) ～IDEを導入する
wordpress_id: 7
categories:
- 未分類
tags:
- CoverFlow
- FlashDevelop
- Flex
---

<!-- more -->現在、[オブジェクト倶楽部](http://www.ObjectClub.jp)のメールマガジンで連載している「Flexで体験するリッチクライアント」を補足するTechnoteです。  

第二回は、FlexでFlashコンポーネントを開発するのに便利なIDEを導入する手順を整理します。  

  



### ■FlashDevelopとは


  

FlashDevelopは、フリーで利用可能なFlashの統合開発環境です。Flex Builderは有償版なので、タダで開発したいという人は、このツールを使うのがオススメです。Flex2,Flex3に必要なmxmlやActionScriptのコード補完機能などプログラミングをするには十分な機能を持っています。メニューなどすべて英語表記ですが、Eclipse IDEと操作性は似ているので、大きな問題はないでしょう。  

  



### ■ダウンロードする


  

[FlashDevelopのサイト](http://www.flashdevelop.org/)へアクセスします。
![](/images/blog/images/flex2_coverflow_2/download1.jpg) 最新版を入手するには、Releasesを選択します。  
![](/images/blog/images/flex2_coverflow_2/download2.jpg) 現時点の最新版は3.0.0 Beta7です。まだBetaですが3系を使うことを推奨します。  
![](/images/blog/images/flex2_coverflow_2/download3.jpg) ダウンロードのリンクをクリックすると、ダウンロードが始まります。ダウンロードが終わるまでしばらく待ちましょう。  

  



### ■インストールする


  

ダウンロードしたファイル(現時点ではFlashDevelop-3.0.0-Beta7.exe)を実行します。  
![](/images/blog/images/flex2_coverflow_2/install1.jpg) 画面の指示にしたがって進んで行くとインストールが始まります。  
![](/images/blog/images/flex2_coverflow_2/install2.jpg) こちらはFlex本体と違って、それほど時間もかからずに終了します。  

  



### ■はじめにすること


  

FlashDevelopはFlex SDKの環境は含んでいないので、パスを設定する必要があります。  
![](/images/blog/images/flex2_coverflow_2/dev1.jpg) まずインストールしたFlashDevelopを実行します。  
![](/images/blog/images/flex2_coverflow_2/dev2.jpg) Tools - Program Settings... （もしくはF10）を選択します。  
![](/images/blog/images/flex2_coverflow_2/dev4.jpg) 左側のタブで「AS3Context」を選択し、Flex SDK Locationの値を設定します（デフォルトはc:flex_sdkなどになっています）。もしFlex Builderをデフォルトインストールしたなら、C:Program FilesAdobeFlex Builder 3sdks2.0.1 になってると思うので、Flex2のトップディレクトリを選択します。今回はメルマガがFlex2で先行しているので、Flex2で進めます。設定したらCloseで設定画面を閉じます。特に保存とかないのですが、設定は無事保存されるので気にしないことにします。
  



### ■次回


  

Flex2を使って画像を表示する簡単なサンプルからスタートしていきます。
