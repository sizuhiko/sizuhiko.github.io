---
author: sizuhiko
comments: true
date: 2008-04-22 08:04:50+00:00
slug: flex2%e3%81%a7coverflow%e3%82%af%e3%83%ad%e3%83%bc%e3%83%b3%e3%82%92%e4%bd%9c%e3%82%8b-3-%ef%bd%9e%e7%94%bb%e5%83%8f%e3%82%92%e8%a1%a8%e7%a4%ba%e3%81%99%e3%82%8b
title: Flex2でCoverFlowクローンを作る (3) ～画像を表示する
wordpress_id: 8
categories:
- 未分類
tags:
- CoverFlow
- Flex
---

<!-- more -->現在、[オブジェクト倶楽部](http://www.objectclub.jp/)のメールマガジンで連載している「Flexで体験するリッチクライアント」を補足するTechnoteです。  

第三回は、Flashコンポーネント内に画像を表示する手順を整理します。  

  



### ■今回サンプルの完成イメージ


  









  
単純に画像が表示されるだけですが、まずはじめの一歩として取り組んでみましょう。  

  



### ■ファイルの準備


  

プロジェクトファイルを[ダウンロード](/images/blog/images/flex2_coverflow_3/reflector.zip)して、任意のディレクトリで解凍します。


  * reflector.as3proj
  * reflector.mxml
  * ImageReflector.as

reflector.as3projをダブルクリックすると、FlashDevelopが実行されます。  

  



### ■動かしてみよう！


  

![](/images/blog/images/flex2_coverflow_3/test.jpg) 
細かい解説は後にして、ひとまずソースコードを記述したら、コンパイルです。
ツールバーの再生ボタンをクリックするとコンパイルが始まり、下ペインにコンパイルメッセージが出力されます。
「reflector.swf」ができあがると、自動的に再生がはじまり、  
![](/images/blog/images/flex2_coverflow_3/run.jpg) 
amazon.comから取得したWeb2.0ビギナーズバイブル[*1]の書籍画像が表示できましたね。  

  



### ■カスタムコントロールを作るなら、UIComponent


Flex2でカスタムコントロールを作るには、いくつか方法がありますが、本サンプルのように、UIComponentクラスを継承するのが最も簡単です。UIComponentはPlayerからのイベントを制御してくれるので、カスタムコントロールを作る場合、特定のメソッドのみオーバライドすれば良い事になります。また、表示する画像自体は、_contentという属性に持たせることにします。UIComponentは表示要素のスーパークラスです。
  



### ■コントロールの値を変更する、commitProperties


commitProperties()メソッドをオーバライドして、このカスタムコントロールが持つ値を設定します。FlashPlayerがmxml上の
    
    <local:ImageReflector />

を解析すると、内部的にはaddChild() メソッドを使用してコンポーネントが追加されまず。するとFlexはinvalidateProperties()を自動的に呼び出します。  

つまり、必ず１度は最初にcommitProperties()が呼び出されるのです。カスタムコントロールの場合、コンストラクタでなく、ここで描画情報を初期化します。  

まず、画像(Imageクラス)を実体として、UIComponentを作成します。

    
    _content = UIComponent(new Image());


Amazonの画像を指定します。IDataRenderer.dataに画像のパスを指定すると、実際の描画はImageクラスが担当してくれます。

    
    IDataRenderer(_content).data = "http://ec1.images-amazon.com/images/P/4839923221.09._SL200_SCZZZZZZZ_.jpg";


カスタムコントロールの要素として、自身の子エレメントとして追加します。

    
    addChild(_content);


つまり、mxml上では、

    
    
          <local:ImageReflector >
            <Image />
          </local:ImageReflector >
    


と書いたのと同じような状態となります。  

最後に、invalidateDisplayList()メソッドを呼びます。
invalidateDisplayList()を呼び出すと、画像の描画サイズを調整するため、updateDisplayList()が呼ばれる仕組みとなっています。  

  



### ■コントロールのサイズを指定する、measure


invalidateProperties()では、commitProperties()の後にmeasure()メソッドの呼び出されます。このメソッドではFlashPlayer上に表示するサイズを設定する必要があるので、_contentから実際の画像サイズを取得して、measuredHeightとmeasuredWidthのプロパティに値を設定します。  

  



### ■画像サイズを調整する、updateDisplayList


commitProperties()の最後で、子要素の描画を行うためにinvalidateDisplayList()を呼び出しています。ここでは主に子要素の表示サイズ、位置を調整します。  

親要素のどの辺に、どのくらいの大きさで表示するか指定するのです。今回は画像を表示するだけなので、画像サイズを取得して、UIComponentのサイ
ズに設定します。

    
    _content.setActualSize(contentWidth,contentHeight);


  



### ■まとめ


今回は画像を表示するだけだったので、これほどコードを記述しなくても、もっと簡単な方法もあったのですが、この過程は鏡面効果画像を表示するまでに重要なものです。いよいよ次回は画像を鏡面加工しますので、楽しみに待っていてください。  

  



#### [1]:Web2.0ビギナーズバイブル


著者名：伊藤 浩一、大津 真、岸田 健一郎、まえだ ひさこ、安井 力  

Web2.0に不可欠なオープンソース技術にはどのようなものがあるのか、そして、それらを使用して具体的にどのようなWebアプリケーション作成ができるのかということを一冊の書籍としてまとめたものです。  

[http://www.amazon.co.jp/exec/obidos/ASIN/4839923221/xpjp-22](http://www.amazon.co.jp/exec/obidos/ASIN/4839923221/xpjp-22)
