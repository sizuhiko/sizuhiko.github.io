---
author: sizuhiko
comments: true
date: 2009-02-04 01:02:22+00:00
slug: cakephp1-2-1-8004-auth-scaffold
title: CakePHP1.2.1.8004 で AuthコンポーネントとScaffoldを併用する際の注意事項
wordpress_id: 21
categories:
- 未分類
tags:
- AuthComponent
- CakePHP1.2.1
- Scaffold
---

<!-- more -->先日セキュリティアップデートとして、1.2.0から1.2.1に更新されたのは、皆さんご存知のことと思います。  

で、昨日やっとこさ1.2.1を使い始めたら、なんとAuthでログインしてなくてもscaffoldのアクションが動いちゃうじゃないですか！！。これはまずい。。  

なお肝心のセキュリティアップデートは、[CakePHP 1.2.1.8004へアップデート推奨](http://cakephp.jp/modules/newbb/viewtopic.php?topic_id=1696&forum=1&post_id=4032#forumpost4032)からリンクされている「[Changeset 7979](https://trac.cakephp.org/changeset/7979)」の差分のようなので、今回の回避策を使っても、問題なさそうだと判断しています。まぁscaffold使ってなければ関係ないのですけどね。  
  

で、問題の箇所はAuthComponent::startup()で


    
    
    $isErrorOrTests = (
    	strtolower($controller->name) == 'cakeerror' ||
    	(strtolower($controller->name) == 'tests' && Configure::read() > 0) ||
    	!in_array($controller->params['action'], $controller->methods)
    );
    if ($isErrorOrTests) {
    	return true;
    }


  

という箇所があるのですが、
  


    
    !in_array($controller->params['action'], $controller->methods)
    


  

というコードの「$controller->methods」にはscaffoldのアクションが含まれていないんですよね。なんでコントローラにそんなメソッドないよエラーページに遷移しようとして、ログイン画面には遷移しないんですが、ほんとのところはscaffoldに遷移して、一覧・追加・変更・削除ができちゃうというトホホな感じです。  

なのでscaffoldをAuthのログイン傘下で使っている人は、Authから$controller->methodsに含まれているかどうかチェックは外してしまいましょう。  

これから本家のTracにチケットを書くとします。。。  

その後、あっさり本家から「Bakeしてね」とやんわり修正を断られてしまったので、Auth使う人はscaffold使わないか、$controller->methodsにbeforeFilterでscaffoldAction追加するとか（たぶんこれは良くないけど）、Authを継承して変えちゃう（startupの前でscaffoldActionをarray_mergeして、戻ってきたら元の値に戻せば・・・まぁ、どうか？というのもありますけど）とか、まぁいろいろ策はあるかな？と思います。  

  

PS: この、$controller->methodsですが、どこで使ってんの？と調べてみたら、dispatcherとauthだけでした。dispatcherは当然として、なんでauthが！？？という不思議な感は否めないのですが、こればっかりは仕方ないですね。今後使うところ増えるかもしれないし。


