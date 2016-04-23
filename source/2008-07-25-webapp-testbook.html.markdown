---
author: sizuhiko
comments: true
date: 2008-07-25 08:07:10+00:00
slug: '%e6%9c%ac%e6%97%a5%e3%80%81%e7%84%a1%e4%ba%8b%e7%99%ba%e5%a3%b2%e3%81%95%e3%82%8c%e3%81%be%e3%81%97%e3%81%9f'
title: 本日、無事発売されました
wordpress_id: 16
categories:
- 未分類
tags:
- PHP
- SimpleTest
- Webアプリケーションテスト手法
---

<!-- more -->「Webアプリケーションテスト手法」という本を共著しました。「SimpleTestによるPHPのテスト」というお題で、PHPの自動テストについて書きました。実はこの本は紆余曲折あったのですが、まさに”無事”という言葉が当てはまります。何はともあれ拍手！パチパチ　:cheers:   

[![](http://images.amazon.com/images/P/4839924309.09._PC_SCMZZZZZZZ_.jpg)](http://www.amazon.co.jp/Web%E3%82%A2%E3%83%97%E3%83%AA%E3%82%B1%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3%E3%83%86%E3%82%B9%E3%83%88%E6%89%8B%E6%B3%95-%E6%B0%B4%E9%87%8E-%E8%B2%B4%E6%98%8E/dp/4839924309/ref=sr_1_2?ie=UTF8&s=books&qid=1216973795&sr=8-2)
  

  

で、SimpleTestとはxUnit系のテスティングフレームワークなんで。assertEqual()とかあるわけですが、本家のWebサイトや自身のテストコードが

    
    assertEqual($hoge, 'Hello');
    


みたいになってるんで、本もそのとおりにしています。  

本当なら、

    
    assertEqual('Hello', $hoge);
    


とassertEqual(期待値, 戻り値);みたいに書きたいわけですが、まぁ大きな問題ではないです。  

と、思ってCakePHPのテストコードを見てみたら、やっぱりassertEqual(戻り値, 期待値);のほうになってるんですね。SimpleTestベースに使っているから、そのままなんだと思います。  

PHPUnitは、assertEqual(期待値, 戻り値);になってますね。テストコード見ると、SimpleTestベースなのかPHPUnitベースなのかわかるという副作用もありますが。。。。

