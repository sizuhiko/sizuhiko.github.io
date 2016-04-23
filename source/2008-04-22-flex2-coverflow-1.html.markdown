---
author: sizuhiko
comments: true
date: 2008-04-22 03:04:15+00:00
slug: flex2-coverflow-1
title: 'Flex2でCoverFlowクローンを作る (1) ～環境を整える '
wordpress_id: 6
categories:
- 未分類
tags:
- CoverFlow
- Flex
---

<!-- more -->現在、[オブジェクト倶楽部](http://www.ObjectClub.jp)のメールマガジンで連載している「Flexで体験するリッチクライアント」を補足するTechnoteです。  

今回は第一回として、FlexでFlashコンポーネントを開発するための環境を整える手順を整理します。  

  



### ■Flexとは


  

Flexは、プログラミング言語を使ってFlashアプリケーションを作るための製品群を表すもので、Flex製品ラインナップには、以下のようなものがあります。  



  * Adobe Flex SDK (ソフトウェア開発キット)
  * Adobe Flex Builder
  * Adobe Flex Data Services
  * Adobe Flex Charting
メルマガ執筆時点の正式版はFlex 2でしたので、このシリーズはFlex2でテストされたコードで記述されていますが、現在Flex 3がAirとして正式公開されています。おそらくFlex3でも動きます。  

  



### ■ダウンロードする


  

早速Flexで開発する環境を作っていきましょう。本シリーズではWindows XP Proを使った手順を説明をしていきます。  

  

[Adobe Flexのサイト](http://www.adobe.com/jp/products/flex/)へアクセスします。  

  

Flex2の頃、ダウンロードページには


  * Flex Builderを30日間無償で試用（SDK込み）
  * Flex 2 SDKを利用して、無償でFlexアプリケーションの開発・実装をスタート
  * Flex Data Services 2 Expressエディションをダウンロード（無償）
の3つのコンテンツがあったのですが、現在は、以下のようなページに変わっています。  

![](/images/blog/download_page.jpg) 
なお、ダウンロードページへ行くには、Adobe IDでログインを求められます。Adobe ID自体の登録は無料ですので、まだな人は登録をしてからログインしてください。仕方がないので、日本語 | Windows | 425.0MB を選択して、ダウンロードします。またSDKだけダウンロードできるようになってほしいですね。。。  



### ■インストールする


  

おそろしく大きいファイルFB3_WWEJ.exeのダウンロードが終了したら、ファイルを実行します。![](/images/blog/download_page3.jpg) 
インストールプログラムの実行にしばらく時間がかかります。。。。。。  
![](/images/blog/download_page4.jpg) 
日本語を選択してインストールを開始します。その後、ライセンスに同意とか、インストールする場所とか聞いてくるので、お好みで進んでいきます。インストールを開始すると、以下のような画面になります。  
![](/images/blog/download_page5.jpg) 
ボクのマシンは結構スペックが良いと思っているのですが、それでも20分近く時間がかかりました。気長に待ちましょう。。。。  
![](/images/blog/flexdir.jpg) インストールが完了すると、自動的にインストールしたディレクトリ（デフォルトだとC:Program FilesAdobeFlex Builder 3）が開きます。よくみると、ディレクトリ名にsdksというフォルダがあるのに気が付きます。ディレクトリを移動すると、  
![](/images/blog/flexdir2.jpg) のようになっていて、なんだFlex2もあるじゃないですか。それぞれのバージョンディレクトリの下、たとえば2.0.1frameworkslocaleには日本語のファイルも入っているようで、コンパイルメッセージも無事日本語で表示できそうです。しかしそうなると、やっぱり個別にインストールさせてほしい。。。。とにかくダウンロードとインストールは辛抱です・・・  



### ■次回は


  

Flex Builderは便利だし使いやすいのですが、有償なので仕事以外では使うのをためらいます。そんなときはフリーの開発環境FlashDevelopを使うと良いと思います。次回はこのFlashDevelopのインストール方法を紹介したいと思います。
