---
layout: post
title: "SpingMVC之annotation-driven标签"
# subtitle: "subtitle"
date: 2019-01-20
categories: 技术
# cover: "http://on2171g4d.bkt.clouddn.com/jekyll-theme-h2o-postcover.jpg"
tags: SpringMVC Spring
---

> 对于 SpringMVC 的探索已经接近尾声，本篇笔记主要记录下 SpringMVC 为我们提供的一个神奇标签 `<mvc:annotation-driven/>`，这个标签会帮我们注入很多关键而实用的 bean，但是用它也得小心跟自己手动注入的 bean 重复，会造成不必要的麻烦。所以今天来了解下这个标签。
> 本篇笔记主要分析 SpringMVC 5.1.1 这个版本。

为了弄清楚这些问题，我们先找到它的解析类，所有的自定义命名空间（像 mvc，context 等）下的标签解析都是由`BeanDefinitionParser` 接口的实现类来完成的。我们今天研究的是`<mvc:annotation-driven/>`标签，所以我们找到对应的实现类是`org.springframework.web.servlet.config.AnnotationDrivenBeanDefinitionParser`。

# 1 简单了解下功能

`AnnotationDrivenBeanDefinitionParser`，为 `<annotation-driven />` MVC 名称空间元素提供配置。

## 1.1 注册以下 HandlerMappings (映射器们)：

- `RequestMappingHandlerMapping` 的排序为 0，用于将请求映射到带@RequestMapping 注释的控制器方法。
- `BeanNameUrlHandlerMapping` 在排序为 2，以将 URL 路径映射到控制器 bean 名称。

## 1.2 注册以下 HandlerAdapters (适配器们)：

- `RequestMappingHandlerAdapter` 用于使用带@RequestMapping 注解的控制器方法处理请求。
- `HttpRequestHandlerAdapter` 用于使用 HttpRequestHandlers 处理请求。
- `SimpleControllerHandlerAdapter` 用于使用基于接口的控制器处理请求。

## 1.3 注册以下 HandlerExceptionResolvers (异常处理解析器们)：

- `ExceptionHandlerExceptionResolver`，用于通过 `org.springframework.web.bind.annotation.ExceptionHandler` 方法处理异常。
- `ResponseStatusExceptionResolver` 用于使用 `org.springframework.web.bind.annotation.ResponseStatus` 注释的异常。
- `DefaultHandlerExceptionResolver` 用于解析已知的 Spring 异常类型

## 1.4 其他

注册 `org.springframework.util.AntPathMatcher` 和 `org.springframework.web.util.UrlPathHelper` 以供 `RequestMappingHandlerMapping`、`ViewControllers` 的 `HandlerMapping` 和 `HandlerMapping` 服务资源是使用。

对于 JSR-303 实现，会检测 `javax.validation.Validator` 路径是否有效，有效则会帮我们创建对应的实现类并注入。

最后帮我们检测一些列 `HttpMessageConverter` 的实现类们，这些主要是用作直接对请求体里面解析出来的数据进行转换。俗称 http 消息转换器，与参数转换器不一样。
在 SpringMVC 5.1.1 中有以下几个检测：

| 检测路径                                                                               | 注入消息转换器                           | 对应请求类型                |
| -------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------- |
| com.rometools.rome.feed.WireFeed                                                       | RssChannelHttpMessageConverter           | application/atom+xml        |
| javax.xml.bind.Binder                                                                  | Jaxb2RootElementHttpMessageConverter     | application/xml             |
| com.fasterxml.jackson.databind.ObjectMapper & com.fasterxml.jackson.core.JsonGenerator | MappingJackson2HttpMessageConverter      | application/json            |
| com.fasterxml.jackson.dataformat.xml.XmlMapper                                         | MappingJackson2XmlHttpMessageConverter   | application/xml             |
| com.fasterxml.jackson.dataformat.smile.SmileFactory                                    | MappingJackson2SmileHttpMessageConverter | application/x-jackson-smile |
| com.fasterxml.jackson.dataformat.cbor.CBORFactory                                      | MappingJackson2CborHttpMessageConverter  | application/cbor            |
| com.google.gson.Gson                                                                   | GsonHttpMessageConverter                 | application/json            |

除了会帮我们注入以上检测有效的 http 消息转换器外，还会帮我们注入 SpringMVC 自带的几个 http 消息转换器，上面检测的转换器是由上到下顺序加入的，也就是说解析的时候回根据 ContentType 从上到下找合适的。

# 2 源码简介

该标签的解释是在 `org.springframework.web.servlet.config.AnnotationDrivenBeanDefinitionParser` 类的 `parse(..)` 方法中

## 2.1 HandlerMappings 注册

### 2.1.1 `RequestMappingHandlerMapping` 映射器的注册

