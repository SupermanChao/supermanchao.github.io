---
layout: post
title: "SpringMVC工作原理之处理映射[HandlerMapping]"
subtitle: "SpringMVC映射器"
date: 2019-01-16
categories: 技术
# cover: "http://on2171g4d.bkt.clouddn.com/jekyll-theme-h2o-postcover.jpg"
tags: SpringMVC Spring
---

> 请求过来是怎么映射到对应的方法上，这里离不开映射处理器 `HandlerMapping`，今天这篇笔记就来探究 `HandlerMapping` 实现逻辑。
> 本篇笔记主要分析 SpringMVC 5.1.1 这个版本。

![SpringMVC运行流程](/assets/img/2019-01-16/4322526-4ae5e3f128d7611f.webp)

SpringMVC 内部是根据 `HandlerMapping` 将 `Request` 和 `Controller` 里面的方法对应起来的，为了方便理解，我这里把实现它的子类统称为**映射处理器**[ps: 自己一时兴起瞎起的，不准确还请见谅]。
`HandlerMapping` 功能就是根据请求匹配到对应的 `Handler`，然后将找到的 `Handler` 和所有匹配的 `HandlerInterceptor`（拦截器）绑定到创建的 `HandlerExecutionChain` 对象上并返回。

`HandlerMapping` 只是一个接口类，不同的实现类有不同的匹对方式，根据功能的不同我们需要在 SpringMVC 容器中注入不同的映射处理器 `HandlerMapping`。

简单工作图如下

![HandlerMapping.jpg](/assets/img/2019-01-16/4322526-10fa45bc1a5a7732.webp)

# 1 `HandlerMapping` 接口

## 1.1 `HandlerMapping` 注入

在 `DispatcherServlet` 类中有下面这个方法

```java
public class DispatcherServlet extends FrameworkServlet {
  private void initHandlerMappings(ApplicationContext context) {...}
}
```

