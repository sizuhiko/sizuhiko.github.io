---
title: uvu での Test Double 
date: 2022-05-05 09:10 UTC
tags: 
- TypeScript
- Test Double
- uvu
---

[uvu](https://github.com/lukeed/uvu) は軽量で高速なJavaScript/TypeScriptのテスティングランナーです。
SveltteKit でも利用されており、[pong-swoosh](https://its-succ.github.io/pong-swoosh/) でも採用しています。

現時点の uvu は assert 機能がメインで、依存関係をモックして置き換えるような Test Double には対応していません。
ただ、すべてが DI で解決できるわけではなく、依存パッケージについてはモックしたい場合もあります。

そこで [pong-swoosh](https://its-succ.github.io/pong-swoosh/) では、以下の2つのライブラリを使って、 uvu で Test Double を実現しています。

- [snoop](https://www.npmjs.com/package/snoop)
- [proxyquire](https://www.npmjs.com/package/proxyquire)

### snoop

`Easy breezy test spies fo sheezy.` というキャッチです（よくわからんw）。

やれることは Jest でいうところの `Jest.fn()` だと思っていれば大丈夫です。
モック関数を作れます。公式の Example でも uvu をランナーに使っていることから、親和性も高いです。

```javascript
import { snoop } from 'snoop';
import { test } from 'uvu';
import * as assert from 'uvu/assert';

const add = (a, b) => a + b;

test('add', () => {
  const addFn = snoop(add);
  const anotherAddFn = snoop(add);

  addFn.fn(1, 1);
  anotherAddFn.fn(1, 1);
  addFn.fn(2, 2);
  anotherAddFn.fn(2, 2);

  assert.ok(addFn.called);
  assert.not(addFn.notCalled);
  assert.not(addFn.calledOnce);
  assert.is(addFn.callCount, 2);
  assert.equal(addFn.calls[0].arguments, [1, 1]);
  assert.equal(addFn.calls[1].arguments, [2, 2]);
  assert.is(addFn.calls[0].result, 2);
  assert.is(addFn.calls[1].result, 4);
  assert.not(addFn.firstCall.error);
  assert.not(addFn.lastCall.error);
  assert.ok(addFn.calledBefore(anotherAddFn));
  assert.ok(addFn.calledAfter(anotherAddFn));
  assert.ok(addFn.calledImmediatelyBefore(anotherAddFn));
  assert.not(addFn.calledImmediatelyAfter(anotherAddFn));
});

test.run();
```

### proxyquire

Node.js の require モジュールをプロキシすることができるライブラリです。
Jest でいうところの `Jest.mock('ライブラリ名', {/** モック */})` だと思っていれば大丈夫です。

[公式サンプル](https://www.npmjs.com/package/proxyquire)を引用すると、以下のような感じです。

get.js:

```javascript
var get    = require('simple-get');
var assert = require('assert');
 
module.exports = function fetch (callback) {
  get('https://api/users', callback);
};
```

get.test.js:

```javascript
var proxyquire = require('proxyquire').noCallThru();
var assert = require('assert');
 
var fetch = proxyquire('./get', {
  'simple-get': function (url, callback) {
    process.nextTick(function () {
      callback(null, { statusCode: 200 })
    })
  }
});
 
fetch(function (err, res) {
  assert(res.statusCode, 200)
});
```

### pong-swoosh での使い方

この2つを組み合わせて、依存モジュールを `proxyquire` で置き換え、置き換える関数は `snoop` で作っています。

[create-channel.jsのテストコード](https://github.com/its-succ/pong-swoosh/blob/main/server/tests/create-channel.js)を例にします。
`create-channel` は、ブラウザからのチャンネル作成リクエストを受け付けたあと、実際にチャンネルを作成する処理です。

```javascript
test('まだ作成されていないチャンネルの場合は、チャンネル追加されてソケットにオーナー登録されること', (context) => {
  const getChannelMock = snoop(() => false); // 存在しないチャンネル
  const addChannelMock = snoop(() => {});
  const channelId = faker.datatype.uuid();
  const createChannel = proxyquire('../create-channel', {
    './channel': {
      getChannel: getChannelMock.fn,
      addChannel: addChannelMock.fn,
    },
    'uuid': {
      v4: () => channelId,
    },
  });
  const result = createChannel(context.socket, 'test', 'test.ch');

  assert.ok(addChannelMock.called);
  assert.is(addChannelMock.callCount, 1);
  assert.equal(addChannelMock.calls[0].arguments, ['test', channelId, 'test.ch']);
```

`create-channel` の実装では以下のように `channel` モジュールに依存しているので、そこをモックしていきます。

```javascript
const channel = require('./channel');
const { v4: uuidv4 } = require('uuid');

module.exports = (socket, userId, channelName, channelId) => {
  const exists = channel.getChannel(userId, channelName);
```

まず、Test Double を下準備します。

```javascript
  const getChannelMock = snoop(() => false); // 存在しないチャンネル
  const addChannelMock = snoop(() => {});
  const channelId = faker.datatype.uuid();
  const createChannel = proxyquire('../create-channel', {
    './channel': {
      getChannel: getChannelMock.fn,
      addChannel: addChannelMock.fn,
    },
    'uuid': {
      v4: () => channelId,
    },
  });
```

`snoop` でモック関数を2つ作り、それを `proxyquire` を使って、 `./channel` の `require` モジュールを置き換えます。
`uuid` モジュールも同様に `snoop` でモックしていることがわかるでしょう。

で、実際に `const result = createChannel(context.socket, 'test', 'test.ch');` でテスト対象のモジュールを呼び出したら
`getChannel` が `false` になると `addChannel` が呼ばれるのが正しい動作なので、以下のように検証しています。

```javascript
  assert.ok(addChannelMock.called);
  assert.is(addChannelMock.callCount, 1);
  assert.equal(addChannelMock.calls[0].arguments, ['test', channelId, 'test.ch']);
```

- 1行目は、 `addChannel` が呼ばれたかどうか
- 2行目は、 `addChannel` が何回呼ばれたか
- 3行目は、 `addChannel` がどのような引数で呼び出されたか

を検証することができます。Jest で Test Double を書いたことがあれば、イメージはつきやすいと思います。
このように Test Double の機能が標準では備わってない uvu でも、どうしてもモックしたいテストも記述できるようになっています。
