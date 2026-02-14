# 玩转流媒体服务器

> 📅 发布时间：2025-06-25
>
> 🏷️ 标签：`音视频` `流媒体` `推流` `拉流` `MediaMTX`
>
> ⏱️ 阅读时长：约 40 分钟

## 1. 视频推流与拉流技术指南

### 1.1 核心概念：推流与拉流

- **推流**：将实时的音视频数据从源头 ​（如摄像头、麦克风、屏幕、视频文件）​ 编码、封装并通过网络协议持续发送到流媒体服务器的过程。

- **拉流**：​ 播放端 ​（如网页播放器、手机 App、智能电视）​ 从流媒体服务器请求并接收音视频数据流，然后解码、渲染播放的过程

- **流媒体服务器**：这是整个流程的核心枢纽。它负责：
  - 接收来自各种来源的推流。
  - ​ 处理流（可能进行转码、转封装、录制、鉴权等）。
  - ​ 分发流给大量的拉流客户端。
  - 常见的开源流媒体服务器：Nginx with RTMP module, SRS, Janus Gateway (WebRTC), MediaSoup (WebRTC), Ant Media Server, Wowza (商业), Red5 等。

### 1.2 实现流程与技术栈

#### 1.2.1 推流端实现

##### 1.2.1.1 编码

- 目的：​​ 将原始的音视频数据（如 YUV/RGB 视频，PCM 音频）压缩成更小的数据量，以适应网络传输。这是计算密集型操作。
- 常用编码标准：​​
  - 视频：​​ H.264/AVC (最广泛兼容), H.265/HEVC (更高压缩率，需硬件支持), VP8, VP9, AV1 (新兴，压缩率高，专利免费)。
  - 音频：​​ AAC (最广泛), Opus (低延迟，WebRTC 常用), MP3。
- 工具/库：
  - FFmpeg：​​ ​ 绝对的主力！​​ 命令行工具和库，功能极其强大，几乎涵盖所有音视频处理操作（采集、编码、封装、推流等）。Java 可以通过 ProcessBuilder 调用命令行，或使用 JavaCV (对 FFmpeg 的 Java 封装)。
  - 硬件编码：​​ 利用 GPU (如 NVIDIA NVENC, AMD AMF, Intel Quick Sync Video) 或专用芯片进行编码，大幅降低 CPU 负载，提高性能。FFmpeg 通常支持调用硬件编码器。
  - ​ 软件编码库：​​ x264 (H.264 软件编码器), x265 (H.265 软件编码器), libvpx (VP8/VP9), libopus。FFmpeg 内部会调用这些库。
  - Java 库：​​ Xuggler (基于 FFmpeg，但较老且维护少), JavaCV (推荐，活跃度高，功能强)。纯 Java 编码库性能通常不如 C/C++ 库。

##### 1.2.1.2 封装

- 目的：​​ 将编码后的视频轨和音频轨数据，加上一些元信息（如分辨率、帧率、编码格式、时间戳），打包成一个连续的、适合流式传输的文件格式。
- 常用流式封装格式：​​
  - FLV：​​ Adobe Flash 时代的产物，RTMP 常用，逐渐被淘汰。
  - ​TS：​​ MPEG Transport Stream。HLS 协议强制使用。
  - MP4：​​ Fragmented MP4。常用于 HLS (作为分片格式) 和 MPEG-DASH。
  - WebM：​​ 基于 Matroska，常用于 VP8/VP9 视频和 Opus 音频（WebRTC）。
- 工具：​​ FFmpeg 同样擅长封装。

##### 1.2.1.3 传输 (推流协议)

- 目的：​​ 将封装好的音视频数据包，通过网络发送到流媒体服务器。选择协议要考虑延迟、防火墙穿透、兼容性等因素。
- 常用推流协议：​​
  - RTMP：
    - ​ 基于 TCP，端口 1935。​​ 曾是直播行业标准，延迟相对较低 (1-3 秒)。
    - 优点：​​ 成熟、稳定、广泛支持（编码器、服务器、早期播放器）。
    - 缺点：​​ 基于 Flash 遗产，原生 HTML5 不支持（需转协议或 Flash 播放器），防火墙穿透有时有问题（非 HTTP/HTTPS）。
    - 地址格式：​​ `rtmp://server-ip:1935/app-name/stream-key` (其中 `stream-key` 是服务器用于区分不同流的密钥)。
  - RTSP：
    - 控制信令：通常基于 TCP（端口 554）传输，用于发送控制命令（如 DESCRIBE, SETUP, PLAY, PAUSE, TEARDOWN）。
    - 媒体数据：实际音视频流通过 RTP 协议传输，通常基于 UDP（动态端口）或 TCP 传输（此时 RTP 数据通过 RTSP 隧道传输）。
    - 优点：
      - ​ 精准控制 ​：支持播放、暂停、跳转（NPT）等操作，适合视频点播、IP 摄像头控制。
      - ​ 协议分离 ​：控制（RTSP）与数据传输（RTP）分离，可灵活选择传输方式
    - 缺点：
      - 防火墙不友好 ​：动态端口分配需要防火墙开放大量 UDP 端口（或采用 TCP 传输，但增加复杂性）。
      - 无原生 HTML5 支持 ​：浏览器无法直接播放 RTSP 流（需要转码或 JS 插件如 hls.js 不支持）。
      - ​ 协议复杂 ​：需完整实现 RTSP 状态机（OPTIONS, DESCRIBE, SETUP, PLAY, TEARDOWN 等交互）。
    - 地址格式：`rtsp://[username]:[password]@[ip]:[port]/[path]`，用户名密码可选，路径取决于设备厂商
  - SRT：​​
    - 新兴协议，基于 UDP，但提供可靠或尽力而为的传输。
    - 优点：​​ 抗网络抖动和丢包能力强，安全性好（内置 AES 加密），开源。
    - 缺点：​​ 相对较新，生态支持不如 RTMP 广泛（但增长迅速）。
  - WebRTC：​​
    - 主要设计用于实时通信（P2P 延迟极低 <1s），但也可用于推流到服务器（称为 “WHIP” 或类似技术）。
    - 优点：​​ 超低延迟，原生浏览器支持，强加密。
    - 缺点：​​ 服务器端实现相对复杂，大规模分发成本可能更高（常需配合其他协议如 RTMP 或 HLS 做二次分发）。
  - RIST：​​ 类似 SRT，旨在标准化安全可靠的视频传输。
  - 基于 HTTP 的协议 (较少用于纯推流)：​​ 如 HLS 上传分片，但延迟高，通常不用于实时推流。
- 工具：​​
  - FFmpeg：​​ 支持推流到 RTMP、SRT、HLS (上传分片) 等服务器。
  - OBS Studio：​​ 流行的开源直播软件，内部使用 FFmpeg/x264，支持 RTMP、SRT 推流。
  - 硬件编码器：​​ 很多设备自带 RTMP 推流功能。
  - 客户端 SDK：​​ 各大云服务商（阿里云、腾讯云、AWS、Azure）提供 SDK，方便集成推流功能到 App 中。

#### 1.2.2 流媒体服务器端

##### 1.2.2.1 接收

监听特定端口（如 RTMP 1935, SRT 的 UDP 端口），接收来自推流客户端的连接和数据。

##### 1.2.2.2 处理

- 转码/转封装：​​ 将输入的流（如 RTMP FLV）转换成其他协议和格式（如 HLS TS）以适应不同播放端。可能需要改变编码格式（如 H.264 转 H.265）、分辨率、码率等。非常消耗资源。
- 录制：​​ 将直播流保存为文件（如 MP4, FLV）。
- ​ 时移：​​ 允许用户回看过去一段时间的内容。
- ​ 鉴权：​​ 验证推流端（stream key）和拉流端（token, referer）的合法性。
- 协议转换：​​ 例如，接收 RTMP 推流，同时提供 HLS 和 RTMP 拉流地址。

