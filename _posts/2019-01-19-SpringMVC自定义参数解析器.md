---
layout: post
title: "SpringMVC自定义参数解析器"
# subtitle: "SpringMVC自定义参数解析器"
date: 2019-01-19
categories: 技术
cover: "http://on2171g4d.bkt.clouddn.com/jekyll-theme-h2o-postcover.jpg"
tags: SpringMVC Spring 参数解析器
---

> 前面一篇[SpringMVC 工作原理之参数解析](https://www.jianshu.com/p/2bfd65bc9ce4)分析了参数解析及转换的过程，先是通过参数解析器解析参数，然后再是转换器转换参数，最终绑定到对应 RequestMapping 方法参数上。但是在有些时候 SpringMVC 提供的参数解析器或参数转换器满足不了我们的需求，这个时候就需要我们自己按照 SpringMVC 提供的接口进行自定义。

# 一 自定义参数解析器

## 1 场景分析

在有些开发场景中，SpringMVC 提供的参数解析器满足不了咱们的需求。例如在数据量大的提交环境中，提交数据用到了表单和 JSON 融合的方式，就是表单某个字段的 value 是 JSON 字符串。

如果整个提交的数据体是 JSON 数据还好，导入 Jackson 架包，用 `@RequestBody` 修饰参数，最终 SpringMVC 会通过自带的 `RequestResponseBodyMethodProcessor` 解析器进行解析，使用 Jackson 提供的 `MappingJackson2HttpMessageConverter` 转换器将 JSON 数据转换成我们想要的格式。

如果提交的是正常表单数据也好，用 `@RequestParam` 修饰参数，最终 SpringMVC 会通过自带的 `RequestParamMethodArgumentResolver` 解析器解析出表单里面的 `value`，然后找到合适的转换器将数据装换成我们想要的格式。

但是现在是表单里面掺杂了 JSON 字符串的 `value`，为了优雅的解决这个问题，就需要我们自定义一个参数解析器。

## 2 开始代码编写

假设现在是一个发送消息的请求，表单提交的数据前面的 `key` 和 `value` 指明了发送人的信息，后面有一个 `key` 对一个发送消息体，是一个 JSON 字符串，里面指明了消息的具体情况。

注意：开始下面代码前需要先导入 Jackson 支持 JSON 数据转换的架包。

### ① 自定义名叫 `JSONRequestParam` 参数注解

```java
import org.springframework.core.annotation.AliasFor;
import java.lang.annotation.*;

@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface JSONRequestParam {

    @AliasFor("name")
    String value() default "";

    @AliasFor("value")
    String name() default "";

    boolean required() default true;
}
```

### ② 自定义名叫 `JSONArgumentResolver` 参数解析器，需要实现 `HandlerMethodArgumentResolver` 接口

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import javax.servlet.http.HttpServletRequest;

public class JSONArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(JSONRequestParam.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer, NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {

        //得到 JSONRequestParam 注解信息并将其转换成用来记录注解信息的 JSONRequestParamNamedValueInfo 对象
        JSONRequestParam jsonRequestParam = parameter.getParameterAnnotation(JSONRequestParam.class);
        JSONRequestParamNamedValueInfo namedValueInfo = new JSONRequestParamNamedValueInfo(jsonRequestParam.name(), jsonRequestParam.required());
        if (namedValueInfo.name.isEmpty()) {
            namedValueInfo.name = parameter.getParameterName();
            if (namedValueInfo.name == null) {
                throw new IllegalArgumentException(
                        "Name for argument type [" + parameter.getNestedParameterType().getName() +
                                "] not available, and parameter name information not found in class file either.");
            }
        }

        HttpServletRequest servletRequest = webRequest.getNativeRequest(HttpServletRequest.class);

        //获得对应的 value 的 JSON 字符串
        String jsonText = servletRequest.getParameter(namedValueInfo.name);

        //得到参数的 Class
        Class clazz = parameter.getParameterType();

        //使用 Jackson 将 JSON 字符串转换成我们想要的对象类
        ObjectMapper mapper = new ObjectMapper();
        Object value = mapper.readValue(jsonText, clazz);

        return value;
    }

    private static class JSONRequestParamNamedValueInfo {

        private String name;

        private boolean required;

        public JSONRequestParamNamedValueInfo(String name, boolean required) {
            this.name = name;
            this.required = required;
        }
    }
}
```

### ③ 自定义参数解析器的注入

最终我们需要将自定义的参数解析器注入到 `RequestMappingHandlerAdapter` 适配器的 `customArgumentResolvers` 的集合属性中。但是该适配器一般是由 [<mvc:annotation-driven />](https://www.jianshu.com/p/fc3bc70b9ed3) 标签帮我们注入的，所以在写了该标签的情况下就不要自己手动注入，所以正确的注入姿势如下：

```xml
<mvc:annotation-driven>
    <mvc:argument-resolvers>
        <bean class="com.ogemray.springmvc.controller.JSONArgumentResolver"></bean>
    </mvc:argument-resolvers>
</mvc:annotation-driven>
```

④ 编写参数需要转换的 POJO 类

```java
public class Message {

    //1. 文字  2. 图片 3. 语音 4. 其他
    private int type;

    //文字类容
    private String content;

    //图片信息
    private float picWidth;
    private float picHeight;
    private float picAddress;

    //语音信息
    private float voiceTime;
    private float voiceAddress;
}
```

⑤ 编写 Controller 里面对应的方法代码

```java
@ResponseBody
@RequestMapping(value = "hello", method = RequestMethod.POST)
public String testHello(@RequestParam String touid, @JSONRequestParam(value = "msg") Message message) {

    System.out.println("发送人UID : " + touid);
    System.out.println(message);
    return "success";
}
```

这里为了更直观很多东西做了简化，参数包括两部分，前面是正常键值对标记接收人的 uid，后面用自定义 `@JSONRequestParam` 注解修饰的消息实体。返回值也只是一个字符串，并将该字符串直接写入到 Response 的 body 里面，所以请求头里面的 Accept 字段应该标记接收内容格式为文本格式。

⑥ AJAX 发送请求

```html
<a id="tag" href="${pageContext.request.contextPath}/hello">点击发送消息</a>
<script type="text/javascript">
  $("#tag").click(function () {
    var msgBody = { type: 1, content: "Hello Word" };
    var args = { touid: "893081892", msg: JSON.stringify(msgBody) };

    $.ajax({
      url: this.href,
      type: "POST",
      data: args,
      contentType: "application/x-www-form-urlencoded; charset=utf-8",
      headers: { Accept: "text/html; charset=utf-8" },
      success: function (data, textStatus) {
        console.log(textStatus);
        console.log(data);
      },
      error: function (data, textStatus, errorThrown) {
        console.log(textStatus);
        console.log(data);
        console.log(errorThrown);
      },
    });
    return false;
  });
</script>
```

注意：这里需要指明发送的数据为表单格式(即 `Content-Type = application/x-www-form-urlencoded; charset=utf-8`)

# 二 自定义参数转换器

## 1 使用场景

在某些时候，表单提交大量数据时就显得很复杂，例如需要提交关于某个人的信息，需要包含名字、年龄、身高......，这时候请求体里面就需要大量的键值对，如果我们将一个人的信息用特殊符号分割写进一个字符串里面，这样一个键值对就可以将整个人的信息都传递出去，服务器按照指定格式解析字符串，这样一来便节省了不必要的流量消耗。这种情况下 SpringMVC 提供的转换器就不够用了，需要我们自定义转换器。

## 2 开始代码编写

假设提交的个人信息字符串里面包括人的名字、年龄、身高、和体重，然后用 "&" 字符分割。

### ① 首先写一个关于记录人信息的 POJO 类

```
public class Person {
    private String name;
    private Integer age;
    private Float height;
    private Float weight;
}
```

### ② 自定义类名为 `PersonConverter` 转换器，需要实现 `Converter` 接口

```java
import org.springframework.core.convert.converter.Converter;

public class PersonConverter implements Converter<String, Person> {

    @Override
    public Person convert(String source) {

        if (source != null) {
            String[] array = source.split("&");
            if (array.length >= 4) {
                Person person = new Person();
                person.setName(array[0]);
                person.setAge(Integer.parseInt(array[1]));
                person.setHeight(Float.parseFloat(array[2]));
                person.setWeight(Float.parseFloat(array[3]));
                return person;
            } else  {
                System.out.println("参数不合法 : " + source);
            }
        }
        return null;
    }
}
```

### ③ 将自定义的转换器注入到容器

[<mvc:annotation-driven />](https://www.jianshu.com/p/fc3bc70b9ed3) 标签会自动帮我们创建并注入 `ConfigurableWebBindingInitializer` 对象，该对象上面记录了验证器(`validator` 属性)、转换器相关(`conversionService` 属性)等等，最终将该对象绑定到 `RequestMappingHandlerAdapter` 适配器上，用作后来的参数验证及转换。

在源码里 [<mvc:annotation-driven />](https://www.jianshu.com/p/fc3bc70b9ed3) 标签帮我们创建的 `conversionService` 是 `FormattingConversionServiceFactoryBean` 工厂类 bean，所以我们下面自定义也用它。使用`FormattingConversionServiceFactoryBean` 可以让 SpringMVC 支持 `@NumberFormat` 和 `@DateTimeFormat` 等 Spring 内部自定义的转换器。

```xml
<bean id="conversionService" class="org.springframework.format.support.FormattingConversionServiceFactoryBean">
    <property name="converters">
        <set>
            <bean class="com.ogemray.converter.PersonConverter"></bean>
        </set>
    </property>
</bean>
<mvc:annotation-driven conversion-service="conversionService" />
```

### ④ 编写 Controller 里面对应的方法代码

```java
@ResponseBody
@RequestMapping(value = "hello", method = RequestMethod.POST)
public String testHello(Person person) {
    System.out.println(person);
    return "success";
}
```

这里也是为了代码直观做了简化，直接返回字符串简单了解提交状态。

### ⑤ AJAX 发送请求

```html
<a id="tag" href="${pageContext.request.contextPath}/hello">点击发送请求</a>
<script type="text/javascript">
  $("#tag").click(function () {
    $.ajax({
      url: this.href,
      type: "POST",
      data: { person: "Tom&18&175.1&56.8" },
      contentType: "application/x-www-form-urlencoded; charset=utf-8",
      heanders: { Accept: "text/html; charset=utf-8" },
      success: function (data) {
        console.log(data);
      },
      error: function () {},
    });
    return false;
  });
</script>
```

# 总结

优秀的框架支持开闭原则，对外扩展开放，内部修改关闭。通过这两个自定义可以学到很多优秀的编程思想。
