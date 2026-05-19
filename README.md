# LLM Explainer

LLM Explainer 是一个前后端分离项目：

- `frontend/`：Next.js 用户前端，部署到 Vercel
- `backend/`：FastAPI API 与管理端，部署到 Render
- `desktop/`：Electron 桌面端，本地运行，不部署到 Vercel

安全原则：

- 模型 API Key、数据库密码、JWT_SECRET 只放在后端环境变量
- 前端只使用公开变量 `NEXT_PUBLIC_API_BASE_URL`
- `.env`、`.env.local`、数据库连接串、私钥文件都不能上传到 GitHub

本地当前默认地址：

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8001`
- Backend health: `http://localhost:8001/api/health`
- Backend admin: `http://localhost:8001/admin/login`

## Project Structure

下面是当前项目的主要结构。这里列的是需要维护和部署的核心目录，不包含 `node_modules/`、`.next/`、`.venv/`、`dist/` 这类本地生成内容。

```text
LLM-explain/
├── README.md
├── .gitignore
├── .env.example
├── render.yaml
├── scripts/
│   └── scan-secrets.sh
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── main.py
│       ├── config.py
│       ├── schemas.py
│       ├── model_router.py
│       ├── database.py
│       ├── admin_auth.py
│       ├── admin_web.py
│       ├── api/
│       │   ├── explain.py
│       │   ├── health.py
│       │   ├── history.py
│       │   ├── usage.py
│       │   └── admin/
│       │       ├── logs.py
│       │       └── users.py
│       ├── repositories/
│       │   └── in_memory.py
│       └── services/
│           └── openai_client.py
├── frontend/
│   ├── .env.local.example
│   ├── package.json
│   ├── next.config.ts
│   ├── vercel.json
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   └── login/page.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx
│   │       ├── admin/page.tsx
│   │       ├── dashboard/page.tsx
│   │       ├── explain/page.tsx
│   │       ├── history/page.tsx
│   │       ├── pdf/page.tsx
│   │       └── settings/page.tsx
│   ├── components/
│   │   ├── explain/
│   │   └── ui/
│   └── lib/
│       ├── api.ts
│       ├── admin-api.ts
│       ├── mock-data.ts
│       ├── types.ts
│       └── utils.ts
├── desktop/
│   ├── package.json
│   ├── assets/
│   │   └── navia-x.svg
│   └── src/
│       ├── main.js
│       ├── preload.js
│       ├── renderer.html
│       ├── renderer.css
│       └── renderer.js
├── extension/
│   ├── manifest.json
│   ├── assets/
│   │   └── navia-x.svg
│   └── src/
│       ├── background.js
│       ├── content.js
│       ├── content.css
│       ├── popup.html
│       ├── popup.css
│       └── popup.js
├── database/
│   └── schema.sql
└── docs/
    ├── DEPLOYMENT.md
    ├── DESKTOP_SETUP.md
    ├── ENV.md
    ├── EXTENSION_SETUP.md
    ├── FIRST_DEPLOY_CHECKLIST.md
    ├── PRODUCT_SPEC.md
    └── TEST_PLAN.md
```

### Root Directory

- `README.md`：项目说明、部署方式、本地开发方式
- `.env.example`：根环境变量样板，给 GitHub 保留占位符版本
- `render.yaml`：Render 后端部署配置
- `scripts/scan-secrets.sh`：上传 GitHub 前的敏感信息扫描脚本

### Backend Structure

- `backend/app/main.py`：FastAPI 入口，挂载 `/api` 路由、CORS 和管理页
- `backend/app/config.py`：统一读取环境变量
- `backend/app/schemas.py`：请求与响应的数据模型
- `backend/app/api/explain.py`：主解释接口 `POST /api/explain`
- `backend/app/api/health.py`：健康检查 `GET /api/health`
- `backend/app/api/history.py`：历史记录接口
- `backend/app/api/usage.py`：使用量接口
- `backend/app/api/admin/`：管理员接口
- `backend/app/admin_web.py`：后端管理网页
- `backend/app/admin_auth.py`：管理员登录和会话校验
- `backend/app/model_router.py`：根据模式选择模型配置
- `backend/app/services/openai_client.py`：后端统一调用 LLM 提供商
- `backend/app/repositories/in_memory.py`：当前默认内存数据仓库
- `backend/requirements.txt`：Render 安装依赖时使用

