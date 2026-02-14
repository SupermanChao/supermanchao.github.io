# 多播和广播

> 📅 发布时间：2018-01-23
>
> 🏷️ 标签：`多播` `广播`
>
> ⏱️ 阅读时长：约 10 分钟

> 单播用于两个主机之间的端对端通信，但平时开发中有这样的场景，要向一组 N 个主机发送相同的数据，如果基于 TCP 提供服务器，则需要维护 N 个套接字连接，即使使用 UDP 套接字提供服务器，也需要 N 次的数据发送。像这样，向大量客户端发送相同数据时，也会对服务器端和网络流量产生负面影响，可以使用多播和广播技术解决该问题。

前面几篇文章讲解了有关 TCP 套接字和 UDP 套接字通信代码及原理，今天在 UDP 套接字通信的基础上探讨下广播和多播相关。

## 1、三种通信方式对比

在 IP 网络中，根据接收者的数量和类型，通信方式主要分为以下三种：

| 特性 | 单播 (Unicast) | 广播 (Broadcast) | 多播 (Multicast) |
| :--- | :--- | :--- | :--- |
| **接收者** | 单个特定主机 | 网段内所有主机 | 加入特定组的所有主机 |
| **目的地址** | 特定主机 IP | 广播地址（如 255.255.255.255） | D 类 IP (224.0.0.0~239.255.255.255) |
| **网络负载** | 随客户端数量线性增加 | 较高，即便不感兴趣的主机也会收到 | 较低，数据在路由节点才进行复制 |
| **应用场景** | 网页浏览、文件传输 | 路由发现、DHCP | 视频会议、股票行情推送 |

## 2、多播 (Multicast)

多播也叫组播，传输数据是基于 UDP 完成的。区别在于 UDP 单播只能向单一目的地址传输，而多播数据可以同时传递到加入（注册）特定组的多个主机。

### 2.1 多播传输数据特点：

- 多播发送者针对特定的多播组织发送一次数据
- 加入特定组的接收者都可以收到多播数据

### 2.2 多播地址：

多播地址是 D 类 IP 地址：224.0.0.0~239.255.255.255，并被划分为局部链接多播地址、预留多播地址和管理权限多播地址三类。

- **局部链接多播地址**：224.0.0.0~224.0.0.255，这是为路由协议和其它用途保留的地址，路由器并不转发属于此范围的 IP 包。
- **预留多播地址**：224.0.1.0~238.255.255.255，可用于全球范围（如 Internet）或网络协议。
- **管理权限多播地址**：239.0.0.0~239.255.255.255，可供组织内部使用，类似于私有 IP 地址，不能用于 Internet，可限制多播范围。

> **补充：多播 MAC 地址映射**
> 在以太网传输时，多播 IP 地址会映射到一个特定的 MAC 地址前缀 `01:00:5e`。具体的映射规则是将 IP 地址的低 23 位放入 MAC 地址的低 23 位中。

### 2.3 组管理协议：IGMP

多播的实现离不开 **IGMP (Internet Group Management Protocol)**。

- **作用**：它是主机与本地路由器之间运行的协议。主机通过 IGMP 通知路由器它想加入或离开某个多播组。
- **原理**：路由器会定期发送 IGMP 查询消息，了解网段内哪些组还有成员。只要网段内还有一个主机在组内，路由器就会继续向该网段转发该组的多播流。

### 2.4 多播传输原理：

多播是基于 UDP 套接字传输数据的基础完成，数据包格式与前面讲到的 UDP 数据包相同，以前的传输数据包的地址改成多播地址，向网络传递一个多播数据包时，路由器将复制该数据包并传递到多个主机，多播的传输需要借助路由器完成，正是由于这样的特性，大大节省了网络流量，减少了占用带宽，同时也减少了发送端的重复无用的工作，多播主要用于“多媒体数据的实时传输”。

要实现多播通信，要求介于多播源和接收者之间的路由器、集线器、交换机以及主机均需支持 IP 多播。目前，IP 多播技术已得到硬件、软件厂商的广泛支持。

多播可以跨网传输，传输流程如下：

![组播传输流程.jpg](./4322526-dd5d7eb8e78efae3.webp)

### 2.5 多播实现：

有关多播的实现需要设置 UDP 套接字的一些可选项。

| **IPPROTO_IP** 选项名 | 说明                                 | 数据类型       |
| --------------------- | ------------------------------------ | -------------- |
| IP_MULTICAST_TTL      | 生存时间(Time To Live)，组播传送距离 | int            |
| IP_ADD_MEMBERSHIP     | 加入组播                             | struct ip_mreq |
| IP_DROP_MEMBERSHIP    | 离开组播                             | struct ip_mreq |
| IP_MULTICAST_IF       | 获取默认接口或设置接口               | int            |
| IP_MULTICAST_LOOP     | 组播数据回送，缺省默认回送           | int            |

#### 2.5.1 多播发送端

