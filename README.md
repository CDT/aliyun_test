# Alibaba Cloud Serverless Admin Demo

这是一个基于阿里云的全栈 Admin Demo（当前部署地域：香港）：

- 前端：React + Vite + TypeScript + Ant Design
- 后端：Function Compute（FC）Node.js 18 + TypeScript + HTTP Trigger
- 存储：本地 JSON（必选）+ OSS JSON 持久化（可选）
- 鉴权：JWT + RBAC（admin / user）
- 托管：OSS 静态网站
- CI/CD：GitHub Actions

## 1. 功能清单（MVP）

1. 登录页（用户名/密码）
2. 管理后台布局（侧边栏 + 顶栏 + 路由）
3. 权限控制
   - admin：Dashboard、User Management、System Settings
   - user：仅 Dashboard
4. Dashboard（统计卡片 + mock 表格）
5. 用户管理（admin 可 CRUD）
6. API
   - `POST /api/auth/login`
   - `GET /api/auth/me`
   - `GET/POST/PUT/DELETE /api/users`
7. 前端请求层
   - Axios token 自动注入
   - 401 自动跳转登录

## 2. 目录结构

```text
repo-root/
  admin-web/
  admin-api/
  .github/workflows/
    deploy.yml
  README.md
```

## 3. 本地开发

### 3.1 环境要求

```bash
node -v
npm -v
```

建议 Node.js 18+（推荐 20）。

### 3.2 启动后端

```bash
cd admin-api
cp .env.example .env
npm install
npm run dev
```

默认监听：`http://localhost:9000`

### 3.3 启动前端

新开一个终端：

```bash
cd admin-web
cp .env.example .env
npm install
npm run dev
```

默认地址：`http://localhost:5173`

Vite 已配置代理：`/api -> http://localhost:9000`

### 3.4 演示账号

- 管理员：`admin / admin123`
- 普通用户：`user / user123`

## 4. 后端环境变量说明（admin-api）

`.env` 示例见 `admin-api/.env.example`。

关键变量：

- `JWT_SECRET`：JWT 签名密钥
- `ALLOW_ORIGIN`：允许跨域来源（逗号分隔）
- `API_PREFIX`：默认 `/api`
- `OSS_BUCKET`：可选，启用 OSS JSON 持久化时填写
- `OSS_REGION`：如 `cn-hongkong`
- `OSS_ENDPOINT`：可选，自定义 OSS endpoint
- `OSS_OBJECT_KEY`：可选，默认 `admin-demo/users.json`

## 5. 前端环境变量说明（admin-web）

`.env` 示例见 `admin-web/.env.example`。

- `VITE_API_BASE`：API 基础路径
  - 本地开发：`/api`
  - OSS 上线后：建议改为 `https://<你的FC触发域名>/api`
- `VITE_PROXY_TARGET`：本地代理目标，仅 dev 有效

## 6. 阿里云部署（手动）

## 6.1 创建 OSS Bucket（静态网站托管）

1. 进入 OSS 控制台，创建 Bucket（如 `admin-demo-yourname`）。
2. 地域选择中国香港（`cn-hongkong`），无需备案即可绑定自定义域名。
3. 读写权限建议按你的安全策略设置（演示可公共读）。
4. 打开“静态页面”功能：
   - 默认首页：`index.html`
   - 默认 404 页：`index.html`
   - 错误页：`index.html`

这样可实现 SPA 路由刷新不 404。

## 6.2 创建 FC 服务与函数（HTTP Trigger）

可先在控制台创建空函数，再用 CLI 覆盖代码；也可直接用 `s deploy` 自动创建。

推荐直接用本项目 `admin-api/s.yaml`：

```bash
npm install -g @serverless-devs/s
s config add -a default --AccessKeyID <你的AK> --AccessKeySecret <你的SK> -f
```

Linux/macOS:

```bash
cd admin-api
export OSS_REGION=cn-hongkong
export FC_SERVICE=admin-demo-service
export FC_FUNCTION=admin-demo-api
export JWT_SECRET='replace-with-a-strong-secret'
export ALLOW_ORIGIN='https://<你的OSS访问域名>'
export OSS_BUCKET=''
export OSS_ENDPOINT=''
export OSS_OBJECT_KEY='admin-demo/users.json'
npm install
npm run build
s deploy -y
```

Windows PowerShell:

```powershell
cd admin-api
$env:OSS_REGION='cn-hongkong'
$env:FC_SERVICE='admin-demo-service'
$env:FC_FUNCTION='admin-demo-api'
$env:JWT_SECRET='replace-with-a-strong-secret'
$env:ALLOW_ORIGIN='https://<你的OSS访问域名>'
$env:OSS_BUCKET=''
$env:OSS_ENDPOINT=''
$env:OSS_OBJECT_KEY='admin-demo/users.json'
npm install
npm run build
s deploy -y
```

部署后拿到 FC 的 HTTP Trigger 域名，接口地址使用：

- `https://<FC域名>/api/auth/login`
- `https://<FC域名>/api/auth/me`
- `https://<FC域名>/api/users`

## 6.3 上传前端到 OSS

先打包前端：

```bash
cd admin-web
npm install
npm run build
```

然后执行上传脚本（Linux/macOS）：

```bash
cd ..
export OSS_BUCKET='你的Bucket名'
export OSS_REGION='cn-hongkong'
export ALICLOUD_ACCESS_KEY_ID='你的AK'
export ALICLOUD_ACCESS_KEY_SECRET='你的SK'
echo "Use GitHub Actions deploy workflow to upload dist to OSS"
```

> 前端 OSS 上传由 `.github/workflows/deploy.yml` 自动执行。

## 6.4 前端改为调用线上 API

编辑 `admin-web/.env.production`（新建）：

```env
VITE_API_BASE=https://<你的FC触发域名>/api
```

然后重新构建并上传：

```bash
cd admin-web
npm run build
cd ..
echo "Push to main to trigger GitHub Actions deployment"
```

## 7. GitHub Actions 自动部署

工作流文件：`.github/workflows/deploy.yml`

触发方式：

- push 到 `main`
- 手动触发 `workflow_dispatch`

### 7.1 必填 GitHub Secrets

- `ALICLOUD_ACCESS_KEY_ID`
- `ALICLOUD_ACCESS_KEY_SECRET`
- `OSS_BUCKET`
- `OSS_REGION`
- `FC_SERVICE`
- `FC_FUNCTION`

### 7.2 可选 GitHub Secrets（建议设置）

- `JWT_SECRET`
- `ALLOW_ORIGIN`
- `OSS_ENDPOINT`

### 7.3 工作流做了什么

1. 构建 `admin-web`
2. 把 `admin-web/dist` 上传到 OSS
3. 构建 `admin-api`
4. 使用 Serverless Devs 部署 FC

## 8. API 响应格式

统一返回：

```json
{
  "code": 0,
  "data": {},
  "message": "success"
}
```

错误时 `code != 0`，并返回可读 `message`。

## 9. 鉴权与权限

- 登录成功返回 JWT access token
- 前端拦截器自动注入 `Authorization: Bearer <token>`
- 后端中间件校验 JWT
- RBAC：
  - `admin` 可访问 `/users`、`/settings`
  - `user` 仅可访问 `/dashboard`

## 10. 安全注意事项

1. 不要把 AK/SK、JWT_SECRET 写死到代码仓库。
2. 生产环境务必使用强随机 `JWT_SECRET`。
3. `ALLOW_ORIGIN` 建议精确到你的 OSS 域名和管理端域名。
4. 演示数据账号仅用于 Demo，生产请改为安全认证流程。
