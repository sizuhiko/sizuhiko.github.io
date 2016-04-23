---
author: sizuhiko
comments: true
date: 2008-04-28 08:04:40+00:00
slug: flex2-coverflow-4
title: Flex2でCoverFlowクローンを作る (４) ～鏡面加工する
wordpress_id: 9
categories:
- 未分類
tags:
- CoverFlow
- crossdomain.xml
- Flex
---

<!-- more -->現在、[オブジェクト倶楽部](http://www.objectclub.jp/)のメールマガジンで連載している「Flexで体験するリッチクライアント」を補足するTechnoteです。  

第四回は、画像を鏡面加工して表示する手順を整理します。  

  



### ■今回サンプルの完成イメージ


  









  
前回はカスタムコントロールを使って、画像を表示するサンプルを紹介しました。今回はその画像を加工して表示します。画像の加工はいろいろありますが、Macユーザとしては外せない鏡面効果を付けてみましょう。今回は、カスタムコントロール(ImageReflector.as)を修正してい
きます。  

  



### ■ファイルの準備


  

プロジェクトファイルを[ダウンロード](/images/blog/images/flex2_coverflow_4/reflector.zip)して、任意のディレクトリで解凍します。


  * reflector.as3proj
  * reflector.mxml
  * ImageReflector.as

reflector.as3projをダブルクリックすると、FlashDevelopが実行されます。  

  



### ■commitProperties()の修正


以下のようなコードに修正となります。

    
    
    override protected function commitProperties():void
    {
        if (_imageLoader == null) {
            initLoader();
        }
        invalidateDisplayList();
    }
    


具体的な変更イメージが掴めないと思うので、initLoader関数の処理も見てみましょう。  

前回のサンプルでは、

    
    
    _content = UIComponent(new Image());
    


の部分で、Image.dataに値をセットすることで画像を出していましたが、今回はかなり異なります。これはオリジナルの画像を鏡面加工するには、元の画像の読み込みが完了していなければならないためです。Imageを使って画像を表示する方法は便利なのですが、読み込み状況まで制御することができません。このような場合は、Loaderクラスを使って画像を読み込むことができます。

    
    
    _imageLoader.load(new URLRequest("http://ec1.images-amazon.com/images/P/4839923221.09._SL200_SCLZZZZZZZ_.jpg"));
    


で画像の読み込みを命令すると、完了イベント(Event.COMPLETE)を受け取れます。イベントを受け取ると、addEventListenerに記述された内容を実行します。

    
    
    _imageLoader.contentLoaderInfo.addEventListener(Event.COMPLETE, function():void {
         // ここに記述された内容を実行
    }
    


次に、

    
    
    _imageShape = new Shape();
    _content.addChild(_imageShape);
    


のようにして描画領域を作成します。描画領域はShapeと呼ばれる単純な描画コンポーネントを使います。Flex本ではSpriteを使うケースも多いのですが、使い分けとしては、さらに子供の要素を追加する場合はSprite。単純な描画枠ならShapeという理解でよいでしょう。Shapeの方がSpriteよりも使用メモリが少ないという利点もあります。  

取得した画像をビットマップデータに変換しておきます。

    
    
    _imageShapeBitmap = new BitmapData(_imageLoader.width, _imageLoader.height, true, 0x000000);
    _imageShapeBitmap.draw(_imageLoader);
    


のように書くと、ロードした画像を簡単にビットマップとして扱えるようになります。  


    
    
    var reflectionBitmap:Bitmap = createReflectionBitmap(_imageShapeBitmap);
    


で鏡面画像を作成して、_contentの子オブジェクトの更新イベントでinvalidateReflection()が呼ばれるようにしておきます。
  



### ■鏡面画像を作成する createReflectionBitmap()


この関数のポイントはグラデーションパターンを作成するところです。

    
    
    var alphaGradientBitmap:BitmapData = new BitmapData(tw, th, true, 0x00000000);
    var gradientMatrix: Matrix = new Matrix();
    var gradientShape: Shape = new Shape();
    gradientMatrix.createGradientBox(tw, th * kFalloff, Math.PI/2, 0, th * (1.0 - kFalloff));
    gradientShape.graphics.beginGradientFill(GradientType.LINEAR, [0xFFFFFF, 0xFFFFFF], [0, 1], [0, 255], gradientMatrix);
    gradientShape.graphics.drawRect(0, th * (1.0 - kFalloff), tw, th * kFalloff);
    gradientShape.graphics.endFill();
    alphaGradientBitmap.draw(gradientShape, new Matrix());
    


Math.PIとは、円周率を表していて、Math.PI/2は90度を意味します。通常の座標軸は、左から右にむかうので、Math.PI/2を適用した場合は、時計回りに90度つまり上から下に向かって描画するように制御できます。またグラデーションには、線状(LINEAR)と放射線状(RADIAL)があり、段々薄くなっていく鏡面効果の場合は、線状を使います。

    
    
    var reflectionData:BitmapData = new BitmapData(tw, th, false, 0x00000000);
    reflectionData.fillRect(rect, 0x00000000);
    reflectionData.copyPixels(target, rect, new Point(), alphaGradientBitmap);
    


のように引数で渡されたオリジナル画像と、グラデーションパターンの画像を重ね合わせますが、copyPixelsを使うと、重ね合わせる透過ビットマップを指定できるので、便利です。
最後に

    
    
    reflectionBitmap = new Bitmap(reflectionData);
    reflectionBitmap.alpha = .85;
    


で使いやすいようにBitmapDataに変換し、透過度を指定しておきます。背景を白に変更した場合など、透過度を調整すると、お好みの鏡面効果にすることができます。 
  



### ■鏡面効果を開始する


initLoaderで設定した、Imageの描画が完了したときに呼ばれるメソッドを以下のように定義します。

    
     
    private function invalidateReflection(event:Event):void
    {
        _invalidatedReflection = true;
        invalidateSize();
        invalidateDisplayList();
    }
    


このタイミングでようやく鏡面画像を書いてよし、というタイミングになるので_invalidatedReflectionフラグをオン(true)に設定します。
その後、画面の再描画を即すために、invalidateDisplayList()を呼び出します。
  



### ■実際に描画する


updateDisplayListを修正して、ビットマップの描画を行います。  

ビットマップを描画領域に書き出すには、graphicsオブジェクトを使用します。

    
    
    _imageShape.graphics
    


graphicsオブジェクトはShape上にベクター描画するためのプロパティです。beginBitmapFillはビットマップで塗りつぶしを開始する、という宣言で、描画範囲をdrawRectで決定します。graphicsオブジェクトで描画を終了する場合は、描画の種類に関係なくendFillで終了します。  

鏡面画像はそのままだと、オリジナル画像にグラデーションが重なっているだけの画像です。実際に鏡面効果に見せるためには、反転させて、位置を下げる必要があります。

    
    
    var m:Matrix = new Matrix();
    m.scale(1.0, -1.0);
    m.ty = 2 * _imageShapeBitmap.height;
    _imageShape.graphics.beginBitmapFill(_reflectionShapeBitmap, m);
    _imageShape.graphics.drawRect(0, _imageShapeBitmap.height, _reflectionShapeBitmap.width, _reflectionShapeBitmap.height);
    _imageShape.graphics.endFill();
    


本サンプルではMatrixクラスを使って反転させています。画像の反転など3D効果を出すのには、行列計算を行う必要があります。Matrixは表示オブジェクトの回転、拡大縮小、平行移動を行列を使って計算することができます。今回のケースは単純に反転するだけなので、拡大縮小(scale)メソッドを使います。なぜ反転するのに拡大縮小？という疑問があるかもしれません。なぜなら鏡面効果を考えてください。画像を180度回転させると左右が逆になります。するとその後左右反転を呼ばなければなりません。これでは二度手間ですね。  

つまり単純に反転させる効果はscaleメソッドを使い実施します。上下反転はscale(1.0, -1.0)、左右反転は scale(-1.0, 1.0)で実現できます。行列計算というと難しいイメージしかありませんが、100x200画像を拡大縮小させる場合は、四点[(0,0)(200,0)(0,100)(200,100)]で、x,yそれぞれをscaleで指定された値でかけるだけです。つまりscale(1.0,-1.0)の結果は[(0,0)(200,0)(0,-100)(200,-100)]となるので、y軸0の値を中心に画像が上方向
に向いていることがわかると思います。結果として上下反転したように見えるのです。
  



### ■クロスドメインの罠


amazonではAPI用にFlashから接続可能なcrossdomain.xmlが定義されています。例えば[http://xml.amazon.com/](http://xml.amazon.com/)などのルートにはcrossdomain.xmlが設置されています。ところが、画像サーバのcrossdomain.xmlは画像サーバ内からだけしか参照できないので、ここで作成したSWFファイルをサーバにアップロードしてもうまく表示できません。  

そこで、PHPスクリプトなどを使って回避することができます。なお本記事上の完成イメージは、PHPサイトでプロキシしています。  

まずPHPのコードは以下のようになります。例えば、crossdomain.phpとしておきましょう。

    
    
    <?php
    if($_GET["file"]){
        header("Content-Type:image/jpeg;");
        readfile($_GET["file"]);
    }
    ?>
    


次にcrossdomain.xmlをドキュメントルートに配置します。

    
    <?xml version="1.0"?>
    <!DOCTYPE cross-domain-policy SYSTEM "http://www.adobe.com/xml/dtds/cross-domain-policy.dtd">
    <cross-domain-policy>
        <allow-access-from domain="*"/>
    </cross-domain-policy>
    


後は、ImageReflector.asのload部分を以下のように書き換えます。

    
    var context:LoaderContext = new LoaderContext(true);
    _imageLoader.load(new URLRequest("http://hoge.com/crossdomain.php?file=http://images.amazon.com/images/P/4839923221.09._SL200_SCLZZZZZZZ_.jpg"), context);
    


すると、PHPサイトがプロキシとなってくれ、PHPサイトのcrossdomain.xmlをFlashは解釈して、SWFから画像が表示できるようになります。  

クロスドメイン対応の記述は、添付のプロジェクトに含まれないので注意してください。  

※なおローカルで試す分には、クロスドメインの対策を入れなくても動作します。



