# 環境構築

```
npm install

# ローカルサーバー起動
npm run start:dev
```

TODO page と一致するか？っていうメソッド作る

スクレイピング系入れてみる

npx playwright install

npx playwright codegen wikipedia.org
npx playwright codegen https://www.buyma.com/mens/ook-Pro:y-buyma-scrapi

gcloud
https://takagi.blog/how-to-install-gcloud-command-on-mac/

モック系削除

# Y-BUYMA-SCRAPING-API

## ディレクトリの責務

- src/daos/〇〇/〇〇 Dao.〇〇.ts

  - 外部との処理が責務

- src/daos/〇〇/〇〇 Dao.ts

  - 〇〇 Dao.〇〇.ts のインターフェース定義が責務

- src/entities

  - 基本的な interface 定義が責務

- src/routes/index.ts

  - エンドポイントを定義

- src/routes/〇〇.ts

  - http データのリクエスト、レスポンスを定義が責務

- src/usecase/〇〇.ts

  - データの加工、レスポンスの管理が責務

- src/index.ts

  - メインファイル

https://www.notion.so/BUYMA-PJ-38befffa650a48e7992c0b355d86b158

```

npx playwright install

npx playwright codegen https://www.buyma.com/mens/

```

# cloud tasks ローカルテスト時

以下のコマンドを実行してからローカルサーバーを起動

```
cd tasks
./get-local-ip-addr.sh
docker-compose up -d
```
