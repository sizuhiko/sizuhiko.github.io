---
author: sizuhiko
comments: true
date: 2013-02-19 05:02:05+00:00
slug: cakephp-bddplugin-updates-2
title: CakePHP BddPlugin updates (2013/2/19)
wordpress_id: 53
categories:
- 未分類
tags:
- BDD
- BddPlugin
- CakePHP
- PHP
- Spec
---

<!-- more -->

### v0.9.3リリース


  

本日バージョン0.9.3をリリースしました。  

機能面での修正というわけではなく、今回は Composer の **A Multi-Framework Composer Library Installer** ([https://github.com/composer/installers](https://github.com/composer/installers)) という仕組みに対応したものです。  

  

なのでpluginsディレクトリでgit cloneして引き続きご利用の皆様は、今回のアップデートは無視してもらっても大丈夫です。  

  



### なにが嬉しいのか


  

Composerのフレームワークプラグインを管理する機能については、ちょっと前から知っていたのですが、まぁCakePHPでは3以降中心かな？と思っていたところ [@abe4tawa8](http://twitter.com/abe4tawa8) さんから Pull Request をいただきまして、修正を始めたといういきさつです。  

このComposerの仕組みを使うと、appディレクトリの下に利用するプラグインとかPHPUnitとかのrequireを指定したcomposer.jsonを置いておくことでプロジェクトで必要なモジュールの依存関係を解決しようというものです。  

例えば

    
    
    {
        "config": {
            "vendor-dir": "Vendor"
        },
        "minimum-stability": "dev",
        "repositories": [
            {
                "type": "pear",
                "url": "http://pear.phpunit.de"
            },
    
            {
                "type": "vcs",
                "url": "https://github.com/sizuhiko/CommonContexts.git"
            },
            {
                "type": "vcs",
                "url": "https://github.com/sizuhiko/Spec-PHP.git"
            },
    
            {
                "type": "vcs",
                "url": "git://github.com/sizuhiko/Bdd.git"
            }
        ],
        "require-dev": {
            "sizuhiko/Bdd": "dev-develop",
            "behat/mink-goutte-driver": "*",
            "behat/mink-selenium-driver": "*",
            "behat/mink-selenium2-driver": "*"
        }
    }
    


のように書くと、Bddプラグインを app/Plugins ディレクトリにインストールすることが可能になります。  

あとは app/Config/bootstrap.php に


    
    
    CakePlugin::load('Bdd');
    require dirname(dirname(__FILE__)).DS.'Vendor/autoload.php';
    



BddPluginの利用と、依存関係のライブラリ群のautoloadをrequireすれば大丈夫です。  

  



### 残念なお知らせ


  

Composerでは依存先のライブラリのrepositories指定を参照してくれません。


>   
Repositories are not resolved recursively. You can only add them to your main composer.json. Repository declarations of dependencies' composer.jsons are ignored.  



[http://getcomposer.org/doc/04-schema.md#repositories](http://getcomposer.org/doc/04-schema.md#repositories) より  

  

BddPluginではPullRequest中のCommonContextやforkしてカスタマイズしているSpec-PHPを使っており、それらのリポジトリを指定する必要があります。  

他の依存関係はどうなっているの？と、気付いた方はするどいわけですが、Composerは[Packagist](https://packagist.org/)というリポジトリサイトを使っており、ここに必要なリポジトリを追加すれば良い訳です。登録は無料です。  

で、これらforkしたプロジェクトについても登録してしまえば良いと思って作業を進めていたのですが、いざ手元でも動作確認がほぼOKになったところでPackagistのサイトでSubmitしようとすると


>   
Do not submit forks of existing packages. If you need to test changes to a package that you forked to patch, use VCS Repositories instead. If however it is a real long-term fork you intend on maintaining feel free to submit it.  



特に「**Do not submit forks of existing packages. **」の部分は太字になっていまして、他を受け付けない雰囲気を醸し出しています。まぁ要はメンテナンスを続けるならフォークしたプロジェクトでも登録可能だよ、と書いてあるわけですが、あまりの警告にビビってしまい各アプリケーションのcomposer.jsonにrepositoriesを追加してもらう方針としました。必要な部分は上記サンプルのとおりになっています。  

  



### さいごに


  

そういえばBddPlugin自体はPackagistに登録しても問題ないのだった！、と今Blogを書いていて気がついたので、それはこれから実施します。そうするとBddPluginのリポジトリ宣言は必要なくなりますね（汗  

今のcomposer.jsonではnameがsizuhiko/Bddになっていて、BddをスモールケースにしろとPackagistに怒られているので、少々時間がかかります  

それと先日Co-Edoで行われたCakeBeerTalkの飛び入りLTでも話しましたが、使っていての不明点など何でもgithubのissueで質問ください。よろしくおねがいします。  

BddPluginを使った勉強会もやりたいですなー

