# 套接字(Socket)编程(三) 套接字可选项

> 📅 发布时间：2018-01-13
>
> 🏷️ 标签：`Socket` `TCP` `UDP`
>
> ⏱️ 阅读时长：约 15 分钟

> 套接字具有多种特性，这些特性可以通过可选项（Options）进行更改。本篇文章将介绍更改套接字可选项的方法，并以此为基础进一步观察套接字内部的工作机制。

前面介绍了套接字通信的基本函数 [《套接字(Socket)编程(一) 函数概念篇》](./2017-12-25-套接字(Socket)编程(一) 函数概念篇/README.md) 和通信原理 [《套接字(Socket)编程(二) 内部通信原理》](./2018-01-02-套接字(Socket)编程(二)内部通信原理/README.md)。

通常我们创建好套接字后直接使用，此时套接字采用的是系统默认特性。但在复杂的生产环境下（如处理高并发、异常断连或网络优化时），往往需要手动更改这些可选项。

---

## 1. 套接字可选项的协议层

套接字可选项是分层的，不同的协议层对应不同的配置范围：

| **协议层** | **功能** |
| :--- | :--- |
| **SOL_SOCKET** | 套接字通用可选项的设置 |
| **IPPROTO_IP** | IP 层的相关属性设置 |
| **IPPROTO_TCP** | TCP 层的协议属性设置 |

### 1.1 常用可选项列表

#### SOL_SOCKET 层 (通用选项)
| 选项名 | 说明 | 数据类型 |
| :--- | :--- | :--- |
| **SO_KEEPALIVE** | 开启 TCP 保活检测机制 | int (bool) |
| **SO_REUSEADDR** | 是否启用地址重用（主要用于快速重启服务器） | int (bool) |
| **SO_LINGER** | 控制 `close()` 的关闭行为（延迟关闭或强制复位） | struct linger |
| **SO_RCVBUF** | 输入缓冲区大小 | int |
| **SO_SNDBUF** | 输出缓冲区大小 | int |
| **SO_RCVTIMEO** | 接收数据的超时时间 | struct timeval |
| **SO_SNDTIMEO** | 发送数据的超时时间 | struct timeval |
| **SO_TYPE** | 获取套接字类型 (如 SOCK_STREAM/SOCK_DGRAM) | int (只读) |

#### IPPROTO_TCP 层 (TCP 特有选项)
| 选项名 | 说明 | 数据类型 |
| :--- | :--- | :--- |
| **TCP_KEEPALIVE** | 保活探测的空闲间隔时间 (macOS/iOS 特有名) | int |
| **TCP_KEEPINTVL** | 探测包重发的时间间隔 | int |
| **TCP_KEEPCNT** | 探测包无响应的最大重发次数 | int |
| **TCP_NODELAY** | 禁用 Nagle 算法（适用于对实时性要求极高的场景） | int (bool) |

---

## 2. 核心 API：getsockopt & setsockopt

这两个函数是操作可选项的唯一入口：

```c
#include <sys/socket.h>

// 获取选项值
int getsockopt(int sock, int level, int optname, void *optval, socklen_t *optlen);

// 设置选项值
int setsockopt(int sock, int level, int optname, const void *optval, socklen_t optlen);
```
**返回值**：成功返回 0，失败返回 -1。

---

## 3. 重点应用举例

### 3.1 SO_KEEPALIVE (TCP 保活检测)

**背景**：TCP 连接中，如果对端由于断电、网线拔出等异常情况掉线，本端无法通过正常的四次挥手感知。

**保活原理**：
开启后，如果连接在 `TCP_KEEPALIVE`（默认 2 小时）内没有数据往来，系统会自动发送一个探测包：
1. 若对方回复 ACK，表示连接正常。
2. 若对方无响应，按 `TCP_KEEPINTVL` 间隔重试 `TCP_KEEPCNT` 次。
3. 若仍无响应，系统判定连接死亡，后续 `recv` 会返回超时错误。

```c
#include <netinet/tcp.h>

void setupKeepAlive(int fd) {
    int on = 1;
    // 1. 开启机制
    setsockopt(fd, SOL_SOCKET, SO_KEEPALIVE, &on, sizeof(on));
    
    // 2. 设置空闲 10s 后开始探测 (iOS/macOS 使用 TCP_KEEPALIVE)
    int idle = 10;
    setsockopt(fd, IPPROTO_TCP, TCP_KEEPALIVE, &idle, sizeof(idle));
    
    // 3. 设置重试间隔为 5s，最多重试 3 次
    int interval = 5;
    int count = 3;
    setsockopt(fd, IPPROTO_TCP, TCP_KEEPINTVL, &interval, sizeof(interval));
    setsockopt(fd, IPPROTO_TCP, TCP_KEEPCNT, &count, sizeof(count));
}
```
> **实战建议**：移动端网络环境不稳定，运营商链路可能随时回收，建议在应用层辅以业务心跳包。

### 3.2 SO_REUSEADDR (地址重用)

**背景**：主动关闭连接的一方会进入 `TIME-WAIT` 状态（通常 2-4 分钟），此时尝试重启并 `bind` 相同端口会报错 `Address already in use`。

**作用**：设置此项后，服务器可以立即重启并重新绑定处于 `TIME-WAIT` 状态的地址。

```c
int opt = 1;
setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
```

### 3.3 SO_LINGER (延迟/强制关闭)

**作用**：控制 `close()` 函数的行为。

- **默认情况**：`close()` 立即返回，数据异步发送。
- **配置 `l_onoff=1, l_linger=5`**：`close()` 会阻塞最多 5s，直到缓冲区数据发送完毕并收到 ACK。
- **配置 `l_onoff=1, l_linger=0`**：强制关闭，不发送 FIN 而是发送 **RST** 信号，立即丢弃缓冲区数据。这会导致对端收到 "Connection reset by peer" 错误。

```c
struct linger so_linger;
so_linger.l_onoff = 1;
so_linger.l_linger = 5; 
setsockopt(sock, SOL_SOCKET, SO_LINGER, &so_linger, sizeof(so_linger));
```

### 3.4 读写超时设置 (SO_RCVTIMEO / SO_SNDTIMEO)

这在 UDP 通信或不使用 `select/poll` 的简单 TCP 客户端中非常有用，可以防止程序永久阻塞在 `recv` 上。

```c
struct timeval timeout = {5, 0}; // 5秒
setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof(timeout));
```

### 3.5 缓冲区大小 (SO_RCVBUF / SO_SNDBUF)

**注意**：设置缓冲区大小时，内核往往会将其值翻倍，以预留一部分空间处理报文头等额外开销。

```c
int size = 1024 * 128; // 128KB
setsockopt(sock, SOL_SOCKET, SO_SNDBUF, &size, sizeof(size));
```

### 3.6 TCP_NODELAY (禁用 Nagle 算法)

**Nagle 算法**：通过延迟发送小包（等待 ACK 或攒够足够数据）来减少网络包数量，提高带宽利用率。

但在某些场景下（如网络游戏、实时控制、交互式 SSH），Nagle 算法会导致明显的指令延迟。此时应禁用它：

```c
int nodelay = 1;
setsockopt(sock, IPPROTO_TCP, TCP_NODELAY, &nodelay, sizeof(nodelay));
```

---

## 4. 结语

掌握套接字可选项，意味着你从“只会创建连接”迈向了“能够掌控连接”。在实际 iOS 开发中，虽然大部分场景可以通过三方库处理，但当遇到复杂的网络层 Bug 或协议优化时，这些底层参数的调整能力将是你的核心竞争力。