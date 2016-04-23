---
title: AngularJSでngDialog中の値をngModelでバインドしたいとき注意すること
date: 2015-05-02 08:19 UTC
tags:
- JavaScript
- AngularJS
- ngDialog
---

AngularJS でモーダルダイアログを表示するために、何を使うでしょうか？
多くの場合 [ngDialog](https://github.com/likeastore/ngDialog) というコンポーネントを使うのではないかと思います。

で、ダイアログ上の値は、それを表示したコントローラのスコープにバインドする、という良くあるシナリオを想定してください。

まずうまく[動作するサンプル](https://jsfiddle.net/sizuhiko/ox73fktc/1/)を紹介します。

`Open Dialog`というリンクをクリックして、ダイアログを表示したら、チェックボックスをON/OFFしてください。
ダイアログ背景のページで `check: true` と `check: false` がトグルするはずです。

```html
<div data-ng-app="myApplication">
    <div data-ng-controller="MainController">
		<a href="" ng-click="ShowNgDialog()">Open Dialog</a>
        <span>check: {{FormData.allcheck}}</span>
    </div>
</div>
```

```js
var myApplication = angular.module('myApplication', ['ngDialog']);

myApplication.controller('MainController', function ($scope, ngDialog) {
    $scope.FormData={allcheck: false};
    $scope.ShowNgDialog = function () {
        ngDialog.open({            
            template: '<div><input type="checkbox" ng-model="FormData.allcheck"/></div>',
            plain: true,
            scope:$scope
           
        });
    }    
});
```

とても簡単な例ですが、AngularJSを使ってモーダルダイアログを表示して、チェックボックスの値をコントローラのスコープ変数 `FormData.allcheck` にバインドしています。

### なぜか変数だとバインドされない

一方で、こちらは[動作しないサンプル](http://jsfiddle.net/sizuhiko/ox73fktc/2/)です。

`Open Dialog`というリンクをクリックして、ダイアログを表示したら、チェックボックスをON/OFFしてください。
ダイアログ背景のページは `check: false` のままです。

```html
<div data-ng-app="myApplication">
    <div data-ng-controller="MainController">
		<a href="" ng-click="ShowNgDialog()">Open Dialog</a>
        <span>check: {{allcheck}}</span>
    </div>
</div>
```

```js
var myApplication = angular.module('myApplication', ['ngDialog']);

myApplication.controller('MainController', function ($scope, ngDialog) {
    $scope.allcheck = false;
    $scope.ShowNgDialog = function () {
        ngDialog.open({            
            template: '<div><input type="checkbox" ng-model="allcheck"/></div>',
            plain: true,
            scope:$scope
           
        });
    }    
});
```

変わったのは、コントローラのスコープ変数にバインドするオブジェクトです。

うまく動作するのは `$scope.FormData={allcheck: false};` のようにスコープのプロパティはオブジェクトで、オブジェクトに値を保持しているケースです。
一方うまく動作しないのは `$scope.allcheck = false;` のようにスコープのプロパティに変数で値を保持しているケースです。

### ngDialogでなければ変数でバインドできる

ngDialogでなく普通に表示される範囲にある場合は、[動作するサンプル](http://jsfiddle.net/sizuhiko/ox73fktc/3/)です。

チェックボックスをON/OFFしてください。ページで `check: true` と `check: false` がトグルするはずです。

```html
<div data-ng-app="myApplication">
    <div data-ng-controller="MainController">
		<div><input type="checkbox" ng-model="allcheck"/></div>
        <span>check: {{allcheck}}</span>
    </div>
</div>
```

```js
var myApplication = angular.module('myApplication', ['ngDialog']);

myApplication.controller('MainController', function ($scope, ngDialog) {
    $scope.allcheck = false;
});
```

### まとめ

ngDialogを使うときのちょっとした小ネタなのですが、解決策を見つけるまで結構時間がかかりました。
もし、ngDialogを使ってうまくデータバィンディングできない！という人の参考になればと思います。


