---
author: sizuhiko
comments: true
date: 2008-06-09 09:06:49+00:00
slug: cakephp-1-2-rc1-treebehavior
title: CakePHP 1.2 RC1でTreeBehaviorの絞込み範囲指定が変更となった
wordpress_id: 12
categories:
- 未分類
tags:
- '1.2'
- CakePHP
- RC1
- TreeBehavior
---

<!-- more -->TreeBehavior自体1.2から追加された機能なのに、変更になるなんて。。。  

1.2βでは

    
    
    $this->Category->setScope(array('company_id'=>'1'));
    $categories = $this->Category->children();
    


のように書くと、company_idが1のカテゴリだけ階層構造で取得できていたのだが、RC1ではsetScopeがDeprecatedになってしまった。で、上記方法を使っている画面を表示すると、「(TreeBehavior::setScope) Deprecated - Use BehaviorCollection::attach() to re-attach with new settings」というエラーメッセージが出るが、お世辞にもどう変更していいかわかるメッセージじゃないし、ドキュメントにも書いてない。  

なので、ソースを読み込むことに。まぁソース読めばわかります。結果としては、

    
    
    $this->Category->$this->Behaviors->attach('Tree', array('scope'=>array('company_id'=>'1')));
    $categories = $this->Category->children();
    


のように記述するのですが、これを使用箇所で全部変更するのは大変ですね。そこで、Categoryのモデルクラスに以下のようなメソッドを追加してあげました。

    
    
    function setScope($scope = array()) {
        return $this->Behaviors->attach('Tree', array('scope'=>$scope));
    }
    


ま、AppModelに追加しても良かったんですが、全部がTreeBehavior使っている訳ではないと思うので、その場合は、setTreeScopeのような名前に変更した方が良いかな？と思っています。

