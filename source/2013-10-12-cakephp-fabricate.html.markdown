---
author: sizuhiko
comments: true
date: 2013-10-12 11:10:45+00:00
slug: cakephp-fabricate
title: CakePHPのデータジェネレータ Fabricate を作りました
wordpress_id: 55
categories:
- 未分類
tags:
- CakePHP
- fablicator
- fixture
- Test
---

<!-- more -->Fabricate は Ruby の Fabricator に影響を受けたもので、データを簡単にすばやく生成する CakePHP2 用のプラグインです。  
  
[GitHub: sizuhiko/Fabricate](https://github.com/sizuhiko/Fabricate)  
  
動作確認しているバージョンはCakePHP2.3.10, CakePHP2.4.1ですが、他のバージョンでもCakePHP2系なら動くと思います。  
  


### インストール方法

  
Composer対応しているので、composer.json に追加するだけで大丈夫です。テストだけに利用するなら require-dev に、実行コードからも使いたい場合は require に追加してください。どちらでも動作します。  
  

    
    
        "extra": {
            "installer-paths": {
                "Plugin/Fabricate": ["sizuhiko/fabricate"]
            }
        },
        "require": {
            "composer/installers": "*",
            "sizuhiko/fabricate": "*"
        }
    

  
composer/installers に対応していますので、お好みで extra/installer-paths に追加すれば、Plugin の下に良い感じでインストール可能です。  
  
後は bootstrap.php でプラグインの宣言を追加してください。  
  

    
    
    CakePlugin::load('Fabricate');
    

  
  


### 概要

  
Fabricateプラグインには3つのメソッドがあります。  
  


  * Fabricate::attributes_for(:model_name, :number_of_generation, :callback) : CakePHPの属性配列をデータ付きで返します（複数件生成可能）
  * Fabricate::build(:model_name, :callback) : CakePHPのモデルインスタンスを返します（1件のみ生成可能）
  * Fabricate::create(:model_name, :number_of_generation, :callback) : 指定された件数分データベースに生成する
  
  


### 用途

  
このプラグインは以下のような用途にとても向いています。  
  


  * ページングのテストをするのに大量にデータを生成したい
  * fixture だと各テストケースで同じデータが生成されてしまうけど、各テストケース毎に違うデータを生成したい。かつテスト対象のカラム以外は適当な値が自動的に入って欲しい
  * Bddプラグイン（CakePHPのBehatインテグレーションプラグイン）のステップで「Postモデルに100件のデータが登録されていること」みたいなのを書きたいのに、簡単に記述できないなぁと思ったとき
  
  


### 使い方＆サンプル

  


####  attributes_for

  

    
    
    $results = Fabricate::attributes_for('Post', 10, function($data){
        return ["created" => "2013-10-09 12:40:28", "updated" => "2013-10-09 12:40:28"];
    });
    
    // $results is followings :
    array (
      0 => 
      array (
        'id' => 1,
        'title' => 'Lorem ipsum dolor sit amet',
        'body' => 'Lorem ipsum dolor sit amet, aliquet feugiat. Convallis morbi fringilla gravida, phasellus feugiat dapibus velit nunc, pulvinar eget sollicitudin venenatis cum nullam, vivamus ut a sed, mollitia lectus. Nulla vestibulum massa neque ut et, id hendrerit sit, feugiat in taciti enim proin nibh, tempor dignissim, rhoncus duis vestibulum nunc mattis convallis.',
        'created' => '2013-10-09 12:40:28',
        'updated' => '2013-10-09 12:40:28',
      ),
      1 => 
      array (
      ....
    

  
  
これでPostモデル（第一引数に名前を指定）のスキーマ情報からカラム（属性）を取得して、タイプに応じた値が自動的に生成されて配列で戻ります。  
第二引数に生成するレコード件数を指定します。  
ただ、全部自動的だと困るという場合があるので、3つ目の引数にコールバック関数を指定可能になっています。このコールバック関数は、10件のデータを生成する場合、都度計10回呼び出されます。  
戻り値として、属性名をキーに値を持つ連想配列を指定すると、都度array_mergeが実行されます（recursiveではありません）。  
データの自動生成処理は、CakePHPのコアにあった FixtureTask の _generateRecords() というメソッドを拝借してきて、そのまま利用しています。  
CakePHPでfixtureを生成したときrecordsに入っている内容と同じ物になります。  
  
このメソッドの使いどころとしては、関連先との関連も生成して saveAll したいといったような、ちょっと応用的な使い方に向いていると思います。  
  
また、第二引数、第三引数は省略可能ですので、  

    
    
    // 1件だけ生成
    Fabricate::attributes_for('Post');
    // 1件だけコールバックを指定して生成
    Fabricate::attributes_for('Post', function($data){
        return ["created" => "2013-10-09 12:40:28", "updated" => "2013-10-09 12:40:28"];
    });
    // 10件生成
    Fabricate::attributes_for('Post', 10);
    

  
というバリエーションでも利用可能です。  
  


#### build

  
とりあえず本家のFabricatorに近づけたたくて作ったメソッドですが、CakePHPではモデルのインスタンスを複数同時に持てないので、正直使い勝手としては微妙です（作者が言うなという話ですが）。  
  


#### create

  
最も簡単にデータをデータベースに保存するなら、このメソッドで十分です。  
attributes_forで作ったレコードをすべてデータベースに保存します。  
引数の使い方はattributes_forと同一になっています。  
  


### きっかけと今後

  
ページングのテストを書こうとして、とにかく面倒になってきて「**何でCakePHPにはFabricatorがないんだー**」というノリで、カッとなって作った系ですので、機能的には最低限になっています。  
かつたぶん最新のFabricatorのクローンとも言い難い状況です。  
  
またカッとなったら、最新のFabricatorの機能に近づけようかな〜、どなかた使っていただける方がいればご要望、機能追加は GitHubのIssue、Pull Requestでお願いします。  
  
  
  

