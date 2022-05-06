---
title: Rails 7の採用提案で注目を集め始めた Import maps の過去、現在、そして未来について...
date: 2022-05-06 08:03 UTC
tags: 
- import maps
---

[import maps](https://github.com/WICG/import-maps) については 2019年ごろに度々当ブログにて紹介してきました。
で、それからもずっと issue なんかを追いかけてはきたのですが、昨年 Rails 7 に import maps が入るっていう驚きがあったのと、
社内で発表する機会もあったので、少しスライドにまとめて発表しました。

<script async class="speakerdeck-embed" data-id="eb44656534a14719bfcb2847d29cf690" data-ratio="1.33333333333333" src="//speakerdeck.com/assets/embed.js"></script>

で、これを発表したのが 2021/11/29 （いい肉の日だった）のですが、それからすぐ 2021/12/15 Rails 7 がリリースされました。

### Rails 7 における import maps

[Rails 7.0: Fulfilling a vision](https://rubyonrails.org/2021/12/15/Rails-7-fulfilling-a-vision)

で、import maps に関連する部分として [Importmap for Rails](https://github.com/rails/importmap-rails) というライブラリができました。
[Rails本体の Gemfile に入っている](https://github.com/rails/rails/blob/main/Gemfile#L24)ので Rails 7+ をインストールすると、自動的に入ります。
Railsのアプリケーションジェネレータを使うとき、 `javascript` オプション( `-j` )のデフォルトも `importmap` のようです。
[/railties/lib/rails/generators/rails/app/app_generator.rb#L26](https://github.com/rails/rails/blob/2a98e28a31d3b9a720c4a9571c23b40433a035df/railties/lib/rails/generators/rails/app/app_generator.rb#L260)

ドキュメントにも書いてあるとおり、現時点は Chrome/Edge 89+ だけが import maps をサポートしているので、[es-module-shims](https://github.com/guybedford/es-module-shims)を使っているようです。

ライブラリの中では [importmap_tags_helper.rb](https://github.com/rails/importmap-rails/blob/main/app/helpers/importmap/importmap_tags_helper.rb) で import maps 関連のタグを出力できるヘルパー関数を用意しています。
ドキュメントによると、設定は `config/importmap.rb` にするようです。

公式ドキュメントによると、以下のように記述するようです。

```ruby
# config/importmap.rb
pin "react", to: "https://ga.jspm.io/npm:react@17.0.2/index.js"
```

もしくはコマンド実行すると、最新のバージョンで `config/importmap.rb` に追記してくれるようです。
[Using npm packages via JavaScript CDNs](https://github.com/rails/importmap-rails#using-npm-packages-via-javascript-cdns)

```bash
./bin/importmap pin react react-dom
```

なるほど、といいたいところですが、ここで一つ疑問がおきます。
これって `npm outdated` や `npm audit` てきなことや、 dependabot での脆弱性チェックってどうなっちゃうのかしら？と。

### パッケージの最新追従はどうなるのか？

さきほどの `importmap` コマンドですが、 `unpin` という削除するオプションはあるようですが、アップデート系は書いてないので無いのかな？
あとは import maps の json を出力する `json` オプションがあるだけみたいだ（執筆時点のソースコードを確認した）。

脆弱性があったパッケージのアップデートとか気にしないのかな？気にするよね？
少し `package-lock.json` から `config/importmap.rb` に変換するライブラリとかないかな？と調べてみたりもしたのですが、
見つかりませんでした。

まぁそれより、ちゃんと issue 見るか、と思っていたらちゃんとありました。
[/bin/importmap outdated](https://github.com/rails/importmap-rails/issues/19)

で、上記に対するPRもありました。
[Add outdated and audit commands](https://github.com/rails/importmap-rails/pull/109)

こんな感じで出力されるようです。

#### Audit

<pre>
+-------------+----------+---------------------+--------------------------------------------------------+
| Package     | Severity | Vulnerable versions | Vulnerability                                          |
+-------------+----------+---------------------+--------------------------------------------------------+
| glob-parent | high     | <5.1.2              | Regular expression denial of service                   |
| is-svg      | high     | >=2.1.0 <4.3.0      | ReDOS in IS-SVG                                        |
| is-svg      | high     | >=2.1.0 <4.2.2      | Regular Expression Denial of Service (ReDoS)           |
| lodash      | critical | <4.17.12            | Prototype Pollution in lodash                          |
| lodash      | high     | <4.17.21            | Command Injection in lodash                            |
| lodash      | high     | <4.17.19            | Prototype Pollution in lodash                          |
| lodash      | high     | <4.17.11            | Prototype Pollution in lodash                          |
| lodash      | low      | <4.17.5             | Prototype Pollution in lodash                          |
| lodash      | moderate | <4.17.21            | Regular Expression Denial of Service (ReDoS) in lodash |
| lodash      | moderate | <4.17.11            | Prototype pollution in lodash                          |
| nth-check   | moderate | <2.0.1              | Inefficient Regular Expression Complexity in nth-check |
+-------------+----------+---------------------+--------------------------------------------------------+
  11 vulnerabilities found: 6 high, 3 moderate, 1 low, 1 critical
</pre>

#### Outdated

<pre><code>
+-----------------+---------------+---------------+
| Package         | Current       | Latest        |
+-----------------+---------------+---------------+
| @jspm/core      | 2.0.0-beta.18 | 2.0.0-beta.19 |
| @jspm/core      | 2.0.0-beta.2  | 2.0.0-beta.19 |
| aaaasssstimulus | 2.0.0         | Not found     |
| glob-parent     | 3.1.0         | 6.0.2         |
| is-glob         | 3.1.0         | 4.0.3         |
| is-svg          | 3.0.0         | 4.3.2         |
| lodash          | 4.17.1        | 4.17.21       |
| nth-check       | 1.0.0         | 2.0.1         |
| react           | 16.0.0        | 17.0.2        |
| stimulus        | 2.0.0         | 3.0.1         |
+-----------------+---------------+---------------+
  10 outdated packages found
</code></pre>

CI で dependabot みたいなのがどう検知するかといった課題はあるかもですが、いったんコマンド結果が出力できるので、それをシェルでゴニョゴニョすれば
アップデートの検知や脆弱性の発見はできるようになりそうですね。

### 合わせて読みたい

さいごに Zenn にも良い記事があったので、紹介しておきます。
[Rails 7.0 で標準になった importmap-rails とは何なのか？](https://zenn.dev/takeyuweb/articles/996adfac0d58fb)
