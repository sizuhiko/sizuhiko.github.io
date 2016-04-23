---
author: sizuhiko
comments: true
date: 2008-05-29 06:05:21+00:00
slug: flex2-coverflow-5
title: Flex2でCoverFlowクローンを作る (５) ～並べて台形変形させる
wordpress_id: 10
categories:
- 未分類
tags:
- CoverFlow
- Flex
---

<!-- more -->現在、[オブジェクト倶楽部](http://www.objectclub.jp/)のメールマガジンで連載している「Flexで体験するリッチクライアント」を補足するTechnoteです。  

第五回は、画像を横に並べて、中央の画像以外は台形表示する手順を整理します。  

  



### ■今回サンプルの完成イメージ


  









  
前回は画像を鏡面効果表示するサンプルを紹介しました。今回はその画像いくつか並べて中央以外は台形加工して表示します。今回は、カスタムコントロール(ImageReflector.as)とmxmlファイルを修正していきます。  

  



### ■ファイルの準備


  

プロジェクトファイルを[ダウンロード](/images/blog/images/flex2_coverflow_5/reflector.zip)して、任意のディレクトリで解凍します。


  * reflector.as3proj
  * reflector.mxml
  * ImageReflector.as
  * TransformUtil.as

reflector.as3projをダブルクリックすると、FlashDevelopが実行されます。  

  



### ■要素を並べて、繰り返し表示するには


Flashでは、Boxを使うとBox内に要素を並べることができます。BoxにはHBox（横並び）とVBox（縦並び）の実装があり、CoverFlowでは横並びを利用します。  

HBoxを使って以下のようなコードを書けばよいのですが、

    
    
    <HBox>
      <local:ImageReflector id="imageReflector0" />
      <local:ImageReflector id="imageReflector1" />
      <local:ImageReflector id="imageReflector2" />
      <local:ImageReflector id="imageReflector3" />
    </HBox>
    


これだとImageReflectorを必要な分、記述しなければいけないのでかなり面倒です。そこで、繰り返しを便利にしてくれるRepeaterという要素があります。今回のmxmlでは以下のように記述しています。

    
    
    <HBox id="h_frame" height="400" width="500" backgroundColor="0x000000" paddingLeft="200" paddingRight="200" verticalScrollPolicy="off">
    	<Repeater id="rp" dataProvider="{dp}">
    		<local:ImageReflector id="imageReflector" asinId="{rp.currentItem}" creationComplete="onCreationComplete(event)"/>
    	</Repeater>
    </HBox>
    


Repeaterで繰り返したい要素はdataProviderというパラメータで指定することができます。dpは同じmxmlのスクリプト部分に記述しています。

    
    
    [Bindable]
    private var dp:ArrayCollection =  new ArrayCollection(["482228350X", "4774133655", "4274066940", "4822283143", "4839923221", "4873113202", "4797333502", "4822282295"]);
    


配列要素（ArrayCollection）に、amazonのasinidを指定していけば、値が変更になった場合も簡単です。後々XMLファイルに外だしにする場合もそれほど変更が必要になりません。  

  




### ■画面とActionScriptで情報を交換する


dataProviderで指定した、asinidをActionScriptに引き渡すには、[Bindable]を宣言すれば良いだけです。この宣言は変数でも関数でも、直前に記述すれば、MXMLとActionScriptの間で情報を交換することができます。本サンプルでは、asinIdと、選択表示（今回は中央）のIndexをMXMLからActionScriptに対して引き渡しています。引渡し方法は、タグの中で指定する方法や、MXMLのScriptからID指定で渡す方法があります。  

タグの中で指定するには、

    
    
    <local:ImageReflector asinId="{rp.currentItem}"/>
    


と書くことで、ImageReflectorクラスのasinId変数の初期値として、rp.currentItemの値がセットされます。rp.currentItemはRepeater(idがrp)の現在のdataProvider配列の値です。繰り返している現在の値を引き渡しています。  

スクリプトの中で指定するには、

    
    
    imageReflector[0].selectedIndex = dp.length / 2;
    


と書くことで、idがimageReflectorの要素の0番目のselectedIndex変数に値をセットすることができます。imageReflectorはRepeaterで繰り返しているImageReflector要素のidで同じIDが複数出現すると、自動的に配列要素となってくれます。  

  



### ■measureを修正して、個々の横幅を指定する


Flashが個々の要素の幅を決定するときに呼ぶmeasure関数で、選択要素は等幅、それ以外は台形変形したときに横幅を指定するようにします。

    
     
    if(selectedIndex == repeaterIndex) {
    	measuredWidth = _content.getExplicitOrMeasuredWidth();
    }
    else {
    	measuredWidth = tiltingWidth;
    }
    


selectedIndexはMXMLとバインディングしている変数ですが、repeaterIndexはどこにも出てきません。これは自分のコントロールがRepeaterの中にある場合に有効な変数で、自分がRepeaterの何番目かを知ることができるのです。ですからMXMLから指定された選択Indexである場合は、画像の幅を指定し、それ以外の場合はtiltingWidthを指定します。このtiltingWidthも変数宣言していませんが、今回追加したコードに関数が記述されています。

    
    
    public function set tiltingWidth(value:Number):void
    {
    	// no set
    }
    public function get tiltingWidth():Number
    {
    	var contentWidth:Number = _content.getExplicitOrMeasuredWidth();
    	var contentHeight:Number = _content.getExplicitOrMeasuredHeight();
    	var radians:Number = Math.atan2(-tiltingMargin, maxTiltingWidth);
    	var rotation:Number = radians * 180 / Math.PI;
    	var w:Number = Math.abs(contentWidth * Math.cos(rotation * 180 / Math.PI));
    	return Math.min(maxTiltingWidth, w);
    }
    


functionの後にset,getと書くとプロパティ値のsetter,getterの意味を持つことができ、あたかもtiltingWidthというメンバ変数があるように見せかけることができます。  

![](/images/blog/1image01.gif) 
台形変形したときの横幅は、前回も出たMathの三角関数を使って出しています。図のように台形に変形したときに切り落とされる三角形の底辺となる幅を想定すればよいでしょう。最初に上のように高さがtiltingMarginで、幅がmaxTiltingWidthの三角形で斜辺への角度を求めます。  

同じ角度で斜辺の長さが実際の画像幅になった場合に、底辺がどのくらいの幅になるかを求めます。そこで小さいほうの幅を採用すると幅の異なる様々な画像でもうまく幅を指定することができます。  

  



### ■実際に描画する


updateDisplayListを修正して、ビットマップを台形変形するなどの描画を行います。  

前回まではupdateDisplayListで直接画像を表示していましたが、transformImageという関数に変形後の幅を渡して画像を描画してもらうようにします。今回追加したtransformImage関数では、Kazuhiko Arase氏の[四角形の自由変形](http://www.d-project.com/flex/009_FreeTransform/)という記事に掲載されている、TransformUtilクラスを使っています。台形変形すると様々な考慮が必要となるのですが、この変形ツールを指定すれば、４点の座標を指定するだけで良いので便利です。  
![](/images/blog/image02.gif) 
transformImage関数では、図のように６つの点を計算しています。位置が計算できたら、drawImageShape関数でTransformUtilを呼び出して、描画領域へ表示するようにします。  

  



### ■クロスドメインの注意事項


前回も書いたのですが、amazonの画像サーバのcrossdomain.xmlは画像サーバ内からだけしか参照できないので、ここで作成したSWFファイルをサーバにアップロードしてもうまく表示できません。  

本記事上の完成イメージは、PHPサイトでプロキシしています。  

まずPHPのコードは前回記事を参考にしてください。  

  



### ■次回予告


アニメーション表示に取り掛かりたいと思います。