```java
//生成RequestMappingHandlerMapping组件对象
RootBeanDefinition handlerMappingDef = new RootBeanDefinition(RequestMappingHandlerMapping.class);
handlerMappingDef.setSource(source);
handlerMappingDef.setRole(BeanDefinition.ROLE_INFRASTRUCTURE);
//优先级设置为最高
handlerMappingDef.getPropertyValues().add("order", 0);
//添加contentNegotiationManager属性，处理media type
handlerMappingDef.getPropertyValues().add("contentNegotiationManager", contentNegotiationManager);

if (element.hasAttribute("enable-matrix-variables")) {
    Boolean enableMatrixVariables = Boolean.valueOf(element.getAttribute("enable-matrix-variables"));
    handlerMappingDef.getPropertyValues().add("removeSemicolonContent", !enableMatrixVariables);
}

//配置路径匹配解析器等属性
configurePathMatchingProperties(handlerMappingDef, element, context);
readerContext.getRegistry().registerBeanDefinition(HANDLER_MAPPING_BEAN_NAME , handlerMappingDef);

//将RequestMappingHandlerMapping注册为bean对象放置bean工厂中
RuntimeBeanReference corsRef = MvcNamespaceUtils.registerCorsConfigurations(null, context, source);
handlerMappingDef.getPropertyValues().add("corsConfigurations", corsRef);
```

### 2.1.1 `BeanNameUrlHandlerMapping` 映射器注册就比较随意

```java
// Ensure BeanNameUrlHandlerMapping (SPR-8289) and default HandlerAdapters are not "turned off"
MvcNamespaceUtils.registerDefaultComponents(context, source);
```

放在这里跟 `HttpRequestHandlerAdapter`、`SimpleControllerHandlerAdapter`、`HandlerMappingIntrospector` 一起注册的。

## 2.2 HandlerAdapters 注册

### 2.2.1 `RequestMappingHandlerAdapter` 适配器的注册

```java
//从该标签的 "conversion-service" 属性中获取注入到容器里面的参数转换服务器, 没有则重新创建
RuntimeBeanReference conversionService = getConversionService(element, source, context);
//从该标签的 "validator" 属性中获取注入到容器里面的参数验证服务, 没有则创建
RuntimeBeanReference validator = getValidator(element, source, context);
//从该标签的 "message-codes-resolver" 属性中获取错误码解析器, 没有则不创建
RuntimeBeanReference messageCodesResolver = getMessageCodesResolver(element);

//创建 `WebDataBinder` 初始化使用到的记录器, 并将上面的参数转换和验证相关绑定在其上面
RootBeanDefinition bindingDef = new RootBeanDefinition(ConfigurableWebBindingInitializer.class);
bindingDef.setSource(source);
bindingDef.setRole(BeanDefinition.ROLE_INFRASTRUCTURE);
bindingDef.getPropertyValues().add("conversionService", conversionService);
bindingDef.getPropertyValues().add("validator", validator);
bindingDef.getPropertyValues().add("messageCodesResolver", messageCodesResolver);

//从该标签的 `message-converters` 属性上获取记录请求体转换器的集合，没有则创建默认的
ManagedList<?> messageConverters = getMessageConverters(element, source, context);
//从该标签的 `argument-resolvers` 属性上获取记录自定义参数转换器的集合
ManagedList<?> argumentResolvers = getArgumentResolvers(element, context);
//从该标签的 `return-value-handlers` 属性上获取记录自定义返回值转换器的集合
ManagedList<?> returnValueHandlers = getReturnValueHandlers(element, context);
//从该标签的 "async-support" 子节点解析，获取其中的 "default-timeout" 属性，作为异步处理超时时间，默认null
String asyncTimeout = getAsyncTimeout(element);
//从该标签的 "async-support" 子节点解析，获取其中的 "task-executor" 属性，异步任务线程池
RuntimeBeanReference asyncExecutor = getAsyncExecutor(element);
//从该标签的 "async-support" 子节点解析，获取其中的 "callable-interceptors"节点，异步处理callable类型拦截器
ManagedList<?> callableInterceptors = getCallableInterceptors(element, source, context);
ManagedList<?> deferredResultInterceptors = getDeferredResultInterceptors(element, source, context);

//生成RequestMappingHandlerAdapter组件对象，并将上面获取的相关绑定在该映射器上
RootBeanDefinition handlerAdapterDef = new RootBeanDefinition(RequestMappingHandlerAdapter.class);
handlerAdapterDef.setSource(source);
handlerAdapterDef.setRole(BeanDefinition.ROLE_INFRASTRUCTURE);
handlerAdapterDef.getPropertyValues().add("contentNegotiationManager", contentNegotiationManager);
handlerAdapterDef.getPropertyValues().add("webBindingInitializer", bindingDef);
handlerAdapterDef.getPropertyValues().add("messageConverters", messageConverters);
addRequestBodyAdvice(handlerAdapterDef);
addResponseBodyAdvice(handlerAdapterDef);

if (element.hasAttribute("ignore-default-model-on-redirect")) {
    Boolean ignoreDefaultModel = Boolean.valueOf(element.getAttribute("ignore-default-model-on-redirect"));
    handlerAdapterDef.getPropertyValues().add("ignoreDefaultModelOnRedirect", ignoreDefaultModel);
}
if (argumentResolvers != null) {
    handlerAdapterDef.getPropertyValues().add("customArgumentResolvers", argumentResolvers);
}
if (returnValueHandlers != null) {
    handlerAdapterDef.getPropertyValues().add("customReturnValueHandlers", returnValueHandlers);
}
if (asyncTimeout != null) {
    handlerAdapterDef.getPropertyValues().add("asyncRequestTimeout", asyncTimeout);
}
if (asyncExecutor != null) {
    handlerAdapterDef.getPropertyValues().add("taskExecutor", asyncExecutor);
}

handlerAdapterDef.getPropertyValues().add("callableInterceptors", callableInterceptors);
handlerAdapterDef.getPropertyValues().add("deferredResultInterceptors", deferredResultInterceptors);
readerContext.getRegistry().registerBeanDefinition(HANDLER_ADAPTER_BEAN_NAME , handlerAdapterDef);
```

