---
title: Middleman を 3系から 4系にアップグレードした
date: 2022-05-06 01:59 UTC
tags: 
- Middleman
---

GWどこ行っても混んでそうなんで、月-金はブログを書くと決めた今年。
ここ2年コロナでコミュニティ活動やらもできず、ブログを書くのもモチベ下がりまくりだったけど、良いきっかけになりました。
さて、久々にブログやるのだから、せっかくなんで執筆環境もアップデートしようということで、確認すると Middleman は 4系にアップデートされていました。

Middleman公式のアップデートガイド[v4 へのアップグレード](https://middlemanapp.com/jp/basics/upgrade-v4/)をまずはチェック。

ふむふむ、 config には影響ありそうだけど、それ以外は外部ライブラリやテンプレート関係っぽいので、まずはビルドしてみてかな、という感じ。
そういえば Middleman で使ってる Ruby のバージョンも古いなーと思って、 Middleman v4 で対応している Ruby バージョンは何だろう？と調べました。

特に記述がないので Ruby 3系でも動くのかなーと思っていたら、[Cannot start server ( or use cli) with Ruby 3.0 and Middleman 4](https://github.com/middleman/middleman/issues/2539)なんて issue がありました。

> Which 4.4.0 tried to add some support for Ruby 3, I would not suggest relying on it. It is far too much work to support projects as old as 2008 and a language released in 2020 at the same time.
>
> Patches welcome or if you want to live dangerously the master branch and 5.0x series will be Ruby 3.1+ only

とのこと。Middleman 5系になると Ruby 3.1以上のみになるんですね。まぁそれまでは Ruby 2系かぁということで、とはいえ2系も古いバージョンが手元に入っていたので、これを最新にすることにしました。

### Ruby 2.7.6 へのアップデート

Ruby のバージョン管理には rbenv + ruby-build を使っているので、まずはそれ自体のアップデートを。
brew 使っても良いのですが、僕は git から clone して使っているので、 pull して最新に。

```bash
$ rbenv install 2.7.6
Downloading openssl-...

BUILD FAILED 
```

あれ？なんかopensslダウンロードしようとして、失敗するな...

`rbenv brew openssl` でググるとありました。[rbenv installがopensslで失敗する](https://qiita.com/kazutosato/items/9c4ff7711ca992dd67e5)、そして解決策をみて「あーこれ昔もハマった記憶があるような、ないような」という気分に。

ということで、以下のコマンドを実行して無事アップデートできました。

```bash
RUBY_CONFIGURE_OPTS="--with-openssl-dir=/opt/local/bin/openssl" rbenv install 2.7.6
```

### Middleman 4.4.2 へのアップデート

まず `bundle outdated` で、アップデート可能なバージョンがあるか確認します。
Gemfileは以下のようになっていました。

```
# the following line to use "https"
source 'http://rubygems.org'

gem "middleman", "~> 3.2.2"
gem "middleman-blog", "~> 3.5.1"
gem "middleman-deploy"

# For feed.xml.builder
gem "builder", "~> 3.0"
gem "middleman-syntax"
gem "redcarpet"
```

すると、 `middleman` と `middleman-blog` には、ともに 4系のアップデートがあったので、 `Gemfile` のバージョンを更新して `bundle update` を実行しました。

### middleman-deploy の更新

ライブラリのバージョンも無事アップデートできたので、 `bundle exec middleman server` を実行してみたところ、 `middleman-deploy` でエラーが出ます。
このライブラリは `outdated` で調べたとき更新がなかったので、何でだろう？と思い、まずは issue を調べてみることに。
そうしたら、ありました。
[Error with Middleman 4.2 and middleman-deploy 1.0](https://github.com/karlfreeman/middleman-deploy/issues/132)

なるほど、まだステーブルではない [2.0.0.pre.alpha](https://rubygems.org/gems/middleman-deploy/versions/2.0.0.pre.alpha) バージョンを利用しないといけないようです。これだと `outdated` には出ないですね。
それに伴い condfig も変更になっていました。

```ruby
activate :deploy do |deploy|
  deploy.build_before = true # default: false
  # deploy.method = :git 1系の指定方法
  deploy.deploy_method = :git # 2系の指定方法
```

しかし、alpha から 7年経過...。Middleman も一時期は流行ったのですが、SSG(Static Site Generator)の移り変わりも速いですね。
今は何が流行っているのだろうか？

### さいごに

[これらを修正した commit はこちら](https://github.com/sizuhiko/sizuhiko.github.io/commit/cbcec8474610850da2bca9f61ef46ed9b0a019ec)になります。

実は古い記事の demo コードもブログに混ぜていたのですが、これを入れると何故か UTF-8 じゃないファイルがある、みたいなエラーになってしまいました。
エラー箇所は、バイナリー判定してバイナリーでないファイルだったら、みたいなコードもあったりするので、 html が置いてあるといけないのかな。なんでとりあえず demo はディレクトリごと削除することに。
まぁ古い jQuery 関係の demo なんで、そのうちそれらはライブラリ側の github pages に移そうと思います（もう需要ないだろうけど）。

あと middleman コマンド実行すると

```
Deprecation warning: Expected string default value for '--instrument'; got false (boolean).
This will be rejected in the future unless you explicitly pass the options `check_default_type: false` or call `allow_incompatible_default_type!` in your code
You can silence deprecations warning by setting the environment variable THOR_SILENCE_DEPRECATION.
```

みたいなワーニングが出ているので、時間があったらこちらも調査したいなと思っています。
