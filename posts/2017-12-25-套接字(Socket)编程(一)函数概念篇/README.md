# 套接字(Socket)编程(一) 函数概念篇

> 📅 发布时间：2017-12-25
>
> 🏷️ 标签：`套接字` `Socket` `TCP` `UDP`
>
> ⏱️ 阅读时长：约 15 分钟

> 套接字是网络通信的基石，是网络通信的基本构建。最初由加利福尼亚大学 Berkeley 分校为 UNIX 开发的网络通信编程接口（POSIX Socket），本文主要介绍套接字的基础概念与核心函数，帮助读者了解使用套接字编写程序的基本过程。

---

## 1. 开发环境说明

本文所涉及的代码及函数解析基于以下环境：
- **操作系统**：Unix-like 系统 (包括 macOS, Linux, BSD)。
- **编程语言**：标准 C / C++。
- **编译器**：Clang / GCC。
- **核心头文件**：
  - `<sys/socket.h>`：核心套接字 API。
  - `<arpa/inet.h>`：IP 地址转换与字节序转换函数。
  - `<netinet/in.h>`：定义了 `sockaddr_in` 等协议族结构体。
  - `<unistd.h>`：包含 `close` 函数。
  - `<errno.h>`：用于捕获系统级错误。

---

## 2. 概念

所谓的套接字（Socket），实际上是一个指向传输提供者的句柄。根据性质和作用的不同，套接字主要分为以下 3 种类型：

- **原始套接字 (Raw Socket)**：允许对底层网络传输机制进行控制，接收到的数据中包含 IP 首部。
- **流式套接字 (Stream Socket)**：提供双向、有序、可靠的数据传输服务（面向连接）。**TCP 协议采用的就是流式套接字。**
- **数据包套接字 (Datagram Socket)**：提供双向数据流，但不保证传输的可靠性、有序性和无重复性（无连接）。**UDP 协议采用的就是数据包套接字。**

### 2.1 TCP 套接字编程流程

**基于 TCP 面向连接的服务器端流程：**
1. 创建套接字 (`socket`)
2. 绑定到本地地址和端口 (`bind`)
3. 设置监听状态 (`listen`)
4. 接受请求 (`accept`)：**此处会阻塞**，直到有客户端连接。
5. 通信 (`send`/`recv`)
6. 释放资源 (`close`)

**基于 TCP 面向连接的客户端流程：**
1. 创建套接字 (`socket`)
2. 向服务器发出连接请求 (`connect`)
3. 连接成功后进行通信 (`send`/`recv`)
4. 释放资源 (`close`)

### 2.2 UDP 套接字编程流程

**基于 UDP 无连接的接收端流程：**
1. 创建套接字 (`socket`)
2. 绑定 (`bind`)
3. 接收数据 (`recvfrom`)：**此处默认会阻塞**。
4. 释放资源 (`close`)

---

## 3. 核心通信函数

### 3.1 socket 函数
`int socket(int af, int type, int protocol);`
- **af**：地址族。IPv4 使用 `AF_INET`，IPv6 使用 `AF_INET6`。
- **type**：套接字类型。`SOCK_STREAM` (TCP)、`SOCK_DGRAM` (UDP)。
- **返回值**：成功返回非负整数（文件描述符），失败返回 -1。

### 3.2 bind 函数
`int bind(int sockfd, const struct sockaddr *my_addr, socklen_t addrlen);`
- **注意**：绑定的端口号若低于 1024，通常需要超级用户 (root) 权限。
- **INADDR_ANY**：如果绑定地址设为 `INADDR_ANY`，表示监听主机上所有的网卡接口。

### 3.3 listen 函数
`int listen(int sockfd, int backlog);`
- **backlog**：指内核为该套接字排队的最大连接个数。

### 3.4 accept 函数
`int accept(int sockfd, struct sockaddr *addr, socklen_t *addrlen);`
- **阻塞特性**：如果没有客户端连接，进程会进入睡眠状态。

### 3.5 recv 与 send 函数 (TCP)
`ssize_t recv(int sockfd, void *buf, size_t len, int flags);`
`ssize_t send(int sockfd, const void *buf, size_t len, int flags);`
- **返回值**：
  - `> 0`：实际处理的字节数。
  - `== 0`：**非常重要**。在 `recv` 中表示对端已正常关闭连接（收到 EOF）。
  - `< 0`：发生错误。

