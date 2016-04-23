---
title: CakePHPで動的にプレフィックスルーティングを追加したときに気をつけること
date: 2014-03-08 17:04:00+09:00
slug: cakephp-addprefix-here-problem
tags:
- CakePHP
---

<!-- more -->
あるURLや特定のパラメータ、ユーザでアクセスされたとき、プレフィックスルーティングを付けたかったので、動的に付与したらハマったので小ネタを書いておきます。

### 動的にプレフィックスルーティングを追加するには

公式ドキュメントの解説のとおり、

    // routes.php
    Router::connect(
        "/site-proxy/:controller",
        array('action' => 'index', 'prefix' => 'site-proxy', 'site-proxy' => true)
    );
    
    // core.phpなど
    Configure::write('Routing.prefixes', array('site-proxy'));

のように記述します。

RouterTest.phpのテストコードを見たら

    $request = new CakeRequest();
    $request->addParams(array(
        'controller' => 'registrations', 'action' => 'admin_index',
        'plugin' => null, 'prefix' => 'admin', 'admin' => true,
        'ext' => 'html'
    ));

みたいなコードがあったので、CakeRequest::addParams() を使って追加できることがわかります。

実際コントローラで

    $this->request->addParams(['prefix' => 'site-proxy', 'site-proxy' => true]);

みたいに書くと、View上で $this->html->link() などで出力されるURLにプレフィックスルーティングが追加されます。

### ハマりポイント

View上でフォームを作成するときに

    echo $this->Form->create('Post');

のように書くと思うのですが、このようにモデル名だけが指定されているときCakePHPではどのようにURLが生成されるか、というと

    // FormHelper::create() L367付近
    if ($options['action'] === null && $options['url'] === null) {
        $options['action'] = $this->request->here(false);
    } elseif (empty($options['url']) || is_array($options['url'])) {

URLというオプションを指定しない場合は、 action は CakeRequest::here() の値になることがわかります。

で、CakeRequest::here() とはどんなコードか見てみると

    public function here($base = true) {
        $url = $this->here;
        if (!empty($this->query)) {
            $url .= '?' . http_build_query($this->query, null, '&');
        }
        if (!$base) {
            $url = preg_replace('/^' . preg_quote($this->base, '/') . '/', '', $url, 1);
        }
        return $url;
    }

のようになっていて、要は現在のURL（$this->query）から再生成されるだけです。リクエストに入っているプレフィックスルーティングの設定は参照されず、プレフィックスなしのURLがformタグのactionに入ってしまいます。

### まとめ

解決方法としては

- Form::create() で `url` オプションを追加する
- addParams するときに here を変更する

        // 例）
        $request->addParams(array(
            'admin' => true,
            'prefix' => 'admin',
        ))->addPaths(array(
            'here' => '/admin/this/interesting/index',
        ))

あたりが良さそうです。まぁ動的にプレフィックス付けるなんてあんまりやらないのかもしれないですが、何かの参考になれば...    