### Frontend Structure

- `frontend/package.json`：Next.js 前端依赖和命令
- `frontend/vercel.json`：Vercel 前端部署识别配置
- `frontend/app/page.tsx`：当前用户主入口页
- `frontend/app/layout.tsx`：全局布局
- `frontend/app/globals.css`：全局样式
- `frontend/components/explain/`：解释工作台相关组件
- `frontend/components/ui/`：通用 UI 组件
- `frontend/lib/api.ts`：前端调用后端解释接口
- `frontend/lib/admin-api.ts`：前端管理数据接口封装
- `frontend/lib/types.ts`：前端类型定义
- `frontend/.env.local.example`：前端公开环境变量模板

### Desktop Structure

- `desktop/package.json`：Electron 桌面端依赖和命令
- `desktop/src/main.js`：Electron 主进程，窗口、托盘、后端调用桥接
- `desktop/src/preload.js`：安全暴露渲染进程 API
- `desktop/src/renderer.html`：桌面端页面结构
- `desktop/src/renderer.css`：桌面端样式
- `desktop/src/renderer.js`：桌面端交互、状态、渲染逻辑

### Other Directories

- `extension/`：浏览器扩展原型，当前不是主部署目标
- `database/schema.sql`：数据库结构草案
- `docs/`：部署、环境变量、桌面端和测试文档

### Local-Only Generated Directories

这些目录主要是本地开发或打包生成，不作为源码结构的一部分：

- `backend/.venv/`
- `frontend/.next/`
- `desktop/node_modules/`
- `desktop/dist/`
- `desktop/.artifacts/`

## Local Development

### 1. 复制环境变量模板

后端：

```bash
cp .env.example backend/.env
```

前端：

```bash
cp frontend/.env.local.example frontend/.env.local
```

### 2. 填写后端模型密钥

编辑 `backend/.env`，至少填写：

```bash
OPENAI_API_KEY=your_real_openai_key
JWT_SECRET=your_strong_random_secret
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password
```

如果你以后接入其他供应商，也只填写在后端环境变量里：

```bash
GOOGLE_API_KEY=
DASHSCOPE_API_KEY=
OPENROUTER_API_KEY=
XAI_API_KEY=
DATABASE_URL=
```

### 3. 启动后端

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

后端健康检查：

```bash
curl http://localhost:8001/api/health
```

预期返回：

```json
{"status":"ok","service":"LLM Explainer API"}
```

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端会从下面这个公开变量读取后端地址：

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

### 5. 启动桌面端

```bash
cd desktop
npm install
npm run dev
```

桌面端同样调用后端 API，不直接持有模型密钥。

## GitHub Upload

### 不要上传的文件

这些文件或目录不能上传到 GitHub：

- `backend/.env`
- `frontend/.env.local`
- 根目录 `.env`
- `.venv/`
- `node_modules/`
- `.next/`
- `desktop/dist/`
- `desktop/.artifacts/`
- 任何包含真实 key、数据库密码、JWT secret、证书或私钥的文件

### 上传前检查

先确认敏感文件没有被加入版本控制：

```bash
git status
```

再运行敏感信息扫描：

```bash
bash scripts/scan-secrets.sh
grep -R "sk-" .
grep -R "OPENAI_API_KEY=" .
grep -R "GOOGLE_API_KEY=" .
grep -R "DASHSCOPE_API_KEY=" .
grep -R "OPENROUTER_API_KEY=" .
```

说明：

- 如果结果出现在 `.env.example` 或 `backend/.env.example` 里，且值只是占位符，这是可以的
- 如果结果出现在 `.env`、`.env.local`、源码文件、提交说明或真实配置里，就不能上传

如果你安装了 `gitleaks`，建议再跑一次：

```bash
gitleaks detect --source .
```

### `.env` 跟踪说明

当前目录还没有初始化 Git 仓库，所以 `.env` 目前不存在“已被 Git 跟踪”的问题。

如果你之后执行 `git init` 之前就误加过 `.env`，可以取消跟踪：

```bash
git rm --cached .env
git rm --cached backend/.env
git rm --cached frontend/.env.local
```

