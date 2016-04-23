---
author: sizuhiko
comments: true
date: 2008-09-13 05:09:10+00:00
slug: flex2-coverflow-8
title: Flex2でCoverFlowクローンを作る (８) ～画像を重ね合わせる
wordpress_id: 18
categories:
- 未分類
tags:
- CoverFlow
- Flex
---

<!-- more -->現在、[オブジェクト倶楽部](http://www.objectclub.jp/)のメールマガジンで連載している「Flexで体験するリッチクライアント」を補足するTechnoteです。  

第八回は、画像を重ね合わせる手法を整理します。  

  



### ■今回サンプルの完成イメージ


  









  

画像をクリックしながら、左右に動かしたり、勢い良く左右に動かしたりすると、CoverFlowのように加速効果付きでスクロールします。
  

  
前回は画像を掴んで勢い良く放したり、掴みながらスクロールさせるといった動作を、マウスイベントを取得して実装してみました。今回は、画像を重ね合わせていきます。  

  



### ■ファイルの準備


  

プロジェクトファイルを[ダウンロード](/images/blog/images/flex2_coverflow_8/reflector.zip)して、任意のディレクトリで解凍します。


  * reflector.as3proj
  * reflector.mxml
  * ImageReflector.as
  * TransformUtil.as
  * CoverFlowLayout.as
  * RepeaterHBox.as

新しいファイルCoverFlowLayoutとRepeaterBoxの2つが追加になっています。追加になったファイルは後ほど詳しく解説します。  

reflector.as3projをダブルクリックすると、FlashDevelopが実行されます。  

  



### ■選択している画像以外の表示幅を狭くする


画像を重ね合わせるときに、まずはじめに考える方法は、標記のとおりだと思います。そこで、今回はoverrlapWidthをいう変数を使って、重ね合わせの幅を定義してみました。実際に適用する箇所は、


  * measure() -- 実際に描画する縦横サイズを返す処理
  * transformImage() -- 画像を斜めに描画する処理
  * animateTransform() -- アニメーション描画を開始する処理

です。画像は左右の両側から重なるイメージなので、重なり幅が20とすると、実際の画像幅は倍の40必要となりますので、画像の幅として*2をしています。  


    
    
    measuredWidth = overrlapWidth*2;
    


このように修正してプレビューしてみるとどうなるでしょうか？
![](/images/blog/images/flex2_coverflow_8/example1.jpg) 
  

残念ながら赤丸で囲ったように、選択画像より右側の並びが変になってしまいます。
  



### ■要素のZ順序を入れ替える


Window操作のプログラミングをした経験のある人なら、この状況を標記のとおり解決できる、と推測するでしょう。そしてもちろんFlexでも同様の機能を持っています。  

そこで以下のようにmxmlのonCreationComplete()を変更してみました。

    
    
    private function onCreationComplete(event:FlexEvent):void {
        if(event.currentTarget.repeaterIndex >= (dp.length - 1)){
            // 最初の重なりは一番右の項目が下になるよう（逆順）にする。
            for(var i:int = 0; i < (dp.length/2); i++) {
                h_frame.swapChildren(imageReflector[i], imageReflector[dp.length-i-1]);
            }
            h_frame.invalidateProperties();
            // 重なりスワップ終了
            initScroll();
        }
    }
    


このように修正してプレビューしてみるとどうなるでしょうか？![](/images/blog/images/flex2_coverflow_8/example2.jpg) 
  

うわぁーーーーーー、なぜか表示する順番が変になってしまいました。なぜこうなるのでしょうか？
  



### ■Flexはオープンソースだから、ソースを読めばいいじゃないか


Flexの各クラスはcoreでない限りソースが提供されています。ともかくh_frameのクラスであるHBOXの描画について調べてみましょう。  

frameworks/source/mx/containers/HBox.asにはほとんど処理はないので、親クラスであるBoxのコードを見ます。

    
    
    override protected function updateDisplayList(unscaledWidth:Number,
                                                      unscaledHeight:Number):void
    {
        super.updateDisplayList(unscaledWidth, unscaledHeight);
    
        layoutObject.updateDisplayList(unscaledWidth, unscaledHeight);
    }
    


描画のコードはこのようになっていて、実際の描画はどうもlayoutObjectがやっているようです。そこでmx.containers.utilityClasses.BoxLayoutのupdateDisplayListを見てみると、

    
    
    for (i = 0; i < n; i++)
    {
        obj = IUIComponent(target.getChildAt(i));
        top = (h - obj.height) * verticalAlign + paddingTop;
        obj.move(Math.floor(left), Math.floor(top));
        if (obj.includeInLayout)
            left += obj.width + gap;
    }
    


のように、getChildAtを使って、子要素の順番（=Z順）に表示位置の計算をしているのがわかります。swapChildrenは子要素の順番を変更することで描画の重なりを変更しようとしているので、2番目のプレビューのようになるのはやもえません。ではどのようにHBoxに定義された順番（レイアウト計算順序）とZ順（表示順序）を別々に管理し、描画したら良いのでしょうか？
  



### ■Repeaterを使うHBox、RepeaterHBoxを作る


つまりこういうことです。HBox内に要素を並べるとき、通常は要素の並びを持っている訳ではありませんが、HBox内でRepeaterを使っているなら、要素の順番はRepeater自信が保持しています。  

そこでRepeaterHBoxを作ることにします。今回は簡単に要素の並びを取得できるように、mxml上のパラメータrepeaterArray="{imageReflector}"でクラス変数に配列を渡すことにしました。

    
    
    <local:RepeaterHBox id="h_frame" height="400" width="500" backgroundColor="0x000000" paddingLeft="200" paddingRight="200" verticalScrollPolicy="off" scroll="onScroll(event)" mouseUp="onMouseUp(event)" mouseDown="onMouseDown(event)" mouseMove="onMouseMove(event)" mouseOut="onMouseOut(event)"  initialize="onInitialize()" repeaterArray="{imageReflector}" >
        <Repeater id="rp" dataProvider="{dp}">
            <local:ImageReflector id="imageReflector" asinId="{rp.currentItem}" creationComplete="onCreationComplete(event)" click="changeSelect(event)" />
        </Repeater>
    </local:RepeaterHBox>
    


RepeaterHBoxの特徴は、HBoxを継承しHBoxである機能はもちろん、前節で問題となっていた、BoxLayoutを変更することです。RepeaterHBoxでは独自のレイアウト処理CoverFlowLayoutを使っています。CoverFlowLayoutはBoxLayoutの一部を変更したいだけなので、BoxLayoutのソースコードを丸ごとコピーしてきて、前記のコードを下記
のように修正します。

    
    
    for (i = 0; i < n; i++)
    {
        obj = IUIComponent(target.repeaterArray[i]);
        top = (h - obj.height) * verticalAlign + paddingTop;
        obj.move(Math.floor(left), Math.floor(top));
        if (obj.includeInLayout)
            left += obj.width + gap;
    }
    


表示順を変更しても、リピーターの定義（target.repeaterArray）順に要素の表示位置（レイアウト）を計算すれば問題は解決します。
  



### ■mx_internal::で内部要素にアクセスする


RepeaterHBoxクラスでは見慣れない記述mx_internalがあると思います。

    
    
    mx_internal::layoutObject = new CoverFlowLayout();
    


実はこのmx_internalは、Flexの内部クラスに直接アクセスするために、重要な記述です。今回のように標準コンポーネントをカスタマイズする場合、通常のメソッドオーバーライドだけでは、どうしてもうまくカスタマイズできない場合があります。例えば、coreの中の変数だったり、以下のように内部名前空間に変数が定義されている場合です。

    
    
    /**
     *  @private
     */
    mx_internal var layoutObject:BoxLayout = new BoxLayout();
    


これはBoxクラスで、レイアウトオブジェクトを定義している例ですが、要はprivate変数として扱っているものなのです。ただこれだと独自レイアウトによる描画ができないので、上記のようにmx_internal::layoutObjectと書くことで、内部スコープの変数値を上書きできるのです。
  

  



### ■クロスドメインの注意事項


amazonの画像サーバのcrossdomain.xmlは画像サーバ内からだけしか参照できないので、ここで作成したSWFファイルをサーバにアップロードしてもうまく表示できません。  

本記事上の完成イメージは、PHPサイトでプロキシしています。  

まずPHPのコードは過去記事を参考にしてください。  

  



### ■次回予告


次回で最終回、最後にamazonからタイトル、著者を取り出して表示する機能を実装してみます。
  

