---
author: sizuhiko
comments: true
date: 2011-10-09 08:10:48+00:00
slug: phpsh-cake
title: phpshでCakeを試食する
wordpress_id: 41
categories:
- 未分類
tags:
- CakePHP
- phpsh
---

<!-- more -->![](/images/blog/taste-cake.png) 

普段 Rails でプログラミングをしていて、便利だなぁと思う機能の１つに

    
    rails c

があります。
  
  

コマンドラインからRailsアプリケーションのコードを実行できるコンソールで、コードをファイルに書かなくてもすぐ試せるので「あれっ、こんな書き方で良いのだっけ？」という事をお手軽に試すことができます。  

Rubyにはirbといった対話型ツールもあります。PHPではこれに相当するものは php -q などが標準で使えるのですが、イマイチな使い勝手です。  

そんな中、facebookから公開されている「phpsh」を知りました。これはPHPの対話型ツールで、いわゆるPHP版のirbみたいなものです。
  
  

phpshは[http://www.phpsh.org/](http://www.phpsh.org/)で、コードはgithubで公開されています。
  
  

今回はphpsh自体のコードをハックすることなく、オートローダー用のphpファイルを作成して、CakePHPのコードを動かせるようにしてみました。
  



### Taste


  

この対話型ツールでできることは、実際の製品コードを試す、ケーキで言えば"試食"ということで「Taste」と名付けました。  

[https://github.com/sizuhiko/Taste](https://github.com/sizuhiko/Taste)
  
  



### インストール


  

事前にphpshをインストールしておいてください。インストール方法はgithubのREADMEに書かれているので簡単にできると思います。ちなみに私の環境ではphpshのzipをダウンロードして、以下のコマンドを実行しました。

    
    
    python setup.py install --prefix=/usr/local
    


.bashrcに以下の行を追加

    
    
    export PYTHONPATH=/usr/local/lib/python2.6/site-packages 
    


  

後はTasteをインストールします。これはgithubで公開している taste.php を CakePHP のルートディレクトリにコピーするだけです。
  
  



### 実行


  

phpshは --prefixを付けたディレクトリ/bin にインストールされます。仮にそのディレクトリにパスが通っているとして、以下のコマンドを実行します。

    
    phpsh taste.php


  
![](/images/blog/taste-cake-2.png)
  



  1. 私の環境では pcntl をインストールしていないので赤字で出ますが、phpshとしては必須ではないので気にしなくていいです。
  2. ログディレクトリのワーニングが出ますが、コンソールのブートストラップを参考していて出ています。こちらも試食には問題ないのでスルーします。

  



### できること


  

CakePHPのコアクラスや、appに配置されたアプリケーションのコードを試すことができます。それは普通に.phpのコードに書いているのと同じ感覚でできます。
では、おなじみのBlogチュートリアルを作った場合、どんな結果が得られるのか見てみましょう。
  
  




#### モデルクラスを使ってみる


  

phpshのコンソールでClassRegistryを使ってモデルを取得し、findしてみます。

    
    
    php> $post = ClassRegistry::init('Post');
    php> $data = $post->find('all');
    


以下のように、色付きで表示することができます。![](/images/blog/taste-cake-3.png)   

  
  




#### URLを実行してみる


  

通常のブラウザから実行したときのように Dispatcher クラスを使ってみると、アクションから出力されるhtmlコードを表示してみることができます。

    
    
    php> $Dispatcher = new Dispatcher('/posts');
    

![](/images/blog/taste-cake-4.png) 
  
  




#### Routerを使って、URLルーティングを試す


  


    
    
    php> echo Router::url(array('controller'=>'posts', 'action'=>'index'), false);
    /posts
    


  



### さいごに


このようにphpshからCakePHPを使ってみれば、製品コード上でvar_dumpして確認する必要もありません（ここ重要）。  

また、ここで紹介した使い方はほんの一片なので、実際にはもっと便利に使えるんじゃないかなぁと思っています。  

現在は、アプリケーションはapp限定です。もしapp以外のアプリケーションディレクトリを使っているひとは、taste.php の 39行目 'app' => 'app' の値を変更してください。  

CakePHP2.0対応は、そのうちやりたいなぁと思っています....
