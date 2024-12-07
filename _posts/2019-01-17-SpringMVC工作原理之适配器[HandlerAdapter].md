---
layout: post
title: "SpringMVC工作原理之适配器[HandlerAdapter]"
subtitle: "SpringMVC适配器"
date: 2019-01-17
categories: 技术
# cover: ""
tags: SpringMVC Spring
---

> 前面说到 [SpringMVC 工作原理之处理映射[HandlerMapping]](https://www.jianshu.com/p/f04816ee2495) ，由映射处理器(`HandlerMapping`) 映射出对应的 `handler`，但是接下来的 `handler` 是怎么去解析，怎么去调用 `handler` 对应的视图方法，这个时候就需要用到 `handler` 的适配器。
> 本篇原理主要分析 SpringMVC 5.1.1 这个版本。

![SpringMVC运行流程](/assets/img/2019-01-17/4322526-873dc442cdc93555.webp)

不同的映射处理器(`HandlerMapping`) 映射出来的 `handler` 对象是不一样的，`AbstractUrlHandlerMapping` 映射器映射出来的是 `handler` 是 `Controller` 对象，`AbstractHandlerMethodMapping` 映射器映射出来的 `handler` 是 `HandlerMethod` 对象。由此我们猜想映射的处理器也应该有很多种，不同的映射由不同的适配器来负责解析。

# 1 HandlerAdapter 基础了解

## 1.1 首先我们来看下适配器 `HandlerAdapter` 接口内部的方法

![](/assets/img/2019-01-17/4322526-ba0b41c776045852.webp)

## 1.2 再来看下适配器 `HandlerAdapter` 接口的实现链

![](/assets/img/2019-01-17/4322526-4ecbd58d198ebeed.webp)

## 1.3 适配器们的加载

首先我们来看下源码，容器初始化的时候会将注入到容器的适配器们加进缓存。

![](/assets/img/2019-01-17/4322526-750f5ce0d141c0e2.webp)

首先扫描注入容器的适配器，这里需要注意下 [<mvc:annotation-driven />](https://www.jianshu.com/p/fc3bc70b9ed3) 会帮我们注入 `RequestMappingHandlerAdapter` 、`HttpRequestHandlerAdapter` 和 `SimpleControllerHandlerAdapter` 这三个配置器，我们需要注意下不要手动重复注入。

当我们没有写 [<mvc:annotation-driven />](https://www.jianshu.com/p/fc3bc70b9ed3) 标签帮我们注入，也没有手动注入，从上面源码最后一步可以看到，容器在初始化的时候检测到会自动帮我们注入 `RequestMappingHandlerAdapter` 、`HttpRequestHandlerAdapter` 和 `SimpleControllerHandlerAdapter` 这三个配置器。

# 2 HttpRequestHandlerAdapter

可以执行 `HttpRequestHandler` 类型的 `handler`，源码如下

![](/assets/img/2019-01-17/4322526-2630fcffa9ee7210.webp)

# 3 SimpleServletHandlerAdapter

可以执行 `Servlet` 类型的 `handler`，源码如下

![](/assets/img/2019-01-17/4322526-7688b459d9aacf1f.webp)

# 4 SimpleControllerHandlerAdapter

可以执行 `Controller` 类型的 `handler`，源码如下

![](/assets/img/2019-01-17/4322526-fa476a4133d287ac.webp)

在前面 [SpringMVC 工作原理之处理映射[HandlerMapping]](https://www.jianshu.com/p/f04816ee2495) 笔记中使用 `AbstractUrlHandlerMapping` 的子类映射器最终返回的 `handler` 是 `Controller` 类型，当时定义的视图控制器都继承自 `AbstractController`，视图必须实现 `handleRequestInternal(...)` 方法。
在 `AbstractController` 内部源码如下

![](/assets/img/2019-01-17/4322526-c0bf7701b51e9661.webp)

从源码中可以看出 `Controller` 对象调用 `handlerRequest(..)` 方法最终经过处理后还是调用 `handleRequestInternal (..)` 方法。

# 5. AbstractHandlerMethodAdapter

在这里 `AbstractHandlerMethodAdapter` 只有一个实现子类就是 `RequestMappingHandlerAdapter`，首先我们来看下其内部是怎么来实现判断 `supports(..)` 是否支持该 `handler` 和接下来的 `handler` 解析方法 `handle(..)` 的，源码如下

![](/assets/img/2019-01-17/4322526-55214381b4732d20.webp)

# 6. 总结

关于适配器的分类总结及适配，本篇笔记就记录到这里。前面讲到的几种适配器执行对应的 `handler` 都很简单，主要是 `RequestMappingHandlerAdapter` 适配器，该适配从上面可以看出，他内部解析来的详细解析可以参考我的下一篇文章 [SpringMVC 工作原理之参数解析](https://www.jianshu.com/p/2bfd65bc9ce4)