发送端为了实现多播的传递，必须设置 TTL。TTL 是 Time to Live 的简写，是控制“数据包传递距离”的主要因素。TTL 每经过一个路由器就减一，变为 0 时数据包被销毁。

TTL 的典型阈值含义：
- **0** : 限定在同一主机
- **1** : 限定在同一子网
- **32** : 限定在同一站点
- **64** : 限定在同一地区
- **128** : 限定在同一洲
- **255** : 范围不受限制

![TTL和多播路由.jpg](./4322526-37c81e25052238c4.webp)

**发送端代码示例：**

```c
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <errno.h>

int createMulticastSender(char* ip, uint16_t port);

int main(int argc, const char * argv[]) {

    char *ip = "239.145.145.145";
    uint16_t port = 9190;

    if (createMulticastSender(ip, port) == 0) {
        printf("开启多播发送端失败\n");
    }
    return 0;
}

#pragma mark ---开启多播发送端
int createMulticastSender(char* ip, uint16_t port)
{
    int sock;
    struct sockaddr_in mAddr;

    mAddr.sin_len = sizeof(mAddr);
    mAddr.sin_family = AF_INET;
    mAddr.sin_port = htons(port);
    mAddr.sin_addr.s_addr = inet_addr(ip);

    sock = socket(AF_INET, SOCK_DGRAM, 0);

    int opval = 64;
    if (setsockopt(sock, IPPROTO_IP, IP_MULTICAST_TTL, &opval, sizeof(opval)) == -1) {
        printf("设置多播的生命周期失败 code:%d description:%s\n",errno,strerror(errno));
        return 0;
    }
    /*
    //禁止组播回送
    int loop = 0;
    if (setsockopt(sock, IPPROTO_IP, IP_MULTICAST_LOOP, &loop, sizeof(loop)) == -1) {
        printf("禁止组播数据回送失败 code:%d description:%s\n",errno,strerror(errno));
    }
    */
    char *buffer = "Hello, World!";
    ssize_t buffer_len = strlen(buffer);
    while (1) {
        ssize_t sendLen = sendto(sock, buffer, buffer_len, 0, (struct sockaddr*)&mAddr, mAddr.sin_len);
        if (sendLen == buffer_len) {
            printf("成功多播 %zd 字节数据\n",sendLen);
        }else if (sendLen  == -1) {
            printf("多播失败  code:%d description:%s\n",errno,strerror(errno));
            break;
        }else {
            printf("多播数据不对 需要发送字节数为 %lu 字节，而实际发送 %zd 字节\n",sizeof(buffer),sendLen);
        }
        sleep(2);
    }

    printf("关闭多播发送端\n");
    close(sock);
    return 1;
}
```

#### 2.5.2 多播接收端

加入多播组也要通过设置 UDP 套接字的相关参数完成。

**接收端代码示例：**

```c
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <errno.h>

int createMulticastReceiver(char* ip, uint16_t port);

int main(int argc, const char * argv[]) {

    char *ip = "239.145.145.145";
    uint16_t port = 9190;

    if (createMulticastReceiver(ip, port) == 0) {
        printf("开启多播接收端失败\n");
    }
    return 0;
}

#pragma mark ---开启多播接收端
int createMulticastReceiver(char* ip, uint16_t port)
{
    int sock;
    struct sockaddr_in addr,peerAddr;
    memset(&peerAddr, 0, sizeof(peerAddr));
    memset(&addr, 0, sizeof(addr));
    struct ip_mreq join_adr;

    addr.sin_len = sizeof(addr);
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);
    addr.sin_addr.s_addr = htonl(INADDR_ANY);

    sock = socket(AF_INET, SOCK_DGRAM, 0);
    if (bind(sock, (struct sockaddr*)&addr, sizeof(addr)) == -1) {
        printf("绑定多播地址失败 code:%d description:%s\n",errno,strerror(errno));
        return 0;
    }

    join_adr.imr_interface.s_addr = htonl(INADDR_ANY);
    join_adr.imr_multiaddr.s_addr = inet_addr(ip);
    if (setsockopt(sock, IPPROTO_IP, IP_ADD_MEMBERSHIP, &join_adr, sizeof(join_adr)) == -1) {
        printf("加入组播失败 code:%d description:%s\n",errno,strerror(errno));
        return 0;
    }

    printf("准备工作完成，开始接收组播\n");
    char buffer[64];
    while (1) {
        memset(buffer, 0, sizeof(buffer));
        ssize_t recvLen = recvfrom(sock, buffer, sizeof(buffer), 0, (struct sockaddr*)&peerAddr, 0);
        if (recvLen > 0) {
            printf("peer IP:%s  peer Port:%d  buffer:%s\n",inet_ntoa(peerAddr.sin_addr),ntohs(peerAddr.sin_port),buffer);
            if (buffer[0] == 'C') break;
        }else {
            printf("接收多播错误 code:%d description:%s\n",errno,strerror(errno));
            break;
        }
    }

    printf("准备离开组播组\n");
    if (setsockopt(sock, IPPROTO_IP, IP_DROP_MEMBERSHIP, &join_adr, sizeof(join_adr)) == -1) {
        printf("离开组播失败 code:%d description:%s\n",errno,strerror(errno));
    }

    printf("关闭多播接收端\n");
    close(sock);
    return 1;
}
```

