# Docker 学习笔记

> 📅 发布时间：2019-12-10
>
> 🏷️ 标签：`Docker`
>
> ⏱️ 阅读时长：约 10 分钟

## 1. 基础概念

### 1.1 Docker 是什么

Docker 是一个开源的容器化平台，它通过将应用程序及其依赖项打包到一个轻量级、可移植的容器中，确保应用在不同环境中都能保持一致的运行效果。

### 1.2 为什么用 Docker

更高效的利用系统资源：由于容器不需要进行硬件虚拟以及运行完整操作系统等额外开销，Docker 对系统资源的利用率更高。

一致的运行环境：Docker 的镜像提供了除内核外完整的运行时环境，也确保了应用运行环境一致性。

更轻松的迁移：由于 Docker 确保了执行环境的一致性，使得应用的迁移更加容易。

### 1.3 基本概念

- 镜像（Image）：相当于一个容器模板。其底层设计为分层存储的架构。
- 容器（Container）：可以理解为一个轻量级的虚拟机，镜像运行的载体.
- 镜像仓库：存放镜像的仓库，官方镜像仓库[https://hub.docker.com](https://hub.docker.com/)

## 2. Docker 命令

### 2.1 镜像

```bash
# 搜索镜像：docker search 仓库名
$ docker search mysql

# 下载镜像：docker pull [选项] [Docker Registry 地址[:端口号]/] 仓库名[:标签]
$ docker pull ubuntu:18.04

# 列出镜像
$ docker image ls

# 删除镜像：docker image rm [选项] 镜像名字或ID
$ docker image rm ubuntu
```

### 2.2 容器

```bash
# 列出容器：docker ps [选项]
$ docker ps
$ docker ps -a

# 创建并运行容器：docker run [选项] 镜像名[:标签] [创建容器后执行的命令] [前面命令参数...]
# 最简单的方式运行
$ docker run nginx:latest
# 运行后执行命令
$ docker run nginx:latest ls
# 以交互式方式运行，-i标识交互式，-t标识分配一个命令行
$ docker run -it nginx:latest bash
# 以后台方式运行（推荐且最常用）：-d
$ docker run -d nginx:latest
# 端口映射：-p 宿主机端口:容器端口
$ docker run -d -p 8080:80 nginx:latest
# 数据卷映射：-v 宿主机目录:容器目录[:读写权限ro/rw]
$ docker run -d -v /opt/apps/nginx/nginx.conf:/etc/nginx/nginx.conf nginx:latest
# 设置环境变量：-e 变量名=变量值
$ docker run -d -e NGINX_ENTRYPOINT_QUIET_LOGS=1 nginx
# 容器命名：-name 需要指定的容器名
$ docker run -d --name nginx nginx:latest
# 容器退出后的重启策略：--restart 重启策略，no不重启、always总是重启...
$ docker run -d --restart always nginx:latest

# 交互式方式进入容器：docker exec [选项] 容器名或ID 命令 [参数...]
$ docker exec -it nginx bash

# 停止运行容器：docker stop [选项] 容器名或ID
$ docker stop nginx

# 删除容器：docker rm [选项] 容器名或ID
$ docker rm nginx
# 强制删除正在运行中的容器
$ docker rm -f nginx

# 查看容器日志：docker logs [选项] 容器名或ID
# 持续监控日志输出
$ docker logs -f nginx
# 查看最新的20条日志 --tail 20 或 -n 20
$ docker logs -f --tail 20 nginx

# 文件复制
# 容器文件复制到宿主机：docker cp [选项] 容器名或ID:src_path desc_path
$ docker cp nginx:/usr/share/nginx/html/index.html ~
# 宿主机文件复制到容器：docker cp [选项] src_path 容器名或ID:desc_path
$ docker cp ~/index.html nginx:/usr/share/nginx/html
```

## 3. 定制镜像

### 3.1 `docker commit` 指令（不推荐）

当我们改动了容器里面的文件，如果不使用卷的话，我们做的任何文件修改都会被记录于容器存储层里。

而 Docker 提供了一个`docker commit`命令，可以将容器的存储层保存下来成为镜像，存放在本地仓库中。

**语法格式为**

```bash
$ docker commit [选项] 容器ID或容器名 [仓库名[:标签]]
```

**使用示例**

例如我们修改了启动的 nginx 容器中`/usr/share/nginx/html/index.html`文件的内容之后

```bash
$ docker commit \
    --author "Tao Wang <xxxx@163.com>" \
    --message "修改了默认网页" \
    nginx \
    nginx:v2
```

**慎用**

使用`docker commit`意味着所有对镜像的操作都是黑箱操作，生成的镜像也被称为**黑箱镜像**，换句话说，就是除了制作镜像的人知道执行过什么命令、怎么生成的镜像，别人根本无从得知。
而且，即使是这个制作镜像的人，过一段时间后也无法记清具体的操作。
这种黑箱镜像的维护工作是非常痛苦的。

### 3.2 Dockerfile（推荐）

实际开发中可以用 Dockerfile 定制镜像，镜像的定制实际上就是定制每一层所添加的配置、文件。

如果我们可以把**每一层修改、构建、操作的命令**都写入一个脚本，用这个脚本来构建、定制镜像，这个脚本就 Dockerfile。

这样也解决了镜像定制的透明问题，别人看你的 Dockerfile 文件，就知道你对基础镜像做了什么更改。

#### 3.2.1 Dockerfile 常用指令

```dockerfile
# 定义基础镜像
# 语法：FROM 镜像名:标签
# 运行时机：构建镜像的时候
FROM centos:7

# 定义环境变量
# 语法：ENV 变量名="变量值"
# 运行时机：构建镜像的时候
ENV DIR="/root"

# 设置当前镜像中的工作目录，不存在时会创建，然后进入到该目录下
# 语法：WORKDIR 目录
# 运行时机：构建镜像的时候
WORKDIR /app

# 定义构建镜像的时候执行命令
# 语法：RUN 命令
# 运行时机：构建镜像的时候
# 提示：尽量合并 RUN 指令以减少镜像层数，如 RUN yum update && yum install -y vim
RUN tar -xvf dist.tar

# 构建上下文中文件复制到镜像中
# 语法：COPY 源路径 目标路径
# 运行时机：构建镜像的时候
# 提示：配合 .dockerignore 文件排除无关文件
COPY hello-java.jar .

# 构建上下文中文件或网络文件添加到镜像中，如果是压缩文件会自动解压
# 语法：ADD 源路径 目标路径
# 运行时机：构建镜像的时候
ADD dist.zip .
ADD hello-java.jar .

# 声明发布需要暴露的端口
# 语法：EXPOSE 端口1 端口2 ...
# 运行时机：构建镜像的时候
EXPOSE 80

# 定义容器运行时的默认命令
# 语法1：CMD ["命令", "参数1", "参数2"]；推荐使用这种JSON数组的方式，这种方式并不会展开环境变量
# 语法2：CMD 命令 参数1 参数2；这种方式会展开环境命令
# 运行实际：运行容器的时候
# 注意1：文件里面的CMD后面的命令会被 docker run 后面的命令覆盖
# 注意2：一个文件里面只能有一个CMD指令，如果有多条，只有最后一条才会生效
CMD ["sh", "-c", "echo $PATH"]
CMD ["java", "-jar", "hello-java.jar"]

# 定义容器运行时的默认命令，不会被docker run后面的命令覆盖
# 语法：ENTRYPOINT ["命令", "参数1", "参数2"]
# 运行实际：运行容器的时候
ENTRYPOINT ["java", "-jar", "hello-java.jar"]
```

#### 3.2.2 Dockerfile 构建指令

接下来使用 Dockerfile 文件构建镜像

**语法格式为**

```bash
$ docker build [选项] 上下文路径/URL
```

选项：`-t`指定名字[:标签]；`-f`指定 Dockerfile 文件；

上下文路径：Docker 其实也是 CS 结构，构建的时候需要将指定的上下文路劲中的内容打包上传到服务端开始操作. 所以这个路径下面只需包含 Dockerfile 文件和构建镜像所需文件即可，不要有多余无用文件

**使用示例**

```bash
$ docker build -t my-nginx -f Dockerfile .
$ docker build -t my-nginx:v1 -f Dockerfile .
```

#### 3.2.3 自定义镜像示例

##### 后端项目部署示例

创建 Dockerfile

```dockerfile
FROM openjdk:8-jre-alpine
WORKDIR /app
COPY hello-java.jar /app/hello-java.jar
EXPOSE 8081
CMD ["java", "-jar", "hello-java.jar", "--spring.profiles.active=prod"]
```

构建 Docker 镜像

```bash
$ docker build -t hello-java-app .
```

运行容器

```bash
$ docker run -d --name hello-java-container -p 8081:8081 hello-java-app
```

##### 前端项目部署示例

创建 Dockerfile

```dockerfile
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
ADD dist.zip .
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

构建 Docker 镜像

```bash
$ docker build -t hello-web-app .
```

运行容器

```bash
$ docker run -d -p 8080:80 --name hello-web-container hello-web-app
```

## 4. Docker Compose

Compose 项目是 Docker 官方的开源项目，负责实现对 Docker 容器集群的快速编排。

定义和运行多个 Docker 容器的应用。

目前 Docker 官方用 GO 语言 重写 了 Docker Compose，并将其作为了 docker cli 的子命令，称为 Compose V2. 你可以参照官方文档安装，然后将熟悉的 docker-compose 命令替换为 docker compose，即可使用 Docker Compose。

### 4.1 Docker Compose 常用命令

基本语法格式

```bash
docker compose [选项] [命令] [参数...]
```

选项：

- `-f`指定 Compose 模板文件，默认为当前目录的 docker-compose.yml
- `-p`指定项目名，默认当前目录名作为项目名
- `--verbose`输出更多调试信息
- `-v/--version`打印版本并退出

```bash
# 查看 compose 版本
$ docker compose version

# 查看容器状态
$ docker compose ps

# 运行服务
$ docker compose up
# 后台方式运行
$ docker compose up -d
# 后台启动特定服务
$ docker compose up -d hello-java-app

# 停止服务
$ docker compose stop
# 停止特定服务
$ docker compose stop hello-java-app

# 重启服务
$ docker compose restart
# 重启特定服务
$ docker compose restart hello-java-app

# 销毁服务（停止并删除所有容器、网络和数据卷）
$ docker compose down

# 进入指定服务容器
$ docker compose exec hello-java-app bash

# 构建服务镜像
$ docker compose build
# 构建特定服务镜像
$ docker compose build hello-java-app

# 检查 docker-compose.yml 文件的语法是否正确
$ docker compose config --validate

# 查看日志
$ docker compose logs
# 查看实时日志
$ docker compose logs -f
# 查看特定服务日志
$ docker compose logs hello-java-app
```

### 4.2 docker-compose.yml 详解

```yaml
version: "3.8" # 指定 Docker Compose 文件版本

services: # 定义服务
  service_name: # 服务名称
    image: nginx:latest # 使用的镜像
    build: # 构建配置
      context: . # Dockerfile 所在目录
      dockerfile: Dockerfile
    environment: # 环境变量
      - NODE_ENV=production
    volumes: # 数据卷映射
      - ./data:/app/data
    depends_on: # 服务依赖
      - db
    networks: # 网络配置
      - app_network
    ports: # 端口映射
      - "8080:80"
    command: ["nginx", "-g", "daemon off;"] # 覆盖容器启动时的默认命令
    restart: always # 重启策略: no, always, on-failure, unless-stopped

> 💡 **提示**：在同一个 Compose 项目中的服务，可以通过**服务名**作为主机名互相访问（如 Java 应用连接数据库可以使用 `jdbc:mysql://mysql:3306/db`）。

networks: # 定义网络
  app_network:
    driver: bridge

volumes: # 定义数据卷
  app_data:
```

### 4.3 综合示例

对上面的 3.2.3 里面的前端项目`hello-web-app`和后端项目`hello-java-app`（Dockerfile 文件），再加上 MySQL 服务和 Redis 服务

**docker-compose.yml 文件编写**

```yaml
version: "3.8"

services:
  # MySQL
  mysql:
    image: mysql:5.7.33
    environment:
      - TZ=Asia/Shanghai
      - MYSQL_ROOT_PASSWORD=12345678
    volumes:
      - /opt/docker/apps/mysql/data:/var/lib/mysql
      - /opt/docker/apps/mysql/conf/my.cnf:/etc/mysql/my.cnf
      - /opt/docker/apps/mysql/log:/var/log/mysql
    ports:
      - 3306:3306
    restart: always
  # Redis
  redis:
    image: redis:7.4.1
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - /opt/docker/apps/redis/data:/data
      - /opt/docker/apps/redis/conf/redis.conf:/etc/redis/redis.conf
      - /opt/docker/apps/redis/logs:/logs
    ports:
      - 6379:6379
    restart: always
  # 前端服务
  hello-web-app:
    build:
      context: ./hello-web-app/
      dockerfile: Dockerfile
    environment:
      - TZ=Asia/Shanghai
    ports:
      - 8080:80
    restart: always
  # 后端服务
  hello-java-app:
    build:
      context: ./hello-java-app/
      dockerfile: Dockerfile
    environment:
      - TZ=Asia/Shanghai
    ports:
      - 8081:8081
    restart: always
```

## 5. 进阶技巧

### 5.1 常用清理命令

```bash
# 清理所有停止的容器、未使用的网络和悬挂镜像（dangling images）
$ docker system prune

# 清理更彻底，包括所有未被使用的镜像和卷
$ docker system prune -a --volumes
```

### 5.2 多阶段构建 (Multi-stage Build)

以前端项目为例，通过多阶段构建可以减小最终镜像体积，且不需要在生产镜像中保留源码。

```dockerfile
# 第一阶段：编译
FROM node:16-alpine as builder
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

# 第二阶段：运行
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 6. 其他

### 6.1 Docker 可视化工具

- [Portainer](https://www.portainer.io/install)
- [1Panel](https://1panel.cn/)

**参考资料**

- [_Docker—从入门到实践_](https://yeasy.gitbook.io/docker_practice)
- [_Dockerfile reference_](https://docs.docker.com/reference/dockerfile/)
- [_CLI reference_](https://docs.docker.com/reference/cli/docker/)
- [_Docker Hub_](https://hub.docker.com/)