### 2.2.2 `HttpRequestHandlerAdapter` 和 `SimpleControllerHandlerAdapter` 适配器的注册就比较随意

```java
registerHttpRequestHandlerAdapter(parserContext, source);
registerSimpleControllerHandlerAdapter(parserContext, source);
```

## 2.3 HandlerExceptionResolvers 组件注册

默认采用 `ExceptionHandlerExceptionResolver`(处理 `@ExceptionHandler` 方法注解)、`ResponseStatusExceptionResolver`(处理 `@ResponseStatus` 类型、方法注解)、`DefaultHandlerExceptionResolver`(处理普通的 `Spring` 异常) 作为异常处理类

```java
RootBeanDefinition methodExceptionResolver = new RootBeanDefinition(ExceptionHandlerExceptionResolver.class);
methodExceptionResolver.setSource(source);
methodExceptionResolver.setRole(BeanDefinition.ROLE_INFRASTRUCTURE);
methodExceptionResolver.getPropertyValues().add("contentNegotiationManager", contentNegotiationManager);
methodExceptionResolver.getPropertyValues().add("messageConverters", messageConverters);
methodExceptionResolver.getPropertyValues().add("order", 0);
addResponseBodyAdvice(methodExceptionResolver);
if (argumentResolvers != null) {
    methodExceptionResolver.getPropertyValues().add("customArgumentResolvers", argumentResolvers);
}
if (returnValueHandlers != null) {
    methodExceptionResolver.getPropertyValues().add("customReturnValueHandlers", returnValueHandlers);
}
String methodExResolverName = readerContext.registerWithGeneratedName(methodExceptionResolver);

RootBeanDefinition statusExceptionResolver = new RootBeanDefinition(ResponseStatusExceptionResolver.class);
statusExceptionResolver.setSource(source);
statusExceptionResolver.setRole(BeanDefinition.ROLE_INFRASTRUCTURE);
statusExceptionResolver.getPropertyValues().add("order", 1);
String statusExResolverName = readerContext.registerWithGeneratedName(statusExceptionResolver);

RootBeanDefinition defaultExceptionResolver = new RootBeanDefinition(DefaultHandlerExceptionResolver.class);
defaultExceptionResolver.setSource(source);
defaultExceptionResolver.setRole(BeanDefinition.ROLE_INFRASTRUCTURE);
defaultExceptionResolver.getPropertyValues().add("order", 2);
String defaultExResolverName = readerContext.registerWithGeneratedName(defaultExceptionResolver);
```

## 2.4 其他的根据检测有效路径注册

```java
static {
    ClassLoader classLoader = AnnotationDrivenBeanDefinitionParser.class.getClassLoader();
    javaxValidationPresent = ClassUtils.isPresent("javax.validation.Validator", classLoader);
    romePresent = ClassUtils.isPresent("com.rometools.rome.feed.WireFeed", classLoader);
    jaxb2Present = ClassUtils.isPresent("javax.xml.bind.Binder", classLoader);
    jackson2Present = ClassUtils.isPresent("com.fasterxml.jackson.databind.ObjectMapper", classLoader) &&
    ClassUtils.isPresent("com.fasterxml.jackson.core.JsonGenerator", classLoader);
    jackson2XmlPresent = ClassUtils.isPresent("com.fasterxml.jackson.dataformat.xml.XmlMapper", classLoader);
    jackson2SmilePresent = ClassUtils.isPresent("com.fasterxml.jackson.dataformat.smile.SmileFactory", classLoader);
    jackson2CborPresent = ClassUtils.isPresent("com.fasterxml.jackson.dataformat.cbor.CBORFactory", classLoader);
    gsonPresent = ClassUtils.isPresent("com.google.gson.Gson", classLoader);
}
```

后面会根据上面 Class 路径的检测结果注入相关的验证器和转换器。
