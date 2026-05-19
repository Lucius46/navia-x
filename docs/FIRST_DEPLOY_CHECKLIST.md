# First Deployment Checklist

这份清单按“第一次上线”的真实顺序写，适合你边部署边打勾。

项目目标：

- 前端：Vercel
- 后端：Render
- 域名预期：
  - 前端测试域名：`https://your-vercel-domain.vercel.app`
  - 前端正式域名：`https://www.navia-x.com`
  - 后端测试域名：`https://your-render-backend-url.onrender.com`

---

## Step 1. 本地安全检查

确认以下文件存在，但不要上传真实内容：

- `backend/.env`
- `frontend/.env.local`
- `.env.example`
- `backend/.env.example`
- `render.yaml`

运行：

```bash
git status
bash scripts/scan-secrets.sh
grep -R "sk-" .
grep -R "OPENAI_API_KEY=" .
grep -R "GOOGLE_API_KEY=" .
grep -R "DASHSCOPE_API_KEY=" .
grep -R "OPENROUTER_API_KEY=" .
```

通过标准：

- 没有真实 API Key
- 没有真实数据库密码
- 没有真实 JWT secret
- `backend/.env` 和 `frontend/.env.local` 不在待提交列表里

如果误加过敏感文件：

```bash
git rm --cached .env
git rm --cached backend/.env
git rm --cached frontend/.env.local
```

---

## Step 2. 本地构建检查

后端：

```bash
cd backend
python3 -m compileall app
```

前端：

```bash
cd frontend
npm run build
```

通过标准：

- 后端语法检查通过
- 前端 build 通过

---

## Step 3. 上传 GitHub

如果仓库还没初始化：

```bash
git init
git add .
git status
git commit -m "Initial safe deployment setup"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

上传前最后确认：

- `backend/.env` 不在 `git status`
- `frontend/.env.local` 不在 `git status`
- 没有 `node_modules/`
- 没有 `.next/`
- 没有 `.venv/`

---

## Step 4. 在 Render 部署后端

### 4.1 创建服务

进入 Render：

1. 点击 `New +`
2. 选择 `Web Service`
3. 连接你的 GitHub 仓库

### 4.2 基本配置

填写：

- Name: `llm-explainer-api`
- Root Directory: `backend`
- Runtime: `Python`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

如果 Render 识别到仓库里的 `render.yaml`，直接确认即可。

### 4.3 环境变量

在 Render Dashboard 手动填写：

```bash
APP_NAME=LLM Explainer API
APP_ENV=production
API_PREFIX=/api
FRONTEND_ORIGIN=https://your-vercel-domain.vercel.app
CORS_ORIGINS=https://your-vercel-domain.vercel.app,https://www.navia-x.com
OPENAI_API_KEY=your_real_openai_key
JWT_SECRET=your_strong_random_secret
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password
ADMIN_NAME=LLM Explainer Admin
ADMIN_SESSION_SECRET=your_admin_session_secret
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-4.1-mini
MOCK_AI_RESPONSES=false
DAILY_REQUEST_LIMIT=20
INPUT_CHAR_LIMIT=3000
```

如果你要接数据库或其他模型供应商，再补：

```bash
DATABASE_URL=your_real_database_url
SUPABASE_URL=your_real_supabase_url
SUPABASE_ANON_KEY=your_real_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_real_supabase_service_role_key
GOOGLE_API_KEY=your_real_google_key
DASHSCOPE_API_KEY=your_real_dashscope_key
OPENROUTER_API_KEY=your_real_openrouter_key
XAI_API_KEY=your_real_xai_key
```

注意：

- 真实值只填在 Render
- 不要改 GitHub 里的 `render.yaml` 去写真实值

### 4.4 首次验证

部署完成后访问：

```bash
https://your-render-backend-url.onrender.com/api/health
```

预期返回：

```json
{"status":"ok","service":"LLM Explainer API"}
```

再打开：

```bash
https://your-render-backend-url.onrender.com/docs
https://your-render-backend-url.onrender.com/admin/login
```

通过标准：

- `/api/health` 正常
- `/docs` 能打开
- `/admin/login` 能打开

---

## Step 5. 在 Vercel 部署前端

### 5.1 导入项目

进入 Vercel：

1. 点击 `Add New...`
2. 选择 `Project`
3. 导入你的 GitHub 仓库

### 5.2 根目录设置

填写：

- Framework Preset: `Next.js`
- Root Directory: `frontend`

### 5.3 环境变量

只填写这一项：

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-render-backend-url.onrender.com
```

不要填写：

- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `DASHSCOPE_API_KEY`
- `OPENROUTER_API_KEY`
- `NEXT_PUBLIC_OPENAI_API_KEY`

### 5.4 部署

点击 `Deploy`。

部署完成后，拿到：

```bash
https://your-vercel-domain.vercel.app
```

---

## Step 6. 回填 Render 的 CORS

拿到真实 Vercel 域名后，回到 Render，更新：

```bash
FRONTEND_ORIGIN=https://your-vercel-domain.vercel.app
CORS_ORIGINS=https://your-vercel-domain.vercel.app,https://www.navia-x.com
```

如果你已经绑定正式域名，也可以写成：

```bash
FRONTEND_ORIGIN=https://www.navia-x.com
CORS_ORIGINS=https://your-vercel-domain.vercel.app,https://www.navia-x.com
```

保存后重新部署或等待 Render 自动重启。

---

## Step 7. 联调验证

### 7.1 验证前端页面

打开：

```bash
https://your-vercel-domain.vercel.app
```

确认：

- 页面能正常打开
- 没有白屏
- 没有直接暴露模型 key

### 7.2 验证前端到后端

在前端输入一段测试文本，点击“开始解析”，确认：

- 请求成功
- 没有 CORS 报错
- 没有 `localhost` 请求残留

### 7.3 验证后端到模型

确认：

- 后端能正常调用 LLM API
- 如果失败，先看 Render Logs
- 常见原因：
  - `OPENAI_API_KEY` 没填
  - `MOCK_AI_RESPONSES` 配置不对
  - `CORS_ORIGINS` 没写 Vercel 域名

---

## Step 8. 正式上线前复查

最后再检查一次：

- GitHub 没有 `.env`
- GitHub 没有 `frontend/.env.local`
- Render 已填真实环境变量
- Vercel 已填 `NEXT_PUBLIC_API_BASE_URL`
- `/api/health` 正常
- 前端可以调用后端
- 后端可以调用 LLM API
- 管理员密码不是默认值
- `JWT_SECRET` 和 `ADMIN_SESSION_SECRET` 不是默认值

---

## Quick Order

最短顺序可以记成：

1. 本地扫密钥
2. 本地 build
3. 上传 GitHub
4. 部署 Render
5. 填 Render 环境变量
6. 验证 `/api/health`
7. 部署 Vercel
8. 填 `NEXT_PUBLIC_API_BASE_URL`
9. 回填 Render 的 CORS
10. 前后端联调
