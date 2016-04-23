---
title: gulp-rev-replace を使ってリビジョン管理をするときに注意したいこと
date: 2015-05-02 06:51 UTC
tags:
- JavaScript
- gulp
- gulp-rev
---

JavaScriptでモダンな開発をするとき、[gulp](http://gulpjs.com/)というビルドシステムを使うと、簡単にビルド過程を自動化できます。
さらに、JavaScriptでアプリケーションを作ったとき、ライブラリはCDNなどから取得するとして、自分で作ったスクリプトファイルは１つのファイルにまとめてミニファイズする、ということをgulpのタスクで書くでしょう。
一般的にJavaScriptやCSSをHTML上に記述するとき、以下のようにします。

```html
<script type="text/javascript" src="/js/app.js"></script>
<link rel="stylesheet" href="/css/app.css" type="text/css">
```

### リリースしたのにファイルの変更が読み込まれない

良くあるシーンとして、JavaScriptファイルやCSSファイルを差し替えたのに、変更がブラウザに反映されない、というケースです。
これはブラウザのキャッシュが有効になっていて、JavaScriptやCSSのファイルをWebサーバへ取得しに行かないために発生します。

そこで、この課題に対応するため、以下のどちらかの方法を採用すると思います。

- ファイル名のGETパラメータに、乱数を付加して `/js/app.js?_リビジョン番号` のようにする
- ファイル名にリビジョン番号を入れて `/js/app-リビジョン番号.js` のようにする

こうすると、リビジョンが変更になった（リリースした）ときにファイルが必ず読み込まれるようになります。

### GETパラメータの付加は推奨されない

前記の対応のうち、GETパラメータにリビジョン番号を追加する方法はあまり推奨されません(参照:[`High Performance Web Sites`](http://www.amazon.co.jp/High-Performance-Web-Sites-Essential/dp/0596529309/ref=tmm_pap_title_0?ie=UTF8&qid=1430550831&sr=8-1))。
この方法は、ブラウザやWebサーバがキャッシュを利用しないため、サイトの負荷につながります。

もちろん毎回リクエストが来ても問題ないサイトや、利用者が想定されていれば問題ないかもしれないですが、利用できるのであればキャッシュが有効になっていてページが速く表示できた方が良いことはいうまでもありません。

gulp-revを使ってGETパラメータにリビジョン番号を入れたい場合は、[gulp-rev-append](https://github.com/bustardcelly/gulp-rev-append)を使うとクエリ文字列としてハッシュ値を入れられるようになります。

### ビルド時にファイル名を変更する

推奨される方法は  `/js/app-リビジョン番号.js` のように、ファイル名を変更することです。
gulpのタスク上に、`gulp-rev`のREADMEに書いてあるとおりの方法で対応します。

```js
var gulp = require('gulp');
var rev = require('gulp-rev');
 
gulp.task('default', function () {
    // by default, gulp would pick `assets/css` as the base, 
    // so we need to set it explicitly: 
    return gulp.src(['assets/css/*.css', 'assets/js/*.js'], {base: 'assets'})
        .pipe(gulp.dest('build/assets'))  // copy original assets to build dir 
        .pipe(rev())
        .pipe(gulp.dest('build/assets'))  // write rev'd assets to build dir 
        .pipe(rev.manifest())
        .pipe(gulp.dest('build/assets')); // write manifest to build dir 
});
```

プロジェクトによっては、このように単純な構成ではなく、複数のストリームを使ってビルドすることもあるでしょう。

```js
gulp.task('build_js', function () {
    return gulp.src('src/*.js')
        .pipe(sourcemaps.init())
        .pipe(concat({path: 'bundle.js', cwd: ''}))
        .pipe(rev())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('dist'));
```

たとえばjsとcssを分けてビルドしなくてはいけないようなケースですね。
元ファイル名と、置き換えられたファイル名のマッピングを出力するために、`rev.manifest()`というAPIを呼び出します。
出力先は、そのあとの`dest`API呼び出しで指定します。ファイル名は省略時には `manifest.json` というファイル名になります。

```js
{
    "app.css": "app-098f6bcd.css",
    "app.js": "app-273c2cin.js"
}
```

### ファイル名の変更を反映する

HTMLファイルのjsやcssのファイル名を書き換えるのに使うのが、[gulp-rev-replace](https://github.com/jamesknelson/gulp-rev-replace)です。
マニフェストファイルを入力として、HTMLファイルのビルド（コピー）過程で差し込むことができるようになっています。

```js
gulp.task("revreplace", ["revision"], function(){
  var manifest = gulp.src("./" + opt.distFolder + "/rev-manifest.json");

  return gulp.src(opt.distFolder + "/index.html")
    .pipe(revReplace({manifest: manifest}))
    .pipe(gulp.dest(opt.distFolder));
});
```

`revReplace()` というAPIを使って、指定したマニフェストの内容と一致する部分を置換します。

```html
<script type="text/javascript" src="/js/app-273c2cin.js"></script>
<link rel="stylesheet" href="/css/app-098f6bcd.css" type="text/css">
```

### とても便利、でも...

私が遭遇したケースで説明しましょう。
ビルド済みファイル名が `domain.js` というファイル名でそれにリビジョン番号を追加する必要がありました。
さらにドメイン名のチェック用に、[is-valid-domain.js](https://github.com/miguelmota/is-valid-domain)というライブラリも読み込んでいました。

```html
<script type="text/javascript" src="/lib/is-valid-domain.js"></script>
<script type="text/javascript" src="/js/domain.js"></script>
```

ここでビルドしたところ

```html
<script type="text/javascript" src="/lib/is-valid-domain-リビジョン番号.js"></script>
<script type="text/javascript" src="/js/domain-リビジョン番号.js"></script>
```

のようになってしまいました。`domain.js` だけでなく、`is-valid-domain.js` も変わってしまいます。
なぜこうなるか、ソースを見てみました。

```js
renames.forEach(function replaceOnce(rename) {
  contents = contents.split(rename.unreved).join(rename.reved);
  if (options.prefix) {
    contents = contents.split('/' + options.prefix).join(options.prefix + '/');
  }
});
```

まぁですよね。ファイルを読み込んで `domain.js` に一致するところで分割、`domain-リビジョン番号.js` を追加して繰り返す、という実装です。
ファイルのどこに入っているか厳密に識別するのは困難（正規表現を使えばできなくはないかもしれないけど）です。

で、このようなケースにならなそうなら、そのまま gulp-rev-replace を使ってもらえば問題ないと思います。
ライブラリの挙動がわかっていれば利用するのも安心ですね。

### 私は gulp-template を使いました

で、私は gulp-rev-replace 使うのやめました。

ちょっと予期しない動作をするのは怖かったので、リビジョン番号が入って欲しいところを明示するようにしたかったのです。
そこで使ったのが [gulp-template](https://github.com/sindresorhus/gulp-template) です。

```html
<h1>Hello <%= name %></h1>
```

`<%= =>` で囲んだ部分に値を差し込むことができるので、以下のように記述します。

```html
<script type="text/javascript" src="/lib/is-valid-domain.js"></script>
<script type="text/javascript" src="/js/<%= data['domain.js'] %>"></script>
```

そこにマニフェストJSONを`fs-extra`で読み込んで、`template`APIに流し込むようにします。
そのままだと、変換前JSファイル名が変数名になって取り出しずらいので、`variable`オプションを指定して`data`という変数名にバインドするようにします。

```js
var gulp = require('gulp');
var template = require('gulp-template');
var fs = require('fs-extra');

gulp.task('build_html', function () {
	var manifest = fs.readJsonSync('./' + opt.distFolder + '/rev-manifest.json', {throws: false})
    return gulp.src('src/*.html')
        .pipe(template(manifest, {variable: 'data'}))
        .pipe(gulp.dest('dist'));
});
```

### まとめ

静的ファイルのリビジョン管理って結構面倒なんですが、gulp使うと便利なライブラリあって簡単に実装できます。
今回は私が遭遇した特殊なケースかもしれないので、そのままgulp-revだけで完結できることも多々あるでしょう。
gulp-revや、その関連ライブラリには便利な機能がまだあるので、一度使ってみてください。



