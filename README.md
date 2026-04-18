# Food Museum

鎵嬫満浼樺厛鐨勪釜浜洪鐗╁崥鐗╅缃戠珯銆傚彲涓婁紶姣忔棩椋熺墿鍥剧墖銆佹椂闂磋酱鐎戝竷娴佸睍绀恒€佸垹闄よ褰曘€佸鍑?CSV/JSON銆?
## 1. 鐜鍑嗗

1. 瀹夎 Node.js 20+
2. 鍦?Supabase 鍒涘缓椤圭洰
3. 鍦?Supabase Storage 鏂板缓鍏紑 bucket锛屽悕绉颁笌 `SUPABASE_BUCKET` 涓€鑷达紙榛樿 `food-images`锛?4. 鎵ц `supabase/schema.sql` 鍒涘缓鏁版嵁琛?
## 2. 鐜鍙橀噺

澶嶅埗 `.env.example` 涓?`.env.local`锛屽～鍐欙細

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET`

## 3. 鏈湴杩愯

```bash
npm install
npm run dev
```

鎵撳紑 `http://localhost:3000`

## 4. API 鍒楄〃

- `POST /api/entries` 鏂板璁板綍锛坢ultipart/form-data锛?- `GET /api/entries?cursor=` 鍒嗛〉璇诲彇
- `DELETE /api/entries/:id` 鍒犻櫎璁板綍
- `GET /api/export?format=csv|json` 瀵煎嚭

## 5. Vercel 閮ㄧ讲

1. 瀵煎叆鏈」鐩埌 Vercel
2. 鍦?Vercel 璁剧疆涓?`.env.local` 鐩稿悓鐨勭幆澧冨彉閲?3. 閮ㄧ讲鍚庡嵆鍙€氳繃鍩熷悕璁块棶

## 6. 璇存槑

- 褰撳墠涓哄叕寮€绔欑偣锛屾棤鐧诲綍鍜岃闂繚鎶ゃ€?- 鍥剧墖鍦ㄥ墠绔嚜鍔ㄥ帇缂╁苟淇濇寔姣斾緥鍚庝笂浼犮€?- 棣栨湡涓嶅寘鍚嚜鍔?AI 杞粯鍔熻兘锛岀敤鎴峰彲涓婁紶宸插鐞嗗畬鎴愮殑鎴愬搧鍥俱€