##### 1.2.2.3 分发

将处理后的流通过不同的协议分发给拉流客户端。服务器需要高效处理大量并发连接。

##### 1.2.2.4 集群与 CDN

对于大规模应用，需要多台服务器组成集群，并利用 CDN 进行边缘分发，降低源服务器压力和用户访问延迟。

#### 1.2.3 拉流端实现

##### 1.2.3.1 请求

播放器向流媒体服务器请求播放指定的流。需要知道流的访问地址（URL）。

##### 1.2.3.2 传输 (拉流协议)

- ​HLS：​​
  - 基于 HTTP，端口 80/443。​​ 苹果公司提出，现已成为 HTML5 直播的事实标准。
  - 原理：​​ 将流切割成一系列小的 .ts 视频分片文件，并用一个 .m3u8 播放列表索引文件来描述这些分片。播放器按顺序下载并播放分片。
  - 优点：​​ 防火墙穿透性好（HTTP），自适应码率（通过不同码率的 m3u8 文件实现），HTML5 原生支持（`<video>` 标签）。
  - 缺点：​​ 延迟相对较高（通常 10-30 秒或更高，低延迟优化方案可降至几秒）。
  - 地址格式：​​ `http(s)://server-ip/path/to/your/stream.m3u8`
- MPEG-DASH：​​
  - 基于 HTTP。​​ 类似 HLS 的国际标准。
  - 原理：​​ 使用 .mpd 清单文件和媒体分片（通常是 fMP4）。
  - 优点：​​ 标准开放，自适应码率能力优秀。
  - 缺点：​​ 原生浏览器支持略晚于 HLS（现在主流浏览器基本都支持），生态略小于 HLS。
- RTMP：​​
  - 也可用于拉流（尤其在 Flash 时代）。
  - 优点：​​ 延迟低。
  - ​ 缺点：​​ HTML5 原生不支持，需要 Flash 或第三方 JS 播放器（如 hls.js 也支持 RTMP via Flash 后备，但 Flash 已淘汰）。逐渐被淘汰。
- WebRTC：
  - 用于拉流时，能实现超低延迟（<1s）。
  - 优点：​​ 超低延迟，原生浏览器支持。
  - 缺点：​​ 服务器实现复杂，大规模分发成本高，通常用于互动性强的场景（连麦、监控）。
- HTTP-FLV：​​
  - 将 FLV 封装在 HTTP 长连接上传输。
  - 优点：​​ 延迟比 HLS 低（可做到 1-3 秒），兼容部分播放器。
  - 缺点：​​ 非标准协议，原生 HTML5 不支持（需 JS 播放器如 flv.js）。

##### 1.2.3.3 解码

播放器下载到数据后，使用解码器（如浏览器内置的 MediaSource Extensions, 移动端 MediaCodec/VideoToolbox, 桌面端 FFmpeg）将压缩的音视频数据还原成原始数据。

##### 1.2.3.4 渲染

将解码后的视频帧绘制到屏幕，音频数据输出到扬声器。

## 2. 开箱即用的网关服务

推荐网关解决方案: ​MediaMTX (原 rtsp-simple-server)​​

_MediaMTX_ 是一个开箱即用、零依赖的实时媒体服务器和媒体代理，支持发布、读取、代理、录制和回放音视频流。它被设计为一个“媒体路由器”，可将媒体流从一端路由到另一端

### 2.1 协议支持

