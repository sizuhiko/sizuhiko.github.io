---
author: sizuhiko
comments: true
date: 2008-11-11 02:11:39+00:00
slug: flex2-coverflow-8-amazon
title: Flex2でCoverFlowクローンを作る (９) ～Amazonと連携する
wordpress_id: 20
categories:
- 未分類
tags:
- CoverFlow
- Flex
---

<!-- more -->現在、[オブジェクト倶楽部](http://www.objectclub.jp/)のメールマガジンで連載している「Flexで体験するリッチクライアント」を補足するTechnoteです。  

第九回の今回は最終回となります。AmazonWebserviceと連携してタイトルや著者名を表示する手法を整理します。  

  



### ■今回サンプルの完成イメージ


  









  

画像をクリックしながら、左右に動かしたり、勢い良く左右に動かしたりすると、CoverFlowのように動作します。  

  

  
前回は画像を重ね合わせることで、写真部分の見栄えは「ほぼ」CoverFlowに近くなりました。今回はAmazonWebserviceと連携して、asinIdのタイトルや著者を表示します。  

  



### ■ファイルの準備


  

プロジェクトファイルを[ダウンロード](/images/blog/images/flex2_coverflow_9/reflector.zip)して、任意のディレクトリで解凍します。  



  * reflector.as3proj
  * reflector.mxml
  * ImageReflector.as
  * TransformUtil.as
  * CoverFlowLayout.as
  * RepeaterHBox.as
  * AmazonWebservice.as

新しいファイルAmazonWebservice.asが追加になっています。追加になったファイルは後ほど詳しく解説します。  

reflector.as3projをダブルクリックすると、FlashDevelopが実行されます。  

  



### ■AmazonWebサービスに登録する


AmazonWebサービスを使うと、今回やろうとしているような、asinIdの商品情報を取得することができます。  

精しくは、こちらのドキュメントが日本語であるので、一読すると良いでしょう。  

[http://www.amazon.co.jp/gp/feature.html?docId=451209](http://www.amazon.co.jp/gp/feature.html?docId=451209)  

  

まだアカウントをもっていない方は、  

[http://aws.amazon.com](http://aws.amazon.com)/  

から登録しましょう。  

  

登録すると、登録ID(Subscription ID)が取得できます。  

そのIDをAmazonWebservice.asのAWSAccessKeyId変数に入れてください。  



    
    	
    public class AmazonWebservice {
        private const AWSAccessKeyId:String = "***** あなたの登録ID ******";
        private const AmazonRegionCode:String = "09"; // 日本は09
    


  



### ■Amazonから商品情報を取得する


Amazonとのデータのやりとりは、FlashからGETパラメータで必要な情報を送り込み、戻りとしてXMLを受け取るシンプルなRESTインターフェースです。  

AmazonへリクエストするURLをgetAmazonRestUrl関数で作っています。  


    
    
    private function getAmazonRestUrl(asin:String):String 
    {
        var url:String = "http://webservices.amazon.co.jp/onca/xml?"
                   + "Service=AWSECommerceService&"
                   + "AWSAccessKeyId="+AWSAccessKeyId+"&"
                   + "Operation=ItemLookup&"
                   + "IdType=ASIN&ItemId=" + asin + "&"
                   + "ResponseGroup=Request,ItemIds,ItemAttributes,Tracks,EditorialReview";
        return url; 
    }
    


パラメータごとの詳細な解説は、上記ドキュメントを参照して欲しいのですが、ここでは
IdTypeをASINとして、ItemIdで取得したいasinIdを指定します。  

レスポンスはすべて取得することもできますが、ここではResponseGroupに書いた内容に絞り込んで
取得します。  


  



### ■Amazonからの戻り値を取得する


URLを呼び出して、結果を取得するのは、AmazonからCoverFlow用の写真を取得するインターフェースと同じです。  



    
    
    _amazonLoader = new URLLoader();
    _amazonLoader.addEventListener(Event.COMPLETE, completeAmazonRequest);
    _amazonLoader.load(new URLRequest(getAmazonRestUrl(asin)));
    


  

のようにして、URLから取得できたらcompleteAmazonRequest関数が呼ばれます。  

  

受信部分のコードは  


    
    
    private function completeAmazonRequest(event:Event):void
    {
        namespace ns = 'http://webservices.amazon.com/AWSECommerceService/2005-10-05';
        use namespace ns;
        _xml = new XML(_amazonLoader.data);
    }
    


と、たったこれだけです。Amazon Webサービスで指定されたネーミングスペースを指定して、XMLオブジェクトを作ります。  

戻ってきたデータはXML形式なので、これでActionScriptから参照しやすい形式となります。  


  



### ■XML内のデータを解析する


取得したXMLを解析するのはとても簡単です。  

たとえばWeb2.0ビギナーズバイブルのasinIdを指定して戻ってくるXMLは以下のとおりです。  

  


    
    
    <?xml version="1.0" ?>
    <ItemLookupResponse xmlns="http://webservices.amazon.com/AWSECommerceService/2005-10-05">
      <OperationRequest>
        <HTTPHeaders>
          <Header Name="UserAgent" Value="Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; .NET CLR 1.1.4322; .NET CLR 2.0.50727)">
          </Header>
        </HTTPHeaders>
        <RequestId>53c87848-02e3-4317-8136-b49b1d2a0108</RequestId>
        <Arguments>
          <Argument Name="Operation" Value="ItemLookup"></Argument>
          <Argument Name="Service" Value="AWSECommerceService"></Argument>
          <Argument Name="ItemId" Value="4839923221"></Argument>
          <Argument Name="IdType" Value="ASIN"></Argument>
          <Argument Name="AWSAccessKeyId" Value="********************"></Argument>
          <Argument Name="ResponseGroup" Value="Request,ItemIds,ItemAttributes,Tracks,EditorialReview"></Argument>
        </Arguments>
        <RequestProcessingTime>0.1317150000000000</RequestProcessingTime>
      </OperationRequest>
      <Items>
        <Request>
          <IsValid>True</IsValid>
          <ItemLookupRequest>
            <Condition>New</Condition>
            <DeliveryMethod>Ship</DeliveryMethod>
            <IdType>ASIN</IdType>
            <MerchantId>Amazon</MerchantId>
            <OfferPage>1</OfferPage>
            <ItemId>4839923221</ItemId>
            <ResponseGroup>Request</ResponseGroup>
            <ResponseGroup>ItemIds</ResponseGroup>
            <ResponseGroup>ItemAttributes</ResponseGroup>
            <ResponseGroup>Tracks</ResponseGroup>
            <ResponseGroup>EditorialReview</ResponseGroup>
            <ReviewPage>1</ReviewPage>
          </ItemLookupRequest>
        </Request>
        <Item>
          <ASIN>4839923221</ASIN>
          <DetailPageURL>http://www.amazon.co.jp/Web2-0%E3%83%93%E3%82%AE%E3%83%8A%E3%83%BC%E3%82%BA%E3%83%90%E3%82%A4%E3%83%96%E3%83%AB-%E4%BC%8A%E8%97%A4-%E6%B5%A9%E4%B8%80/dp/4839923221%3FSubscriptionId%3D*******************%26tag%3Dws%26linkCode%3Dxm2%26camp%3D2025%26creative%3D165953%26creativeASIN%3D4839923221</DetailPageURL>
          <ItemAttributes>
            <Author>伊藤 浩一</Author>
            <Author>大津 真</Author>
            <Author>岸田 健一郎</Author>
            <Author>まえだ ひさこ</Author>
            <Author>安井 力</Author>
            <Binding>単行本</Binding>
            <EAN>9784839923228</EAN>
            <ISBN>4839923221</ISBN>
            <Label>毎日コミュニケーションズ</Label>
            <ListPrice>
              <Amount>3990</Amount>
              <CurrencyCode>JPY</CurrencyCode>
              <FormattedPrice>￥ 3,990</FormattedPrice>
            </ListPrice>
            <Manufacturer>毎日コミュニケーションズ</Manufacturer>
            <NumberOfPages>927</NumberOfPages>
            <PackageDimensions>
              <Height Units="hundredths-inches">205</Height>
              <Length Units="hundredths-inches">921</Length>
              <Weight Units="hundredths-pounds">340</Weight>
              <Width Units="hundredths-inches">724</Width>
            </PackageDimensions>
            <ProductGroup>Book</ProductGroup>
            <PublicationDate>2007-04</PublicationDate>
            <Publisher>毎日コミュニケーションズ</Publisher>
            <Studio>毎日コミュニケーションズ</Studio>
            <Title>Web2.0ビギナーズバイブル</Title>
          </ItemAttributes>
        </Item>
      </Items>
    </ItemLookupResponse>
    


で、本のタイトルは、  


    
    ItemLookupResponse
     +-- Item
          +-- ItemAttributes
               +-- Title
    


という階層にあります。これを取得するにはXMLオブジェクトから  


    
    
    _xml.Items.Item.ItemAttributes.child('Title');
    


と書くだけで取得できます。_xmlオブジェクトからXMLの階層をたどるようにタグ名を.(ドット)で区切っていくだけです。簡単ですね。  


  



### ■ImageReflectorから使う


AmazonWebserviceの実装ができたら、ImageReflectorから呼び出します。  

initLoader()の末尾に、  


    
    
    _amazonInfo.callAmazon(asinId);
    


を追加し、asinIdの商品情報を取得します。情報が取得できたか判断して、描画終了という判断にするために、isCompleted関数を  


    
    
    public function isCompleted():Boolean {
        if (!_invalidatedReflection) return false
        if (_amazonInfo == null) return false
        if (!_amazonInfo.isLoaded()) return false;
    
        return true;
    }
    


のように修正して、Amazon Webサービスからのロードが終了していることも判断材料とします。

  

  



### ■画面に描画する


最後に画面に描画領域を作成します。  

mxmlにラベルとして、タイトルと著者名を表示する欄を作ります。  


    
    
    <Label id="title" text="タイトル" color="0xFFFFFF" paddingTop="-180" paddingLeft="20" fontWeight="bold" fontSize="11" />
    <Label id="subtitle" text="著者" color="0xFFFFFF" paddingLeft="20" fontWeight="bold" fontSize="11" />
    


この表示は、特定の本を選択したときに変更したいので、選択が変更されたときのイベントselectedIndex関数で、値を代入します。  


    
    
    // 選択された項目のタイトルを表示
    title.text = imageReflector[value].titleText;
    subtitle.text = imageReflector[value].authorText;
    


お約束ですが、ImageReflector側では、titleTextとauthorTextはBindableにしておく必要があります。  


  



### ■クロスドメインの注意事項


amazonの画像サーバのcrossdomain.xmlは画像サーバ内からだけしか参照できないので、ここで作成したSWFファイルをサーバにアップロードしてもうまく表示できません。  

本記事上の完成イメージは、PHPサイトでプロキシしています。  

まずPHPのコードは過去記事を参考にしてください。  

  



### ■さいごに


これまで読んでくださった皆様、ありがとうございました。こんな機能もFlex版CoverFlowに欲しいぞ！という場合は、ぜひコメントください。
よろしくお願いします。
  

