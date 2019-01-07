---
title: GCPにBitnamiでmemcachedサーバーを作る
date: 2019-01-07 02:26 UTC
tags:
- GCP
- memcached
- Bitnami
---

2019年最初の記事はmemcachedのサーバーを作ることからです。

### なんで今さらサーバーを？

私は現在[Toilet Evolution](https://toiletevolution.space/)というサービスを作っていて、まぁ特に流行ってもいないのですが、トイレ監視のIoTプラットフォームをやっています。
これはGAE(Google App Engine)で動いていて、PHP5.5で作られています。

GAEには[gVisor](https://github.com/google/gvisor)というコンテナ技術をベースにした第二世代( `2nd Gen` と呼ばれている )があるのですが、PHP7.2が使えるようになります。
しかしこれに伴い、これまで使えていたmemcachedサーバーが使えなくなります。
通常のGCPアプリと一緒となり、[Cloud Memorystore](https://cloud.google.com/memorystore/?hl=ja)を使えということですね。
ただ、これには無料枠がなくて、（なんとか低額でやっていきたい層だけが）ぬーんとなるので、今回 GCP の無料インスタンス `f1-micro` にmemcachedサーバー(SASL付き)を構築してみようという試みです（`f1-micro` が無料で使えるのは米国リージョンだけです）。

### Bitnami

[Bitnami](https://bitnami.com)とは、アプリケーションをインストールするのを支援するサービスで、クラウドにも対応しています。
memcachedサーバーをGCP上に構築するのも、GUIからポチポチと実行できます。
もちろん自力でやっても問題はないので、[SASL memcached now available!](https://blog.couchbase.com/sasl-memcached-now-available/)みたいな記事を読んでやってもOKです。

Bitnamiの画面遷移とかざっくりした説明は書きません。
[GCPにRedmine環境を作ってみた](https://stpost.net/se/web-se/server/gcp-redmine-environment)というBlogが、Bitnamiを使ってGCPにRedmine環境を作るという内容で、スクショもたくさんあってわかりやすいです。
まぁ使ってみてそんなにハマりどころはないので、読まなくてもだいたい大丈夫です（ただし英語アレルギーとかない人）。

### プロジェクトを作る

GCPでプロジェクトを作って（もしくは既存のプロジェクトで）以下のAPIを有効化しておくと、Bitnamiからのデプロイが簡単に進みます。

- [Compute Engine API](https://console.cloud.google.com/apis/api/compute.googleapis.com/overview)
- [Google Cloud Deployment Manager V2 API](https://console.cloud.google.com/apis/api/deploymentmanager.googleapis.com/overview)

あとは課金の設定。

### memcachedサーバーを作る

米国リージョンを選択するのですが、App Engine と同じリージョンに配置したいので、 `gcloud app regions list` で利用できるリージョンを確認しておきましょう（GAEからはインターネット越しになるので、それほど意味があるかはわかりませんが、気分的な問題ですw）。

memcachedを選択して、プロジェクトを選んでいくと `us-xxxx` のリージョンで `f1-micro` を選択したのに、料金が表示（$4.28ぐらい）されるかもしれませんが、
[f1-micro インスタンス使用量は、最初の 744 時間分が無料](https://cloud.google.com/free/docs/always-free-usage-limits) なので、744時間 == 31日 ということで実質月額無料です。

`Application Info` にユーザー名 `user` とパスワードがあるので、PHPから接続する情報として記録しておきます。
`Server Info` にアクセスするときのIPアドレスがあるので記録しておきます。また、SSHするときのキーがあるので、何かのときのためにダウンロードしておきます。

[Cloud ConsoleのVMインスタンス](https://console.cloud.google.com/compute/instances)に、memcachedサーバーができているのを確認しておきます。

#### App Engine からアクセスできるようにする

このままでは App Engine からアクセスできない（App Engine はインターネット経由でGCPのVMにアクセスするため）ので、ファイヤーウォールの設定を行います。
Bitnamiのドキュメント[Connect To Memcached From A Different Machine](https://docs.bitnami.com/google/infrastructure/memcached/administration/connect-remotely/)によると、ポート `11211` を解放するよう書いてあります。
BitnamiからインストールされるmemcachedはデフォルトでSASL認証がonになっているので、PaaSのようにIP制限できない環境からクラウド越しに利用するときは安心ですね。

もし、GCPでのファイヤーウォール設定のやり方がわからない場合は、上記ページの `the FAQ` の遷移先 [Open Or Close Server Ports](https://docs.bitnami.com/google/faq/administration/use-firewall/)が参考になります。

### サンプルプログラム

[GAE 2nd Gen で動くPHP7.2のサンプルプログラム](https://github.com/sizuhiko/gae-php7-memcache-sample)を用意しました。

`app.yaml` ファイルの環境変数を3つ設定します。

- MEMCACHED_SERVER_ADDR: memcached サーバーのIP
- MEMCACHED_USERNAME: ユーザー名。これはデフォルトで `user` になっているので、変更不要
- MEMCACHED_PASSWORD: `Application Info` で表示できるパスワード

以下のコマンドでプロジェクトにApp Engineを作ります。例えば `us-west2` に memcached サーバーを構築したら以下のような感じです。

```
gcloud app create --region=us-west2
```

続いて、アプリケーションをデプロイします。

```
gcloud app deploy
```

### 実行してみる

GAEのエンドポイントに接続すると、以下のように表示され、memcached と接続し読み書きできていることがわかります。

```
Array
(
    [xxx.xxx.xxx.xxx:11211] => Array
        (
            [pid] => 1786
            [uptime] => 4689
            [time] => 1546843636
            [version] => 1.5.12
            [libevent] => 2.0.17-stable
            [pointer_size] => 64
            [rusage_user] => 0.46
            [rusage_system] => 0.188
            [max_connections] => 1024
            [curr_connections] => 2
            [total_connections] => 5
            [rejected_connections] => 0
            [connection_structures] => 3
            [reserved_fds] => 20
            [cmd_get] => 2
            [cmd_set] => 2
            [cmd_flush] => 0
            [cmd_touch] => 0
            [get_hits] => 2
            [get_misses] => 0
            [get_expired] => 0
            [get_flushed] => 0
            [delete_misses] => 0
            [delete_hits] => 0
            [incr_misses] => 0
            [incr_hits] => 0
            [decr_misses] => 0
            [decr_hits] => 0
            [cas_misses] => 0
            [cas_hits] => 0
            [cas_badval] => 0
            [touch_hits] => 0
            [touch_misses] => 0
            [auth_cmds] => 3
            [auth_errors] => 0
            [bytes_read] => 607
            [bytes_written] => 6855
            [limit_maxbytes] => 67108864
            [accepting_conns] => 1
            [listen_disabled_num] => 0
            [time_in_listen_disabled_us] => 0
            [threads] => 4
            [conn_yields] => 0
            [hash_power_level] => 16
            [hash_bytes] => 524288
            [hash_is_expanding] => 0
            [slab_reassign_rescues] => 0
            [slab_reassign_chunk_rescues] => 0
            [slab_reassign_evictions_nomem] => 0
            [slab_reassign_inline_reclaim] => 0
            [slab_reassign_busy_items] => 0
            [slab_reassign_busy_deletes] => 0
            [slab_reassign_running] => 0
            [slabs_moved] => 0
            [lru_crawler_running] => 0
            [lru_crawler_starts] => 3060
            [lru_maintainer_juggles] => 4979
            [malloc_fails] => 0
            [log_worker_dropped] => 0
            [log_worker_written] => 0
            [log_watcher_skipped] => 0
            [log_watcher_sent] => 0
            [bytes] => 69
            [curr_items] => 1
            [total_items] => 2
            [slab_global_page_pool] => 0
            [expired_unfetched] => 0
            [evicted_unfetched] => 0
            [evicted_active] => 0
            [evictions] => 0
            [reclaimed] => 0
            [crawler_reclaimed] => 0
            [crawler_items_checked] => 0
            [lrutail_reflocked] => 0
            [moves_to_cold] => 2
            [moves_to_warm] => 0
            [moves_within_lru] => 0
            [direct_reclaims] => 0
            [lru_bumps_dropped] => 0
        )

)
Hello World
```

数回アクセスしてみると、以下のようなスペックになります。

- 99 パーセンタイル: 90.24ms
- 95 パーセンタイル: 89.18ms
- 50 パーセンタイル: 77.25ms

### さいごに

私のサービスは `Cloud Datastore` のキャッシュとしてmemcacheを使っているので、キャッシュになければ、
永続化しているところから直接ロードするだけなので、堅牢さはそれほど必要ないです。
できれば `Cloud Datastore` へのI/O回数を減らして低額でやりたいなぁという程度なので、`f1-micro` に1つサーバーを起動する程度で良いという割り切りです。

あとは[redislabs](https://redislabs.com)が30MBまでなら無料で使えるので、そういうのも選択肢としてあるかもしれないですね（実際に[GAE Python3のドキュメント](https://cloud.google.com/appengine/docs/standard/python3/using-redislabs-redis?hl=ja)からはリンクされていたりする）。

もし同様にやってみたいなぁと思う方がいたら参考になれば幸いです。