---

## 4. 辅助转换函数

在网络编程中，由于不同计算机体系结构对数据的存储方式不同，以及 IP 地址 in “字符串”与“二进制”之间的转换需求，必须使用辅助函数。

### 4.1 字节序转换 (Byte Order)

**背景知识**：
- **小端序 (Little-Endian)**：低位字节存放在低地址（如 x86、ARM、macOS）。例如 `0x1234` 存储为 `34 12`。
- **大端序 (Big-Endian)**：高位字节存放在低地址。**网络传输规定必须使用大端序**。

**命名规则**：`h` (host 主机), `n` (network 网络), `s` (short 16位), `l` (long 32位)。

- **`htons()`**：Host to Network Short。将 16 位端口号从主机序转为网络序。
- **`ntohs()`**：Network to Host Short。将收到的网络序端口号转回主机序。
- **`htonl()`**：Host to Network Long。将 32 位 IPv4 地址从主机序转为网络序。
- **`ntohl()`**：Network to Host Long。

**示例代码**：
```c
uint16_t host_port = 8888;
uint16_t net_port = htons(host_port);
printf("主机端口: %d (0x%04x), 网络字节序: 0x%04x\n", host_port, host_port, net_port);
// 在 x86 机器上，输出可能是：主机端口: 8888 (0x22b8), 网络字节序: 0xb822
```

### 4.2 IP 地址转换 (Modern API)

现代网络编程推荐使用 `inet_pton` 和 `inet_ntop`，它们不仅安全，且同时支持 IPv4 和 IPv6。

#### 4.2.1 inet_pton (String to Binary)
**功能**：将“点分十进制”的字符串 IP 转换为网络字节序的二进制整数。
- `p` 代表 **Presentation**（表达格式/字符串）。
- `n` 代表 **Numeric**（数值格式/二进制）。

**示例**：
```c
struct sockaddr_in addr;
const char *ip_str = "192.168.1.100";
// 将字符串转换为二进制并直接存入结构体
if (inet_pton(AF_INET, ip_str, &addr.sin_addr) <= 0) {
    perror("IP conversion failed");
}
```

#### 4.2.2 inet_ntop (Binary to String)
**功能**：将网络字节序的二进制 IP 转换为易读的字符串。

**示例**：
```c
char ip_buf[INET_ADDRSTRLEN]; // INET_ADDRSTRLEN 是系统定义的 IPv4 字符串长度常量
inet_ntop(AF_INET, &addr.sin_addr, ip_buf, sizeof(ip_buf));
printf("连接的 IP 地址是: %s\n", ip_buf);
```

### 4.3 获取套接字信息

在通信过程中，有时我们需要知道当前套接字对应的本地或远程地址信息。

- **`getsockname()`**：获取**本地**地址和端口。常用于服务器绑定 `INADDR_ANY` 后，确定实际使用的 IP。
- **`getpeername()`**：获取**远程（对方）**地址和端口。

**示例**：
```c
struct sockaddr_in peer_addr;
socklen_t addr_len = sizeof(peer_addr);
if (getpeername(clnt_fd, (struct sockaddr *)&peer_addr, &addr_len) == 0) {
    printf("对方端口是: %d\n", ntohs(peer_addr.sin_port));
}
```

---

## 5. 关键点补充 (重要)

### 5.1 错误处理机制
在 POSIX Socket 中，几乎所有的系统调用失败都会返回 `-1`。正确的做法是检查 `errno`：
```c
if (bind(fd, (struct sockaddr*)&addr, sizeof(addr)) == -1) {
    perror("Bind failed"); // 会打印具体的错误原因，如 "Address already in use"
    exit(EXIT_FAILURE);
}
```

### 5.2 端口复用 (SO_REUSEADDR)
在开发阶段，经常遇到服务器关闭后立刻重启显示“Address already in use”。这是因为 TCP 的 `TIME_WAIT` 状态。可以通过以下设置解决：
```c
int opt = 1;
setsockopt(serv_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
```

---

## 6. 代码示例实现

### 6.1 TCP 示例

