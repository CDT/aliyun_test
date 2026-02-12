# FC 部署说明（admin-api）

本文说明如何把 `admin-api` 部署到阿里云函数计算（Function Compute, FC）。

## 1. 前置准备

1. 已开通阿里云 Function Compute。
2. 已安装 Node.js 18+。
3. 已安装 Serverless Devs CLI（v3）：

```bash
npm install -g @serverless-devs/s
```

4. 在 `admin-api` 目录安装依赖并构建：

```bash
cd admin-api
npm install
npm run build
```

## 2. 配置凭证（仅本机）

需要三个值，均可在阿里云控制台获取：

| 值 | 获取方式 |
|---|---|
| AccountID | 控制台右上角头像 → 账号管理 |
| AccessKeyID | 控制台右上角头像 → AccessKey 管理 → 创建 AccessKey |
| AccessKeySecret | 同上，创建时仅展示一次，请妥善保存 |

### 方式一：命令行（推荐）

```bash
s config add --AccountID <你的AccountID> --AccessKeyID <你的AK> --AccessKeySecret <你的SK> --access default -f
```

### 方式二：手动编辑配置文件

如果命令行方式未生效（已知 Windows + v3 存在此问题），可直接编辑 `~/.s/access.yaml`：

- Linux/macOS: `~/.s/access.yaml`
- Windows: `%USERPROFILE%\.s\access.yaml`

写入以下内容：

```yaml
default:
  AccountID: <你的AccountID>
  AccessKeyID: <你的AK>
  AccessKeySecret: <你的SK>
```

保存后验证：

```bash
s config get -a default
```

应能看到凭证信息（部分掩码显示）。

## 3. 配置部署参数

部署参数直接在 `admin-api/s.yaml` 中编辑。部署前按需修改以下字段：

| 字段 | 默认值 | 说明 |
|---|---|---|
| `region` | `cn-hangzhou` | FC 部署区域 |
| `service.name` | `admin-demo-service` | FC 服务名 |
| `function.name` | `admin-demo-api` | FC 函数名 |
| `environmentVariables.JWT_SECRET` | `change-this-in-production` | JWT 签名密钥，务必修改 |
| `environmentVariables.ALLOW_ORIGIN` | `*` | CORS 允许的前端域名，如 `https://<bucket>.oss-<region>.aliyuncs.com` |
| `environmentVariables.OSS_BUCKET` | （空） | 可选，开启 OSS JSON 持久化时填写 bucket 名称 |
| `environmentVariables.OSS_REGION` | `cn-hangzhou` | OSS 所在区域 |
| `environmentVariables.OSS_ENDPOINT` | （空） | 自定义 OSS endpoint，一般留空 |
| `environmentVariables.OSS_OBJECT_KEY` | `admin-demo/users.json` | OSS 持久化文件路径 |

> **注意：** Serverless Devs v3 的 `devsapp/fc` 组件不支持 `${env()}` 语法，因此所有值直接写在 `s.yaml` 中。请勿将含敏感信息的 `s.yaml` 提交到公开仓库。

## 4. 执行部署

```bash
cd admin-api
npm run deploy:fc
```

或等效地：

```bash
cd admin-api
npm run build
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

| 现象 | 排查方向 |
|---|---|
| `s deploy` 提示 "default is not found" | 凭证未正确写入，参考第 2 节方式二手动编辑 `access.yaml` |
| `s deploy` 提示 "Account id not obtained" | `access.yaml` 缺少 `AccountID` 字段 |
| 返回 401 | 检查前端是否带 `Authorization: Bearer <token>` |
| 前端跨域失败 | 检查 `ALLOW_ORIGIN` 是否包含 OSS 域名与本地域名 |
| 404 | 确认请求路径包含 `/api` 前缀，例如 `/api/auth/login` |
| `s deploy` 报 `getaddrinfo ENOTFOUND` 且 URL 含 `%7Benv(` | `s.yaml` 中使用了 `${env()}` 语法，v3 不支持，需改为硬编码值 |