## Deploy Backend to Render

### 1. New Web Service

在 Render 创建一个新的 Web Service，并连接 GitHub 仓库。

### 2. Render 基本设置

- Name: `llm-explainer-api`
- Environment: `Python`
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

仓库里已经提供了根目录 [render.yaml](render.yaml)。

### 3. Render Environment Variables

至少配置：

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
ADMIN_SESSION_SECRET=your_admin_session_secret
```

如果会用到其他供应商或数据库，再补：

```bash
GOOGLE_API_KEY=your_real_google_key
DASHSCOPE_API_KEY=your_real_dashscope_key
OPENROUTER_API_KEY=your_real_openrouter_key
XAI_API_KEY=your_real_xai_key
DATABASE_URL=your_real_database_url
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-4.1-mini
MOCK_AI_RESPONSES=false
```

注意：

- 这些真实值只填在 Render Dashboard
- 不要把真实值写进 `render.yaml`
- Render 会自动提供 `PORT`，不用手动填写

### 4. CORS 要点

后端通过 `CORS_ORIGINS` 读取多个来源，至少要包含：

- `http://localhost:3000`
- `https://your-vercel-domain.vercel.app`
- `https://www.navia-x.com`

## Deploy Frontend to Vercel

### 1. Import GitHub Repo

在 Vercel 导入这个 GitHub 仓库。

### 2. Root Directory

把前端 Root Directory 设置为：

```bash
frontend
```

前端是 Next.js 项目，仓库里已经提供 [frontend/vercel.json](frontend/vercel.json)。

### 3. Vercel Environment Variable

只需要公开 API 地址，不要填任何模型 key：

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-render-backend-url.onrender.com
```

禁止在前端填写这些变量：

- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `DASHSCOPE_API_KEY`
- `OPENROUTER_API_KEY`
- `NEXT_PUBLIC_OPENAI_API_KEY`

### 4. Deploy

部署成功后，把实际的 Vercel 域名回填到 Render 的：

```bash
FRONTEND_ORIGIN=https://your-vercel-domain.vercel.app
CORS_ORIGINS=https://your-vercel-domain.vercel.app,https://www.navia-x.com
```

## Production Checklist

- GitHub 里没有 `.env`
- GitHub 里没有 `frontend/.env.local`
- GitHub 里没有真实 API Key
- GitHub 里没有数据库密码
- Render 环境变量已经填写
- Vercel 环境变量已经填写
- `https://your-render-backend-url.onrender.com/api/health` 正常
- 前端可以调用后端
- 后端可以调用 LLM API
- 管理员账号密码和 `JWT_SECRET` 已改成真实强密码

## Security Scan

快捷命令：

```bash
bash scripts/scan-secrets.sh
```

手动命令：

```bash
grep -R "sk-" .
grep -R "OPENAI_API_KEY=" .
grep -R "GOOGLE_API_KEY=" .
grep -R "DASHSCOPE_API_KEY=" .
grep -R "OPENROUTER_API_KEY=" .
```

如果搜索结果只出现在 `.env.example` 中且值是占位符，可以继续；如果出现真实值，就先清理再上传。

## GitHub Upload Commands

```bash
git init
git add .
git status
git commit -m "Initial safe deployment setup"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Deployment Notes

- 后端服务名：`LLM Explainer API`
- 后端 API 前缀：`/api`
- 前端不能直接调用 LLM 供应商
- 所有模型密钥只能在后端环境变量里读取
- 本地开发时，前端默认调用 `http://localhost:8001`

## Recommended Deploy Order

1. 先清理并检查敏感信息
2. 上传 GitHub
3. 部署 Render 后端
4. 在 Render 填好真实环境变量
5. 验证 `/api/health`
6. 部署 Vercel 前端
7. 在 Vercel 填 `NEXT_PUBLIC_API_BASE_URL`
8. 把 Vercel 域名回填到 Render 的 `CORS_ORIGINS`
9. 最后验证前端到后端的联通和模型调用

## First Deploy Checklist

如果你想按后台页面一步一步操作，可以直接看：

- [docs/FIRST_DEPLOY_CHECKLIST.md](docs/FIRST_DEPLOY_CHECKLIST.md)
