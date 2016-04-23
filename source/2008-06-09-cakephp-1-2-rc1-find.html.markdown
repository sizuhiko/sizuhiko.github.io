---
author: sizuhiko
comments: true
date: 2008-06-09 09:06:17+00:00
slug: cakephp-1-2-rc1-find
title: CakePHP 1.2 RC1からfindの条件指定方法が変更となった
wordpress_id: 11
categories:
- 未分類
tags:
- '1.2'
- CakePHP
- find
- RC1
---

<!-- more -->CakePHP1.2 も RC1 となり、現在開発中のプロジェクトでβからRC1に変更したところ、様々なトラブルが。。。  

1.2βでは1.1の検索方法を踏襲しており、以下のように記述できる。

    
    
    $conditions = array("Post.title" => "This is a post");
    
    //Example usage with a model:
    $this->Post->find($conditions);
    


この例は完全一致（=）なので問題はなかったのだが、それ以外の<や>、LIKEやBETWEENなど記述方法が変更となっている。
なおINの場合は、

    
    
    $conditions = array("Post.id" => array(1,2,3,4,5));
    
    //Example usage with a model:
    $this->Post->find($conditions);
    


のように記述でき、1.1などからの変更はない。
ではLIKEについてこれまでの記法をおさらいすると、

    
    
    $conditions = array("Post.title" => "LIKE %post%");
    
    //Example usage with a model:
    $this->Post->find($conditions);
    


となっていた。しかしこれを1.2 RC1で実行すると、WHERE句は「'Post.title' = 'LIKE %post%'」のようになってしまう。そこで、dbo_source.phpを見て解析してみた。結果、LIKEなどの記法は

    
    
    $conditions = array("Post.title LIKE" => "%post%");
    
    //Example usage with a model:
    $this->Post->find($conditions);
    


のように変更となっていた。この変更はかなり驚きだが、カラム名の方にLIKEや<=などの条件を移動することで、様々なSQLインジェクションを考えると、従来のようにvalue側を正規表現で切り分けるより安全な気がする。  

値が１つの場合は良さそうだ。ではBETWEENの場合はどうだろう？従来は、

    
    
    $conditions = array("Post.date" => "BETWEEN 2008-1-1 AND 2009-1-1");
    
    //Example usage with a model:
    $this->Post->find($conditions);
    


のように記述していたが、これもそのままだとWHERE句は「'Post.data' = 'BETWEEN 2008-1-1 AND 2009-1-1'」のようになってしまう。ではLIKEと同じようにしてみると、

    
    
    $conditions = array("Post.date BETWEEN" => "2008-1-1 AND 2009-1-1");
    
    //Example usage with a model:
    $this->Post->find($conditions);
    


WHERE句は「'Post.data' BETWEEN '2008-1-1 AND 2009-1-1'」のようになってしまう。これも正しくない。このようなケースはさらに変更されており、以下のようになる。

    
    
    $conditions = array("Post.date BETWEEN ? AND ?" => array("2008-1-1", "2009-1-1"));
    
    //Example usage with a model:
    $this->Post->find($conditions);
    


BETWEENなど値が複数ある場合は、カラム名上で?を使うと配列の値を順番にセットしてくれる。WHERE句は「'Post.data' BETWEEN '2008-1-1' AND '2009-1-1'」のように期待通りの結果となる。  

なおLIKEなどでも

    
    
    $conditions = array("Post.title LIKE ?" => array("%post%"));
    
    //Example usage with a model:
    $this->Post->find($conditions);
    


と書くことが可能だが、そこまで見栄えに統一感を持たせなくても良いかな？と思う。

