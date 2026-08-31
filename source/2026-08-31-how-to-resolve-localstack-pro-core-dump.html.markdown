---
title: LocalStack Pro が Apple Silicon で起動しない（SIGILL / exit code 252）原因と解決方法
date: 2026-08-31 11:14 UTC
tags: 
  - localstack
---

[LocalStack の今後の方向性：AWS クラウド エミュレーターの提供方法の変更に関するお知らせ](https://www.xlsoft.com/jp/blog/blog/2026/04/10/localstack-for-aws-1-post-195598/) というニュースが出て、
今後は有償化になるよというので、他のエミュレーターに切り替えた人も多いでしょう。

一方で、v4 のコミュニティエディションを固定で使い続けて、どこかで（稟議通ったりしたら） LocalStack Pro に切り替えるという選択をした開発チームもあるでしょう。

僕らは後者を選択しました。そして遂にライセンスを手に入れたので、pro で起動してみたら以下のようなエラーになったので、それを解決したという記事です。

```
localstack-main   | 
localstack-main   | LocalStack version: 2026.8.0
localstack-main   | LocalStack build date: 2026-08-26
localstack-main   | LocalStack build git hash: ad728e1ae
localstack-main   | 
localstack-main   | 2026-08-27T02:47:53.265  INFO --- [  MainThread] l.licensing.licensingv2    : Successfully activated cached license XXXXXX :base from /var/lib/localstack/cache/license.json 🔑✅
localstack-main   | LocalStack supervisor: localstack process (PID 17) returned with exit code -4
localstack-main   | LocalStack supervisor: exiting
localstack-main exited with code 252
```

##  大事なことは最初に

この記事は長文になるので、読んでも無駄にならないように、対象者を限定しておきます。

- まず docker で `localstack/localstack-pro:stable` を起動しようとしたら、ライセンスチェックは通過するけど、その後で終了してしまう人
- Docker のゲストカーネルが古い人

後者で、僕は colima を使っているのですが確認方法は以下のとおりです

```bash
$ colima ssh -- uname -r
6.8.0-39-generic
```

ここでゲストカーネルが `7.x` 系でない場合の人が主たる対象です。

もし Docker Desktop を使っている場合は、バージョンが `4.71.0` より前の人が対象です。


### 解決策

- Docker Desktop では 4.38.0 で発生し、4.71.0 で解消したという報告があります（その間のどのバージョンで直ったかは不明）。ゲストカーネルのバージョンで判断するのが確実です。
- Colima を使っている場合は、ゲストカーネルを更新してください（この記事の最後の方に手順があります）
- それ以外の Docker 環境を使っている方: おそらくゲストカーネルの更新が必要です。やり方は生成AIに聞いてみてください

さて、このあとは、どのようにこの解決策に至ったかの物語であります。

## LocalStack Pro に切り替えてみる

さてライセンスにワクワクしながら docker compose の設定を以下のように書き換えます

```yml
  localstack:
    container_name: "${LOCALSTACK_DOCKER_NAME:-localstack-main}"
    image: localstack/localstack-pro:stable # ここと
    ports:
      - "4566:4566"
      - "4510-4559:4510-4559"
    environment:
      - DEBUG=1
      - LAMBDA_RUNTIME_ENVIRONMENT_TIMEOUT=180
      - AWS_DEFAULT_REGION=ap-northeast-1
      - LOCALSTACK_AUTH_TOKEN=${LOCALSTACK_AUTH_TOKEN:?} # ここと
    volumes:
      - "${LOCALSTACK_VOLUME_DIR:-./volume}:/var/lib/localstack" # ここ
      - "/var/run/docker.sock:/var/run/docker.sock"
```

3箇所を変更しました。

これで `docker compose up` して出たエラーは最初のとおりです。

##  Claude と原因調査してみる

まずググってみたのですが、あまりに該当する情報が見つからなかったので、生成AIと対話してみます。

### アーキテクチャの不一致を疑われる

> まず exit code -4 が肝です。これは終了コードではなく シグナル4 = SIGILL（不正命令）でプロセスが強制終了されたことを意味します（コンテナ全体の 252 = 256-4）。
> 
> ログを見ると Successfully activated cached license ... 🔑✅ まで通っているので、AUTH_TOKEN やライセンス自体は正常です。その直後に Pro 版だけが持つネイティブ/コンパイル済みバイナリをロードした瞬間に落ちている、という形になります。
> 
> SIGILL の原因はほぼ CPU 命令セットの不一致で、実務上いちばん多いのは Apple Silicon 上で amd64 イメージを Rosetta / QEMU エミュレーションで動かしているケースです。Free（community）版は純 Python 中心なのでエミュレーションでも動きますが、Pro 版は落ちます。「Free では動いていたのに Pro にしたら落ちた」という状況と非常によく合致します。

※ `Free（community）版は純 Python 中心` に関しては結果として根拠のない推測でした。後にこれは外れだと分かります

という初回の回答でしたので、確認用のコマンドを実行します。

```bash
$ uname -m
arm64
$ docker image inspect localstack/localstack-pro:stable --format '{{.Architecture}}'
arm64
$ echo $DOCKER_DEFAULT_PLATFORM
```

アーキテクチャは一致しているので `アーキテクチャ説` は消えました。

### Docker 自体が疑われる

その後、いろいろ細かい確認があったのですが、お前の Docker 環境教えろみたいな感じになってきました。
確認用のコマンドを実行します。

```bash
$ docker version | grep -i -A2 'server'
Server: Docker Engine - Community
 Engine:
  Version:          27.1.1
$ docker context ls
NAME       DESCRIPTION                               DOCKER ENDPOINT                                     ERROR
colima *   colima                                    unix:///Users/sizuhiko/.colima/default/docker.sock
default    Current DOCKER_HOST based configuration   unix:///var/run/docker.sock
```

僕は colima 使っているので、こんな感じの出力になります。

> その VM 層こそが SIGILL の最有力候補だからです。
> 
> 特に Colima のデフォルト（--vm-type=qemu）は要注意です。QEMU は Apple Silicon 上でも汎用的な CPU モデルをゲストに見せるため、ホストが持っている新しい ARM 命令が VM 内から見えなくなります。その命令を使ってビルドされたバイナリを実行すると、まさに SIGILL で落ちます。
> 
> Free 版（純 Python）→ 影響なし
> Pro 版（ネイティブ拡張）→ SIGILL
> 
> という今回の症状と完全に一致します。バージョンを跨いで再現したことも、ライセンス認証の直後に落ちることも、これで説明がつきます。

※ `Free 版（純 Python）` に関しては結果として根拠のない推測でした。後にこれは外れだと分かります

そして colima のステータスを確認するように聞かれたので実行します。qemu は使っておらず最初から vz でしたので、以下のようになります。

```bash
$ colima status
INFO[0000] colima is running using macOS Virtualization.Framework
INFO[0000] arch: aarch64
INFO[0000] runtime: docker
INFO[0000] mountType: virtiofs
INFO[0000] docker socket: unix:///Users/sizuhiko/.colima/default/docker.sock
INFO[0000] containerd socket: unix:///Users/sizuhiko/.colima/default/containerd.sock
$ grep -i vmType ~/.colima/default/colima.yaml
vmType: vz
# Utilise rosetta for amd64 emulation (requires m1 mac and vmType `vz`)
# Enable nested virtualization for the virtual machine (requires m3 mac and vmType `vz`)
# virtiofs is limited to macOS and vmType `vz`. It is the fastest of the options.
# 9p is the recommended and the most stable option for vmType `qemu`.
# The CPU type for the virtual machine (requires vmType `qemu`).
```

> 環境側の仮説は出尽くしました
> 
> 既に vz、virtiofs、aarch64 ネイティブ。私が挙げてきた VM 層の候補は全部クリアされています。Rosetta も無関係（イメージが arm64 なので経路に入らない）。
> 
> ここまでで潰せたことを整理すると:
> 
> ライセンス・認証 → 正常（オンライン認証成功後に落ちている）
> アーキテクチャ不一致・エミュレーション → なし
> イメージのバージョン → 2 系列で再現
> volume の残骸 → クリーンでも再現
> VM の CPU エミュレーション → vz でホスト CPU がそのまま見えている
> 
> LocalStack Pro の arm64 ビルドが、この CPU で実行できない命令を含んでいるという線がほぼ残るだけです。ユーザー側の設定で直せる範囲は超えています。

なかなかにハードな状況のようです....

### Claude は諦めました...

その後、少しやりとりがあって、以下のような状況に

> 見通し
> 
> 正直に言えば、ここまでの切り分けでユーザー側で直せる可能性はかなり低いと思っています。私が挙げた環境側の仮説（アーキテクチャ、エミュレーション、VM の CPU、バージョン、キャッシュ）は全部潰れました。何度も外した推測にお付き合いいただいて申し訳ないです。
> 
> 上記2つの出力が取れたら、それを添えて Pro サポートに上げるのが確実です。報告内容としては、
> 
> ライセンス認証成功の直後に SIGILL（supervisor が exit code -4 を報告）
> 2026.8.0 / 2026.7.6 の両方で再現、どちらも build date 2026-08-26
> Apple M4 / arm64 ネイティブ / Rosetta 等のエミュレーションなし
> Colima + vz + virtiofs、Docker Engine 27.1.1、Docker Desktop 不使用
> volume 削除済みのクリーン状態でも再現
> LS_LOG=trace の末尾と、debug.exception-trace=1 有効化後の dmesg

で、サポートに上げるために、いろんなコマンドを実行していたところ、以下のような方向性に

> 結論が出ました
> 
> Illegal instruction (core dumped)、その前に Python の例外も panic メッセージも一切なし。
> 
> これで確定です。ライセンス認証の直後、Pro 専用のネイティブモジュールをロード/実行した瞬間に、CPU レベルの不正命令で死んでいます。 Rust panic 説は消えました（panic なら必ずメッセージが出ます）。LocalStack Pro は認証後に暗号化されたコンパイル済み拡張モジュールを復号してロードする作りなので、落ちる位置として完全に整合します。
> 
> Free 版で動いていたのは、そのモジュールが存在しなかったからです。
> 
> 残っている唯一の実用的な回避策
> 
> まだ試していない QEMU での起動です。仮説はこうです。
> 
> M4 が持つ SVE2/SME 系の命令を、Pro のバイナリが「CPU が対応している」と判定して選択する。しかし vz + ゲストカーネルの組み合わせでは実際には実行できず SIGILL。QEMU なら汎用 CPU モデルなのでその機能ビットが見えず、安全なフォールバックパスが選ばれる可能性があります。

いやいや QEMU なんかにしたくないのよ...

※ `Pro は認証後に暗号化されたコンパイル済み拡張モジュールを復号してロードする` に関しては結果として根拠のない推測でした。後にこれは外れだと分かります

### LocalStack のチャットで聞いてみる

また、いろんな確認を経て、Claude にサポートに投げる文面の素案も作ってもらって、送信しました。
エンジニアリングチームと繋いでもらって、週明けには回答するよ！みたいな返事ももらえました（金曜日だったからな...

## 僕は諦めが悪い

なんか v4（コミュニティ版が存在していたときのバージョン）では pro のイメージも動いて、それ以降で動かなくなるのはそれなりの理由があるんじゃないか？と思って、まずは LocalStack のリリースノートを古い順に読んでいきます。

そうすると、以下の記事で 2026-05 のバージョンで Debian のイメージが変更になっていると書いてありました。

https://blog.localstack.cloud/localstack-for-aws-release-2026-05-0/#debian-sid-base-image

何かヒントになるのでは？と思って、Claude に続けて聞いてみました。

### いい発見です。ただ時系列が1つ合いません

> Debian sid ベースへの移行は、有力な原因候補です。sid は glibc もツールチェーンも最先端なので、Pro のネイティブモジュールが新しいコンパイラでビルドされ、ARM のベースラインが上がったという筋は非常にありそうです。ライセンス認証の直後、つまり Pro のネイティブ拡張をロードした瞬間だけ落ちるという症状とも噛み合います（glibc 自体の問題ならもっと早い段階で死ぬはずなので、ビルド時のターゲット設定の方が説明として自然です）。
> 
> ただ、2026.04.0 は 2026.05.0 より前です。sid 移行が 2026.05.0 で入ったなら、4月ビルドの 2026.04.0 は影響を受けていないはずなのに落ちている。ここが噛み合いません。
> 
> 考えられるのは2つです。
> 
> 2026.04.0 の失敗は別の原因だった
> ベースイメージの変更が、アナウンスより前から段階的に入っていた

着眼点は褒めてもらえました。

### 2026.04.0 のエラーを再検証する

compose.yml の localstack イメージのタグを `2026.04.0` に変更して、コマンドを実行します。

```bash
$ docker compose logs localstack | tail -20
localstack-main  | LocalStack supervisor: starting
localstack-main  | LocalStack supervisor: localstack process (PID 17) starting
localstack-main  | LocalStack supervisor: localstack process (PID 17) returned with exit code -4
localstack-main  | LocalStack supervisor: exiting
```

エラーはそのままですが、落ち方が変わっていることに Claude が気づきました

> 落ちる位置が違います
> 
> これは前の2つとは別の挙動です。2026.8.0 / 2026.7.6 では
> 
> LocalStack version: ...        ← バナーが出る
> Successfully activated ...     ← ライセンス認証が通る
> exit code -4
> 
> だったのに、2026.04.0 はバナーも出ずに即死しています。ライセンス認証にすら到達していません。同じ SIGILL でも、より手前で死んでいます。
> 
> つまり「2026 系は一律ダメ」は結果として正しいのですが、中身は同一の不具合ではない可能性があります。 2026.04.0 の方は Python 起動直後のネイティブ読み込み段階で落ちている感じです。

### Python 単体で落ちるか を疑う

> 2026.04.0 はライセンス認証より手前で死んでいるので、インタプリタや glibc の段階まで遡れる可能性があります。

ということで、確認のコマンドを実行します。

```bash
$ docker run --rm --entrypoint python3 localstack/localstack-pro:2026.04.0 -c "print('ok')"
ok
```

> glibc とインタプリタは無罪
> 
> ok が返ったので、Python の起動と glibc の基本ルーチンは正常に動いています。となると SIGILL は、その後にロードされる特定のネイティブ拡張モジュールの中で起きています。sid の新しいツールチェーンでビルドされた .so が怪しい、という筋は残りますが、glibc 自体が原因ではありません。
> 
> Python の faulthandler で犯人を特定できます
> 
> これを先に提案すべきでした。Python の faulthandler は SIGILL を捕まえて、死んだ瞬間の Python スタックトレースを出してくれます。 どのモジュールのどの行で落ちたかが分かるので、ここまでで一番情報量のある手です。

### faulthandler で調べる

> faulthandler のトレースを見せてください。それで犯人が名前で分かります。

ということでコマンドを実行します。実行結果は長いので、ここでは省略します。

```bash
$ docker run --rm -it \
  -e LOCALSTACK_AUTH_TOKEN=$LOCALSTACK_AUTH_TOKEN \
  -e PYTHONFAULTHANDLER=1 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --entrypoint bash \
  localstack/localstack-pro:2026.04.0
```

#### 犯人が判明しました。LocalStack のコードではありません

なんとエラーの原因は LocalStack ではありませんでした（まぁ依存関係ではあるけど）。

> トレースの最深部を見てください。
> 
> File ".../cryptography/x509/certificate_transparency.py", line 8 in <module>
>   → create_module        ← ここでネイティブモジュールをロード中に死亡
> Extension modules: markupsafe._speedups, _awscrt (total: 2)
> 
> certificate_transparency.py の 8 行目は from cryptography.hazmat.bindings._rust import ... です。つまり落ちているのは cryptography パッケージの Rust/OpenSSL ネイティブ拡張（_rust.abi3.so）のロード時。markupsafe._speedups と _awscrt は無事に読めているので、その 2 つは無罪です。
> 
> これは大きな前進です。
> 
> LocalStack 独自の Pro バイナリではなく、サードパーティ製の依存パッケージが原因
Pro 版だけ落ちるのは、認証経路で cryptography.x509 を通るから。Free 版はこの import 経路に入らないので生き延びていた
> 私が延々と追っていた「Pro のネイティブモジュール」説は、ほぼ外れです
> 
> そして cryptography の wheel は OpenSSL を同梱しています。sid ベースへの移行で cryptography のバージョンが上がり、同梱 OpenSSL の aarch64 アセンブリが実行できない命令を含んでいる、というのが最も自然な説明です。

ここで、v4のモジュールと、2026系のモジュールで cryptography のバージョンが違うのかを確認します。

```bash
$ docker run --rm --entrypoint /opt/code/localstack/.venv/bin/python3 \
>   localstack/localstack-pro:2026.04.0 \
>   -c "from cryptography.hazmat.bindings import _rust; print('ok')"
$ docker run --rm --entrypoint /opt/code/localstack/.venv/bin/python3 \
>   localstack/localstack-pro:2026.04.0 -c "import cryptography; print(cryptography.__version__)"
47.0.0

# 動く 4.x 側と比較
$ docker run --rm --entrypoint /opt/code/localstack/.venv/bin/python3 \
>   localstack/localstack-pro:4 -c "import cryptography; print(cryptography.__version__)"
46.0.5
```

### cryptography バージョン47 が原因

> 決定的な差分が出ました
> 
> 壊れている 47.0.0 / 動く 46.0.5。 これが原因です。
> 
> そして1つ目のコマンドの出力に注目してください。ok も出ず、エラーも出ず、何も表示されずにプロンプトが戻っています。docker run はコンテナ内プロセスの SIGILL をシェルのようには報告しないので、これがクラッシュした状態です。
> 
> つまり LocalStack をまったく起動せず、1行で再現できるところまで絞れました。原因は LocalStack のコードではなく、依存パッケージ cryptography 47.0.0 の aarch64 ビルド（同梱 OpenSSL を含む）です。
>
> なお 47.0.0 は私の知識のカットオフより後のリリースなので、既知の不具合があるかは私からは判断できません。

イメージ変更のブログ記事から、一気に解決の糸口が見えてきました

### 回避策1: OPENSSL_armcap（まず試す）

`OPENSSL_armcap` 環境変数はOpenSSL が起動時に行う ARM 拡張命令の検出結果を上書きする環境変数。0 にすると全ての拡張命令を使わず汎用 C 実装にフォールバックします。

これを以前に失敗していたコマンドに入れて、動くかを確認します。

```bash
$ docker run --rm -e OPENSSL_armcap=0 \
>   --entrypoint /opt/code/localstack/.venv/bin/python3 \
>   localstack/localstack-pro:2026.04.0 \
>   -c "from cryptography.hazmat.bindings import _rust; print('ok')"; echo "exit=$?"
ok
exit=0
```

おおお、 `ok` が表示されるようになりました。

> 効きました。原因も回避策も確定です
> 
> OPENSSL_armcap=0 で ok / exit=0。同梱 OpenSSL の ARM 拡張命令の検出結果が原因だと裏付けられました。cryptography 47.0.0 の aarch64 ビルドが、CPU の機能ビットから「使える」と判断した命令を選び、それが Apple Virtualization.framework のゲストでは実行できずに SIGILL、という構図です。
> 
> OPENSSL_armcap=0 はその自動検出を丸ごと無効化して、汎用の C 実装にフォールバックさせます。

この状況で、 compose.yml の環境変数にも追加して起動してみます。

```yml
  localstack:
    container_name: "${LOCALSTACK_DOCKER_NAME:-localstack-main}"
    image: localstack/localstack-pro:stable
    ports:
      - "4566:4566"
      - "4510-4559:4510-4559"
    environment:
      - DEBUG=1
      - LAMBDA_RUNTIME_ENVIRONMENT_TIMEOUT=180
      - AWS_DEFAULT_REGION=ap-northeast-1
      - LOCALSTACK_AUTH_TOKEN=${LOCALSTACK_AUTH_TOKEN:?}
      # cryptography 47.0.0 の同梱 OpenSSL が Apple Silicon の VM ゲストで
      # 実行できない ARM 拡張命令を選ぶため、機能検出を無効化して回避
      - OPENSSL_armcap=0
    volumes:
      - "${LOCALSTACK_VOLUME_DIR:-./volume}:/var/lib/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
```

で、実行してみます。

```
localstack-main  | 2026-08-27T11:28:49.471 DEBUG --- [ady_monitor)] l.extensions.plugins       : calling extensions on_platform_ready
localstack-main  | Ready.
```

環境変数追加して、stable の最新版が起動しました。

## issue 報告する

Claude からは 

- pyca/cryptography への報告
- LocalStack への追加報告

を提案されたので、まずは `*pyca/cryptography` のリポジトリを見てみます。

もちろん issue 報告をする前には同じようなものがあるか確認した方が良いので `Apple Silicon` で検索してみました。

そしたら何てことでしょう。それっぽい issue が既にありました。

["Illegal instruction" (SIGILL) on version 47.0.0 - Apple Silicon (ARM) #14764](https://github.com/pyca/cryptography/issues/14764)

これをClaudeにも教えてあげます。

> 症状は完全に一致、そして一点だけ見立てが変わります
> 
> 47.0.0、SIGILL、exit 132、Apple Silicon の M4 系、Linux ゲスト。あなたのケースと同じ不具合です。
> 
> 注目すべきは報告者の解決方法です。
> 
> cryptography<47.0.0 に下げる（あなたが検証した通り）
> Docker Desktop を 4.38.0 → 4.71.0 に更新
> 
> 後者が効いたということは、VM のカーネルや VMM 側の対応で直るということです。報告者のカーネルは 6.12.5-linuxkit、Docker Desktop 4.38.0 はかなり古いバージョンです。
> 
> 私は「環境は無罪、原因は wheel だけ」と断定しましたが、正確には新しい cryptography が使う ARM 機能と、古いゲストカーネル/VMM の組み合わせが問題だったようです。ゲスト側が CPU の機能ビットを正しく扱えていない、という筋でしょう。断定は避けますが、環境側にも要因があったのは事実で、そこは訂正します。

## 根本的に直せる可能性がある

colima は brew でアップデートしてありました。今回の検証もアップデート後です。
しかしカーネルが古いようです。 brew でソフトウェアを更新していても、中身までは更新されませんよね...

```
$ colima ssh -- uname -r
6.8.0-39-generic
$ colima version
colima version 0.10.3
git commit: 00f6c297e92a82c04a4ab507db0a61435650d7e8

runtime: docker
arch: aarch64
client: v28.4.0
server: v27.1.1
```

> Colima 本体は 0.10.3 で新しいのに、ゲストカーネルが 6.8.0-39-generic。Ubuntu 22.04/24.04 系の LTS カーネルです。issue の報告者が Docker Desktop 更新で直ったのは 4.71.0 に上げた後でそのカーネルバージョンは issue に書かれていませんが、この差が効いている可能性は十分あります。
> 
> ポイントは、Colima を更新しても、既存 VM のゲストカーネルは更新されないという点です。VM 内は Ubuntu イメージなので、カーネルは VM 側の apt 管理下にあります。colima delete して作り直しても、Lima が使う Ubuntu イメージのバージョン次第では同じカーネルになります。
> 
> 作り直すより、VM 内で直接上げる方が確実です。

### 最終的な解決策: ゲストカーネルのバージョンを更新する

Colima でのゲストカーネル更新の方法は以下のとおりです。

```bash
$ colima ssh

sudo apt update
sudo apt install --install-recommends linux-generic-hwe-24.04
exit

$ colima restart
$ colima ssh -- uname -r
7.0.0-30-generic
```

※ linux-generic-hwe-24.04 で入るバージョンは実行時期で変わるので、記事の 7.0.0-30-generic と一致しない可能性があります

### 回避策なしで起動してみる

追加した `OPENSSL_armcap` を compose.yml から削除して、 compose up しなおします。

```
localstack-main  | 2026-08-27T11:40:42.527 DEBUG --- [ady_monitor)] l.extensions.plugins       : calling extensions on_platform_ready
localstack-main  | Ready.
```

すると、問題なく起動しました。

> 根本解決ですね。回避策なしで最新の stable が動くようになりました。
> 
> 結論
> 
> 原因は cryptography 47.0.0 の aarch64 ビルドと、古いゲストカーネル（6.8）の組み合わせでした。新しい cryptography が使う ARM 拡張命令を古いカーネルが正しく扱えず SIGILL。カーネルを 7.0 系に上げたら解消。issue の報告者が Docker Desktop 更新で直ったのと同じ筋です。

ということで、判明しているゲストカーネルと結果の対応は以下のとおりです。

| ゲストカーネル | 環境 | 結果 |
| --- | --- | --- |
| `6.8.0-39-generic` | Colima (Ubuntu) | SIGILL |
| `6.12.5-linuxkit` | Docker Desktop 4.38.0 | SIGILL |
| `7.0.0-30-generic` | Colima (Ubuntu) | 起動する |
| (4.71.0 同梱のもの) | Docker Desktop 4.71.0 | 起動する |

`6.12` でも落ちているので、境界はそれより上にあります。
自分の環境がどちらかは、ゲストカーネルのバージョンで判断してください。

## Claude との振り返りとまとめ

> 私は途中で何度も外しました。Rosetta、VM の CPU、M4 の SVE2、Rust panic、sid ベースイメージ。そして「環境は無罪、原因は wheel だけ」と断定したのも間違いで、実際にはカーネル側が本命でした。決め手になったのは PYTHONFAULTHANDLER=1 と、あなたが :4 まで大きく戻して切り分けた判断、そして上流 issue を見つけたことです。

生成AIでいろんなことが便利に解決していきますが、このような対応は泥臭く人間の察知力で突破口を見つけていくことは、まだまだ必要だと感じました。

最後に都度状況を追加報告していた LocalStack の方にも解決策などを Claude に要約してもらって報告を追加で行いました。

LocalStack チームからは詳細な報告と解決策について、感謝をもらっています。
また

> I also sent a notification to the documentation team to add a warning in our docs until the Engineering team fixes the issue.

ということで、ドキュメントチームとも連携をとってくれるということで、何か LocalStack のドキュメントに今回のケースがよくある事象などで反映されるかもしれません。

少しは世界平和に貢献できたかな？と思います。