#### TCP 服务端 (Server)
```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#define PORT 8888

int main() {
    int serv_fd, clnt_fd;
    struct sockaddr_in serv_addr, clnt_addr;
    socklen_t clnt_addr_size;
    char buffer[1024];

    // 1. 创建套接字
    serv_fd = socket(AF_INET, SOCK_STREAM, 0);
    
    // 2. 绑定地址
    memset(&serv_addr, 0, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = htonl(INADDR_ANY);
    serv_addr.sin_port = htons(PORT);
    bind(serv_fd, (struct sockaddr*)&serv_addr, sizeof(serv_addr));

    // 3. 监听
    listen(serv_fd, 5);
    printf("TCP Server listening on port %d...\n", PORT);

    // 4. 接收连接
    clnt_addr_size = sizeof(clnt_addr);
    clnt_fd = accept(serv_fd, (struct sockaddr*)&clnt_addr, &clnt_addr_size);
    printf("Client connected: %s\n", inet_ntoa(clnt_addr.sin_addr));

    // 5. 通信
    ssize_t len = recv(clnt_fd, buffer, sizeof(buffer)-1, 0);
    buffer[len] = '\0';
    printf("Received: %s\n", buffer);
    send(clnt_fd, "Hello Client!", 13, 0);

    // 6. 关闭
    close(clnt_fd);
    close(serv_fd);
    return 0;
}
```

#### TCP 客户端 (Client)
```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <arpa/inet.h>

#define PORT 8888

int main() {
    int sock_fd;
    struct sockaddr_in serv_addr;
    char buffer[1024];

    // 1. 创建套接字
    sock_fd = socket(AF_INET, SOCK_STREAM, 0);

    // 2. 配置服务端地址
    memset(&serv_addr, 0, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = inet_addr("127.0.0.1");
    serv_addr.sin_port = htons(PORT);

    // 3. 连接
    if (connect(sock_fd, (struct sockaddr*)&serv_addr, sizeof(serv_addr)) < 0) {
        perror("Connect failed");
        return 1;
    }

    // 4. 发送并接收
    send(sock_fd, "Hello Server!", 13, 0);
    ssize_t len = recv(sock_fd, buffer, sizeof(buffer)-1, 0);
    buffer[len] = '\0';
    printf("Server reply: %s\n", buffer);

    // 5. 关闭
    close(sock_fd);
    return 0;
}
```

### 6.2 UDP 示例

#### UDP 服务端 (Server/Receiver)
```c
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>

#define PORT 9999

int main() {
    int sock_fd = socket(AF_INET, SOCK_DGRAM, 0);
    struct sockaddr_in serv_addr, clnt_addr;
    socklen_t clnt_size = sizeof(clnt_addr);
    char buffer[1024];

    memset(&serv_addr, 0, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = htonl(INADDR_ANY);
    serv_addr.sin_port = htons(PORT);

    bind(sock_fd, (struct sockaddr*)&serv_addr, sizeof(serv_addr));
    printf("UDP Server waiting on port %d...\n", PORT);

    // 接收数据并获取客户端地址
    ssize_t len = recvfrom(sock_fd, buffer, sizeof(buffer)-1, 0, (struct sockaddr*)&clnt_addr, &clnt_size);
    buffer[len] = '\0';
    printf("UDP Received from %s: %s\n", inet_ntoa(clnt_addr.sin_addr), buffer);

    // 响应客户端
    sendto(sock_fd, "ACK", 3, 0, (struct sockaddr*)&clnt_addr, clnt_size);

    close(sock_fd);
    return 0;
}
```

#### UDP 客户端 (Client/Sender)
```c
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>

#define PORT 9999

int main() {
    int sock_fd = socket(AF_INET, SOCK_DGRAM, 0);
    struct sockaddr_in serv_addr;
    char buffer[1024];
    socklen_t serv_size = sizeof(serv_addr);

    memset(&serv_addr, 0, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = inet_addr("127.0.0.1");
    serv_addr.sin_port = htons(PORT);

    // 发送数据
    sendto(sock_fd, "Hello UDP Server!", 17, 0, (struct sockaddr*)&serv_addr, serv_size);

    // 接收服务端响应
    ssize_t len = recvfrom(sock_fd, buffer, sizeof(buffer)-1, 0, (struct sockaddr*)&serv_addr, &serv_size);
    buffer[len] = '\0';
    printf("Server response: %s\n", buffer);

    close(sock_fd);
    return 0;
}
```

---

## 7. 结语

Socket 编程是深入理解网络协议的第一步。本文介绍的是同步阻塞式的基本 API，在实际开发中，通常需要结合 **I/O 多路复用 (select/poll/epoll)** 来处理高并发连接。