# 五环共创培训智能体云端部署

## 推荐方式：容器部署

当前应用使用服务端 JSON 文件保存共享数据。云端部署时必须挂载持久化目录，并设置：

```bash
WUHUA_DATA_DIR=/data
```

否则学生提交内容可能在实例重启后丢失。

## 本地验证容器

```bash
docker compose up --build
```

访问：

```text
http://localhost:3017
```

健康检查：

```text
http://localhost:3017/api/health
```

## 云平台部署要点

适合部署到支持 Docker 和持久化磁盘的平台，例如云服务器、Render、Railway、Fly.io、Koyeb 等。

配置：

- 构建方式：Dockerfile
- 容器端口：3000
- 健康检查路径：`/api/health`
- 持久化目录：挂载到 `/data`
- 环境变量：`WUHUA_DATA_DIR=/data`

## 模型 Key

项目不再从环境变量读取模型 API Key。用户登录后在「模型配置」页面自行填写 Base URL、模型名和 API Key。

## 账号

```text
admin / admin123
teacher / teacher123
student / student123
```
