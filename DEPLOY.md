# 🚀 Study Buddy 生产环境部署指南

把项目部署到香港服务器，绑定自定义域名，国内无需梯子秒开。

---

## 📋 总览

| 步骤 | 内容 | 耗时 |
|------|------|------|
| 1 | 买域名 | 5 分钟 |
| 2 | 买服务器 | 5 分钟 |
| 3 | 解析域名 | 2 分钟 |
| 4 | 部署项目 | 10 分钟 |
| 5 | 验证上线 | 2 分钟 |

**总计约 25 分钟完成全部部署。**

---

## 第一步：购买域名

### 推荐平台
- [阿里云万网](https://wanwang.aliyun.com/)
- [腾讯云 DNSPod](https://dnspod.cloud.tencent.com/)

### 便宜后缀推荐（首年）
| 后缀 | 首年价格 | 适合场景 |
|------|----------|----------|
| `.icu` | ~3 元 | 科技/AI 项目 |
| `.xyz` | ~1 元 | 通用 |
| `.top` | ~3 元 | 通用 |
| `.site` | ~5 元 | 通用 |
| `.fun` | ~5 元 | 有趣的项目 |

> 💡 **简历建议**：`.icu` 比较好记，也跟 AI 学习助手调性匹配，比如 `studybuddy.icu`、`aistudy.icu`

注册后实名认证一下（几分钟就过），域名就到手了。

---

## 第二步：购买香港服务器

> ⚠️ **为什么选香港？** 国内访问速度快（~30ms）、不需要 ICP 备案、即买即用。

### 方案 A：阿里云香港轻量（推荐）

1. 打开 [阿里云轻量应用服务器](https://swas.console.aliyun.com/)
2. 地域选 **中国香港**
3. 配置选最低配 **2核1G**（24元/月）
4. 镜像选 **Ubuntu 22.04**（不要选应用镜像）
5. 购买时长选 1 个月试试水

### 方案 B：Sealos（免费额度）

1. 注册 [sealos.run](https://sealos.run)
2. 充值 10 元即送免费额度
3. 用他们的「应用管理」功能部署 Docker 镜像
4. 同样支持绑定自定义域名

> 💡 Sealos 部署略有不同，本文末尾有补充说明。

---

## 第三步：域名解析到服务器

1. 在阿里云控制台找到你的域名 → **解析设置**
2. 添加两条记录：

| 记录类型 | 主机记录 | 记录值 | TTL |
|----------|----------|--------|-----|
| A | @ | 你的服务器IP | 600 |
| A | www | 你的服务器IP | 600 |

服务器 IP 在轻量应用服务器控制台可以看到。

> ⚠️ DNS 解析生效需要 1-10 分钟，可以先做第四步，等部署完就生效了。

---

## 第四步：部署项目到服务器

### 4.1 SSH 登录服务器

在阿里云轻量控制台找到「远程连接」→ 一键登录，或者在本地终端：

```bash
ssh root@你的服务器IP
```

阿里云会提示你设置 root 密码，先设好。

### 4.2 安装 Docker

```bash
# 一键安装 Docker
curl -fsSL https://get.docker.com | sh

# 启动 Docker
systemctl enable docker && systemctl start docker

# 验证
docker --version
```

### 4.3 上传项目代码

在服务器上：

```bash
# 克隆项目（替换为你的仓库地址）
git clone https://github.com/你的用户名/Study-buddy.git
cd Study-buddy
```

> 💡 如果仓库是私有的，先在服务器上配置 SSH key 或者用 `git clone https://用户名:token@github.com/...`

### 4.4 配置环境变量

```bash
# 创建 .env 文件
cat > .env << 'EOF'
DEEPSEEK_API_KEY=你的DeepSeek_API_Key
DOMAIN=你的域名
LOG_LEVEL=INFO
EOF
```

**替换内容：**
- `你的DeepSeek_API_Key` → 在 [platform.deepseek.com](https://platform.deepseek.com) 获取
- `你的域名` → 第一步买的域名，如 `studybuddy.icu`（不要加 https:// 前缀）

### 4.5 启动服务

```bash
# 构建并后台启动
docker compose -f docker-compose.prod.yml up -d --build

# 查看启动日志
docker compose -f docker-compose.prod.yml logs -f
```

看到 `healthy` 就说明启动成功了。按 `Ctrl+C` 退出日志。

### 4.6 检查运行状态

```bash
docker compose -f docker-compose.prod.yml ps
```

两个服务（`study-buddy-app` 和 `study-buddy-caddy`）都是 `Up` 状态就对了。

---

## 第五步：验证上线

### 确认 HTTPS 生效

```bash
curl -I https://你的域名
```

看到 `HTTP/2 200` 和 `server: Caddy` 说明一切正常。

### 浏览器打开

在浏览器访问 `https://你的域名`，应该看到 Study Buddy 界面。

> 🎉 **恭喜！** 现在你可以把这个链接放到简历上了。

---

## 🛠 日常维护

### 查看日志
```bash
docker compose -f docker-compose.prod.yml logs -f --tail=50
```

### 更新代码后重新部署
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### 重启服务
```bash
docker compose -f docker-compose.prod.yml restart
```

### 查看数据持久化情况
```bash
ls -la ./data/
# 包含 chroma/（向量数据库）、uploads/（上传文件）、study_buddy.db（SQLite）
```

---

## 📎 附录：Sealos 部署补充

如果你用 Sealos 代替香港 VPS：

1. 在 Sealos 控制台创建「应用管理」
2. 镜像填 `Dockerfile`（Sealos 支持从源码构建）
3. 环境变量设置同上
4. 端口填 `7860`
5. 域名绑定在 Sealos 的「域名管理」中操作
6. HTTPS 证书 Sealos 自动处理（不需要 Caddy）

---

## 🔧 常见问题

### Q: Caddy 无法申请 HTTPS 证书？
确认域名 DNS 已经解析到服务器 IP，用 `ping 你的域名` 测试。DNS 生效最多等 10 分钟。

### Q: 网站能打开但 API 报错？
检查 `.env` 里的 `DEEPSEEK_API_KEY` 是否正确，以及 DeepSeek 账户余额。

### Q: 上传文件失败？
Docker 内部 `/data` 目录权限问题。运行：
```bash
docker exec study-buddy-app chmod -R 777 /data
```

### Q: 如何查看 Caddy 日志？
```bash
docker logs study-buddy-caddy
```
