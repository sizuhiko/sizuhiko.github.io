---
title: cakephp-fabricate-adaptor を CakePHP3.6 対応しました
date: 2018-06-10 03:51 UTC
tags:
- CakePHP
- Fabricate
---

![](/images/blog/cakephp-fabricate-adaptor-3.6.png)

CakePHPのコア開発のメンバーでもある dakota が南アからPRをくれました。
最近は普段からCakePHP使っていないので、PRはとても助かります。
テストコードなかったので、たくさんビルドエラーになっていましたが、マージして、私の方で対応しておきました。

デフォルトの[developブランチ](https://github.com/sizuhiko/cakephp-fabricate-adaptor)から取得すると、CakePHP3.6の開発でも利用できます。

まだリリース切ってないけど、3.6以前と互換性なくなるので、バージョン番号の規則から言うと 0.x → 1.x にするしかないのかな。
もう少し見直してから（結果として何も変わらないかもしれないけど）1.0にしたいと思っていますので、しばらくお待ちください。