- ​ 官网: [https://github.com/bluenviron/mediamtx](https://github.com/bluenviron/mediamtx)
- ​ 特点 ​：
  - ​ 协议互转 ​
    - 输入支持：RTSP、RTMP、SRT、WebRTC（WHIP）
    - 输出支持：WebRTC（WHEP）、RTMP、HLS、RTSP
    - 低延迟优化 ​：WebRTC 延迟可控制在 500ms 内，优于 HLS（2-10 秒）和 RTMP（1-3 秒）
  - 提供 REST API/Java SDK 管理流
  - 单文件部署，资源占用低
  - 支持集群模式

直播流可以通过以下协议推送到服务器：

| 协议                                             | 变体                                  | 视频编码                                                                                       | 音频编码                                                                                                    |
| ------------------------------------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [SRT 客户端](#srt-clients)                       |                                       | H265, H264, MPEG-4 视频 (H263, Xvid), MPEG-1/2 视频                                            | Opus, MPEG-4 音频 (AAC), MPEG-1/2 音频 (MP3), AC-3                                                          |
| [SRT 摄像头和服务器](#srt-cameras-and-servers)   |                                       | H265, H264, MPEG-4 视频 (H263, Xvid), MPEG-1/2 视频                                            | Opus, MPEG-4 音频 (AAC), MPEG-1/2 音频 (MP3), AC-3                                                          |
| [WebRTC 客户端](#webrtc-clients)                 | WHIP                                  | AV1, VP9, VP8, [H265](#supported-browsers), H264                                               | Opus, G722, G711 (PCMA, PCMU)                                                                               |
| [WebRTC 服务器](#webrtc-servers)                 | WHEP                                  | AV1, VP9, VP8, [H265](#supported-browsers), H264                                               | Opus, G722, G711 (PCMA, PCMU)                                                                               |
| [RTSP 客户端](#rtsp-clients)                     | UDP, TCP, RTSPS                       | AV1, VP9, VP8, H265, H264, MPEG-4 视频 (H263, Xvid), MPEG-1/2 视频, M-JPEG 及任何 RTP 兼容编码 | Opus, MPEG-4 音频 (AAC), MPEG-1/2 音频 (MP3), AC-3, G726, G722, G711 (PCMA, PCMU), LPCM 及任何 RTP 兼容编码 |
| [RTSP 摄像头和服务器](#rtsp-cameras-and-servers) | UDP, UDP-组播, TCP, RTSPS             | AV1, VP9, VP8, H265, H264, MPEG-4 视频 (H263, Xvid), MPEG-1/2 视频, M-JPEG 及任何 RTP 兼容编码 | Opus, MPEG-4 音频 (AAC), MPEG-1/2 音频 (MP3), AC-3, G726, G722, G711 (PCMA, PCMU), LPCM 及任何 RTP 兼容编码 |
| [RTMP 客户端](#rtmp-clients)                     | RTMP, RTMPS, 增强型 RTMP              | AV1, VP9, H265, H264                                                                           | Opus, MPEG-4 音频 (AAC), MPEG-1/2 音频 (MP3), AC-3, G711 (PCMA, PCMU), LPCM                                 |
| [RTMP 摄像头和服务器](#rtmp-cameras-and-servers) | RTMP, RTMPS, 增强型 RTMP              | AV1, VP9, H265, H264                                                                           | Opus, MPEG-4 音频 (AAC), MPEG-1/2 音频 (MP3), AC-3, G711 (PCMA, PCMU), LPCM                                 |
| [HLS 摄像头和服务器](#hls-cameras-and-servers)   | 低延迟 HLS, 基于 MP4 的 HLS, 传统 HLS | AV1, VP9, [H265](#supported-browsers-1), H264                                                  | Opus, MPEG-4 音频 (AAC)                                                                                     |
| [UDP/MPEG-TS](#udpmpeg-ts)                       | 单播, 广播, 组播                      | H265, H264, MPEG-4 视频 (H263, Xvid), MPEG-1/2 视频                                            | Opus, MPEG-4 音频 (AAC), MPEG-1/2 音频 (MP3), AC-3                                                          |
| [树莓派摄像头](#raspberry-pi-cameras)            |                                       | H264                                                                                           |                                                                                                             |

可以通过以下协议从服务器读取直播流：

| 协议              | 变体                                  | 视频编码                                                                                       | 音频编码                                                                                                    |
| ----------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [SRT](#srt)       |                                       | H265, H264, MPEG-4 视频 (H263, Xvid), MPEG-1/2 视频                                            | Opus, MPEG-4 音频 (AAC), MPEG-1/2 音频 (MP3), AC-3                                                          |
| [WebRTC](#webrtc) | WHEP                                  | AV1, VP9, VP8, [H265](#supported-browsers), H264                                               | Opus, G722, G711 (PCMA, PCMU)                                                                               |
| [RTSP](#rtsp)     | UDP, UDP-组播, TCP, RTSPS             | AV1, VP9, VP8, H265, H264, MPEG-4 视频 (H263, Xvid), MPEG-1/2 视频, M-JPEG 及任何 RTP 兼容编码 | Opus, MPEG-4 音频 (AAC), MPEG-1/2 音频 (MP3), AC-3, G726, G722, G711 (PCMA, PCMU), LPCM 及任何 RTP 兼容编码 |
| [RTMP](#rtmp)     | RTMP, RTMPS, 增强型 RTMP              | H264                                                                                           | MPEG-4 音频 (AAC), MPEG-1/2 音频 (MP3)                                                                      |
| [HLS](#hls)       | 低延迟 HLS, 基于 MP4 的 HLS, 传统 HLS | AV1, VP9, [H265](#supported-browsers-1), H264                                                  | Opus, MPEG-4 音频 (AAC)                                                                                     |

直播流可以被录制和回放：

| 格式                               | 视频编码                                                              | 音频编码                                                                    |
| ---------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [fMP4](#record-streams-to-disk)    | AV1, VP9, H265, H264, MPEG-4 视频 (H263, Xvid), MPEG-1/2 视频, M-JPEG | Opus, MPEG-4 音频 (AAC), MPEG-1/2 音频 (MP3), AC-3, G711 (PCMA, PCMU), LPCM |
| [MPEG-TS](#record-streams-to-disk) | H265, H264, MPEG-4 视频 (H263, Xvid), MPEG-1/2 视频                   | Opus, MPEG-4 音频 (AAC), MPEG-1/2 音频 (MP3), AC-3                          |

### 2.2 部署步骤

1. ​Docker 部署 ​ (推荐)

```bash
docker run -d \
  --name mediamtx \
  -e MTX_WEBRTCADDITIONALHOSTS=192.168.50.55 \
  -v "/home/1panel/apps/mediamtx/mediamtx/config/mediamtx.yml:/mediamtx.yml" \
  -p 8888:8888   # WebRTC/WHEP端口 \
  -p 9997:9997   # API管理接口 \
  -p 8554:8554   # RTSP端口 \
  -p 8889:8889   # webRTC HTTP监听端口 \
  -p 8189:8189/udp # webRTC 数据传输UDP端口 \
  bluenviron/mediamtx:latest
```

2. 二进制文件安装 ​

```bash
./mediamtx  # Linux/macOS
mediamtx.exe # Windows
```

3. 配置文件 (mediamtx.yml)

```yaml
api: yes # 启用API
allowOrigin: "*"
webrtc: yes # 启用WebRTC
```

### 2.3 推流配置

#### 2.3.1 手动在`mediamtx.yml`文件中配置

手动在`mediamtx.yml`中配置输入流，支持不同协议

大多数 IP 摄像头通过其内部嵌入的 RTSP 服务器公开其视频流。 可以使用 _MediaMTX_ 连接到一个或多个现有 RTSP 服务器并读取其视频流：

```yaml
paths:
  proxied: # 自定义流名称
    # 源流的 URL，格式为 rtsp://user:pass@host:port/path
    source: rtsp://original-url
```

若源流是 H.265，需通过 FFmpeg 转码为 H.264（WebRTC 要求 H.264 Baseline Profile）：

```yaml
paths:
  my_stream:
    source: ffmpeg://rtsp://源地址 -c:v libx264 -preset ultrafast -tune zerolatency -f rtsp
```

若要从现有服务器、摄像头或监听模式的客户端（即在 URL 后附加 `mode=listener`）向服务器摄取 SRT 流，请将相应的 URL 添加到路径的 `source` 参数中：

```yaml
paths:
  proxied: # 自定义流名称
    # 源流的 URL，格式为 srt://host:port?streamid=streamid&other_parameters
    source: srt://original-url
```

要从现有服务器摄取 WebRTC 流，请将相应的 WHEP URL 添加到路径的 `source` 参数中：

```yaml
paths:
  proxied: # 自定义流名称
    # 源流的 URL，格式为 whep://host:port/path (HTTP) 或 wheps:// (HTTPS)
    source: wheps://host:port/path
```

可以使用 _MediaMTX_ 连接到一个或多个现有 RTMP 服务器并读取其视频流：

```yaml
paths:
  proxied: # 自定义流名称
    # 源流的 URL，格式为 rtmp://user:pass@host:port/path
    source: rtmp://original-url
```

HLS 是一种流媒体协议，通过将流分割成片段并通过 HTTP 协议提供这些片段和播放列表来工作。 可以使用 _MediaMTX_ 连接到一个或多个现有 HLS 服务器并读取其视频流：

```yml
paths:
  proxied: # 自定义流名称
    # 流的播放列表的 URL，格式为 http://user:pass@host:port/path
    source: http://original-url/stream/index.m3u8
```

服务器支持任意数量的源流（数量仅受可用硬件资源的限制），只需向路径部分添加其他条目即可：

```yaml
paths:
  proxied1: # 自定义流名称
    source: rtsp://url1

  proxied2: # 自定义流名称
    source: rtsp://url1
```

#### 2.3.2 通过 API 接口配置

详情可参考[官方API文档](https://bluenviron.github.io/mediamtx/)

获取全部流路径

```bash
curl http://localhost:9997/v3/config/paths/list

## 返回示例
{
  "pageCount": 0,
  "itemCount": 0,
  "items": [
    {
      "name": "string",
      "source": "string",
      ...
    }
  ]
}
```

动态添加流路径 ​

```bash
## 添加名为"proxied"的RTSP输入流
## ​参数说明​：
##   - source：输入流地址
##   - webrtc：是否启用WebRTC输出
curl -X POST http://localhost:9997/v3/config/paths/add/proxied \
  -H "Content-Type: application/json" \
  -d '{
      "source": "rtsp://admin:zhixing123@192.168.50.64:554/Streaming/Channels/101",
      "webrtc": "yes"
  }'
```

删除流路径​

```bash
## 删除流路径"proxied"
curl -X DELETE http://localhost:9997/v3/config/paths/delete/proxied
```

更新流路径

```bash
## 更新流路径"proxied"
curl -X POST http://localhost:9997/v3/config/paths/patch/proxied
```

热重载配置​

```bash
## 应用配置文件变更（mediamtx.yml修改后生效）
curl -X POST http://localhost:9997/v3/config/reload
  -H "Content-Type: application/json" \
  -d '{
      "source": "rtsp://admin:zhixing123@192.168.50.64:554/Streaming/Channels/101",
      "webrtc": "yes"
  }'
```

获取所有活跃发布者​

```bash
## 查询当前所有推流客户端
curl http://localhost:9997/v3/publishers/list

## ​返回示例​
[{
  "path": "proxied",
  "clientId": "123abc",
  "protocol": "RTSP"
}]
```

强制断开指定客户端​

```bash
## 根据ID断开推流客户端
curl -X POST http://localhost:9997/v3/publishers/kick/123abc
```

全局状态概览​

```bash
## 获取CPU/内存使用率、活跃流数量
curl http://localhost:9997/v3/stats
```

指定流路径详情​

```bash
## 查询流路径"proxied"的订阅者信息
curl http://localhost:9997/v3/paths/get/proxied

## 返回示例
{
  "subscribers": [{
    "protocol": "WebRTC",
    "clientIP": "192.168.1.100"
  }]
}
```

### 2.4 拉流配置

#### 2.4.1 FFmpeg

FFmpeg 可以通过多种方式从服务器读取流（RTSP、RTMP、HLS、WebRTC 与 WHEP、SRT）。 推荐的方式是通过 [RTSP](#RTSP) 读取：

```sh
ffmpeg -i rtsp://localhost:8554/mystream -c copy output.mp4
```

RTSP 协议支持多种底层传输协议，每种协议具有不同的特性，可以使用 `rtsp_transport` 标志设置传输协议：

```sh
ffmpeg -rtsp_transport tcp -i rtsp://localhost:8554/mystream -c copy output.mp4
```

#### 2.4.2 SRT

SRT 是一种允许发布和读取实时数据流的协议，提供加密、完整性和重传机制。它通常用于传输编码为 MPEG-TS 的媒体流。 要使用 SRT 协议从服务器读取流，请使用此 URL：

```
srt://localhost:8890?streamid=read:mystream
```

将 `mystream` 替换为路径名称。

如果启用了凭据，可以通过 `user` 和 `pass` 查询参数将凭据传递给服务器：

```
srt://localhost:8890?streamid=read:mystream:user:pass
```

可以使用 SRT 读取的已知客户端包括 FFmpeg、GStreamer 和 VLC。

#### 2.4.3 WebRTC

WebRTC 是一种 API，它利用一组协议和方法将两个客户端连接在一起，允许它们交换实时媒体或数据流。 可以通过访问以下地址读取流 WebRTC 和网页：

```
http://localhost:8889/mystream
```

WHEP 是一种 WebRTC 扩展，允许通过 URL 读取流，而无需通过网页。 这允许将 WebRTC 用作通用流媒体协议。 如果使用支持 WHEP 的软件，可以通过以下 URL 从服务器读取流：

```
http://localhost:8889/mystream/whep
```

```html
<script>
  class CameraPlayer {
    constructor(videoElement, cameraId) {
      this.video = videoElement;
      this.cameraId = cameraId;
      this.pc = new RTCPeerConnection();

      this.pc.ontrack = (event) => {
        if (event.track.kind === "video") {
          this.video.srcObject = event.streams[0];
        }
      };
    }

    async start() {
      // 创建本地描述
      await this.pc.setLocalDescription(await this.pc.createOffer());

      // 获取网关SDP
      const whepUrl = `http://localhost:8889/${this.cameraId}/whep`;
      const response = await fetch(whepUrl, {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: this.pc.localDescription.sdp,
      });

      // 设置远程描述
      await this.pc.setRemoteDescription({
        type: "answer",
        sdp: await response.text(),
      });
    }
  }

  // 使用示例
  const video = document.getElementById("camera1");
  const player = new CameraPlayer(video, "cam101");
  player.start();
</script>
```

#### 2.4.4 RTSP

RTSP 是一种允许发布和读取流的协议。它支持不同的底层传输协议，并允许在传输中加密流，要使用 RTSP 协议读取流，使用此 URL：

```
rtsp://localhost:8554/mystream
```

可以使用 RTSP 读取的已知客户端包括 FFmpeg、GStreamer 和 VLC。

#### 2.4.5 RTMP

RTMP 是一种允许读取和发布流的协议，但其灵活性和效率不如 RTSP 和 WebRTC（不支持 UDP，不支持大多数 RTSP 编码，不支持反馈机制）。 可以通过以下 URL 从服务器读取流：

```
rtmp://localhost/mystream
```

在启用凭据的情况下，可以通过 `user` 和 `pass` 查询参数将凭据传递给服务器：

```
rtmp://localhost/mystream?user=myuser&pass=mypass
```

可以使用 RTMP 读取的已知客户端包括 FFmpeg、GStreamer 和 VLC。

#### 2.4.6 HLS

HLS 是一种通过将流分割成片段并通过 HTTP 协议提供这些片段和播放列表来工作的协议。 可以使用 _MediaMTX_ 生成 HLS 流，该流可以通过网页访问：

```
http://localhost:8888/mystream
```

还可以通过支持 HLS 协议的软件（例如 VLC 或 _MediaMTX_ 本身）通过以下 URL 访问：

```
http://localhost:8888/mystream/index.m3u8
```

可以使用 HLS 读取的已知客户端包括 FFmpeg、GStreamer、VLC 和 Web 浏览器。

### 2.5 MediaMTX 实现 RTSP 到 WebRTC 的转换原理

MediaMTX 充当媒体路由器角色，在输入（RTSP）和输出（WebRTC）协议间建立双向通道，无需深度解封装视频数据，而是通过以下关键步骤实现

- 协议解析与流提取 ​：
  - 接收 RTSP 流后，解析 RTP/RTCP 包，提取 H.264/H.265 裸流数据。
  - 不解码视频 ​：避免转码开销，仅重组数据包格式。
- WebRTC 适配层 ​：
  - 将裸流封装为 WebRTC 支持的 RTP 格式 ​（RFC 6184）。
  - 动态生成 SDP 描述文件，声明视频编码格式（如 H.264 Baseline Profile）、分辨率、帧率。
- ​ 信令交互 ​：
  - 通过 HTTP 或 WebSocket 提供信令接口，处理浏览器的 SDP offer/answer 交换

性能优势 ​： 
- 低延迟 ​：仅协议封装转换，延迟可控制在 100-500ms（原生 H.264 流） 
- 低 CPU 占用 ​：无解码/编码操作，比 FFmpeg 转码方案节省 50%以上资源

### 2.6 MediaMTX 其他配置

所有配置参数均在 `mediamtx.yml` 中列出并注释。

#### 2.6.1 认证

服务器提供三种身份验证用户的方法：

* 内部（`internal`）：用户存储在配置文件中
* 基于 HTTP（`http`）：联系外部 HTTP URL 进行身份验证
* JWT（`jwt`）：外部身份服务器通过 JWT 提供身份验证

内部认证：用户存储在配置文件中，格式如下：

```yaml
authMethod: internal
## 用户列表
authInternalUsers:
  # 默认的非特权用户。
  # 用户名。'any' 表示任何用户，包括匿名用户。
- user: any
  # 密码。 在 'any' 用户的情况下不使用。
  pass:
  # 允许使用此用户的 IP 或网络。 空列表表示任何 IP。
  ips: []
  # 权限列表。
    # 可用操作：publish、read、playback、api、metrics、pprof。
  - action: publish
    # 可以通过设置路径进一步限制访问特定路径。
    # 空路径表示任何路径。
    # 可以通过在前面加波浪号来使用正则表达式。
    path:
  - action: read
    path:
  - action: playback
    path:
```

基于HTTP的认证：身份验证可以委托给外部 HTTP 服务器：

```yaml
authMethod: http
## 如果响应码为20x，则认证通过，否则认证失败。
authHTTPAddress: http://myauthserver/auth
```

每当需要对用户进行身份验证时，都会使用 POST 方法向指定的 URL 发送请求，并带有以下有效负载：

```json
{
  "user": "user",
  "password": "password",
  "token": "token",
  "ip": "ip",
  "action": "publish|read|playback|api|metrics|pprof",
  "path": "path",
  "protocol": "rtsp|rtmp|hls|webrtc|srt",
  "id": "id",
  "query": "query"
}
```

如果 URL 返回以 `20` 开头的状态码（即 `200`），则身份验证成功，否则失败。 请注意，身份验证服务器接收到的请求中用户名和密码为空是完全正常的，即：

```json
{
  "user": "",
  "password": ""
}
```

这是因为 RTSP 客户端在被要求时才会提供凭据。 为了接收凭据，身份验证服务器必须回复状态码 `401`，然后客户端将发送凭据。

可以从该过程排除某些操作：

```yml
## 在 HTTP 基于身份验证的过程中排除的操作。
## 格式与用户权限相同。
authHTTPExclude:
- action: api
- action: metrics
- action: pprof
```

JWT-based：身份验证可以委托给外部身份服务器，该服务器能够生成 JWT 并提供 JWKS 端点。 与基于 HTTP 的方法相比，这种方法的优点在于，仅联系一次外部服务器，而不是每次请求都联系，从而大大提高了性能。将JWT放在 `Authorization: Bearer` HTTP 头中。

```yaml
authMethod: jwt
authJWTJWKS: http://my_identity_server/jwks_endpoint
authJWTClaimKey: mediamtx_permissions
```

JWT 被期望包含一个声明，其中包含与用户权限相同格式的权限列表：

```json
{
 "mediamtx_permissions": [
    {
      "action": "publish",
      "path": ""
    }
  ]
}
```

#### 2.6.2 重封装、重新编码、压缩

要更改流的格式、编码器或压缩，使用 _FFmpeg_ 或 _GStreamer_ 与 _MediaMTX_ 一起使用。 例如，要重新编码现有流，该流可在 `/original` 路径中获得，并将生成的流发布到 `/compressed` 路径，请编辑 `mediamtx.yml`，并用以下内容替换 `paths` 部分中的所有内容：

```yml
paths:
  compressed:
  original:
    runOnReady: >
      ffmpeg -i rtsp://localhost:$RTSP_PORT/$MTX_PATH
        -c:v libx264 -pix_fmt yuv420p -preset ultrafast -b:v 600k
        -max_muxing_queue_size 1024 -f rtsp rtsp://localhost:$RTSP_PORT/compressed
    runOnReadyRestart: yes
```

#### 2.6.3 录制流到磁盘

要将可用流保存到磁盘，请设置 `record` 和 `recordPath` 参数在配置文件中：

```yml
## 录制流到磁盘。
record: yes
## 录制片段的路径。
## 扩展名会自动添加。
## 可用变量有 %path (路径名称), %Y %m %d (年, 月, 日),
## %H %M %S (小时, 分钟, 秒), %f (微秒), %z (时区), %s (unix 纪元).
recordPath: ./recordings/%path/%Y-%m-%d_%H-%M-%S-%f
```

所有可用的录制参数都在 示例配置文件`/mediamtx.yml` 中列出。

#### 2.6.4 回放录制的流

可以通过专用 HTTP 服务器向用户提供现有录音流，该服务器可以通过设置 `playback` 参数在配置中启用：

```yaml
## 启用从回放服务器下载录制内容。
playback: no
## 回放服务器监听器的地址。
playbackAddress: :9996
```

服务器提供一个端点来列出录制的时间段：

```
http://localhost:9996/list?path=[mypath]&start=[start]&end=[end]
```

其中：

* [mypath] 是路径的名称
* [start] （可选）是开始日期，格式为 [RFC3339](https://www.utctime.net/)
* [end] （可选）是结束日期，格式为 [RFC3339](https://www.utctime.net/)

服务器将以 JSON 格式返回时间段列表：

```json
[
  {
    "start": "2006-01-02T15:04:05Z07:00",
    "duration": 60.0,
    "url": "http://localhost:9996/get?path=[mypath]&start=2006-01-02T15%3A04%3A05Z07%3A00&duration=60.0"
  },
  {
    "start": "2006-01-02T15:07:05Z07:00",
    "duration": 32.33,
    "url": "http://localhost:9996/get?path=[mypath]&start=2006-01-02T15%3A07%3A05Z07%3A00&duration=32.33"
  }
]
```

服务器提供一个端点来下载录制：

```
http://localhost:9996/get?path=[mypath]&start=[start]&duration=[duration]&format=[format]
```

其中：

* [mypath] 是路径名称
* [start] 是开始日期，格式为 [RFC3339](https://www.utctime.net/)
* [duration] 是录音的最长持续时间（以秒为单位）
* [format] （可选）是流的输出格式。 可用值为“fmp4”（默认）和“mp4”

所有参数都必须是 [url-encoded](https://www.urlencoder.org/)。 例如：

```
http://localhost:9996/get?path=mypath&start=2024-01-14T16%3A33%3A17%2B00%3A00&duration=200.5
```

生成的流使用 fMP4 格式，该格式与任何浏览器本地兼容，因此其 URL 可以直接插入到 \<video> 标签中：

```html
<video controls>
  <source src="http://localhost:9996/get?path=[mypath]&start=[start_date]&duration=[duration]" type="video/mp4" />
</video>
```

由于某些播放器的兼容性有限，fMP4 格式可能会出现问题。 要解决此问题，可以使用标准 MP4 格式，通过在 `/get` 请求中添加 `format=mp4`：

```
http://localhost:9996/get?path=[mypath]&start=[start_date]&duration=[duration]&format=mp4
```

#### 2.6.5 将流转发到其他服务器

要将传入流转发到其他服务器，请在 `runOnReady` 参数中使用 _FFmpeg_：

```yml
pathDefaults:
  runOnReady: >
    ffmpeg -i rtsp://localhost:$RTSP_PORT/$MTX_PATH
    -c copy
    -f rtsp rtsp://other-server:8554/another-path
  runOnReadyRestart: yes
```

#### 2.6.6 按需发布

编辑 `mediamtx.yml`，用以下内容替换 `paths` 部分中的所有内容：

```yml
paths:
  ondemand:
    runOnDemand: ffmpeg -re -stream_loop -1 -i file.ts -c copy -f rtsp rtsp://localhost:$RTSP_PORT/$MTX_PATH
    runOnDemandRestart: yes
```

`runOnDemand` 中插入的命令仅在客户端请求路径 `ondemand` 时启动，因此文件仅在请求时开始流媒体。


#### 2.6.7 路由绝对时间戳

某些流媒体协议允许路由与每帧关联的绝对时间戳，这对于同步多个视频或数据流非常有用。 特别是，_MediaMTX_ 支持使用以下协议和设备接收绝对时间戳：

* HLS（通过播放列表中的 `EXT-X-PROGRAM-DATE-TIME` 标签）
* RTSP（通过 RTCP 报告，当 `useAbsoluteTimestamp` 在设置中为 `true` 时）
* WebRTC（通过 RTCP 报告，当 `useAbsoluteTimestamp` 在设置中为 `true` 时）
* Raspberry Pi 摄像头

并支持通过以下协议发送绝对时间戳：

* HLS（通过播放列表中的 `EXT-X-PROGRAM-DATE-TIME` 标签）
* RTSP（通过 RTCP 报告）
* WebRTC（通过 RTCP 报告）

一个可以与 HLS 一起读取绝对时间戳的库是 [gohlslib](https://github.com/bluenviron/gohlslib)。

一个可以与 RTSP 一起读取绝对时间戳的库是 [gortsplib](https://github.com/bluenviron/gortsplib)。

如果浏览器支持 WebRTC，则可以通过 [estimatedPlayoutTimestamp](https://www.w3.org/TR/webrtc-stats/#dom-rtcinboundrtpstreamstats-estimatedplayouttimestamp) 指标来连接。


#### 2.6.8 在子文件夹中暴露服务器

基于 HTTP 的服务（WebRTC、HLS、控制 API、回放服务器、指标、pprof）可以暴露在现有 HTTP 服务器或反向代理的子文件夹中。 反向代理必须能够拦截发送到 MediaMTX 的 HTTP 请求及其相应的响应，并执行以下操作：

* 必须从请求路径中删除子文件夹路径。 例如，如果服务器通过 `/subpath` 暴露，并且反向代理收到的请求路径为 `/subpath/mystream/index.m3u8`，则必须将其更改为 `/mystream/index.m3u8`。

* 响应中的任何 `Location` 标头都必须添加子文件夹路径前缀。 例如，如果服务器通过 `/subpath` 暴露，并且服务器发送的响应为 `Location: /mystream/index.m3u8`，则必须将其更改为 `Location: /subfolder/mystream/index.m3u8`。

如果 _nginx_ 是反向代理，则可以通过以下配置实现：

```
location /subpath/ {
    proxy_pass http://mediamtx-ip:8889/;
    proxy_redirect / /subpath/;
}
```

如果 _Apache HTTP Server_ 是反向代理，则可以通过以下配置实现：

```
<Location /subpath>
    ProxyPass http://mediamtx-ip:8889
    ProxyPassReverse http://mediamtx-ip:8889
    Header edit Location ^(.*)$ "/subpath$1"
</Location>
```

如果 _Caddy_ 是反向代理，则可以通过以下配置实现：

```
:80 {
    handle_path /subpath/* {
        reverse_proxy {
            to mediamtx-ip:8889
            header_down Location ^/ /subpath/
        }
    }
}
```

#### 2.6.9 开机自启

###### Linux

在大多数 Linux 发行版（包括 Ubuntu 和 Debian，但不包括 OpenWrt）中，_systemd_ 负责管理服务并在启动时启动它们。

将服务器可执行文件和配置移动到全局文件夹：

```sh
sudo mv mediamtx /usr/local/bin/
sudo mv mediamtx.yml /usr/local/etc/
```

创建一个 _systemd_ 服务：

```sh
sudo tee /etc/systemd/system/mediamtx.service >/dev/null << EOF
[Unit]
Wants=network.target
[Service]
ExecStart=/usr/local/bin/mediamtx /usr/local/etc/mediamtx.yml
[Install]
WantedBy=multi-user.target
EOF
```

如果启用了 SELinux（例如在 RedHat、Rocky、CentOS++ 的情况下），请添加正确的安全上下文：

```sh
semanage fcontext -a -t bin_t /usr/local/bin/mediamtx
restorecon -Fv /usr/local/bin/mediamtx
```

启用并启动服务：

```sh
sudo systemctl daemon-reload
sudo systemctl enable mediamtx
sudo systemctl start mediamtx
```

###### OpenWrt

将服务器可执行文件和配置移动到全局文件夹：

```sh
mv mediamtx /usr/bin/
mkdir -p /usr/etc && mv mediamtx.yml /usr/etc/
```

创建一个 procd 服务：

```sh
tee /etc/init.d/mediamtx >/dev/null << EOF
#!/bin/sh /etc/rc.common
USE_PROCD=1
START=95
STOP=01
start_service() {
    procd_open_instance
    procd_set_param command /usr/bin/mediamtx
    procd_set_param stdout 1
    procd_set_param stderr 1
    procd_close_instance
}
EOF
```

启用并启动服务：

```sh
chmod +x /etc/init.d/mediamtx
/etc/init.d/mediamtx enable
/etc/init.d/mediamtx start
```

查看服务器日志：

```sh
logread
```

###### Windows

下载 [WinSW v2 可执行文件](https://github.com/winsw/winsw/releases/download/v2.11.0/WinSW-x64.exe) 并将其放置在与 `mediamtx.exe` 相同的文件夹中。

在同一文件夹中，创建一个名为 `WinSW-x64.xml` 的文件，内容如下：

```xml
<service>
  <id>mediamtx</id>
  <name>mediamtx</name>
  <description></description>
  <executable>%BASE%/mediamtx.exe</executable>
</service>
```

打开终端，导航到文件夹并运行：

```
WinSW-x64 install
```

服务器现在作为系统服务安装，并将在启动时自动启动。


#### 2.6.10 Hooks

服务器允许指定在发生某个事件时执行的命令，将事件传播到外部软件。

`runOnConnect` 允许在客户端连接到服务器时运行命令：

```yml
## 当客户端连接到服务器时要运行的命令。
## 当客户端断开与服务器的连接时，这将与 SIGINT 一起终止。
## 可用的环境变量有：
## * MTX_CONN_TYPE: 连接类型
## * MTX_CONN_ID: 连接 ID
## * RTSP_PORT: RTSP 服务器端口
runOnConnect: curl http://my-custom-server/webhook?conn_type=$MTX_CONN_TYPE&conn_id=$MTX_CONN_ID
## 如果命令退出，则重新启动该命令。
runOnConnectRestart: no
```

`runOnDisconnect` 允许在客户端断开与服务器的连接时运行命令：

```yml
## 当客户端断开与服务器的连接时要运行的命令。
## 环境变量与 runOnConnect 相同。
runOnDisconnect: curl http://my-custom-server/webhook?conn_type=$MTX_CONN_TYPE&conn_id=$MTX_CONN_ID
```

`runOnInit` 允许在初始化路径时运行命令。 这可用于在服务器启动时发布流：

```yml
paths:
  mypath:
    # 当初始化此路径时要运行的命令。
    # 这可用于在服务器启动时发布流。
    # 可用的环境变量有：
    # * MTX_PATH: 路径名称
    # * RTSP_PORT: RTSP 服务器端口
    # * G1, G2, ...: 正则表达式组，如果路径名称是
    #   正则表达式。
    runOnInit: ffmpeg -i my_file.mp4 -c copy -f rtsp rtsp://localhost:8554/mypath
    # 如果退出，则重新启动该命令。
    runOnInitRestart: no
```

`runOnDemand` 允许在读取器请求路径时运行命令。 这可用于按需发布流：

```yml
pathDefaults:
  # 当此路径被读取器请求时运行此命令
  # 且没有人再向此路径发布流时。
  # 当没有读者时，这将与 SIGINT 一起终止。
  # 可用的环境变量有：
  # * MTX_PATH: 路径名称
  # * MTX_QUERY: 查询参数（由第一个读取器传递）
  # * RTSP_PORT: RTSP 服务器端口
  # * G1, G2, ...: 正则表达式组，如果路径名称是
  #   正则表达式。
  runOnDemand: ffmpeg -i my_file.mp4 -c copy -f rtsp rtsp://localhost:8554/mypath
  # 如果退出，则重新启动该命令。
  runOnDemandRestart: no
```

`runOnUnDemand` 允许在不再有读取器时运行命令：

```yml
pathDefaults:
  # 当不再有读取器时要运行的命令。
  # 环境变量与 runOnDemand 相同。
  runOnUnDemand:
```

`runOnReady` 允许在流准备好被读取时运行命令：

```yml
pathDefaults:
  # 当流准备好被读取时要运行的命令，无论是
  # 由客户端发布还是从服务器/摄像头拉取。
  # 当流不再可用时，这将与 SIGINT 一起终止。
  # 可用的环境变量有：
  # * MTX_PATH: 路径名称
  # * MTX_QUERY: 查询参数（由发布者传递）
  # * MTX_SOURCE_TYPE: 源类型
  # * MTX_SOURCE_ID: 源 ID
  # * RTSP_PORT: RTSP 服务器端口
  # * G1, G2, ...: 正则表达式组，如果路径名称是
  #   正则表达式。
  runOnReady: curl http://my-custom-server/webhook?path=$MTX_PATH&source_type=$MTX_SOURCE_TYPE&source_id=$MTX_SOURCE_ID
  # 如果退出，则重新启动该命令。
  runOnReadyRestart: no
```

`runOnNotReady` 允许在流不再可用时运行命令：

```yml
pathDefaults:
  # 当流不再可用时要运行的命令。
  # 环境变量与 runOnReady 相同。
  runOnNotReady: curl http://my-custom-server/webhook?path=$MTX_PATH&source_type=$MTX_SOURCE_TYPE&source_id=$MTX_SOURCE_ID
```

`runOnRead` 允许在客户端开始读取时运行命令：

```yml
pathDefaults:
  # 当客户端开始读取时要运行的命令。
  # 当客户端停止读取时，这将与 SIGINT 一起终止。
  # 可用的环境变量有：
  # * MTX_PATH: 路径名称
  # * MTX_QUERY: 查询参数（由读取器传递）
  # * MTX_READER_TYPE: 读取器类型
  # * MTX_READER_ID: 读取器 ID
  # * RTSP_PORT: RTSP 服务器端口
  # * G1, G2, ...: 正则表达式组，如果路径名称是
  #   正则表达式。
  runOnRead: curl http://my-custom-server/webhook?path=$MTX_PATH&reader_type=$MTX_READER_TYPE&reader_id=$MTX_READER_ID
  # 如果退出，则重新启动该命令。
  runOnReadRestart: no
```

`runOnUnread` 允许在客户端停止读取时运行命令：

```yml
pathDefaults:
  # 当客户端停止读取时要运行的命令。
  # 环境变量与 runOnRead 相同。
  runOnUnread: curl http://my-custom-server/webhook?path=$MTX_PATH&reader_type=$MTX_READER_TYPE&reader_id=$MTX_READER_ID
```

`runOnRecordSegmentCreate` 允许在创建录制片段时运行命令：

```yml
pathDefaults:
  # 当创建录制片段时要运行的命令。
  # 可用的环境变量有：
  # * MTX_PATH: 路径名称
  # * MTX_SEGMENT_PATH: 段文件路径
  # * RTSP_PORT: RTSP 服务器端口
  # * G1, G2, ...: 正则表达式组，如果路径名称是
  #   正则表达式。
  runOnRecordSegmentCreate: curl http://my-custom-server/webhook?path=$MTX_PATH&segment_path=$MTX_SEGMENT_PATH
```

`runOnRecordSegmentComplete` 允许在录制片段完成时运行命令：

```yml
pathDefaults:
  # 当录制片段完成时要运行的命令。
  # 可用的环境变量有：
  # * MTX_PATH: 路径名称
  # * MTX_SEGMENT_PATH: 段文件路径
  # * MTX_SEGMENT_DURATION: 段持续时间
  # * RTSP_PORT: RTSP 服务器端口
  # * G1, G2, ...: 正则表达式组，如果路径名称是
  #   正则表达式。
  runOnRecordSegmentComplete: curl http://my-custom-server/webhook?path=$MTX_PATH&segment_path=$MTX_SEGMENT_PATH
```

#### 2.6.11 控制 API

服务器可以通过设置 `api` 参数进行查询和控制，该参数可以通过设置 `api` 参数进行启用：

```yml
api: yes
```

要获取活动路径的列表，请运行：

```
curl http://127.0.0.1:9997/v3/paths/list
```

控制 API 的完整文档可在 [专用网站](https://bluenviron.github.io/mediamtx/) 上找到。

请注意，默认情况下，控制 API 仅可通过 localhost 访问；要提高可见性或添加身份验证

## 3. 附录

### 3.1 本地推流测试脚本

使用FFmpeg调取本地摄像头采集资源，推流到流媒体服务器

```bash
#!/bin/bash

## 压力测试配置
RTSP_SERVER="rtsp://192.168.50.55:8554"  # 流媒体服务器地址
STREAM_PREFIX="stream"              # 流名称前缀
NUM_STREAMS=10                       # 并发流数量
CAMERA_DEVICE="0"                    # 摄像头设备索引（0通常是内置摄像头）
RESOLUTION="640x480"                # 分辨率
FPS=30                               # 帧率
DURATION=3600                        # 测试持续时间（秒）

## 用于存储 ffmpeg 进程的 PID
pids=()

## 清理函数，用于终止所有 ffmpeg 进程
cleanup() {
    echo -e "\n正在终止所有推流进程..."
    # 先尝试使用保存的PID终止进程
    if [ ${#pids[@]} -gt 0 ]; then
        kill "${pids[@]}" 2>/dev/null
    fi
    
    # 额外确保所有ffmpeg进程都被终止
    pkill -f ffmpeg
    
    echo "测试完成，所有推流进程已终止。"
    exit 0
}

## 捕获中断信号 (Ctrl+C) 和终止信号，执行清理操作
trap cleanup INT TERM

## 启动多路推流
for ((i=1; i<=$NUM_STREAMS; i++)); do
    echo "启动摄像头推流 ${i}/${NUM_STREAMS}"
    sleep 0.5
    ffmpeg \
            -hide_banner \
            -loglevel error \
            -f avfoundation \
            -video_size $RESOLUTION \
            -framerate $FPS \
            -i "$CAMERA_DEVICE" \
            -c:v libx264 \
            -preset veryfast \
            -tune zerolatency \
            -pix_fmt yuv420p \
            -g $(($FPS*2)) \
            -b:v 800k \
            -maxrate 1000k \
            -bufsize 1000k \
            -an \
            -f rtsp \
            "$RTSP_SERVER/${STREAM_PREFIX}_${i}" > /dev/null 2>&1 &

    # 保存 ffmpeg 进程的 PID
    pids+=($!)
done

echo "已启动 $NUM_STREAMS 路摄像头RTSP推流，持续 $DURATION 秒"
echo "按  Ctrl+C  可提前终止测试"

## 等待指定的测试时间
sleep $DURATION

## 正常时间到达后执行清理
cleanup
```

### 3.2 网页通过 WebRTC 从流媒体服务器拉取全部流进行展示

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>多路WebRTC播放器</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
            font-size: 15px;
        }
        .container {
            width: 100%;
            margin: 0 auto;
            padding: 2vw;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .batch-config {
            margin-bottom: 18px;
            padding: 12px 0 8px 0;
        }
        .batch-config input {
            margin: 0 8px 0 0;
            padding: 7px;
            width: 180px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .batch-config label {
            margin-right: 8px;
        }
        .batch-btn {
            padding: 8px 20px;
            font-size: 16px;
        }
        .stream-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 8px;
            margin-top: 10px;
        }
        .stream-item {
            border: 1px solid #eee;
            border-radius: 6px;
            padding: 8px 6px 6px 6px;
            background: #fafbfc;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .stream-config input {
            margin: 5px;
            padding: 7px;
            width: 160px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .controls {
            display: inline-block;
            margin-left: 10px;
        }
        .btn {
            margin: 5px;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 15px;
        }
        .btn-success {
            background-color: #28a745;
            color: white;
        }
        .btn-danger {
            background-color: #dc3545;
            color: white;
        }
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .video-container {
            text-align: center;
            margin: 10px 0 0 0;
            width: 100%;
        }
        video {
            width: 100%;
            max-width: 300px;
            height: auto;
            background-color: #000;
            border-radius: 8px;
        }
        .status {
            padding: 6px 10px;
            margin: 8px 0;
            border-radius: 4px;
            text-align: center;
            font-size: 14px;
        }
        .status.success { background-color: #d4edda; color: #155724; }
        .status.error { background-color: #f8d7da; color: #721c24; }
        .status.info { background-color: #d1ecf1; color: #0c5460; }
        .add-btn {
            margin: 10px 0 0 0;
            padding: 8px 20px;
            font-size: 16px;
        }
        .stream-count {
            margin: 10px 0;
            font-weight: bold;
            font-size: 16px;
            color: #333;
        }
    </style>
</head>
<body>
<div class="container">
    <h1>多路WebRTC播放器</h1>
    <div class="batch-config">
        <label>服务器地址: <input type="text" id="batchServerUrl" value="http://192.168.50.55:8889" placeholder="服务器地址"></label>
        <label>流路径前缀: <input type="text" id="batchStreamPrefix" value="stream_" placeholder="流路径前缀"></label>
        <label>数量: <input type="number" id="batchCount" value="4" min="1" max="32" style="width:60px;"></label>
        <button id="batchAddBtn" class="btn btn-success batch-btn">批量添加</button>
        <button id="fetchStreamsBtn" class="btn btn-success batch-btn">从服务器获取流列表</button>
    </div>
    <div style="margin-bottom:18px;">
        <button id="playAllBtn" class="btn btn-success batch-btn">播放全部</button>
        <button id="stopAllBtn" class="btn btn-danger batch-btn">停止全部</button>
    </div>
    <div id="streamCountDisplay" class="stream-count" style="display:none;"></div>
    <div id="streamList" class="stream-list"></div>
</div>
<script>
    class MultiWebRTCPlayer {
        constructor() {
            this.streamList = document.getElementById('streamList');
            this.batchAddBtn = document.getElementById('batchAddBtn');
            this.batchServerUrl = document.getElementById('batchServerUrl');
            this.batchStreamPrefix = document.getElementById('batchStreamPrefix');
            this.batchCount = document.getElementById('batchCount');
            this.playAllBtn = document.getElementById('playAllBtn');
            this.stopAllBtn = document.getElementById('stopAllBtn');
            this.fetchStreamsBtn = document.getElementById('fetchStreamsBtn');
            this.streamCountDisplay = document.getElementById('streamCountDisplay');
            this.streamCount = 0;
            this.players = {};
            this.streamInfos = [];
            this.batchAddBtn.onclick = () => this.batchAdd();
            this.playAllBtn.onclick = () => this.playAll();
            this.stopAllBtn.onclick = () => this.stopAll();
            this.fetchStreamsBtn.onclick = () => this.fetchRtspStreams();
        }

        batchAdd() {
            const serverUrl = this.batchServerUrl.value.trim();
            const prefix = this.batchStreamPrefix.value.trim();
            let count = parseInt(this.batchCount.value, 10);
            if (!serverUrl || !prefix || isNaN(count) || count < 1) return;
            this.streamList.innerHTML = '';
            this.players = {};
            this.streamInfos = [];
            this.streamCount = 0;
            this.streamCountDisplay.style.display = 'none';

            for (let i = 1; i <= count; i++) {
                const streamPath = `${prefix}${i}`;
                this.addStream(serverUrl, streamPath);
            }
        }

        async fetchRtspStreams() {
            try {
                const serverUrl = this.batchServerUrl.value.trim();
                if (!serverUrl) {
                    alert('请输入服务器地址');
                    return;
                }

                // 解析服务器地址，获取IP
                const urlParts = serverUrl.split('://');
                const hostPart = urlParts[1] ? urlParts[1].split(':')[0] : urlParts[0].split(':')[0];

                // 构建RTSP会话列表API URL
                const rtspApiUrl = `http://${hostPart}:9997/v3/rtspsessions/list`;

                const response = await fetch(rtspApiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Basic YWRtaW46WlhXTDIwMjU='
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP错误: ${response.status}`);
                }

                const data = await response.json();

                // 清空现有流
                this.streamList.innerHTML = '';
                this.players = {};
                this.streamInfos = [];
                this.streamCount = 0;

                // 显示流数量
                this.streamCountDisplay.textContent = `服务器上共有 ${data.itemCount} 路流`;
                this.streamCountDisplay.style.display = 'block';

                // 添加每个流
                data.items.forEach(item => {
                    if (item.state === 'publish' && item.path) {
                        this.addStream(serverUrl, item.path);
                    }
                });

            } catch (error) {
                alert(`获取流列表失败: ${error.message}`);
                console.error('获取流列表失败:', error);
            }
        }

        addStream(serverUrl, streamPath) {
            const idx = ++this.streamCount;
            const whepUrl = `${serverUrl}/${streamPath}/whep`;
            const item = document.createElement('div');
            item.className = 'stream-item';
            item.id = `stream-item-${idx}`;
            item.innerHTML = `
            <div style="width:100%;text-align:center;font-weight:bold;word-break:break-all;font-size:13px;">${whepUrl}</div>
            <div class="video-container">
                <video id="video-${idx}" controls autoplay muted playsinline></video>
            </div>
            <div id="status-${idx}" class="status" style="display:none;"></div>
        `;
            this.streamList.appendChild(item);
            this.players[idx] = new SimpleWebRTCPlayer(idx, whepUrl);
            this.streamInfos.push({idx, whepUrl});
        }

        playAll() {
            Object.values(this.players).forEach(player => player.start());
        }

        stopAll() {
            Object.values(this.players).forEach(player => player.stop());
        }
    }

    class SimpleWebRTCPlayer {
        constructor(idx, whepUrl) {
            this.idx = idx;
            this.whepUrl = whepUrl;
            this.pc = null;
            this.video = document.getElementById(`video-${idx}`);
            this.status = document.getElementById(`status-${idx}`);
        }

        showStatus(message, type = 'info') {
            this.status.textContent = message;
            this.status.className = `status ${type}`;
            this.status.style.display = 'block';
        }

        async start() {
            try {
                this.showStatus('正在连接...', 'info');
                this.pc = new RTCPeerConnection({});
                this.pc.ontrack = (event) => {
                    if (event.track.kind === 'video') {
                        this.video.srcObject = event.streams[0];
                        this.showStatus('视频流已连接', 'success');
                        this.video.play().catch(() => this.createPlayButton());
                    }
                };
                this.pc.oniceconnectionstatechange = () => {
                    const state = this.pc.iceConnectionState;
                    if (state === 'failed' || state === 'disconnected') {
                        this.showStatus('连接失败', 'error');
                    } else if (state === 'connected' || state === 'completed') {
                        this.showStatus('连接成功', 'success');
                    }
                };
                this.pc.addTransceiver('video', {direction: 'recvonly'});
                this.pc.addTransceiver('audio', {direction: 'recvonly'});
                const offer = await this.pc.createOffer();
                await this.pc.setLocalDescription(offer);
                const response = await fetch(this.whepUrl, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/sdp'},
                    body: offer.sdp
                });
                if (!response.ok) throw new Error(`HTTP错误: ${response.status}`);
                const answer = await response.text();
                await this.pc.setRemoteDescription({type: 'answer', sdp: answer});
            } catch (error) {
                this.showStatus(`连接失败: ${error.message}`, 'error');
            }
        }

        stop() {
            if (this.pc) {
                this.pc.close();
                this.pc = null;
            }
            if (this.video.srcObject) {
                this.video.srcObject.getTracks().forEach(track => track.stop());
                this.video.srcObject = null;
            }
            this.status.style.display = 'none';
            const playBtn = document.getElementById(`manualPlayBtn-${this.idx}`);
            if (playBtn) playBtn.remove();
        }

        createPlayButton() {
            if (document.getElementById(`manualPlayBtn-${this.idx}`)) return;
            const playBtn = document.createElement('button');
            playBtn.id = `manualPlayBtn-${this.idx}`;
            playBtn.textContent = '点击播放视频';
            playBtn.className = 'btn btn-success';
            playBtn.style.margin = '10px';
            playBtn.onclick = () => {
                this.video.play().then(() => {
                    this.showStatus('视频正在播放', 'success');
                    playBtn.remove();
                });
            };
            this.video.parentNode.appendChild(playBtn);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        new MultiWebRTCPlayer();
    });
</script>
</body>
</html>
```