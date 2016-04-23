---
title: BambooのChatWork通知プラグインを作成しました
date: 2015-03-14 08:45 UTC
tags:
- Java
- CI
- Bamboo
---

現在作業支援している現場では Atlassian JIRA,Bitbucket,Bambooと、コミュニケーションツールとしてChatWorkを使っています。
CIツールであるBambooは通知機能としてEmail,HipChat,IMに対応しているのですが、汎用的な通知機能は持っていないので、ChatWorkプラグインを自作してみました。

[Bamboo ChatWork Plugin](https://github.com/sizuhiko/bamboo-chatwork-notification)

ここではBambooのプラグインを作る手順と、そのときにハマったポイントなどを解説します。

### はじめに

BambooのプラグインをAtlassian SDKをインストールします。
[Set up the Atlassian Plugin SDK and Build a Project](https://developer.atlassian.com/docs/getting-started/set-up-the-atlassian-plugin-sdk-and-build-a-project)からプラットフォームにあったSDKをインストールします。

SDKをインストールしたら[Step 3: Try an atlas command](https://developer.atlassian.com/docs/getting-started/set-up-the-atlassian-plugin-sdk-and-build-a-project/explore-the-installed-sdk-and-the-atlas-commands)のとおり以下のコマンドを実行します。

```sh
mkdir 作業ディレクトリ名
cd 作業ディレクトリ名
atlas-run-standalone --product bamboo
```

`atlas-run-standalone`を実行すると、大量の`maven install`が動きます。
かなり時間がかかるので、ネットワークが速い環境と、時間にゆとりがあるときに実行した方が良いです。

### プラグインのスケルトンを生成する

以下のコマンドを実行してください。
```sh
atlas-create-bamboo-plugin
```
以下の表の入力を求められるので、適切に入力します。
<table>
<tr><th>Define value for groupId</th><td>作成するプラグインのパッケージパスを指定</td></tr>
<tr><th>Define value for artifactId</th><td>作成するプラグインの名前を指定</td></tr>
<tr><th>Define value for version</th><td>作成するプラグインのバージョンを指定</td></tr>
<tr><th>Define value for package</th><td>groupIdとartifactIdを結合した値を指定</td></tr>
</table>
入力した内容はpom.xmlに反映されるだけなので、後でpom.xmlを編集すれば大丈夫です。

プラグイン名のディレクトリに`pom.xml` と `src/main` フォルダに以下のファイルが自動生成されます。

- {Define value for package}のパス/MyPluginComponent.java
- {Define value for package}のパス/MyPluginComponentImpl.java
- /resources/atlassian-plugin.xml

正直、自動生成されたコードは役に立たないので、削除してしまって良いでしょう。
`atlassian-plugin.xml`はデフォルト値になっているので、適切に編集します（これは後で大丈夫です）。

以下のコマンドを入力して、プラグイン環境を実行します。

```sh
cd プラグインの名前
atlas-run
```

`atlas-run`を実行すると、大量の`maven install`が動きます。
かなり時間がかかるので、ネットワークが速い環境と、時間にゆとりがあるときに実行した方が良いです（２度目）。

### プラグインを実装する

Bambooの通知プラグインとして、最初からインストールされているものはHipChat通知プラグインです。
とりあえずプラグインを作るための情報があまりに少ないので（Wikiを見て進めても肝心な箇所ほどJavaDocを見ろになってしまう。だがJavaDocを見てもわかるはずがない）、通知プラグインを作りたいと思った人はHitChatプラグインまたは、私の作ったChatWorkプラグインをコピー＆ペーストするのがお勧めです。

私もまず[HipChatプラグインのソースコード](https://bitbucket.org/atlassian/bamboo-hipchat-plugin)を参考にしました。

HipChatプラグインやChatWorkプラグインのコードを見るとわかりますが、実装するファイルはわずかです。
`src/main`ディレクトリに以下のファイルを配備します。

- AbstractNotificationRecipientを継承した通知プラグインの設定画面コントローラ
- NotificationTransportを実装した通知プラグインの通知コントローラ
- resources/atlassian-plugin.xml（プラグインの設定ファイル）
- Freemaker形式のテンプレートファイル（設定入力画面、設定表示画面、通知メッセージなど）

実装する量は多くなく、コツさえ掴めば通知プラグインを作るのは難しくありません。コツさえ掴めば...ですが。

#### 通知プラグインの設定画面コントローラを作成する

ChatWorkプラグインでは、[ChatworkNotificationRecipient.java](https://github.com/sizuhiko/bamboo-chatwork-notification/blob/master/src/main/java/jp/tokyo/open/bamboo/plugin/chatwork/ChatworkNotificationRecipient.java)というクラスを作成しました。
作成したというよりはHipChatプラグインの[HipchatNotificationRecipient.java](https://bitbucket.org/atlassian/bamboo-hipchat-plugin/src/212f5e97f1f97a93535cec3cf074adc9ed5525be/src/main/java/com/atlassian/bamboo/hipchat/HipchatNotificationRecipient.java?at=master)を丸々コピーして微修正した程度です。

実際に差分を見るとわかりますが、クラス名など変更した程度です。

このコントローラに対応する画面は[atlassian-plugin.xml](https://github.com/sizuhiko/bamboo-chatwork-notification/blob/master/src/main/resources/atlassian-plugin.xml#L24-L28)で指定します。

```xml
<notificationRecipient key="recipient.chatwork" name="Chatwork Recipient" class="jp.tokyo.open.bamboo.plugin.chatwork.ChatworkNotificationRecipient" weight="10">
    <description>ChatWork</description>
    <resource type="freemarker" name="edit" location="templates/plugins/notifications/chatwork/editNotification.ftl"/>
    <resource type="freemarker" name="view" location="templates/plugins/notifications/chatwork/viewNotification.ftl"/>
</notificationRecipient>
```

`resource`の`name`が`edit`である場合、設定編集画面のファイルパスを指定します。
`view`の場合は、導入済み通知プラグインが設定一覧に表示される画面部品のファイルパスを指定します。

実際の画面を見てみましょう

```
[@ww.textfield labelKey="chatwork.api.token" name="chatWorkApiToken" value="${chatWorkApiToken!}" required='true'/]
[@ww.textfield labelKey="chatwork.room" name="chatWorkRoom" value="${chatWorkRoom!}" required='true'/]
[@ww.checkbox labelKey="chatwork.notify" name="chatWorkNotifyUsers" value="${chatWorkNotifyUsers!?string}"/]
```

これはFreemakerというテンプレートエンジンを使っているのですが、なんとなく想像できるレベルです。
HTMLと似ています。labelKeyはリソースファイルに定義した内容をバインドするので国際化対応できます。

##### ここで`コツ１`

Freemakerのテンプレート上の`name`属性と、コントローラクラスの[設定入力画面の項目名](https://github.com/sizuhiko/bamboo-chatwork-notification/blob/master/src/main/java/jp/tokyo/open/bamboo/plugin/chatwork/ChatworkNotificationRecipient.java#L32-L34)
がマッピングされています。

この画面はBambooで通知設定を入力するときに以下のようなHTMLに変換されます。

```html
<input type="text" name="chatWorkApiToken" value="xxxxx" required>
<input type="text" name="chatWorkRoom" value="oooooo" required>
<input type="check" name="chatWorkNotifyUsers" value="1" checked>
```

想像どおりですか？
注意しなければならないのは「設定画面にはすべてのプラグインのHTMLが並ぶ」ということです。
えっ？何を言っているかわからない？ではどのようになっているかというと以下のようなHTMLになるのです。

```html
<div class="hipchat-plugin" style="display:none">
  <input type="text" name="apiToken" value="xxxxx" required>
  <input type="text" name="room" value="oooooo" required>
  <input type="check" name="notifyUsers" value="1" checked>
</div>
<div class="chatwork-plugin">
  <input type="text" name="chatWorkApiToken" value="xxxxx" required>
  <input type="text" name="chatWorkRoom" value="oooooo" required>
  <input type="check" name="chatWorkNotifyUsers" value="1" checked>
</div>
```

このようなフォームが生成されていて、選択した通知の部分だけが見えるようになるのです。
カンの良い人は気付いたかもしれません。
私は最初HipChatプラグインをコピペして、項目名を変更していなかったので、以下のようなHTMLが生成されていて、うまくフォームから値を取得できませんでした。

```html
<div class="hipchat-plugin" style="display:none">
  <input type="text" name="apiToken" value="xxxxx" required>
  <input type="text" name="room" value="oooooo" required>
  <input type="check" name="notifyUsers" value="1" checked>
</div>
<div class="chatwork-plugin">
  <input type="text" name="apiToken" value="xxxxx" required>
  <input type="text" name="room" value="oooooo" required>
  <input type="check" name="notifyUsers" value="1" checked>
</div>
```
同一フォームに同じname属性を持つHTMLが生成されて、submitされるのでコントローラのpopulateメソッドのMapに正しく値が入らなくなっていました。
なのでなるべく重複しない名前を指定しておくことが重要です。
ところが標準の通知プラグインであるHipChatが一等地の名前を持っているのです。Bambooとしてどのような名前規則を推奨しているのかドキュメントには記載していないので、パッケージ名を付加するなどの工夫が必要です。

なお保存すると、保存完了メッセージが表示されるのですが、このメッセージのカスタマイズ方法はわかっていません。
そもそもカスタマイズできるのか調査中ですが、Bambooのコードはオープンソースではないので...(ry

#### 通知プラグインの通知コントローラを作成してChatWorkに通知する

ChatWorkプラグインでは、[ChatworkNotificationTransport.java](https://github.com/sizuhiko/bamboo-chatwork-notification/blob/master/src/main/java/jp/tokyo/open/bamboo/plugin/chatwork/ChatworkNotificationTransport.java)というクラスを作成しました。
作成したというよりはHipChatプラグインの[HipchatNotificationTransport.java](https://bitbucket.org/atlassian/bamboo-hipchat-plugin/src/212f5e97f1f97a93535cec3cf074adc9ed5525be/src/main/java/com/atlassian/bamboo/hipchat/HipchatNotificationTransport.java?at=master)を丸々コピーして修正しました。

まず通知には通知メッセージが必要ですよね。
通知メッセージをFreemakerのテンプレートで記述したいのですが、ここで圧倒的なドキュメント不足に遭遇します。
ほぼ自力での解決はムリなので、Bambooの標準テンプレートをコピペして作業した方が良いでしょう。

HipChatプラグインのソースコードを見ると、特に通知クラスを作ったり、通知のテンプレートを指定することはしていないようです。
Bambooの通知機能はHipChatに連携することに依存していて、HipChatはBamboo標準のテンプレートを使っています。
[通知プラグインを作るためのドキュメント](https://developer.atlassian.com/display/BAMBOODEV/Notification+Plugin+Modules)を確認します。
[Building a Notification Plugin](https://developer.atlassian.com/display/BAMBOODEV/Building+a+Notification+Plugin)を読むと、カスタムリスナーを登録する手順が書いてありますが、独自の通知タイプを作らない限りこのとおりやらなくても大丈夫です。
実際、私もカスタムリスナーを作成してドキュメント通りやってみたのですが、うまく動作しませんでした。atlassian-plugin.xmlにリスナー定義を追加してやってみたりしたのですが....

##### ここで`コツ２`

そこでChatWorkプラグインでは、[ChatworkNotificationRecipientからChatworkNotificationTransportのインスタンスを作成するとき](https://github.com/sizuhiko/bamboo-chatwork-notification/blob/master/src/main/java/jp/tokyo/open/bamboo/plugin/chatwork/ChatworkNotificationRecipient.java#L136)に、`TemplateRenderer`というFreemakerのテンプレートを操作できるインスタンスを渡すようにしました。ChatworkNotificationTransportで独自に取得することはできないようです。
ChatworkNotificationRecipientではDIによって値がセットされるようになっているようです（ドキュメントなし）。

`ChatworkNotificationTransport::sendNotification()`メソッドが送信指示として呼び出されるので、TemplateRendererを使って独自テンプレートを呼び出して文字列に変換します。
文字列変換したメッセージをChatWork APIを使って指定したルームに送信するだけです。

以下の部分がChatWork用に実装したコードです。

```Java
    static String getChatworkApiURL(String room) {
        return CHATWORK_API_URL.replaceAll("\\{room_id\\}", room);
    }


    private String getChatworkContent() {
        String templateLocation = "templates/plugins/notifications/chatwork/BuildCompleted.ftl";
        return templateRenderer.render(templateLocation, populateContext());
    }

    private Map<String, Object> populateContext()
    {
        Map<String, Object> context = Maps.newHashMap();
        context.put("build", plan);
        context.put("buildSummary", resultsSummary);
        return context;
    }
```
`getChatworkContent()`を使ってFreemakerテンプレートからメッセージを取得します。
実際のテンプレートファイルは以下のよな内容です。

```
[#-- @ftlvariable name="build" type="com.atlassian.bamboo.build.Buildable" --]
[#-- @ftlvariable name="buildSummary" type="com.atlassian.bamboo.resultsummary.BuildResultsSummary" --]
[#include "/notification-templates/notificationCommons.ftl"]
[#include "/notification-templates/notificationCommonsText.ftl" ]
[#assign authors = buildSummary.uniqueAuthors/]

[#if buildSummary.successful][#lt]
[info][title][@buildNotificationTitleText build buildSummary/] was SUCCESSFUL[/title]
[@showRestartCount buildSummary/]
[#if buildSummary.testResultsSummary.totalTestCaseCount >0] [@showTestSummary buildSummary.testResultsSummary/][/#if].
[#if authors?has_content] [@showAuthorSummary authors/][/#if][#lt]
${baseUrl}/browse/${buildSummary.planResultKey}/
[/info]
[#else][#lt]
[info][title][@buildNotificationTitleText build buildSummary/] has FAILED[/title]
[@showRestartCount buildSummary/]
[#if buildSummary.testResultsSummary.totalTestCaseCount >0] [@showTestSummary buildSummary.testResultsSummary/][/#if].
[#if authors?has_content] [@showAuthorSummary authors/][/#if][#lt]
${baseUrl}/browse/${buildSummary.planResultKey}/
[/info]
[/#if][#lt]
```

先ほども書きましたが、これをJavaDocの情報を元に生成するのはほぼムリ、というか完全にムリです。
最初の手順でインストールしたSDKの中に実際のBambooがインストールされるので、Bambooのwarファイルが展開された`WEB-INF/classes/notification-templates`のBuildCompleted.ftlファイルの内容をコピペして、ChatWorkメッセージ記法に合わせて修正しています。

後はSDKで実行したBambooにプラグインをインストールして、デバッグしながら確認するのが近道です。

#### プラグインをビルドする

プラグインは管理画面からjarファイルとしてアップロードします。
そのためコンソールから以下のコマンドを実行します。

```sh
cd プラグインの名前
atlas-mvn clean package
```

atlas-mvnはmvnのラッパーのようなのですが、mvnを直接実行するのでなく、こちらのコマンドを使った方が良いみたいです。
あとは通常のmavenのビルドと一緒ですが、初回はまた大量のmvn installが動くのでネットワークと時間には余裕を持って挑みましょう。

ビルドが終わるとtargetディレクトリにjarファイルが生成されます。

### さいごに

ChatWork通知プラグインとHipChat通知プラグインの差分はほんとうにわずかで、それほど難しいものではありません。
Bambooの通知プラグインモジュールで得た経験は以下のようなところです。

- ドキュメント読めばなんとなくわかるけど、「詳しくはJavaDocへ」でつまづく（心が折れる）
- 入力画面など生成されたものはブラウザのデバッガを使って、名前空間がバッティングしていないか確認が必要
- EclipseのJDなどを使って、Bamboo自体のソースコードをリバースして調べながら実装しないとムリ

プロジェクト都合じゃないとなかなかBambooとか使ったりする機会がないのですが、もしBamboo使うことになって通知プラグインを作りたいと思った方は参考にしていただければと思います。

長くなったので、このあたりで終わりにしますが、他にもいろいろわかったことはあるので、また気が向いたら書こうかなと思います。

