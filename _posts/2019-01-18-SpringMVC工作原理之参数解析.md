---
layout: post
title: "SpringMVC工作原理之参数解析"
subtitle: "SpringMVC参数解析"
date: 2019-01-18
categories: 技术
# cover: ""
tags: SpringMVC Spring
---

> 前面分析到 [SpringMVC 工作原理之处理映射[HandlerMapping]](https://www.jianshu.com/p/f04816ee2495) ，由映射处理器(`HandlerMapping`) 解析出对应的 `handler`。接着 [SpringMVC 工作原理之适配器[HandlerAdapter]](https://www.jianshu.com/p/23ad68d8b421) 描述了 `handler` 是怎么匹配到合适的适配器，进行 `handler` 对应方法的执行。其他几种适配器还好，但是 `RequestMappingHandlerAdapter` 适配器对应接下来的参数解析及绑定并执行并不是那么简单，**因此本篇笔记主要分析 `RequestMappingHandlerAdapter` 适配器解析对应 `handler` 的执行流程。**
> 本篇笔记主要分析 SpringMVC 5.1.1 这个版本。

![SpringMVC运行流程](/assets/img/2019-01-18/4322526-fe895ae46924002c.webp)

`RequestMappingHandlerAdapter` 大概解析流程如下

![RequestMappingHandlerAdapter解析流程](/assets/img/2019-01-18/4322526-fee9abf2f5d8c9ae.webp)

# 1 了解在前面

在开始下面的具体源码分析前，我们需要了解一些相关的类和接口

## 1.1 HandlerMethod

在开始记录方法执行流程前，必须要先说下记录方法的对象 `HandlerMethod`，`HandlerMethod` 及子类主要用于封装方法调用相关信息。简单理解为保持方法信息的 pojo 类。

![HandlerMethod及其子类.png](/assets/img/2019-01-18/4322526-5f7a7f4069f988a9.webp)

分析下各个类的功能及职责：

- **`HandlerMethod`** 封装方法定义相关的信息 (如类、方法、参数等)
- **`InvocableHandlerMethod`** 参数准备委托 `HandlerMethodArgumentResolver` 进行具体的解析
- **`ServletInvocableHandlerMethod`** 添加返回值处理职责，`ResponseStatus` 处理

在容器初始化的时候，`RequestMappingHandlerMapping` 映射处理器就将 `@RequestMapping` 描述的方法以 `RequestMappingInfo` 为 key，`HandlerMethod` 为 value 放进自己的缓存 。至如 `HandlerMethod` 内部后面是怎么进行对应方法上的参数解析及绑定到后来的方法执行等等，咱们接下来会详细讲解。

## 1.2 参数解析器(`HandlerMethodArgumentResolver`)和返回值的解析器(`HandlerMethodReturnValueHandler`)

在分析源码之前，首先让我们来看下 SpringMVC 中两个重要的接口，两个接口都是在 3.1 版本后添加的。

- 处理方法参数的解析器接口

![](/assets/img/2019-01-18/4322526-7de4ae60cc97b72a.webp)

- 处理方法调用返回值的解析器接口

![](/assets/img/2019-01-18/4322526-7803aea6123b6d9f.webp)

两个接口分别有两个方法，一个用来查看该解析器是否支持该参数的解析，第二个方法用来对参数进行解析。

## 1.3 默认解析器的注入

在容器初始话的时候，初始化 `RequestMappingHandlerAdapter` 适配器的时候会将默认的参数解析器都注入进缓存中。

![](/assets/img/2019-01-18/4322526-e2416584652cec2c.webp)

加载默认的参数解析器(ArgumentResolvers)，绑定到 `RequestMappingHandlerAdapter` 适配器的 `argumentResolvers` 属性上。
加载默认的返回值解析器(ReturnValueHandlers)，绑定到 `RequestMappingHandlerAdapter` 适配器的 `returnValueHandlers` 属性上。

下面我们来简单的看下都有哪些默认解析器

- 默认注入的参数解析器

![](/assets/img/2019-01-18/4322526-c6b012c790d4cee2.webp)

- 默认注入的返回值解析器

![](/assets/img/2019-01-18/4322526-9951e25ffb7bd62a.webp)

# 2 解析过程流程

## 2.1 解析器的绑定及匹配

接着 `RequestMappingHandlerAdapter` 适配器的 `handleInternal(..)` 方法往下说，在 `handleInternal(..)` 方法中主要检查是否需要同步执行接下来对方法的操作，内部调用 `invokeHandlerMethod(..)` 方法。

![](/assets/img/2019-01-18/4322526-4809186f8eacc1c0.webp)

该方法内部就方法执行流程大致可以分为以上标注的 6 步：

- ①. 对应 `WebDataBinderFactory` 工厂类的创建，_因里面涉及到的东西有点多，将放在下面参数值类型转换部分详细解说。_
- ②. 根据该 `HandlerMethod` 创建对应的 `ServletInvocableHandlerMethod` 对象。
- ③. 将注入到缓存的参数解析器绑定到创建的 `ServletInvocableHandlerMethod` 对象上。
- ④. 将注入缓存的返回值解析器绑定到创建的 `ServletInvocableHandlerMethod` 对象上。
- ⑤. 将上面创建的 `WebDataBinderFactory` 工厂类对象绑定到创建的 `ServletInvocableHandlerMethod` 对象上。
- ⑥. 执行 `ServletInvocableHandlerMethod` 的 `invokeAndHandle(...)` 方法。

总结：`RequestMappingHandlerAdapter` 在内部对于每个请求，都会实例化一个 `ServletInvocableHandlerMethod` 进行处理。

`ServletInvocableHandlerMethod` 内部会分别对请求跟响应进行处理。

![](/assets/img/2019-01-18/4322526-19cca832099a097b.webp)

进入执行请求对应方法里面看看流程

![](/assets/img/2019-01-18/4322526-1c6437fd1ed2d921.webp)

接下来就是请求参数解析器和返回值解析器上场的时候了。

①. `ServletInvocableHandlerMethod` 类在处理参数的时候，会使用自己绑定的参数解析器，参数解析器记录在属性`argumentResolvers` (这个属性是它的父类 `InvocableHandlerMethod`中定义的)，`argumentResolvers` 属性是一个 `HandlerMethodArgumentResolverComposite` 类(**这里使用了组合模式的一种变形**)，这个类是实现了 `HandlerMethodArgumentResolver` 接口的类，实现了该类里面的两个接口。同时里面有记录所有参数解析器的 `List` 集合，有缓存 `MethodParameter` 与解析器对应关系的 `Map` 集合。

![](/assets/img/2019-01-18/4322526-f3942ef53305d943.webp)

![](/assets/img/2019-01-18/4322526-09ab2cd4c802b84a.webp)

②. `ServletInvocableHandlerMethod` 类在处理返回值的时候，会使用自身绑定的返回值解析器，该解析器记录在属性 `returnValueHandlers` (自身属性)，`returnValueHandlers` 属性是一个 `HandlerMethodReturnValueHandlerComposite` 类(**这里使用了组合模式的一种变形**)，这个类实现了 `HandlerMethodReturnValueHandler` 接口，实现了该接口里面的两个方法。同时里面有记录所有返回值解析器的 `List` 集合。

![](/assets/img/2019-01-18/4322526-b4ba326407169b8c.webp)

![](/assets/img/2019-01-18/4322526-bac5301344410f69.webp)

## 2.2 参数解析器内部解析流程

因为解析器太多，这里只能抽其中一个来了解下参数解析器内部实现解析的逻辑，选个最常用的解析器 `RequestParamMethodArgumentResolver`，他是用来解析 `@RequestParam` 注解的参数。`RequestParamMethodArgumentResolver` 继承自 `AbstractNamedValueMethodArgumentResolver`，而 `AbstractNamedValueMethodArgumentResolver` 抽象类实现了 `HandlerMethodArgumentResolver` 接口。

**首先来看下其支持解析的参数种类**

![](/assets/img/2019-01-18/4322526-be319137d65f6937.webp)

**再来看下其解析参数的过程**

参数解析的过程可以分为三个部分：**参数名字解析、参数值获取、参数值类型转换**。

![](/assets/img/2019-01-18/4322526-f98c9a27d850a992.webp)

### (1). 参数名字解析

`NamedValueInfo` 是该抽象解析器定义的一个内部类，有三个属性记录形参上的修饰，分别是 `name`、`required`、`defaultValue`，分别记录形参名字、形参是否必须、形参默认值。

![](/assets/img/2019-01-18/4322526-31515b4952f48cbc.webp)

咱们来看下 `RequestParamMethodArgumentResolver` 子类是怎么实现 `createNamedValueInfo(..)` 这个方法的。

![](/assets/img/2019-01-18/4322526-4de5caa9987bf99e.webp)

很明显返回的是 `RequestParamNamedValueInfo` 对象，`RequestParamNamedValueInfo` 类是该解析类里面的一个内部类，继承自 `NamedValueInfo`，构建方法里面将传进去的 `RequestParam` 的 `name`、`required`、`defaultValue` 分别记录到创建的 `RequestParamNamedValueInfo` 对象的属性上。

通过后面的 `updateNameValueInfo(..)` 方法检查一遍，当 `@RequestParam` 注解的 `name` 和 `value` 属性为空时，会自动以形参的名字作为 `name`。

### (2). 参数值获取

`resolveName(...)` 抽象类的抽象方法，具体由其子类实现，下面我们来看下 `RequestParamMethodArgumentResolver` 解析类是怎么实现的吧。

![](/assets/img/2019-01-18/4322526-3e997941fa0be07f.webp)

上面分别实现了可变请求和不可变请求对于根据 `name` 取值的方式。

### (3). 参数值类型转换

从上面源码可以看出，通过自身绑定的 `binderFactory` 创建出 `WebDataBinder` 对象，通过创建出来的 `WebDataBinder` 对象来进行数据转换。
那么接下来的分析就有条理了，分为三个部分：**`WebDataBinderFactory` 属性对象的创建及绑定、`WebDataBinderFactory` 属性对象内部执行 `createBinder(...)` 方法创建出 `WebDataBinder` 对象的具体逻辑、 `WebDataBinder` 进行数据类型转换的具体逻辑。**

#### (3.1) `WebDataBinderFactory` 属性对象的创建及绑定

前面说到在 `RequestMappingHandlerAdapter` 适配器中执行 `invokeHandlerMethod(...)` 方法，通过 `WebDataBinderFactory binderFactory = getDataBinderFactory(handlerMethod);` 方法创建 `WebDataBinderFactory` 对象，并将其绑定在创建的 `ServletInvocableHandlerMethod` 对象上。

![](/assets/img/2019-01-18/4322526-ec173b90a4b72726.webp)

这里的 `this.webBindingInitializer` 属性其实就是一个 `ConfigurableWebBindingInitializer` 对象，即在 [<mvc:annotation-driven />](https://www.jianshu.com/p/fc3bc70b9ed3) 时默认注册的。即包含一些解析参数需要的 `MessageCodesResolver`、`BindingErrorProcessor`、`Validator`、`ConversionService`、`PropertyEditorRegistrar[]`。

#### (3.2) `WebDataBinderFactory` 对象内部执行 `createBinder(...)` 方法创建出 `WebDataBinder` 对象的具体逻辑

首先来看下 `WebDataBinderFactory` 接口的实现类

![](/assets/img/2019-01-18/4322526-fc4c25ee3a70c45f.webp)

再来看 `createBinder(...)` 方法

![](/assets/img/2019-01-18/4322526-f89e366cc66c21b0.webp)

1 `new` 出 `WebDataBinder` 接口实现类，依照自身实现类为准，从 **(3.1)** 看出这里的 `this` 对象是 `ServletRequestDataBinderFactory` 对象，`new` 出来的 `WebDataBinder` 接口实现类应该是 `ExtendedServletRequestDataBinder` 类对象。

2 对 `WebDataBinder` 对象进行一些初始化，`this.initializer` 属性是在上面 **(3.1)** 绑定进来的 `ConfigurableWebBindingInitializer` 对象。

![](/assets/img/2019-01-18/4322526-20650106b42fd0d3.webp)

从执行方法里面可以看出设置一些我们在解析参数时用到的转换器和验证器到 `WebDataBinder` 对象上。

3 自身初始化 `WebDataBinder` 的方法

![](/assets/img/2019-01-18/4322526-f131c2a0f76d4f6a.webp)

从上面 `isBinderMethodApplicable(..)` 匹配符合该参数转换的 `@initBinder` 注解修饰的方法逻辑可以看出，以后在 `Controller` 里面写 `@initBinder` 注解修饰的方法，尽量指定 `value` 属性字段，以免每个参数解析都执行不必要的 `@initBinder` 注解修饰的方法。

#### (3.3) `WebDataBinder` 进行数据类型转换的具体逻辑，执行`convertIfNecessary(...)` 方法

数据转换这块很复杂，我目前的能力只能做潜在的分析。因为 `WebDataBinder` 继承自 `DataBinder`，又因为 `DataBinder` 实现了`PropertyEditorRegistry` 和 `TypeConverter` 接口，所以该类具有注入自定义编辑器和转换数据的能力。
数据的转换最终交给 `TypeConverterDelegate` 类进行转换

![](/assets/img/2019-01-18/4322526-2b5962bfb037eaa8.webp)

从上面可以看出，先匹对自定义的编辑器进行数据转换，没有合适的编辑器则匹配对应的转换器进行数据转换。
再来看下第 3 步自定义编辑器里面是怎么来转换数据的

![](/assets/img/2019-01-18/4322526-44fd5e08327e7fad.webp)

## 2.3 返回值析器内部解析流程

前面说到返回值处理器记录在 `ServletInvocableHandlerMethod` 绑定的 `returnValueHandlers` 属性上，`returnValueHandlers` 属性是一个 `HandlerMethodReturnValueHandlerComposite` 类，这个类是一种组合模式的变形，他也实现了 `HandlerMethodReturnValueHandler` 接口，并且该类里面有 `returnValueHandlers` 属性是 `List` 集合属性，缓存了所有的返回值处理器。不清楚的可以看上面的 **2.1 解析器的绑定及匹配**

由于返回值处理器也比较多，所以这里也选取一个最常用的 `ViewNameMethodReturnValueHandler` 返回值解析器看下内部实现原理。首先他肯定实现了 `HandlerMethodReturnValueHandler` 接口，并实现了该接口里面的两个方法。

![](/assets/img/2019-01-18/4322526-e08e5b04f8acd91e.webp)
