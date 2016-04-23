---
author: sizuhiko
comments: true
date: 2009-06-04 07:06:26+00:00
slug: treebehavior-left-right
title: TreeBehavior の left, right ってそういう事だったのね
wordpress_id: 25
categories:
- 未分類
tags:
- Behavior
- CakePHP
---

<!-- more -->CakePHP でとっても役に立つビヘイビアに TreeBehavior があるんです。  

このビヘイビアを使うと、商品カテゴリとかディレクトリみたいに、ツリー構造になっているモデルを簡単に扱うことができます。簡単になるのは、ツリー構造を取得したり、階層を１つ上に移動したり、特定の階層の下に追加したり、といった自分で作ったら、チョー面倒な処理ばかりです。  

  

で、これまで大変お世話になったのに、あんまり意味もわからず parent と left,rightの列があればいいんでしょ、ぐらいにしか思ってませんでした。DB弱者なんで TreeBehavior のソースも追わなかったし・・・・  

で、たまたまSQL関係で調べ物をしていたら、すばらしいページを発見。  

  

『[SQLで木と階層構造のデータを扱う（１）―― 入れ子集合モデル](http://www.geocities.jp/mickindex/database/db_tree_ns.html)』
  

いや、（自分にとっては）すごく難しい話なんですが、すごくわかり易く解説してあって、left,rightってそういう事だったのね、とわかってきた時は感動します。CakePHPのtreeはparent_idが必要なんですが、この理論で行くといらないですね。たぶん何かの都合でparentを持つことにしたと思うんですけど、TreeBehaviorのコードからそこまで読み取ることはできませんでした。