## 3、广播 (Broadcast)

广播的数据传输和多播相似，广播是一次性向网络内的所有主机发送数据，并且只能在局域网内传播，而不能跨网传播，广播也是基于 UDP 套接字传输数据实现。

### 3.1 广播分类

根据广播的地址不同，分为直接广播 (Directed Broadcast) 和本地广播 (Local Broadcast)。

- **直接广播**：广播的 IP 地址除了网络号外，其余主机地址位全部设置为 1。例如向 192.168.1.0 网络发送广播，地址为 192.168.1.255。
- **本地广播**：本地广播的 IP 地址是 255.255.255.255，向该主机所在网络的所有主机发送广播数据。

### 3.2 广播实现

有关广播的实现需要设置 UDP 套接字的相关选项。

| **SOL_SOCKET** 选项名 | 说明                                     | 数据类型 |
| --------------------- | ---------------------------------------- | -------- |
| SO_BROADCAST           | 允许或禁止发送广播数据(1 启用，0 不启用) | int      |

#### 3.2.1 广播发送端

要实现广播的发送必须设置允许广播可选项。

**发送端代码示例：**
```c
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <errno.h>

int createBroadcastSender(char* ip, uint16_t port);

int main(int argc, const char * argv[]) {

    char *ip = "255.255.255.255";
    uint16_t port = 9190;

    if (createBroadcastSender(ip, port) == 0) {
        printf("开启广播发送端失败\n");
    }
    return 0;
}

#pragma mark ---开启广播发送端
int createBroadcastSender(char* ip, uint16_t port)
{
    int sock;
    struct sockaddr_in bAddr;
    memset(&bAddr, 0, sizeof(bAddr));

    bAddr.sin_len = sizeof(bAddr);
    bAddr.sin_family = AF_INET;
    bAddr.sin_port = htons(port);
    bAddr.sin_addr.s_addr = inet_addr(ip);

    sock = socket(AF_INET, SOCK_DGRAM, 0);

    int opval = 1;
    if (setsockopt(sock, SOL_SOCKET, SO_BROADCAST, &opval, sizeof(opval)) == -1) {
        printf("启用广播失败 code:%d description:%s\n",errno,strerror(errno));
        return 0;
    }

    char *buffer = "Hello, World!";
    ssize_t buffer_len = strlen(buffer);
    while (1) {
        ssize_t sendLen = sendto(sock, buffer, buffer_len, 0, (struct sockaddr*)&bAddr, sizeof(bAddr));
        if (sendLen == buffer_len) {
            printf("成功广播 %zd 字节数据\n",sendLen);
        }else if (sendLen  == -1) {
            printf("广播失败  code:%d description:%s\n",errno,strerror(errno));
            break;
        }else {
            printf("广播数据不对 需要发送字节数为 %lu 字节，而实际发送 %zd 字节\n",sizeof(buffer),sendLen);
        }
        sleep(5);
    }

    printf("关闭广播发送端\n");
    close(sock);
    return 1;
}
```

#### 3.2.2 广播接收端

**接收端代码示例：**

```c
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <errno.h>

int createBroadcastReceiver(uint16_t port);

int main(int argc, const char * argv[]) {

    uint16_t port = 9190;
    if (createBroadcastReceiver(port) == 0) {
        printf("开启广播接收端失败\n");
    }
    return 0;
}

#pragma mark ---开启广播接收端
int createBroadcastReceiver(uint16_t port)
{
    int sock;
    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));

    addr.sin_len = sizeof(addr);
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);
    addr.sin_addr.s_addr = htonl(INADDR_ANY);

    sock = socket(AF_INET, SOCK_DGRAM, 0);
    if (bind(sock, (struct sockaddr*)&addr, sizeof(addr)) == -1) {
        printf("绑定广播地址失败 code:%d description:%s\n",errno,strerror(errno));
        return 0;
    }

    printf("准备工作完成，开始接收广播\n");
    char buffer[64];
    while (1) {
        memset(buffer, 0, sizeof(buffer));
        ssize_t recvLen = recvfrom(sock, buffer, sizeof(buffer), 0, NULL, 0);
        if (recvLen > 0) {
            printf("buffer: %s\n",buffer);
            if (buffer[0] == 'C') break;
        }else {
            printf("接收广播错误 code:%d description:%s\n",errno,strerror(errno));
            break;
        }
    }

    printf("关闭广播接收端\n");
    close(sock);
    return 1;
}
```

## 4、结语

关于广播和多播部分的实现很简单，都是基于 UDP 套接字。