容器被初始化的时候会被调用，加载容器中注入的 `HandlerMapping`。其实常用到的 `HandlerMapping` 都是由 [<mvc:annotation-driven />](https://www.jianshu.com/p/fc3bc70b9ed3) 标签帮我们注册的(包括 `RequestMappingHandlerMapping` 和 `BeanNameUrlHandlerMapping `)，如果没有写该标签系统也会帮我们注入默认的映射器，当然也有些需要我们自己手动注入。

## 1.2 `HandlerExecutionChain` 初始化

在 `DispatcherServlet` 类中，`doDispatch(..)` 方法总通过调用本类的 `getHandler(..)` 方法得到 `HandlerExecutionChain` 对象。

![](/assets/img/2019-01-16/4322526-0b387afde0a6b065.webp)

看到这里肯定很模糊，具体 `HandlerMapping` 内部通过调用 `getHandler(..)` 得到 `HandlerExecutionChain` 对象细节请往下看。

## 1.3 `HandlerMapping` 接口

在 `HandlerMapping` 接口中只有一个方法

![](/assets/img/2019-01-16/4322526-e40e3968e20cc7ab.webp)

首先我们来看下实现类结构

![](/assets/img/2019-01-16/4322526-d662a80da46add3e.webp)

展开细看

![](/assets/img/2019-01-16/4322526-f8077211daaa5b73.webp)

大致上分为两大类 `AbstractUrlHandlerMapping` 和 `AbstractHandlerMethodMapping`。都继承自 `AbstractHandlerMapping` 抽象类，实现 `HandlerMapping` 接口。

# 2 `HandlerMapping` 接口实现抽象类 `AbstractHandlerMapping`

在 `AbstractHandlerMapping` 类中实现 `getHandler(..)` 接口方法得到 `HandlerExecutionChain` 对象

![](/assets/img/2019-01-16/4322526-08ace16928109420.webp)

同时 `AbstractHandlerMapping` 继承 `WebApplicationObjectSupport`，初始化时会自动调用模板方法 `initApplicationContext`

![](/assets/img/2019-01-16/4322526-c30047e6f56da89f.webp)

## 2.1 `AbstractHandlerMapping ` 实现类分支之一 `AbstractUrlHandlerMapping`

`AbstractUrlHandlerMapping`：URL 映射的抽象基类，提供将处理程序映射到 `Controller`，所以该类最终直接返回的 `handler` 就是 `Controller` 对象。

实现父抽象类的抽象方法 `getHandlerInternal(..)` 匹配并返回对应的 `Handler` 对象。

![](/assets/img/2019-01-16/4322526-50ce8b58b8ed15d9.webp)

接下来咱们看看根据路径匹对 `handler` 的方法 `lookupHandler(..)`

![](/assets/img/2019-01-16/4322526-c490689674d50069.webp)

上面代码可以看出从 `this.handlerMap` 中通过 `urlPath` 匹对找到对应的 `handler` 对象。那接下来就看下开始是怎么将 `handler` 对象加入到 `this.handlerMap` 集合中是关键。

![](/assets/img/2019-01-16/4322526-9e2cde910c13693d.webp)

那接下来调研这个 `protected void registerHandler(String urlPath, Object handler) {}` 这个方法什么时候调用，怎么调用就是接下来的重点了。
从源码来看是在 `AbstractUrlHandlerMapping` 子类里面调用。

`AbstractUrlHandlerMapping` 的子类从上面截图的类结构可以看出来，大致分为两类：

- 间接继承 `AbstractUrlHandlerMapping` 的 `BeanNameUrlHandlerMapping`
- 直接继承 `AbstractUrlHandlerMapping` 的 `SimpleUrlHandlerMapping`

### 2.1.1 `BeanNameUrlHandlerMapping`

首先来看其父类 `AbstractDetectingUrlHandlerMapping` 怎么调用 `registerHandler(String urlPath, Object handler)` 又怎么匹配到配置在容器中的 `handler` 并将其注入到 `AbstractUrlHandlerMapping` 的 `this.handlerMap` 中。

![](/assets/img/2019-01-16/4322526-6695a25f9381bdb8.webp)

接下来看下 `BeanNameUrlHandlerMapping` 里面的 `determineUrlsForHandler(..)` 方法是怎么实现匹对 beanName 是否跟该映射器相关并返回 URLs 的逻辑吧。

![](/assets/img/2019-01-16/4322526-0896fc325b3d0c28.webp)

从上面的源码分析我们可以得知，在 SpringMVC 容器中，且在注入了 `BeanNameUrlHandlerMapping` 映射器的时候，只要是以 "/" 开头的 bean 的 name，都会作为该映射器匹配的 `Handler` 对象。

接下来咱们就自定义一个经过该映射器匹对的视图，但是在自定义之前我们需要先了解下 `Controller` 这个接口。因为使用 `AbstractUrlHandlerMapping` 的实现类时，需要让控制层的类实现 `Controller` 接口（一般继承 `AbstractController` 即可），另外还有一些已经实现了的 `Controller` 类，如下图所示。但是不论是自己实现 `Controller` 接口还是继承系统已经实现的类，都只能处理一个请求。

![](/assets/img/2019-01-16/4322526-4670265a015ef78c.webp)

首先编写控制层代码

```java
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.mvc.AbstractController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class HelloController extends AbstractController {

    @Override
    protected ModelAndView handleRequestInternal(HttpServletRequest request, HttpServletResponse response) {
        System.out.println("访问方法进来了");
        ModelAndView mv = new ModelAndView();
        mv.setViewName("success");
        return mv;
    }
}
```

接下面在 SpringMVC 容器中注入 `BeanNameUrlHandlerMapping` 映射器和自定义的 `Controller`

```xml
<!-- 注册 HandlerMapping -->
<!--<bean class="org.springframework.web.servlet.handler.BeanNameUrlHandlerMapping"></bean>-->

<!-- <mvc:annotation-driven /> 自动帮我们注入 BeanNameUrlHandlerMapping 映射器, 所以与上面手动注入该映射器选其一就行  -->
<mvc:annotation-driven />

<!-- 注册 Handler -->
<bean id="/hello" class="com.ogemray.urlHandlerMapping.HelloController"></bean>
```

注意手动注入 `BeanNameUrlHandlerMapping` 映射器记得不要跟 [<mvc:annotation-driven />](https://www.jianshu.com/p/fc3bc70b9ed3) 标签自动帮我们注入重复(如自己手动注入要么放在 `<mvc:annotation-driven />` 标签之前，要么直接不写)，不然重复注册两次该映射器虽说没有大的影响，但是也有点浪费内存没必要。
注意自定义 `Controller` 实现类注入 `bean` 的 `id` 或 `name` 必须以 "/" 开头，因为上面分析源码说过，`BeanNameUrlHandlerMapping` 映射器主要映射以 "/" 开头的 beanName。

### 2.1.2 `SimpleUrlHandlerMapping`

在接下来咱们看看该映射器是怎么调用父类的 `registerHandler(String urlPath, Object handler)` 方法将 `handler` 加进 `AbstractUrlHandlerMapping` 的 `this.handlerMap` 中。

![](/assets/img/2019-01-16/4322526-b2aba0cf58c6d8bd.webp)

从上面源码可以看出 `SimpleUrlHandlerMapping` 映射器跟前面 `BeanNameUrlHandlerMapping` 映射器有点不一样。后者是有点类似遍历容器里面有所的 `bean` 的 `name` 或 `id` 找到匹配的，并且 `bean` 的 `name` 或 `id` 有特殊要求，匹配的则加入。而前者则是先将加入该映射器的 `handler` 先加进该映射器的一个集合属性里面，容器初始化的时候免去了遍历麻烦的步骤。

接下来咱们就自定义一个经过该映射器匹对的视图。

```java
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.mvc.AbstractController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class HelloController extends AbstractController {

    @Override
    protected ModelAndView handleRequestInternal(HttpServletRequest request, HttpServletResponse response) {
        System.out.println("访问方法进来了");
        ModelAndView mv = new ModelAndView();
        mv.setViewName("success");
        return mv;
    }
}
```

接下面在 Spring MVC 容器中注入 `SimpleUrlHandlerMapping` 映射器和自定义的 `Controller`

```xml
<!-- 注册 HandlerMapping -->
<bean class="org.springframework.web.servlet.handler.SimpleUrlHandlerMapping">
    <property name="mappings">
        <props>
            <prop key="/hello">helloController</prop>
        </props>
    </property>
</bean>
<!-- 注册 Handler -->
<bean id="helloController" class="com.ogemray.urlHandlerMapping.HelloController"></bean>
```

## 2.2 `AbstractHandlerMapping` 实现类分支之二 `AbstractHandlerMethodMapping`

`AbstractHandlerMethodMapping` 最终获取的 `handler` 是 `HandlerMethod` 类型对象。实现该抽象类的子类映射器具体映射什么样的方法，怎么实现请求和方法的映射，该抽象类都给出了抽象接口，可高度自定义[ps: 这里给我印象很深，学到了]。

接下来看下该类的实现链：

![](/assets/img/2019-01-16/4322526-9f22c571677a1126.webp)

具体实现类只有一个 `RequestMappingHandlerMapping`，在开始下面正式逻辑分析之前，我们需要了解几个类。

### 2.2.1 简单了解 `HandlerMethod`

`HandlerMethod` 其实可以简单理解为保持方法信息的 pojo 类

### 2.2.2 `RequestMappingInfo` 类

主要用来记录方法上 `@RequestMapping()` 注解里面的参数，针对 `RequestMappingHandlerMapping` 映射器来使用。

在容器初始化过程中创建映射器(`RequestMappingHandlerMapping`)对象时，会寻找所有被`@Controller` 注解类中被 `@RequestMapping` 注解的方法，然后解析方法上的 `@RequestMapping` 注解，把解析结果封装成 `RequestMappingInfo` 对象，也就是说`RequestMappingInfo` 对象是用来装载方法的匹配相关信息，每个匹配的方法都会对应一个 `RequestMappingInfo` 对象。现在大家应该能明白 `RequestMappingInfo` 的作用了吧。

![](/assets/img/2019-01-16/4322526-3093bc32e7af55a6.webp)

- `PatternsRequestCondition`：模式请求路径过滤器，对应记录和判断 `@RequestMapping` 注解上的 `value` 属性。
- `RequestMethodsRequestCondition`：请求方法过滤器，对应记录和判断 `@RequestMapping` 注解上的 `method` 属性。
- `ParamsRequestCondition`：请求参数过滤器，对应记录和判断 `@RequestMapping` 注解上的 `params` 属性。
- `HeadersRequestCondition`：头字段过滤器，对应记录和判断 `@RequestMapping` 注解上的 `headers` 属性。
- `ConsumesRequestCondition`：请求媒体类型过滤器，对应记录和判断 `@RequestMapping` 注解上的 `consumes` 属性。
- `ProducesRequestCondition`：应答媒体类型过滤器，对应记录和判断 `@RequestMapping` 注解上的 `produces` 属性。
- `RequestConditionHolder`：预留自定义扩展过滤器。

### 2.2.3 进入 `AbstractHandlerMethodMapping` 映射器内部

**① 首先来看下该类实现父抽象类(`AbstractHandlerMapping`) 的抽象方法 `getHandlerInternal(..)` 匹配并返回对应的 `handler` 对象。**

![](/assets/img/2019-01-16/4322526-c29679a01b2264de.webp)

跟前面的另一个实现分支 `AbstractUrlHandlerMapping` 实现看起来差不多，都是根据请求路径来匹对，但是内部配对方式有什么不同还需要我们接着往下看。

![](/assets/img/2019-01-16/4322526-a62c6c346ef0e0e5.webp)

**注意：**

- `Match` 就是该抽象类里面自定义的一个内部类，用来记录方法标记信息对象 `mapping` 和方法源信息对象 `HandlerMethod`。
- 当请求为 restful 风格时，将会遍历所有的 mapping，然后一个个匹对，非常耗时和费资源。优化请参考 [springMVC 在 restful 风格的性能优化](https://blog.csdn.net/shjhhc/article/details/53261168)
- 上面的两个抽象方法(`getMatchingMapping(..)` 和 `getMappingComparator(..)`)
  前者要实现检查提供的请求映射信息中的条件是否与请求匹配。
  后者要实现当一个 `Request` 对应多个 `mapping` 时的择优方案。

**② 看下存储映射关系对象(`MappingRegistry`)内部结构**
说到这里，可能大家对于这个 `this.mappingRegistery` 对象十分好奇，里面到底是怎么存储数据的，先是可以根据 `lookupPath` 找到 `List<mapping>`，接着后来又根据 `mapping` 找到 `HandlerMethod` 对象。

![](/assets/img/2019-01-16/4322526-3a862e4382b20a93.webp)

该实体类里面最重要的两个记录集合分别是 `mappingLookup` 和 `urlLookup` 。

- `urlLookup`：主要用来记录 `lookupPath` 请求路径对应的 `mapping` 集合。
  这里 Spring 留了一个很活的机制，拿 `@RequestMapping` 注解来说，他的 `value` 属性本身就是一个字符数组，在多重设置中难免有路径重复的，所以最终有可能会出现一个 `lookupPath` 对应多个 `RequestMappingInfo`，最终在请求过来的时候给了自定义抽象方法让实现类自己实现择优的方式。
  `MutivalueMap` 是 SpringMVC 自定义的一个 `Map` 类，key 对应的 value 是一个集合，这从名字上也能看出来。

- `mappingLookup`：key 是 `mapping` 对象，value 是 `HandlerMethod` 对象，最终是通过 `lookupPath` 在 `urlLookup` 集合中找到对应的 `mapping` 对象，通过 `mapping` 在 `mappingLookup` 集合中找到 `HandlerMethod` 对象。

**③ 看下是怎么将映射关系装进缓存(`MappingRegistry`) 对象中的**

容器初始化的时候都干了些什么

![](/assets/img/2019-01-16/4322526-2893086eb8b89bff.webp)

`isHandler(..)` 是该抽象类定义的抽象方法，由实现类自己去实现匹对哪些类。看下 `RequestMappingHandlerMapping` 映射器是怎么实现的吧

![](/assets/img/2019-01-16/4322526-1b68a7be551f0941.webp)

看来 `RequestMappingHandlerMapping` 映射器，只要类上有 `Controller` 或 `RequestMapping` 注解，就符合该映射器管辖范围。

接着解析往下看

![](/assets/img/2019-01-16/4322526-607bdd915549b85d.webp)

来个分支看下 `RequestMappingHandlerMapping` 是怎么实现抽象方法 `getMappingForMethod(..)` 方法的，该映射器都匹配什么样的方法呢？

![](/assets/img/2019-01-16/4322526-e6ed500b2743613e.webp)

猜也能猜到，`RequestMappingHandlerMapping` 映射器肯定匹配有 `@RequestMapping` 注解的方法，并返回该方法的映射信息对象 `RequestMappingInfo` 对象。

下面就到了最后一步，具体这个映射关系是怎么装入映射器的 `MappingRegistry` 对象属性的缓存的呢？

![](/assets/img/2019-01-16/4322526-49a02a5cd6db14b7.webp)

# 3 总结

到这里，关于 SpringMVC 内部是怎么通过 `HandlerMapping` 映射器将各自对应映射的资源在容器初始的时候装到自身的缓存，在请求过来时又是怎么找到对应的资源返回最终对应的 `handler` 对象已经描述完了。

现在开发我们基本都不用 `AbstractUrlHandlerMapping` 这种类型的映射器了，但是 SpringMVC 内部还有用到的地方，例如直接 `<mvc:view-controller path="" view-name=""/>` 标签配置资源不经过视图控制器直接跳转就用到了 `SimpleUrlHandlerMapping` 这种映射器。`AbstractUrlHandlerMapping` 匹对解析对应请求最终返回的 `handler` 是 `Controller` 对象。
现在我们习惯直接用 `@Controller` 和 `@RequestMapping` 这样注解来描述视图控制器的逻辑，这种资源映射用的是 `AbstractHandlerMethodMapping` 抽象类的子类 `RequestMappingHandlerMapping` 映射器，匹对解析对应的请求返回`HandlerMethod` 对象。

通过研究这种映射，对于我个人来说学到了很多，优秀的设计模式遵循开闭原则，扩展放开修改关闭，高度模块化同时也支持高度自定义话，优秀！！！
