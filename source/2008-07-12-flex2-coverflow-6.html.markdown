---
author: sizuhiko
comments: true
date: 2008-07-12 08:07:32+00:00
slug: flex2-coverflow-6
title: Flex2でCoverFlowクローンを作る (６) ～アニメーション効果を付ける
wordpress_id: 15
categories:
- 未分類
tags:
- CoverFlow
- Flex
---

<!-- more -->現在、[オブジェクト倶楽部](http://www.objectclub.jp/)のメールマガジンで連載している「Flexで体験するリッチクライアント」を補足するTechnoteです。  

第六回は、アニメーション効果を付けて表示する手順を整理します。  

  



### ■今回サンプルの完成イメージ


  









  

画像をクリックしたり、スクロールバーを動かすと、CoverFlowのようにアニメーションで動きます。
  

  
前回は画像を台形加工して表示するサンプルを紹介しました。今回はその画像を左右にスクロールさせながら、アニメーションで選択・非選択の表示を変更していきます。今回も、カスタムコントロール(ImageReflector.as)とmxmlファイルの両方を修正していきます。  

  



### ■ファイルの準備


  

プロジェクトファイルを[ダウンロード](/images/blog/images/flex2_coverflow_6/reflector.zip)して、任意のディレクトリで解凍します。


  * reflector.as3proj
  * reflector.mxml
  * ImageReflector.as
  * TransformUtil.as

reflector.as3projをダブルクリックすると、FlashDevelopが実行されます。  

  



### ■アニメーション効果を簡単にするAnimateProperty


Flashでは、AnimatePropertyを使うと簡単にアニメーション効果を実現することができます。AnimatePropertyには、指定したプロパティの値を開始値から終了値まで変化させる機能があります。つまり位置を移動させたり、定型的に図形を変形したい場合など、特定のプロパティを非同期に操作することができるのです。  

refrector.mxmlでは以下のように記述しています。

    
    
    // アニメーションを開始する
    private function startAnimation(to:int):void
    {
        if(_animation != null && _animation.isPlaying) {
            _animation.end();
        }
        _animation = new AnimateProperty(h_frame);
        _animation.property = "horizontalScrollPosition";
        _animation.toValue = to;
        _animation.target = h_frame;
        _animation.duration = Math.max(300,Math.abs(to - h_frame.horizontalScrollPosition));
        _animation.easingFunction = mx.effects.easing.Quadratic.easeOut;
        _animation.play();
    }
    


_animation.propertyに指定したhorizontalScrollPositionという変数を、toの値まで変化させると記述することができます。しかもアニメーションはhorizontalScrollPositionが１ずつ加算されていくといった単純なものでなく、easingFunctionに値を指定することで増減する値をコントロールできます。easingFunctionにはFlexが用意してくれているものがあり、イーズアウト・イーズインと呼ばれています。これは変数の変化が加速なのか減速なのかといった指定ができ、イーズアウトはtoValueに近づくと値の変化が少なくなり減速感を与え、イーズインは変化が大きくなっていくことで加速感を与えることができます。AnimatePropertyクラスの値を設定したら、play()関数を呼ぶだけで勝手にhorizontalScrollPositionの値が変化していきます。  

このアニメーション効果は、表示領域を滑らかにスクロールするために使用しています。具体的には、


  * 最初に中央の画像を選択状態にして、センターに表示する
  * 画像がクリックされたら、その位置を選択状態にして、センターに表示する

という機能で使っています。

    
    
    // 表示領域をスクロールする
    private function scrollItem(pos:int):int
    {
        var scrollValue:int = 0;
        // 選択された画像の左端位置に、選択画像の幅/2を足して、表示領域の半分の幅戻ると、センターになる。
        scrollValue = imageReflector[pos].x + (imageReflector[pos].getChildAt(0).width / 2) - (h_frame.width / 2);
        startAnimation(scrollValue);
        return pos;
    }
    


  

  



### ■最初に中央の画像を選択状態にして、センターに表示する


各ImageReflectorが描画されたときに呼ばれるonCreationCompleteでは、これまで最後のImageReflectorが描画されたときに、中央の選択画像を決定していました。今度のサンプルでは、initScroll()関数を呼ぶように変更しています。initScroll()関数は、中央の画像を選択状態にして、そこまでスクロールさせる役割があるのですが、中央までスクロールさせるのには、そこまでの位置が確定していなければなりません。つまり、画像の横幅が固定であれば良いのですが、CoverFlowの中で縦横サイズがバラバラな写真に対応しようと思うと、描画が完了していなければ、位置を取得することができません。そこで、

    
    
    for(var i:int = 0; i < dp.length; i++) {
        if(!imageReflector[i].isCompleted()) {
            return callLater(initScroll); // まだ描画が終わってないので、遅延呼び出しする。
        }
    }
    selectedIndex = scrollItem(dp.length / 2);
    


と書くことで、全てのImageReflectorが描画完了するまで、待つことができます。callLaterはイベントキューの最後に、再度関数呼び出しを入れることで後で処理をさせることができます。そして、すべて描画できていたらscrollItemを呼んで、中央までスクロールしてやれば良いのです。  

ImageReflectorの中でisCompleted関数は、

    
    
    public function isCompleted():Boolean {
        if (!_invalidatedReflection) return false
    	
        return true;
    }
    


と書くことで、_invalidatedReflectionフラグがonになるまで待ってくれます。_invalidatedReflectionフラグは、amazonより画像を呼び出して、実際の描画が開始されたときにonとなるので、この時点で画像サイズなどが決定しています。  

  



### ■選択画像が変わったら、パラパラ漫画のように


選択画像がカーソルで前後にしか変化しないのであれば、中央位置と左右の画像だけを変化させれば良いのですが、マウスで２つ先、３つ先が選択されるケースを想定すると、現在位置から選択位置までパラパラ漫画のように画像をめくっていく必要があります。まず移動先が右なのか、左なのか判断して、どちら方向へスクロールを展開するか決めてやります。

    
     
    public function set selectedIndex(value:Number):void
    {
        if(!initFlag) {
            if(_selectedIndex > value) {
                leftScroll(_selectedIndex, value);
            }
            if(_selectedIndex < value) {
                rightScroll(_selectedIndex, value);
            }
        }
    }
    


後は実際にleftScrollやrightScroll関数で処理させます。例えば、右方法へアニメーションするには、

    
    
    // 右方向へアニメーションスクロールする
    private function rightScroll(from:int, to:int):void
    {
        var oldSelectIndex:int = from;
        for(var i:int = from+1; i <= to; i++) {
            _selectedIndex = i;
            imageReflector[0].selectedIndex = i;
            imageReflector[oldSelectIndex].doAnimate(i - oldSelectIndex);
            imageReflector[i].doAnimate(i-i);
            oldSelectIndex = i;
        }
    }
    


のように記述し、選択位置を変更（imageReflector[0].selectedIndex = i;）し、１つ前の選択画像（oldSelectIndex）を台形へ変形させ、新しい選択画像を台形から正面表示画像へ変形させます。変形させるときもアニメーション効果を付けるため、ImageReflectorクラスにdoAnimate()関数を用意しました。  

doAnimate()関数では、mxmlの横スクロールと同じように、AnimatePropertyを使っています。ただし台形を正面表示に変更したりといった、ある変数の値を単純に変更するだけではうまくいかないケースは多々あります。そこで、ここでのギミックは、animateTransformというプロパティのsetter/getterをfunctionで定義してしまうというものです。これは前回（第５回）でもふれましたが、クラスのメンバ変数を直接操作させないための手段である一方で、トゥーイングで変化する値を受け取って処理させることもできるのです。具体的に、animateTransformの値が変化するときには、以下の関数が呼ばれます。

    
    
    public function set animateTransform(value:Number):void
    {
        _animateTransform = value;
    	
        if (repeaterIndex == selectedIndex) {
            measuredWidth = value;
        }
        else {
            measuredWidth = tiltingWidth;
        }
        invalidateSize();
        transformImage(value);
    	
    }
    


選択画像なら、横幅をアニメーション値にし、そうでなければ台形変化後の幅にしてしまいます。後は、前回作成したtransformImage()関数へ値をアニメーション変化値を渡します。  

  



### ■実際に描画する


transformImage関数を修正して、アニメーション描画を行います。  

前回までと違うこところは、

    
    
    var percent:Number = (contentWidth - value) / (contentWidth - tiltingWidth);
    


のように、どのくらいの割合で値が変化しているか%値であらわし、それをtiltingMarginにかけて変化させています。  

実際、個別の描画シーンで、

    
    
    x1 = xm;
    x2 = value;
    y1 = (maxImageSize - contentHeight) + tiltingMargin * percent;
    y2 = (maxImageSize - contentHeight) + tiltingMargin * 2 * percent;
    y3 = (maxImageSize - contentHeight) + contentHeight - tiltingMargin * 2 * percent;
    y4 = (maxImageSize - contentHeight) + contentHeight - tiltingMargin * percent;
    y5 = y3 + _reflectionShapeBitmap.height - tiltingMargin * 2 * percent;
    y6 = y4 + _reflectionShapeBitmap.height - tiltingMargin;
    


のように、%値をかけてy1からy6までの高さを制御しています。横幅は関数の引数（アニメーション値）をそのまま使用します。
選択画像の場合は、どちらからめくったかという効果を出すために、前回の選択画像位置を_prevSelectに覚えておき、左から中央、右から中央といった分岐をします。
  

  



### ■クロスドメインの注意事項


前回も書いたのですが、amazonの画像サーバのcrossdomain.xmlは画像サーバ内からだけしか参照できないので、ここで作成したSWFファイルをサーバにアップロードしてもうまく表示できません。  

本記事上の完成イメージは、PHPサイトでプロキシしています。  

まずPHPのコードは過去記事を参考にしてください。  

  



### ■次回予告


マウスイベントを取得して、画像をめくる方法を増やしてみたいと思います。
