# Food Museum

閹靛婧€娴兼ê鍘涢惃鍕嚋娴滄椽顥ら悧鈺佸触閻椻晠顩純鎴犵彲閵嗗倸褰叉稉濠佺炊濮ｅ繑妫╂鐔哄⒖閸ュ墽澧栭妴浣规闂傜閰遍悗鎴濈濞翠礁鐫嶇粈鎭掆偓浣稿灩闂勩倛顔囪ぐ鏇樷偓浣割嚤閸?CSV/JSON閵?
## 1. 閻滎垰顣ㄩ崙鍡楊槵

1. 鐎瑰顥?Node.js 20+
2. 閸?Supabase 閸掓稑缂撴い鍦窗
3. 閸?Supabase Storage 閺傛澘缂撻崗顒€绱?bucket閿涘苯鎮曠粔棰佺瑢 `SUPABASE_BUCKET` 娑撯偓閼疯揪绱欐妯款吇 `food-images`閿?4. 閹笛嗩攽 `supabase/schema.sql` 閸掓稑缂撻弫鐗堝祦鐞?
## 2. 閻滎垰顣ㄩ崣姗€鍣?
婢跺秴鍩?`.env.example` 娑?`.env.local`閿涘苯锝為崘娆欑窗

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET`

## 3. 閺堫剙婀存潻鎰攽

```bash
npm install
npm run dev
```

閹垫挸绱?`http://localhost:3000`

## 4. API 閸掓銆?
- `POST /api/entries` 閺傛澘顤冪拋鏉跨秿閿涘潰ultipart/form-data閿?- `GET /api/entries?cursor=` 閸掑棝銆夌拠璇插絿
- `DELETE /api/entries/:id` 閸掔娀娅庣拋鏉跨秿
- `GET /api/export?format=csv|json` 鐎电厧鍤?
## 5. Vercel 闁劎璁?
1. 鐎电厧鍙嗛張顒勩€嶉惄顔煎煂 Vercel
2. 閸?Vercel 鐠佸墽鐤嗘稉?`.env.local` 閻╃鎮撻惃鍕箚婢у啫褰夐柌?3. 闁劎璁查崥搴″祮閸欘垶鈧俺绻冮崺鐔锋倳鐠佸潡妫?
## 6. 鐠囧瓨妲?
- 瑜版挸澧犳稉鍝勫彆瀵偓缁旀瑧鍋ｉ敍灞炬￥閻ц缍嶉崪宀冾問闂傤喕绻氶幎銈冣偓?- 閸ュ墽澧栭崷銊ュ缁旑垵鍤滈崝銊ュ竾缂傗晛鑻熸穱婵囧瘮濮ｆ柧绶ラ崥搴濈瑐娴肩姰鈧?- 妫ｆ牗婀℃稉宥呭瘶閸氼偉鍤滈崝?AI 鏉烆剛绮崝鐔诲厴閿涘瞼鏁ら幋宄板讲娑撳﹣绱跺鎻掝槱閻炲棗鐣幋鎰畱閹存劕鎼ч崶淇扁偓

## 7. Login Protection

Set these env vars in Vercel:

- APP_USER (for example: star)
- APP_PASS (for example: dust)
- APP_SESSION_TOKEN (long random string)

The site and APIs are protected by middleware. Unauthenticated users are redirected to /login.
