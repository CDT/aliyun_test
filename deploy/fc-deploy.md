# FC 部署说明（admin-api）

本文说明如何把 `admin-api` 部署到阿里云函数计算（Function Compute, FC）。

## 1. 前置准备

1. 已开通阿里云 Function Compute。
2. 已安装 Node.js 18+。
3. 已安装 Serverless Devs CLI：

```bash
npm install -g @serverless-devs/s
```

4. 在 `admin-api` 目录安装依赖并构建：

```bash
cd admin-api
npm install
npm run build
```

## 2. 配置 AK/SK（仅本机）

```bash
s config add -a default --AccessKeyID <你的AK> --AccessKeySecret <你的SK> -f
```

## 3. 设置部署环境变量

Linux/macOS:

```bash
export OSS_REGION=cn-hangzhou
export FC_SERVICE=admin-demo-service
export FC_FUNCTION=admin-demo-api
export JWT_SECRET='replace-with-a-strong-secret'
export ALLOW_ORIGIN='https://<你的OSS默认域名>'
export OSS_BUCKET='<可选，开启 OSS JSON 持久化时填写>'
export OSS_ENDPOINT=''
export OSS_OBJECT_KEY='admin-demo/users.json'
```

Windows PowerShell:

```powershell
$env:OSS_REGION='cn-hangzhou'
$env:FC_SERVICE='admin-demo-service'
$env:FC_FUNCTION='admin-demo-api'
$env:JWT_SECRET='replace-with-a-strong-secret'
$env:ALLOW_ORIGIN='https://<你的OSS默认域名>'
$env:OSS_BUCKET='<可选，开启 OSS JSON 持久化时填写>'
$env:OSS_ENDPOINT=''
$env:OSS_OBJECT_KEY='admin-demo/users.json'
```

## 4. 执行部署

```bash
cd admin-api
s deploy -y
```

部署后会输出 HTTP Trigger 地址。

## 5. 控制台核对项

1. 进入 FC 控制台，确认 Service 和 Function 已创建。
2. 进入函数的 HTTP Trigger，确认鉴权方式为 `anonymous`（演示项目）。
3. 在函数配置的环境变量中确认：
   - `JWT_SECRET`
   - `ALLOW_ORIGIN`
   - `OSS_BUCKET` / `OSS_REGION` / `OSS_ENDPOINT`（可选）
4. 用以下路径验证：
   - `POST /api/auth/login`
   - `GET /api/auth/me`
   - `GET /api/users`（需 admin token）

## 6. 常见问题

1. 返回 401：检查前端是否带 `Authorization: Bearer <token>`。
2. 前端跨域失败：检查 `ALLOW_ORIGIN` 是否包含 OSS 域名与本地域名。
3. 404：确认请求路径包含 `/api` 前缀，例如 `/api/auth/login`。
