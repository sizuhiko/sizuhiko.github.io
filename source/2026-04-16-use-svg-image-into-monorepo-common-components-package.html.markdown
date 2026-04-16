---
title: React 共通パッケージで SVG を賢く管理する —— SVGR を活用したコンポーネント化戦略
date: 2026-04-16 08:07 UTC
tags: 
- React
- Component
- SVG
---

デザインシステムの共通化などで React コンポーネントをプロジェクト横断で使うことはよくあると思います。
もしくはモノレポ構成で複数のWebアプリがあったとき、その間で利用する共通コンポーネントだったりするかもしれません。

そんなとき SVG 画像をどうやって管理したら **気持ちいいか**  を考えてみたので、記事にしました。

## SVG のままインポートすれば良いのでは？

いや、まぁそうなんです。

[Vite React (TypeScript) vite-plugin-svgr で SVG をコンポーネントとして扱う](https://chaika.hatenablog.com/entry/2023/12/11/083000) のようにプラグインを使ったり、直接 `.svg` をインポートできるように tsconfig を設定したりすればできなくはないです。

アプリケーション側のアセット管理であれば、それで良いと思っています。

でも共通コンポーネントパッケージとしたとき、どうやって import するかという話になってきます。
もちろん `package.json` の import で拡張子が `.svg` だったとき `public` フォルダを参照させるとか方法はいくらでもあります。

今回の記事では、共通コンポーネント側で JavaScript ファイルにバンドルしたときに含まれてくれることをゴールにしたいと思います。
なので、アセット参照で良いや、という方はゴメンなさい。

## SVG をどうやってコンポーネント化するか

[SVGR](https://react-svgr.com/) というツールを使います。これがとても便利です。

モノレポだと以下のようなディレクトリ構成になっているとします。

```
└── packages/
    └── components/
        ├── icons/    <-- ここにFigmaなどから取得したsvgファイルを保存
        │     └── warning.svg
        └── src/
              ├── Button/    <-- ボタンコンポーネント
              └── Icons/    <-- ここに React コンポーネント化された svg が生成される
```

package.json の `scripts` に `gen:icons` を設定します。

```json
  "scripts": {
    "gen:icons": "npx @svgr/cli -d src/Icons icons"
  },
```

`icons` ディレクトリにある svg 画像がすべて React コンポーネントになって `src/Icons` の下に変換されます。
`warning.svg` は `Warning.tsx` に変換されます。

```tsx
import * as React from 'react'
import type { SVGProps } from 'react'
const SvgWarning = (props: SVGProps<SVGSVGElement>) => (
    // 実際のSVGタグが入る
)
export default SvgWarning
```

あとは `src/Icons/index.ts` を作って export すれば良いだけです。簡単ですね

```typescript
export { default as Warning } from './Warning'
```

アプリケーション側では、共通コンポーネントを `npm i` してから以下のように利用します。

```tsx
// 使う側のイメージ
import { Warning } from '@common/components';

const App = () => <Warning color="red" />;
```

この方法の最大のメリットは、SVG がただの画像ではなく「コード」として扱えるようになることです。
これにより、Tree Shaking の恩恵を受けられたり、型定義によって props の補完が効くようになったりと、開発体験が劇的に向上します。

## SVG コンポーネント化すると良いこと

**Custom Templates** が使える。これですね。CLIのパラメータでもある程度カスタマイズできますが、テンプレートを修正する方が見通しが良いです。

- [Custom Templates 公式ドキュメント](https://react-svgr.com/docs/custom-templates/)

たとえばアプリケーションがテーマを変更できるようになっていたとき、SVGの色を変えたいことがあります。もちろん CSS で変更できる場合もありますが、SVG側でかなり考慮されていないと難しいです。
カスタムテンプレートを使えば fill の値を props にするよう定義することもできるので、そういった需要にも柔軟に対応できます。
これは **共通コンポーネント** という共通化では重要になってくるのではないでしょうか？

さらに共通コンポーネント集を作る際、悩ましいのが「各プロジェクトで微妙に異なる命名規則や型定義」です。
Custom Template を使えば、例えば IconProps という独自の型を自動で付与したり、aria-label などのアクセシビリティ属性を必須にするような出力も自由自在です。

単なる変換ツールとしてではなく、**「SVG の形をした React コンポーネントを量産する工場」**を定義できるのが SVGR の真価だと言えます。

## さいごに

今回は[SVGR](https://react-svgr.com/) というツールの紹介でした。
実際使ってみてとても便利なので、みなさんも使ってみてくださいね。
