---
author: sizuhiko
comments: true
date: 2013-11-04 09:11:42+00:00
slug: cakephp-fabricate-sequence
title: CakePHPのデータジェネレータFabricateにsequenceなどの機能を追加しました
wordpress_id: 56
categories:
- 未分類
tags:
- CakePHP
- fabricate
- fixture
- Test
---

<!-- more -->先日カッとなって作った Fabricate ですが、その後実運用していくうちにいくつかの機能でRuby本家に近づけたくなったので実装を追加しました。  
  
[GitHub: sizuhiko/Fabricate](https://github.com/sizuhiko/Fabricate)  
  


### 変更概要

  


  * closure だけでなく、array 形式での属性値変更が可能に
  * 初期連番をconfigで指定可能に
  * sequenceメソッドで柔軟な採番が可能に
  
  


### array形式での属性値変更

  
これまで属性値を自動生成でなく、自分で決めた値にしたい場合は、無名関数（closure）でarrayを戻す必要がありました。  
これを直接引数でarrayを指定できるようにしました。  
  
従来の記述方法：  

    
    
    Fabricate::create('Post', 10, function($data){
        return ["created" => "2013-10-09 12:40:28", "updated" => "2013-10-09 12:40:28"];
    });
    

  
  
新しくサポートした記述方法：  

    
    
    Fabricate::create('Post', 10, ["created" => "2013-10-09 12:40:28", "updated" => "2013-10-09 12:40:28"]);
    });
    

  
もちろん、第二引数の生成レコード数を省略して1レコードだけ作ることも可能です。  
  
$dataの内容見ないのに、とか全部固定なので無名関数じゃなくても良い等のシーンが思いのほか多いもので。  
  


### 初期連番をconfigで指定

  
これまで連番（スキーマで数値カラムになっている項目は自動的に連番対象になる）は1から常に始まるようにしていたのですが、こちらもやはり変更したい場合があって、本家同様にconfigで変更できるようにしました。  
  

    
    
    Fabricate::config(function($config) {
        $config->sequence_start = 100;
    });
    

  
  
config関数は、環境定義オブジェクトのインスタンスを引数に取るメソッドを呼び出すので、その中で public 属性値である sequence_start の値を変更してください。  
config関数を使わない場合は、従来通り1から開始されます。  
  


### sequenceメソッドで柔軟な採番

  
これが今回のバージョンアップで最も対応したかった機能で、連番を項目毎に変更したり、独自フォーマットに変更できたりします。  
この機能に対応するために、attributes_for(), build(), create() の各メソッドで属性値を上書きできる無名関数に第二引数を追加しました。  
  

    
    
    Fabricate::attributes_for('Post', 10, function($data, $world){
        return [
            'id'=> $world->sequence('id'),
            'title'=> $world->sequence('title', 1, function($i){ return "Title {$i}"; })
        ];
    });
    

  
  
上記のように、$world を引数に取るようになりました。もちろん利用しない場合は省略可能です。  
$worldは新しく追加したクラス FabricateContext のインスタンスで sequence メソッドを持っています。  
  
sequenceメソッドは、3つの利用方法に対応しています。  


  * configで設定された開始値(または1)から開始する連番にする：   

    
    $world->sequence('id')

  * 開始番号を指定して連番にする：  

    
    $world->sequence('id', 10) // この例では10から開始する

  * 独自形式のユニーク文字列を作成する：  

    
    
    $world->sequence('title', function($i){ return "Title {$i}"; }
    // または開始番号を指定して
    $world->sequence('title', 1, function($i){ return "Title {$i}"; }
    

  
一番上の利用方法は、DBのスキーマ定義が数値である限りは、sequenceメソッドを使わなくても同じ連番となるので、あまり利用ケースはないと推測されます。  
  
本家のFabricator では同一プロセス中でのSequenceは常にユニークな値になるようになっていますが、CakePHPプラグイン版ではデータ生成のattributes_for(), build(), create() 各メソッドの呼び出し単位でユニークになります。  
つまり呼び出し毎に開始番号から採番されます。  
  
もし要望があれば、プロセス単位に連番を管理することも可能なので、Githubのissueなどで連絡ください（日本語でok）。  
おそらく対応としては config で定義でできるようにすると思います...（併用でなく、プロセスか生成毎かを選択するイメージ）  
  

