---
title: Step Functions の HTTP タスクでプライベート API にアクセスする
date: 2025-05-02 09:34 UTC
tags:
- AWS
- StepFunctions
- EventBridge
- Lattice
---

Step Functions には [HTTP タスク](https://docs.aws.amazon.com/ja_jp/step-functions/latest/dg/call-https-apis.html)という便利な統合機能があり、ワークフローで HTTPS API を呼び出すことができるようになっています。
そうすることで Step Functions から単に HTTP の API を呼び出すだけなら Lambda を作らなくても良くなりました。便利ですね。

### 2024 Re:Invent の発表でプライベートAPIへのアクセスがサポートされた

ただ、これには制限があって、インターネットからアクセス可能なパブリックな API にしかアクセスできませんでした。つまり VPC 経由でアクセスする必要がある API には依然として VPC Lambda が必要だったのです。
しかし2024年の Re:Invent でプライベートAPIへのアクセスがサポートされることになり、益々利用シーンが増えそうです。

#### 参考記事:

- クラスメソッドブログ:  [[アップデート]StepFunctionsからEventBridge経由でプライベートなAPIの呼び出しが可能になりました！](https://dev.classmethod.jp/articles/stepfunctions-to-private-api-with-eventbridge/)
- AWS公式ブログ [PrivateLink、VPC Lattice、EventBridge、Step Functions により、VPC やアカウントの境界を越えて AWS リソースを安全に共有](https://aws.amazon.com/jp/blogs/news/securely-share-aws-resources-across-vpc-and-account-boundaries-with-privatelink-vpc-lattice-eventbridge-and-step-functions/)

### CDK では？

さっそく使ってみたいと思ったのですが、当然すぐにCDK ではゴニョゴニョできないのかな？とインターネットを調べてみたところ、さっそくサンプルがあるようです。

#### 参考記事:

- [Private API Gateway as EventBridge API Destination](https://benoitboure.com/private-api-gateway-as-eventbridge-api-destination)

L2コンストラクタはまだないので、 `CfnResourceGateway` 、 `CfnResourceConfiguration` を使って作っていくようです。

具体的なCDKのコードは[こちら](https://github.com/bboure/cdk-step-functions-private-api-gateway/blob/main/lib/step-functions-private-api-stack.ts)です。

### やってみた

とりあえず、あっさりできました。

注意点としてはプライベートAPIといいつつ、EventBridge Connection は HTTPs しか使えないので、 HTTP のプライベートAPIにアクセスしたい！という要望がある場合は工夫が必要です。まぁ VPC の中に LB をおいて、そこにプライベートAPIにアクセスするHTTPsエンドポイントを置いて、HTTPに変換して通すみたいな感じですかね。

### めっちゃハマること

#### プライベートAPIのドメイン名を変更したい

0 -> 1 で作るときは問題ないんですけどね。

たとえば仮のドメイン名とかで構築していて、いざ実際の名前が決まったら置き換えたい、みたいなこと普通にあるじゃないですか。

```typescript
    resourceConfig.addPropertyOverride('ResourceConfigurationDefinition.DnsResource', {
      DomainName: props.apiDomainName,
      IpAddressType: 'IPV4',
    })
```

たとえばリソースコンフィグでプライベートAPIのドメイン名を設定しておく必要があるんですが、このプロパティの値を変えるみたいなケースです。

変更するとき `cdk diff` するとちゃんと差分になって変更できそうに見えます。

```
Resources
[~] AWS::VpcLattice::ResourceConfiguration Api/ResourceConfig ApiResourceConfig50DED18C
 └─ [~] ResourceConfigurationDefinition
     └─ [~] .DnsResource:
         └─ [~] .DomainName:
             ├─ [-] 変更前のドメイン名
             └─ [+] 変更後のドメイン名
✨  Number of stacks with differences: 1
```

なんで、そのまま `cdk deploy` するじゃないですか。

```
DeployStack | 0/4 | 10:07:54 AM | UPDATE_IN_PROGRESS   | AWS::CloudFormation::Stack                 | DeployStack User Initiated
DeployStack | 0/4 | 10:08:00 AM | UPDATE_IN_PROGRESS   | AWS::VpcLattice::ResourceConfiguration     | Api/ResourceConfig (ApiResourceConfig50DED18C) 
DeployStack | 1/4 | 10:08:02 AM | UPDATE_COMPLETE      | AWS::VpcLattice::ResourceConfiguration     | Api/ResourceConfig (ApiResourceConfig50DED18C) 
DeployStack | 2/4 | 10:08:04 AM | UPDATE_COMPLETE_CLEA | AWS::CloudFormation::Stack                 | DeployStack 
DeployStack | 3/4 | 10:08:05 AM | UPDATE_COMPLETE      | AWS::CloudFormation::Stack                 | DeployStack 
 ✅  DeployStack
✨  Deployment time: 38s
```

成功しているように見えるじゃないですか。

でも、AWSのマネコンから確認すると..... 変わってません！！！！（衝撃、マジか

原因は不明です...

#### プライベートAPIのドメイン名を変更したいときの解決方法

一度 EventBridge Connection をパブリックAPIに戻します。
下のプライベートAPIの設定や、 `CfnResourceGateway` 、 `CfnResourceConfiguration` も全部削除します（ソースコード的にはコメントアウトでも良いけど）。

```typescript
    const connection = new Connection(this, 'ApiConnection', {
      authorization: Authorization.apiKey('Authorization', props.secret.secretValue),
      connectionName: 'api-connection',
      description: 'プライベートAPIコネクション',
    })
    // ここから
    const cfnConnection: CfnConnection = connection.node.children[0] as unknown as CfnConnection
    cfnConnection.addPropertyOverride('InvocationConnectivityParameters', {
      ResourceParameters: {
        ResourceConfigurationArn: resourceConfig.attrArn,
      },
    })
    // ここまでを削除
```

して、一度デプロイしてリソースを削除して、再度元に戻してドメイン名の変更を適用して 0 -> 1 の状態で作り直します。

ちなみに、AWSのマネコンからドメイン名を変更しようと思っても GUI からもできないので、そういうものなのかもしれません。（diff と deploy は何をもって成功したのかはわからん...

### まとめ

ということで、あまりスマートな解決策ではありませんが、現時点ではこういうやり方しかないのかなと思います。
いい感じに CDK からでも変更できるようになると良いなーと願っています（時間できたら issue 書こうかな
