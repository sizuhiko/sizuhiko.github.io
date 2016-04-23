---
author: sizuhiko
comments: true
date: 2008-08-25 02:08:41+00:00
slug: flex2-coverflow-7
title: Flex2でCoverFlowクローンを作る (７) ～マウスイベントを取得する
wordpress_id: 17
categories:
- 未分類
tags:
- CoverFlow
- Flex
---

<!-- more -->現在、[オブジェクト倶楽部](http://www.objectclub.jp/)のメールマガジンで連載している「Flexで体験するリッチクライアント」を補足するTechnoteです。  

第七回は、マウスイベントを取得する手順を整理します。  

  



### ■今回サンプルの完成イメージ


  









  

画像をクリックしながら、左右に動かしたり、勢い良く左右に動かしたりすると、CoverFlowのように加速効果付きでスクロールします。
  

  
前回はスクロール処理とアニメーション効果を付けてみました。今回は画像を掴んで勢い良く放したり、掴みながらスクロールさせるといった動作を、マウスイベントを取得して変更していきます。今回は、mxmlファイルのみ修正していきます。  

  



### ■ファイルの準備


  

プロジェクトファイルを[ダウンロード](/images/blog/images/flex2_coverflow_7/reflector.zip)して、任意のディレクトリで解凍します。


  * reflector.as3proj
  * reflector.mxml
  * ImageReflector.as
  * TransformUtil.as

前回から修正したのは、reflector.mxmlだけです。  

reflector.as3projをダブルクリックすると、FlashDevelopが実行されます。  

  



### ■マウスの基本動作はクリックと移動


Flexではマウスを操作した結果は、マウスイベントをフックすると知ることができます。例えばmxmlで以下のように書いてみます。

    
    
    <HBox id="h_frame" height="400" width="500" backgroundColor="0x000000" 
          paddingLeft="200" paddingRight="200" verticalScrollPolicy="off" scroll="onScroll(event)" 
          mouseUp="onMouseUp(event)" mouseDown="onMouseDown(event)" mouseMove="onMouseMove(event)"  
          mouseOut="onMouseOut(event)" initialize="onInitialize()" >
    


このコードが今回修正したCoverFlow表示領域のボックス記述です。それぞれ


  1. mouseUp : マウスのボタンが押された後、放されたときに発生する  

  2. mouseDown : マウスとボタンが押されたときに発生する  

  3. mouseMove : マウスポインターが動いたときに発生する  

  4. mouseOut : マウスポインターがHBOXから出たときに発生する  


のような意味を持っています。
  

  



### ■マウスがどこで操作されたのか調べる


マウスイベントは表示領域で取得しますが、対象のHBOXには様々な子コントロールが含まれています。本サンプルで使っているのは


  * カバー写真
  * 横スクロールバー

です。マウスイベント(MouseEvent)がどこで発生したのかを調べるには、MouseEvent#targetで判断できますが、mxmlで定義されているクラス名を判断材
料にする場合は、MouseEvent#target.parentを使います。これは、target自体は表示リストノードであるため、  


    
    if(event.target.parent is HScrollBar)
    


のように記述する必要があります。ちょっと面倒ですね。。  

  



### ■マウスが領域外に出たときを考慮する


マウス操作を実装していて、忘れがちになるのが、この処理です。全画面表示で操作しているようなケースでは無縁ですが、実際はドラッグしながらウィンドウの外でマウスを放した、というケースは珍しくありません。このときイベントを拾っておかないと、再度マウスが領域に戻ったとき、マウスが押されたままと間違って判断してしまうことがあります。マウスが領域から出たら、一旦マウスを放した、という仮定が必要となります。マウスが領域外に出たかどうかはステージオブジェクトのマウスイベントをフックします。これは前述のMouseOutでHBOXから出たのか判断していますが、勢い良くマウスを動かして、一気にFlashPlayerから出てしまうと、MouseOutが呼ばれないことがあります。  

そのため、FlashPlayerからマウスが出た場合も想定して、

    
    h_frame.stage.addEventListener(Event.MOUSE_LEAVE, onMouseOut);
    

のように、記述します。  

似たイベントで、MouseEvent.ROLL_OUTがありますが、これはHTMLの:hoverのような実装をする際に使うイベントです。つまり対象のコントロールの上に来た・離れたというのを制御します。
  

  



### ■クロスドメインの注意事項


amazonの画像サーバのcrossdomain.xmlは画像サーバ内からだけしか参照できないので、ここで作成したSWFファイルをサーバにアップロードしてもうまく表示できません。  

本記事上の完成イメージは、PHPサイトでプロキシしています。  

まずPHPのコードは過去記事を参考にしてください。  

  



### ■次回予告


画像間の隙間をなくして、ホンモノのように画像が重なって表示されている効果を実装してみます。
