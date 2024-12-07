---
layout: post
title: "SpringMVC入门笔记"
subtitle: "SpringMVC入门笔记"
date: 2019-01-15
categories: 技术
# cover: ""
tags: SpringMVC Spring
---

> SpringMVC 细节方面的东西很多，所以在这里做一篇简单的 SpringMVC 的笔记记录，方便以后查看。

Spring MVC 是当前最优秀的 MVC 框架，自从 Spring 2.5 版本发布后，由于支持注解配置，易用性有了大幅度的提高。Spring 3.0 更加完善，实现了对老牌的 MVC 框架 Struts 2 的超越，现在版本已经到了 Spring5.x 了。

# 一、工程创建

## 1. 创建 Maven 的 web 工程，添加架包

Maven 架包添加 `spring-context`、`spring-web`、`spring-webmvc`、`log4j`

## 2. 在 web.xml 中配置 DispatcherServlet

```xml
<servlet>
  <servlet-name>dispatcherServlet</servlet-name>
  <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
  <init-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>classpath:spring-mvc.xml</param-value>
  </init-param>
  <load-on-startup>1</load-on-startup>
</servlet>

<servlet-mapping>
  <servlet-name>dispatcherServlet</servlet-name>
  <url-pattern>/</url-pattern>
</servlet-mapping>
```

**注意：**这里配置的 `<url-pattern>/</url-pattern>` 拦截资源配置的是 `/`，拦截所有除其他 `servlet` 之外的资源访问，包括 jsp、静态网页、图片等等。与 `/*` 不一样，`/*` 一般配在拦截器里面，拦截所有资源访问。

## 3. 创建 SpringMVC 的配置文件

上面配置 `DispatcherServlet` 里面用到了 `contextConfigLocation` 配置文件的地址，下面来创建配置文件。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:mvc="http://www.springframework.org/schema/mvc"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd
       http://www.springframework.org/schema/context
       http://www.springframework.org/schema/context/spring-context.xsd
       http://www.springframework.org/schema/mvc
       http://www.springframework.org/schema/mvc/spring-mvc.xsd">

    <!-- scan the package and the sub package -->
    <context:component-scan base-package="com.ogemray.springmvc"></context:component-scan>

    <!-- don't handle the static resource -->
    <mvc:default-servlet-handler />

    <!-- if you use annotation you must configure following setting -->
    <mvc:annotation-driven />

    <!-- configure the InternalResourceViewResolver -->
    <bean class="org.springframework.web.servlet.view.InternalResourceViewResolver">
        <property name="prefix" value="/WEB-INF/jsp/"></property>
        <property name="suffix" value=".jsp"></property>
    </bean>

    <!-- 配置首页跳转, 省略了在 Controller 里的创建访问方法 -->
    <mvc:view-controller path="index" view-name="../index"></mvc:view-controller>

</beans>
```

# 二、@RequestMapping 注解

在对 SpringMVC 进行的配置的时候, 需要我们指定请求与处理方法之间的映射关系。 指定映射关系，就需要我们用上 `@RequestMapping` 注解。
`@RequestMapping` 是 Spring Web 应用程序中最常被用到的注解之一，这个注解会将 HTTP 请求映射到控制器（Controller 类）的处理方法上。

## 1. value 和 method 属性

简单例子

```java
@RequestMapping("rm")
@Controller
public class RequestMappingController {

    @RequestMapping(value = {"home", "/", ""}, method = RequestMethod.GET)
    public String goRMHome() {
        System.out.println("访问了 Test RequestMapping 首页");
        return "1-rm";
    }
}
```

最终访问路径是 `.../rm/home`，通过该方法返回视图名字和 SpringMVC 视图解析器加工，最终会转发请求到 `.../WEB-INF/jsp/1-rm.jsp` 页面。

如果没有类名上面的 `@RequestMapping("rm")`，则访问路径为 `.../home`。

`method` 指定方法请求类型，取值有 GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS, TRACE。

`value` 为数组字符串，指定访问路径与方法对应，指定的地址可以是 URI。URI 值可以是中：普通的具体值、包含某变量、包含正则表达式。

下面以包含某一变量举例：

```java
@RequestMapping(value = "testPathVariable/{username}", method = RequestMethod.GET)
public String testPathVariable(@PathVariable(value = "username") String name) {
    //参数部分也可以直接写成 @PathVariable String username, 省略value, 保证形参名与上面 {} 内的名字一致
    //不建议省略
    System.out.println("访问了 Test PathVariable 方法 username: " + name);
    return "success";
}
```

## 2. consumes 属性

指定处理请求的提交内容类型（Content-Type）

![](/assets/img/2019-01-15/4322526-716d9ec1f07e0600.webp)

```java
@RequestMapping(value = "testConsumes", method = RequestMethod.POST, consumes = "application/x-www-form-urlencoded")
public String testConsumes() {
    System.out.println("访问了 Test Consumes 方法");
    return "success";
}
```

如果请求里面的 Content-Type 对不上会报错

![](/assets/img/2019-01-15/4322526-5feb653e10cc68ac.webp)

## 3. produces 属性

指定返回的内容类型，仅当 request 请求头中的(Accept)类型中包含该指定类型才返回

![](/assets/img/2019-01-15/4322526-7397b060a717e9dc.webp)

其中 `*/*;q=0.8` 表明可以接收任何类型的，权重系数 0.8 表明如果前面几种类型不能正常接收则使用该项进行自动分析。

```java
@RequestMapping(value = "testProduces", method = RequestMethod.POST, produces = "text/html")
public String testProduces() {
    return "success";
}
```

## 4. params 属性

指定 request 中必须包含某些参数值，才让该方法处理

JSP 页面请求

```xml
<form action="${pageContext.request.contextPath}/rm/testParams" method="post">
    用户名: <input type="text" name="username" value="Tom"><br>
    密  码: <input type="text" name="password" value="123"><br>
    <input type="submit" value="测试 Test Params">
</form>
```

Controller 里面对应的请求方法

```java
@RequestMapping(value = "testParams", method = RequestMethod.POST, params = {"username!=Tom", "password"})
public String testParams() {
    return "success";
}
```

`params = {"username!=Tom", "password"}` 表示请求参数里面 `username !=Tom` 且有包含 `password`，二者有一个不满足则会报错

![](/assets/img/2019-01-15/4322526-a316c01faa79bb13.webp)

## 5. headers 属性

指定 request 中必须包含某些指定的 header 值，才能让该方法处理请求

```java
@RequestMapping(value = "testHeaders", method = RequestMethod.GET, headers = "Accept-Language=zh-CN,zh;q=0.9")
public String testHeaders() {
    return "success";
}
```

如果跟设定头里面对不上会报 404 错误

![](/assets/img/2019-01-15/4322526-c146e01d501ca623.webp)

# 三、@RequestParam 注解

请求

```html
<a href="${pageContext.request.contextPath}/rp/testGetOneParam?username=Tom"
  >单参数 GET 请求方式</a
>
```

## 1. 表单元素的 name 名字和控制器里的方法的形参名一致，此时可以省略 @RequestParam 注解

```java
@RequestMapping(value = "testGetOneParam", method = RequestMethod.GET)
public String testGetOneParam(String username) {
    System.out.println("访问了 单参数 Get 请求方法 username: " + username);
    return "success";
}
```

## 2. 不省略时的写法

示例

```java
@RequestMapping(value = "testPostOneParam", method = RequestMethod.POST)
public String testPostOneParam(@RequestParam String username) {
    System.out.println("username: " + name);
    return "success";
}
```

参数名字不一致时

```java
@RequestMapping(value = "testPostOneParam", method = RequestMethod.POST)
public String testPostOneParam(@RequestParam(value = "username", required = false, defaultValue = "") String name) {
    System.out.println("username: " + name);
    return "success";
}
```

`value` 属性指定传过来的参数名，跟方法里的形参名字对应上

`required` 指定该参数是否是必须携带的

`defaultValue` 没有或者为 `null` 时，指定默认值

**注：省略和不省略 `@RequestParam` 注解，最终 SpringMVC 内部都是使用 `RequestParamMethodArgumentResolver` 参数解析器进行参数解析的。如果省略 `@RequestParam` 注解或省略 `@RequestParam` 注解的 `value` 属性则最终则以形参的名字作为 `key` 去 `HttpServletRequest` 中取值。**

# 四、@RequestHeader 和 @CookieValue 注解

**`@RequestHeader` 注解：可以把 Request 请求 header 部分的值绑定到方法的参数上**

```java
@RequestMapping(value = "rh")
@Controller
public class RequestHeaderController {

    @RequestMapping(value = "testRHAccept", method = RequestMethod.GET)
    public String testRHAccept(@RequestHeader(value = "Accept") String accept) {
        System.out.println(accept);
        return "success";
    }

    @RequestMapping(value = "testRHAcceptEncoding", method = RequestMethod.GET)
    public String testRHAcceptEncoding(@RequestHeader(value = "Accept-Encoding") String acceptEncoding) {
        System.out.println(acceptEncoding);
        return "success";
    }
}
```

**`@CookieValue` 注解：可以把 Request header 中关于 cookie 的值绑定到方法的参数上**

![](/assets/img/2019-01-15/4322526-fc95ee4f30f0e030.webp)

```java
@RequestMapping(value = "cv")
@Controller
public class CookieValueController {
    @RequestMapping(value = "testGetCookieValue", method = RequestMethod.GET)
    public String testGetCookieValue(@CookieValue(value = "JSESSIONID") String cookie) {
        System.out.println("获取到Cookie里面 JSESSIONID 的值 " + cookie);
        return "success";
    }
}
```

# 五、数据结果封装 ModelAndView & ModelMap & Map & Model

SpringMVC 为了方便数据封装和处理，提供了以下几种方案，最终会将封装到模型里面的数据全都通过 `request.setAttribute(name, value)` 添加 request 请求域中。

## 1. ModelAndView

使用 `ModelAndView` 类用来存储处理完后的结果数据，以及显示该数据的视图。从名字上看 `ModelAndView` 中的 `Model` 代表模型，`View` 代表视图。`model `是 `ModelMap` 的类型，而 `ModelMap` 又是 `LinkedHashMap` 的子类，`view` 包含了一些视图信息。

```java
@RequestMapping(value = "testReturnModelAndView", method = RequestMethod.GET)
public ModelAndView testReturnModelAndView() {

    Student s1 = new Student(1, "Tom", 13, new Date());
    Student s2 = new Student(2, "Jerry", 14, new Date());

    List<Student> list = new ArrayList<>();
    list.add(s1); list.add(s2);

    HashMap<String, Student> map = new HashMap<>();
    map.put("s1", s1); map.put("s2", s2);

    ModelAndView mv = new ModelAndView();
    mv.addObject("s1", s1);
    mv.addObject("s2", s2);

    mv.addObject("list", list);
    mv.addObject("map", map);
    mv.setViewName("5-m&v-success");
    return mv;
}
```

## 2. ModelMap & Map & Model

最终也是将封装的数据和返回视图名字封装成 ModelAndView 对象

```java
@RequestMapping(value = "testMapParam", method = RequestMethod.GET)
public String testMapParam(Map<String, Object> paramMap) {
    ...
    paramMap.put("s1", s1);
    paramMap.put("s2", s2);

    paramMap.put("list", list);
    paramMap.put("map", map);
    return "5-m&v-success";
}

@RequestMapping(value = "testModelParam", method = RequestMethod.GET)
public String testModelParam(Model model) {
    ...
    model.addAttribute("s1", s1);
    model.addAttribute("s2", s2);

    model.addAttribute("list", list);
    model.addAttribute("map", map);
    return "5-m&v-success";
}

@RequestMapping(value = "testModelMapParam", method = RequestMethod.GET)
public String testModelMapParam(ModelMap modelMap) {
    ...
    modelMap.addAttribute("s1", s1);
    modelMap.addAttribute("s2", s2);

    modelMap.addAttribute("list",list);
    modelMap.addAttribute("map", map);
    return "5-m&v-success";
}
```

## 3. JSP 页面提取数据

```xml
<%@ page contentType="text/html;charset=UTF-8" language="java" pageEncoding="UTF-8" isELIgnored="false" %>
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<html>
<body>

    <c:if test="${s1 != null && s2 != null}">
        <h3 align="center">单个数据封装</h3>
        <table border="1px solid black" style="border-collapse: collapse" align="center">
            <tr><td colspan="2" align="center">s1</td></tr>
            <tr><td>姓名</td><td>${s1.name}</td></tr>
            <tr><td>年龄</td><td>${s1.age}</td></tr>
            <tr><td>生日</td><td>${s1.birthday.toString()}</td></tr>

            <tr><td colspan="2" align="center">s2</td></tr>
            <tr><td>姓名</td><td>${s2.name}</td></tr>
            <tr><td>年龄</td><td>${s2.age}</td></tr>
            <tr><td>生日</td><td>${s2.birthday.toString()}</td></tr>
        </table>
    </c:if>

    <c:if test="${list != null}">
        <h3 align="center">List数据封装</h3>
        <table border="1px solid black" style="border-collapse: collapse" align="center">
            <c:forEach items="${list}" var="s" varStatus="status">
                <tr><td colspan="2" align="center">${status.count}</td></tr>
                <tr><td>姓名</td><td>${s.name}</td></tr>
                <tr><td>年龄</td><td>${s.age}</td></tr>
                <tr><td>生日</td><td>${s.birthday.toString()}</td></tr>
            </c:forEach>
        </table>
    </c:if>

    <c:if test="${map != null}">
        <h3 align="center">Map数据封装</h3>
        <table border="1px solid black" style="border-collapse: collapse" align="center">
            <c:forEach items="${map}" var="node">
                <tr><td colspan="2" align="center">${node.key}</td></tr>
                <tr><td>姓名</td><td>${node.value.name}</td></tr>
                <tr><td>年龄</td><td>${node.value.age}</td></tr>
                <tr><td>生日</td><td>${node.value.birthday.toString()}</td></tr>
            </c:forEach>
        </table>
    </c:if>
</body>
</html>
```

# 六、@SessionAttributes

如果我们希望在多个请求之间共用某个模型属性数据，则可以在控制器类上标注一个 `@SessionAttributes`，SpringMVC 将把模型中对应的属性暂存到 `HttpSession` 的域中。

**使用方法：**

`@SessionAttributes(value={"xxx"}, types={xxxx.class})`

`value`：是通过键来指定放入`HttpSession` 的域中的值；

`types`：是通过类型指定放入`HttpSession` 的域中的值；

`@SessionAttributes(types=Student.class)`这个注解会将类中所有放入 `Request` 域中的 `Student` 对象同时放进 `HttpSession` 的域空间中。

可以添加多个属性

`@SessionAttributes(value={“s1”, “s2”}) `

`@SessionAttributes(types={User.class, Grade.class})`

可以混合使用

`@SessionAttributes(value={“s1”, “s2”},types={Grade.class})`

**示例**

```java
//@SessionAttributes(value = {"s1", "s2"})
@SessionAttributes(types = Student.class)
@RequestMapping(value = "sa")
@Controller
public class SessionAttributesController {

    @RequestMapping(value = "testSA", method = RequestMethod.GET)
    public String testSessionAttributes(Model model) {
        Student s1 = new Student(1, "Tom", 13, new Date());
        Student s2 = new Student(2, "Jerry", 13, new Date());

        model.addAttribute("s1", s1);
        model.addAttribute("s2", s2);
        return "6-sa-success";
    }
}
```

**JSP 页面提取数据**

```html
<%@ page contentType="text/html;charset=UTF-8" language="java"
pageEncoding="UTF-8" isELIgnored="false" %>
<html>
  <body>
    request s1 : ${requestScope.get("s1")}<br /><br />
    request s2 : ${requestScope.get("s2")}<br /><br />

    session s1 : ${sessionScope.get("s1")}<br /><br />
    session s2 : ${sessionScope.get("s2")}<br /><br />
  </body>
</html>
```

# 七、@ModelAttribute

该注解平时使用的比较多，不仅可以写在方法上面也可以写在参数前面。

## 1. @ModelAttribute 写在方法上面

- 在同一个控制器中，标注了`@ModelAttribute` 的方法实际上会在 `@RequestMapping` 注解方法之前被调用。
- 标注了`@ModelAttribute` 的方法能接受与`@RequestMapping` 标注相同的参数类型，只不过不能直接被映射到具体的请求上。
- 标注在方法上的 `@ModelAttribute` 说明方法一般是用于添加一个或多个属性到 `model` 上。

模拟请求

```html
<a href="${pageContext.request.contextPath}/testModelAttribute">模拟请求</a>
```

### ① 省略 `value` 属性值手动加入属性

```java
@ModelAttribute
public void modelAttributeMethod1(ModelMap modelMap) {
    Person person = new Person("超哥哥 1 号", 12);
    modelMap.addAttribute("person1", person);
}

@RequestMapping(value = "testModelAttribute", method = RequestMethod.GET)
public String testModelAttribute(ModelMap modelMap) {
    modelMap.forEach((key, value) -> {
        System.out.println(key + " = " + value);
        //person1 = Person{name='超哥哥 1 号', age=12}
    });
    return "success";
}
```

可以看出手动加入 `model` 里面属性成功，`key` 为自定义的字符串。

### ② 省略 `value` 属性值自动加入属性

```java
@ModelAttribute
public Person modelAttributeMethod2() {
    return new Person("超哥哥 2 号", 12);
}

@RequestMapping(value = "testModelAttribute", method = RequestMethod.GET)
public String testModelAttribute(ModelMap modelMap) {
    modelMap.forEach((key, value) -> {
        System.out.println(key + " = " + value);
        //person = Person{name='超哥哥 2 号', age=12}
    });
    return "success";
}
```

可以看出 `@ModelAttribute` 修饰的方法没有指定 `value` 属性时，让其自动加入的 `key` 是以添加类的类名首字母小写。

### ③ 指明 `value` 属性值自动加入属性

```java
@ModelAttribute(value = "person3")
public Person modelAttributeMethod3() {
    return new Person("超哥哥 3 号", 13);
}

@RequestMapping(value = "testModelAttribute", method = RequestMethod.GET)
public String testModelAttribute(ModelMap modelMap) {
    modelMap.forEach((key, value) -> {
        System.out.println(key + " = " + value);
        //person3 = Person{name='超哥哥 3 号', age=13}
    });
    return "success";
}
```

从上面可以看出 `@ModelAttribute` 修饰的方法有指定 `value` 属性时，让其自动加入的 `key` 就是自定的 `value` 属性的值。

## 2. @ModelAttribute 写在参数前面

标注在方法参数前的 `@ModelAttribute` 说明了该方法参数的值将由 `model` 中取得，如果 `model` 中找不到，那么该参数会先被实例化，然后被添加到 `model` 中。在 `model` 中存在以后，将请求中所有名称匹配的参数都填充到该参数对象上。

模拟请求

```html
<a href="${pageContext.request.contextPath}/testModelAttribute?age=13"
  >模拟请求</a
>
```

### ① 省略 value 属性值自动匹配或创建

```java
@RequestMapping(value = "testModelAttribute", method = RequestMethod.GET)
public String testModelAttribute(@ModelAttribute Person person) {
    System.out.println(person);
    //Person{name='null', age=13}
    return "success";
}
```

注：在执行 `testModelAttribute(..)` 方法时，因为参数属性是一个 `Person` 类对象，那么他先从 `model` 里面找(**没有指明 `value` 属性值，则以该类名首字母小写为 `key`**)，发现找不到便创建一个，把请求里面的参数赋值到该创建对象上，找到了则用请求里面的参数更新该对象。

### ② 指定 value 属性值匹配或创建

```java
@ModelAttribute(value = "p")
public Person modelAttributeMethod3(@RequestParam Integer age) {
    return new Person("超哥哥 3 号", age);
}

@RequestMapping(value = "testModelAttribute", method = RequestMethod.GET)
public String testModelAttribute(@ModelAttribute(value = "p") Person person) {
    System.out.println(person);
    //Person{name='超哥哥 3 号', age=13}
    return "success";
}
```

注：在执行 `testModelAttribute(..)` 方法时，因为参数属性是一个 `Person` 类对象，那么他先从 `model` 里面找(**有指明 `value` 属性值，则以 `value` 属性值为 `key`**)，发现找不到便创建一个，把请求里面的参数赋值到该创建对象上，找到了则用请求里面的参数更新该对象。

### ③ 省略 @ModelAttribute 注解的 POJO 参数

```java
@ModelAttribute
public Person modelAttributeMethod3(@RequestParam Integer age) {
    return new Person("超哥哥 4 号", age);
}

@RequestMapping(value = "testModelAttribute", method = RequestMethod.GET)
public String testModelAttribute(Person person) {
    System.out.println(person);
    //Person{name='超哥哥 4 号', age=13}
    return "success";
}
```

注：`@ModelAttribute` 注解修饰的方法，没有指定 `value` 属性，则自动注入到 `model` 里面的 `value` 以该对象类名首字母小写为 `key`。在下面 `@RequestMapping` 修饰的方法 `testModelAttribute(..)` 参数时一个 POJO 对象，虽前面没有注解修饰，但默认也会去匹配 `ModelAttributeMethodProcessor` 参数解析器去解析该参数，说白了与上面的第一种情况 `@ModelAttribute` 注解修饰没有设置 `value` 属性值是一样的。

# 八、在 Controller 中使用 redirect 方式处理请求

forword：表示转发！

redirect：表示重定向！

```java
@RequestMapping(value = "index")
public String index() {
    return "success";
}
```

```java
@RequestMapping(value = "index")
public String index() {
    return "redirect:success";
}
```

# 九、RESTFul 风格的 SpringMVC

## 1. RESTFulController

```java
@RequestMapping(value = "rest")
@Controller
public class RESTFulController {

    @RequestMapping(value = {"home", "/", ""}, method = RequestMethod.GET)
    public String goResetHome() {
        System.out.println("访问了 Rest 风格测试首页");
        return "8-rest";
    }

    @RequestMapping(value = "student/{id}", method = RequestMethod.GET)
    public String get(@PathVariable(value = "id") Integer id) {
        System.out.println("get " + id);
        return "success";
    }

    @RequestMapping(value = "student/{id}", method = RequestMethod.POST)
    public String post(@PathVariable(value = "id") Integer id) {
        System.out.println("post " + id);
        return "success";
    }

    @RequestMapping(value = "student/{id}", method = RequestMethod.PUT)
    public String put(@PathVariable(value = "id") Integer id) {
        System.out.println("put " + id);
        return "success";
    }

    @RequestMapping(value = "student/{id}", method = RequestMethod.DELETE)
    public String delete(@PathVariable(value = "id") Integer id) {
        System.out.println("delete " + id);
        return "success";
    }
}
```

## 2. form 表单发送 put 和 delete 请求，需要在 web.xml 中进行如下配置

```xml
<!-- configure the HiddenHttpMethodFilter,convert the post method to put or delete -->
<filter>
  <filter-name>hiddenHttpMethodFilter</filter-name>
  <filter-class>org.springframework.web.filter.HiddenHttpMethodFilter</filter-class>
</filter>
<filter-mapping>
  <filter-name>hiddenHttpMethodFilter</filter-name>
  <url-pattern>/*</url-pattern>
</filter-mapping>
```

## 3. 在前台可以用以下代码产生请求

```xml
<form action="${pageContext.request.contextPath}/rest/student/1" method="get">
    <input type="submit" value="GET">
</form>

<form action="${pageContext.request.contextPath}/rest/student/1" method="post">
    <input type="submit" value="POST">
</form>

<form action="${pageContext.request.contextPath}/rest/student/1" method="post">
    <input type="hidden" name="_method" value="PUT">
    <input type="submit" value="PUT">
</form>

<form action="${pageContext.request.contextPath}/rest/student/1" method="post">
    <input type="hidden" name="_method" value="DELETE">
    <input type="submit" value="DELETE">
</form>
```

# 十、@RequestBody 和 @ResponseBody

在 SpringMVC 的 `Controller` 中经常会用到 `@RequestBody` 和`@ResponseBody` 这两个注解，若想使用这两个注解，前提要写好 [<mvc:annotation-driven />](https://www.jianshu.com/p/fc3bc70b9ed3) 标签，他会帮我们注入接下里解析需要的转换器。

## 1. @RequestBody

**简介：**

`@RequestBody` 注解用于修饰 `Controller` 的方法参数，根据 HTTP Request Header 的 `content-Type` 的内容，通过适当的 `HttpMessageConverter` 转换为 Java 类。

**使用时机：**

当提交的数据不是普通表单的形式(`application/x-www-form-urlcoded`、`multipart/form-data`)，而是 JSON 格式(`application/json`) 或 XML 格式(`application/xml`)。

**使用示例：**XML 格式数据提交

POJO 模型类

```java
@XmlRootElement(name = "person")
public class Person {
    private String name;
    private Integer age;

    public String getName() { return name; }
    @XmlElement
    public void setName(String name) { this.name = name; }
    public Integer getAge() { return age; }
    @XmlElement
    public void setAge(Integer age) { this.age = age; }
}
```

AJAX 请求

```html
<a id="tag" href="${pageContext.request.contextPath}/testRequestBody"
  >点击事件</a
>

<script type="text/javascript">
  $("#tag").click(function () {
    var arg =
      '<?xml version="1.0" encoding="UTF-8" ?>' +
      "<person>" +
      "<name>Tom</name>" +
      "<age>13</age>" +
      "</person>";
    $.ajax({
      url: this.href,
      type: "POST",
      data: arg,
      contentType: "application/xml;charset=utf-8",
      success: function (data, textStatus) {},
      error: function (data, textStatus, errorThrown) {},
    });
    return false;
  });
</script>
```

Controller 里对应的方法

```java
@RequestMapping(value = "testRequestBody", method = RequestMethod.POST)
public String testRequestBody(@RequestBody Person person) {
    System.out.println(person);
    //Person{name='Tom', age=13}
    return "success";
}
```

**注：**`@RequestBody` 注解对于 XML 请求数据的解析，请求方要指定 `Content-Type = application/xml;charset=utf-8`，服务器如果要将接收数据封装成 POJO 类，需要在该 POJO 类里面用 `@XmlRootElement` 和 `@XmlElement` 注解指明跟标签和子标签，SpringMVC 内部最终用到的是自带的 `Jaxb2RootElementHttpMessageConverter` 转换器(其实现了 `HttpMessageConverter` 接口)。

## 2. @ResponseBody

**简介：**

`@ResponseBody` 注解用于修饰 `Controller` 的方法，根据 HTTP Request Header 的 `Accept` 的内容，通过适当的 `HttpMessageConverter` 转换为客户端需要格式的数据并且写入到 `Response` 的 `body` 数据区，从而不通过视图解析器直接将数据响应给客户端。

**使用时机：**

返回的数据不是 html 标签的页面，而是其他某种格式的数据时（如 json、xml 等）使用。

**使用示例：**XML 格式数据响应

POJO 模型类

```java
@XmlRootElement(name = "person")
public class Person {
    private String name;
    private Integer age;

    public String getName() { return name; }
    @XmlElement
    public void setName(String name) { this.name = name; }
    public Integer getAge() { return age; }
    @XmlElement
    public void setAge(Integer age) { this.age = age; }
}
```

Controller 里对应的方法

```java
@ResponseBody
@RequestMapping(value = "testRequestBody", method = RequestMethod.POST)
public Person testRequestBody() {
    Person person = new Person("Tom",13);
    return person;
}
```

AJAX 请求

```html
<a id="tag" href="${pageContext.request.contextPath}/testRequestBody"
  >点击事件</a
>

<script type="text/javascript">
  $("#tag").click(function () {
    $.ajax({
      url: this.href,
      type: "POST",
      data: null,
      headers: { Accept: "application/xml;charset=utf-8" },
      success: function (data, textStatus) {
        console.log(textStatus);
        console.log(data);
      },
      error: function (data, textStatus, errorThrown) {
        console.log(textStatus + "   " + data + "  " + errorThrown);
      },
    });
    return false;
  });
</script>
```

最终浏览器控制台输出

![](/assets/img/2019-01-15/4322526-a944a7aaf1b9d82f.webp)

**注：**`@ResponseBody` 注解对于响应 XML 格式数据的解析，请求方要指定 `Accept = application/xml;charset=utf-8`，服务器如果想将 POJO 类转换成 XML 格式数据，需要在该 POJO 类里面用 `@XmlRootElement` 和 `@XmlElement` 注解指明跟标签和子标签，SpringMVC 内部最终用到的是自带的 `Jaxb2RootElementHttpMessageConverter` 转换器(其实现了 `HttpMessageConverter` 接口)。

# 3. 原理简介

`@RequestBody` 和 `@ResponseBody` 注解最终匹配到的参数解析器和返回值解析器都是 `RequestResponseBodyMethodProcessor` 对象，所以该对象分别实现了 `HandlerMethodArgumentResolver` 和 `HandlerMethodReturnValueHandler` 接口。

在该解析器中有一个 `messageConverters` 属性，该属性是用来记录转换器的 `List`，这些转换器都是在该解析器初始化的时候 `<mvc:annotation-driven />` 标签帮我们注入的。并且这些解析器都实现了 `HttpMessageConverter` 接口，在 `HttpMessageConverter` 接口中有四个最为主要的接口方法。

```java
public interface HttpMessageConverter<T> {
	boolean canRead(Class<?> clazz, @Nullable MediaType mediaType);
	T read(Class<? extends T> clazz, HttpInputMessage inputMessage);

	boolean canWrite(Class<?> clazz, @Nullable MediaType mediaType);
	void write(T t, @Nullable MediaType contentType, HttpOutputMessage outputMessage);
}
```

`read` 对应请求输入的转换解析，`write` 对应响应输出的转换解析。

`canRead` 根据 Request Header 的 `content-Type` 的内容查看该 `HttpMessageConverter` 换器是否支持转换，支持则转换为对应的 Java 类绑定到修饰的方法入参上。

`canWrite` 根据 Request Headers 里面的 `Accept` 的内容查看该 `HttpMessageConverter` 换器是否支持转换，支持则转换成指定格式后，写入到 `Response` 对象的 `body` 数据区。

对应流程图如下

![](/assets/img/2019-01-15/4322526-96344f444801d424.webp)

# 十一、解析和返回 Json 数据

## 1. 首先需要导入 JSON 支持架包并且注入转换器

```xml
<dependency>
  <groupId>com.fasterxml.jackson.core</groupId>
  <artifactId>jackson-databind</artifactId>
  <version>2.9.6</version>
</dependency>
```

`jackson-databind-2.9.6.jar` 架包依赖于 `jackson-annotations-2.9.0.jar` 和 `jackson-core-2.9.6.jar`，所以省略了依赖架包的手动导入。

同时要写好 [<mvc:annotation-driven />](https://www.jianshu.com/p/fc3bc70b9ed3) 标签，其会帮我们注入对应的 JSON 数据转换器。

## 2. 代码示例

需要封装的 POJO

```java
public class Person {
    private String name;
    private Integer age;
}
```

Controller 中对应的请求方法

```java
@ResponseBody
@RequestMapping(value = "testRequestBody", method = RequestMethod.POST)
public Person testRequestBody(@RequestBody Person person) {
    System.out.println(person);
    return person;
}
```

**注：**参数用 `@RequestBody` 修饰意思是将请求的 JSON 数据用合适的转换器，转换成 Java 类。`@ResponseBody` 注解是将返回的数据通过合适的转换器转换成客户端想要的样子并返回，在这里是将请求解析的 `Person` 对象转换成 JOSN 格式数据并返回。

AJAX 请求

```html
<a id="tag" href="${pageContext.request.contextPath}/testRequestBody"
  >点击事件</a
>

<script type="text/javascript">
  $("#tag").click(function () {
    var arg = { name: "Tom", age: "10" };
    $.ajax({
      url: this.href,
      type: "POST",
      data: JSON.stringify(arg),
      contentType: "application/json;charset=utf-8",
      headers: { Accept: "application/json;charset=utf-8" },
      success: function (data, textStatus) {
        console.log(textStatus);
        console.log(data);
      },
      error: function (data, textStatus, errorThrown) {
        console.log(textStatus + "   " + data + "  " + errorThrown);
      },
    });
    return false;
  });
</script>
```

**注：**① 发送的数据要是 JSON 格式(也就是 `data` 属性的数据是 JSON 格式)；② 指明请求数据为 JSON 格式(`contentType: "application/json;charset=utf-8"`)；③ 指明接收数据为 JSON 格式(`headers: { Accept: "application/json;charset=utf-8" }`)。

## 3. 原理简介

最终使用到的转换器是 jackson 提供的 `MappingJackson2HttpMessageConverter`，也是在解析器初始化的时候 `<mvc:annotation-driven />` 标签帮我们注入的。

# 十二、文件上传

## 1. 导入文件上传支持架包

为了实现文件上传，需要导入 `commons-fileupload` 架包，导入如下

```xml
<!-- https://mvnrepository.com/artifact/commons-fileupload/commons-fileupload -->
<dependency>
    <groupId>commons-fileupload</groupId>
    <artifactId>commons-fileupload</artifactId>
    <version>1.3.3</version>
</dependency>
```

## 2. 配置 MultipartResolver

SpringMVC 上下文中默认没有装配 `MultipartResolver`，因此默认情况下其不能处理文件上传工作。如果想使用 SpringMVC 的文件上传功能，则需要在上下文中配置 `MultipartResolver`。在 SpringMVC 配置文件中进行如下配置

```xml
<bean id="multipartResolver" class="org.springframework.web.multipart.commons.CommonsMultipartResolver">
    <!-- 请求的编码格式，必须和 jsp 的 pageEncoding 属性一致，默认为ISO-8859-1 -->
    <property name="defaultEncoding" value="utf-8"></property>
    <!-- 上传最大限制 1M = 1M * 1024 * 1024 = 1048576 byte-->
    <property name="maxUploadSize" value="1048576"></property>
</bean>
```

**注：**这里一定要设置 `id`，并且值必须是 multipartResolver，下面的简单原理会解释。

## 3. 代码示例

Controller 中对应的方法

```java
@RequestMapping(value = "upload", method = RequestMethod.POST)
public String testUpload(@RequestParam(value = "file") MultipartFile multipartFile, HttpServletRequest request) throws Exception {
    if (multipartFile.isEmpty() == false) {
        //multipartFile.getName()   标签名字
        //multipartFile.getOriginalFilename()  上传文件名字
        //multipartFile.getSize()   上传文件大小
        //multipartFile.getContentType()    上传文件类型

        //在 webapp 目录下面(项目目录下面) 建立一个 resources 资源文件夹, 用来存储上传的资源文件
        String parent = request.getServletContext().getRealPath("/resources");
        String filename = UUID.randomUUID() + multipartFile.getOriginalFilename();

        File file = new File(parent, filename);
        multipartFile.transferTo(file);
    }
    return "success";
}
```

JSP 页面的可变表单请求

```xml
<form action="${pageContext.request.contextPath}/upload"
      enctype="multipart/form-data"
      method="post">
    <input type="file" name="file" value="请选择需要上传的文件" /><br>
    <input type="submit" value="提交">
</form>
```

## 4. 原理简介

在 `DispatcherServlet` 初始化的时候，会从容器中加载 `MultipartResolver` 可变表单解析器，从下面源码中可以看出加载条件就是 `id` 或 `name` 为 multipartResolver 的 `bean`。

![](/assets/img/2019-01-15/4322526-478abae754dd2eae.webp)

接着简单了解下解析，在 `DispatcherServlet` 的 `doDispatch(..)` 方法中检查该请求是否是可变表单请求，如果是则用加载到缓存的 `MultipartResolver` 解析器 (这里用到的是注入容器中的 `CommonsMultipartResolver` 可变表单解析器，其实现了 `MultipartResolver` 接口) 将可变请求解析成 `MultipartFile` 对象 (这里是 `CommonsMultipartFile`，其实现了`MultipartFile` 接口)，放在 `HttpServletRequest` 对象中，最终通过合适的参数解析器绑定到对应方法的参数上。

![](/assets/img/2019-01-15/4322526-fcd647eded8c2675.webp)

# 十三、文件下载

SpringMVC 提供了一个 `ResponseEntity` 类型，使用它可以很方便地定义返回的 `HttpHeaders` 和 `HttpStatus`。
以下代码演示文件的下载功能

```java
@RequestMapping(value = "download", method = RequestMethod.GET)
public ResponseEntity<byte[]> testDownload(HttpServletRequest request, @RequestParam String filename) throws Exception {

    String parent = request.getServletContext().getRealPath("/resources");
    File file = new File(parent, filename);

    byte[] body = FileUtils.readFileToByteArray(file);

    String downloadFilename = new String(file.getName().getBytes("utf-8"), "iso-8859-1");

    HttpHeaders headers = new HttpHeaders();
    //设置文件类型
    headers.add("Content-Disposition", "attchement;filename=" + downloadFilename);

    ResponseEntity responseEntity = new ResponseEntity(body, headers, HttpStatus.OK);
    return responseEntity;
}
```

# 十四、拦截器

SpringMVC 的处理器拦截器，类似于 Servlet 开发中的过滤器 Filter，用于对处理器进行预处理和后处理。

## 1. 过滤器与拦截器区别

- **过滤器：**依赖于 servlet 容器，在实现上基于函数回调，可以对几乎所有请求进行过滤，但是缺点是一个过滤器实例只能在容器初始化时调用一次。使用过滤器的目的是用来做一些过滤操作，比如：在过滤器中修改字符编码；在过滤器中修改 HttpServletRequest 的一些参数，包括：过滤低俗文字、危险字符等。
- **拦截器：**依赖于 web 框架，在实现上基于 Java 的反射机制，属于面向切面编程（AOP）的一种运用。由于拦截器是基于 web 框架的调用，因此可以使用 Spring 的依赖注入（DI）进行一些业务操作，同时一个拦截器实例在一个 Controller 生命周期之内可以多次调用。

## 2. 拦截器接口

![](/assets/img/2019-01-15/4322526-4194de4010c3f2da.webp)

拦截器一个有 3 个回调方法，而一般的过滤器 Filter 才两个:

- **`preHandle`：**预处理回调方法，实现处理器的预处理。返回值：true 表示继续流程（如调用下一个拦截器或处理器）；false 表示流程中断，不会继续调用其他的拦截器或处理器，此时我们需要通过 `response` 来产生响应；
- **`postHandle`：**后处理回调方法，实现处理器的后处理（但在渲染视图之前），此时我们可以通过 `modelAndView`（模型和视图对象）对模型数据进行处理或对视图进行处理。
- **`afterCompletion`：**整个请求处理完毕回调方法，即在视图渲染完毕时回调，如性能监控中我们可以在此记录结束时间并输出消耗时间，还可以进行一些资源清理，类似于 `try-catch-finally` 中的`finally`。

## 3. 代码编写

有时候我们可能只需要实现三个回调方法中的某一个，如果实现`HandlerInterceptor` 接口的话，三个方法必须实现，此时 SpringMVC 提供了一个 `HandlerInterceptorAdapter` 适配器（一种适配器设计模式的实现），允许我们只实现需要的回调方法，该适配器内部实现了 `HandlerInterceptor` 接口。

先写两个拦截器

```java
public class HandlerInterceptor1 extends HandlerInterceptorAdapter {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        System.out.println("HandlerInterceptor1 preHandle");
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        System.out.println("HandlerInterceptor1 postHandle");
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        System.out.println("HandlerInterceptor1 afterCompletion");
    }
}
```

```java
public class HandlerInterceptor2 extends HandlerInterceptorAdapter {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        System.out.println("HandlerInterceptor2 preHandle");
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        System.out.println("HandlerInterceptor2 postHandle");
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        System.out.println("HandlerInterceptor2 afterCompletion");
    }
}
```

拦截器的注入

```xml
<mvc:interceptors>
    <bean class="com.ogemray.interceptor.HandlerInterceptor1"></bean>
    <bean class="com.ogemray.interceptor.HandlerInterceptor2"></bean>
</mvc:interceptors>
```

Controller 方法编写

```java
@RequestMapping(value = "/hello")
public String testHello() {
    System.out.println("HelloController.testHello");
    return "success";
}
```

最终输出看下执行顺序

```
HandlerInterceptor1 preHandle
HandlerInterceptor2 preHandle
HelloController.testHello
HandlerInterceptor2 postHandle
HandlerInterceptor1 postHandle
HandlerInterceptor2 afterCompletion
HandlerInterceptor1 afterCompletion
```

## 4. 运行流程图

![SpringMVC拦截器执行流程.jpg](/assets/img/2019-01-15/4322526-e9fc4357827fa32c.webp)

## 5. 选择性拦截注入

有的时候我们需要拦截器拦截指定的请求，这样也是可以配置的

```xml
<mvc:interceptors>
    <mvc:interceptor>
        <!-- 拦截对应 /hello 路径下的所有请求 -->
        <mvc:mapping path="/hello/*"/>
        <!-- 除去 /hello/test2 这个请求 -->
        <mvc:exclude-mapping path="/hello/test2"></mvc:exclude-mapping>
        <bean class="com.ogemray.interceptor.HandlerInterceptor1"></bean>
    </mvc:interceptor>

    <mvc:interceptor>
        <!-- /* 是一级目录下的路径; /** 不分目录等级, 即所有请求 -->
        <mvc:mapping path="/**"/>
        <bean class="com.ogemray.interceptor.HandlerInterceptor2"></bean>
    </mvc:interceptor>
</mvc:interceptors>
```

# 十五、异常处理

在 SpringMVC 中，所有用于处理在请求映射和请求处理过程中抛出的异常的类，都要实现 `HandlerExceptionResolver` 接口。
一个基于 SpringMVC 的 Web 应用程序中，可以存在多个实现了 `HandlerExceptionResolver` 的异常处理类，他们的执行顺序是由其 `order` 的值从小到大来先后执行，直到遇到返回的 `ModelAndView` 不为空则终断接下来的异常解析器的执行并返回异常的 `ModelAndView` 对象。

[<mvc:annotation-driven />](https://www.jianshu.com/p/fc3bc70b9ed3)标签会帮我们注入常用的三个异常解析器：`ExceptionHandlerExceptionResolver`、`ResponseStatusExceptionResolver`、`DefaultHandlerExceptionResolver`。

但是我们接下来重点是了解下常用的两个异常解析器，分别是：`ExceptionHandlerExceptionResolver` 和 `SimpleMappingExceptionResolver`。

## 1. ExceptionHandlerExceptionResolver

注意 `@ExceptionHandler` 注解修饰的方法里面，只能自己 `new` 出 `ModelAndView` 对象然后装入需要的注入的值，对于传参里面带的 `Model` 或 `ModelMap` 达不到传值要求。

### ① 异常处理方法写在对应的类里面

这样只能处理该 `Controller` 里面的异常

处理该 `Controller` 里面所有的异常，在没有找到指定的异常类对应的处理方法的前提下

```java
@ExceptionHandler
public ModelAndView handlerAllException(Exception e) {
    ModelAndView mv = new ModelAndView();
    mv.addObject("exceptionMsg", e.getMessage());
    mv.setViewName("error");
    System.out.println("HelloController.handlerAllException");
    return mv;
}
```

处理该 `Controller` 里面指定类型的异常

```java
@ExceptionHandler(value = {ArithmeticException.class})
public ModelAndView handlerArithmeticException(Exception e) {
    ModelAndView mv = new ModelAndView();
    mv.addObject("exceptionMsg", e.getMessage());
    mv.setViewName("error");
    System.out.println("HelloController.handlerArithmeticException");
    return mv;
}
```

### ② 异常处理方法写在单独的异常处理类里面

这样可以处理所有 `Controller` 的异常，而不是针对单个的 `Controller` 类，类上需要用 `@ControllerAdvice` 注解修饰。

```java
@ControllerAdvice
public class HandlerException {
    @ExceptionHandler
    public ModelAndView handlerAllException(Exception e) {
        ModelAndView mv = new ModelAndView();
        mv.addObject("exceptionMsg", e.getMessage());
        mv.setViewName("error");
        System.out.println("HelloController.handlerAllException");
        return mv;
    }
    @ExceptionHandler(value = {ArithmeticException.class})
    public ModelAndView handlerArithmeticException(Exception e) {
        ModelAndView mv = new ModelAndView();
        mv.addObject("exceptionMsg", e.getMessage());
        mv.setViewName("error");
        System.out.println("HelloController.handlerArithmeticException");
        return mv;
    }
}
```

## 2. SimpleMappingExceptionResolver

不用自己写 java 类处理异常，直接配置就可以了

```xml
<bean class="org.springframework.web.servlet.handler.SimpleMappingExceptionResolver">
    <!-- 指定注入异常属性的key, 默认为 "exception" -->
    <property name="exceptionAttribute" value="ex"></property>
    <property name="exceptionMappings">
        <props>
            <prop key="java.lang.ArrayIndexOutOfBoundsException">error</prop>
        </props>
    </property>
</bean>
```

# 十六、整合 SpringIOC 和 SpringMVC

1. 在 web.xml 中配置 `contextLoaderListener`，并且加入 spring 的配置文件 `applicationContext.xml`
   这样可以把 service、dao、事务、缓存、以及和其它框架的整合放到 spring 的配置文件里面
   web.xml 文件配置如下

```xml
<!DOCTYPE web-app PUBLIC
        "-//Sun Microsystems, Inc.//DTD Web Application 2.3//EN"
        "http://java.sun.com/dtd/web-app_2_3.dtd" >
<web-app>

    <!-- configure the spring -->
    <context-param>
        <param-name>contextConfigLocation</param-name>
        <param-value>classpath:applicationContext.xml</param-value>
    </context-param>
    <listener>
        <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
    </listener>

    <!-- configure the spring mvc -->
    <servlet>
        <servlet-name>dispatcherServlet</servlet-name>
        <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
        <init-param>
            <param-name>contextConfigLocation</param-name>
            <param-value>classpath:spring-mvc.xml</param-value>
        </init-param>
        <load-on-startup>1</load-on-startup>
    </servlet>

    <servlet-mapping>
        <servlet-name>dispatcherServlet</servlet-name>
        <url-pattern>/</url-pattern>
    </servlet-mapping>

</web-app>
```

2. 在 web.xml 中配置 SpringMVC 的 Servlet 和加入 springmvc.xml，这时两个配置文件中扫描的包有重合的时候出现某些 bean 会被初始化 2 次的问题。
   解决：在扫描包的子节点下配置` exclude-filter` 和 `include-filter`

**SpringMVC 只扫描 `@Controller` 和 `@ControllerAdvice`**

```xml
<context:component-scan base-package="com.ogemray.springmvc">
    <context:include-filter type="annotation" expression="org.springframework.stereotype.Controller" />
    <context:include-filter type="annotation" expression="org.springframework.web.bind.annotation.ControllerAdvice" />
</context:component-scan>
```

**Spring 排除扫描 `@Controller` 和 `@ControllerAdvice`**

```xml
<context:component-scan base-package="com.ogemray.springmvc">
    <context:exclude-filter type="annotation" expression="org.springframework.stereotype.Controller" />
    <context:exclude-filter type="annotation" expression="org.springframework.web.bind.annotation.ControllerAdvice" />
</context:component-scan>
```

**注意：**Spring 和 SpringMVC 都有一个 IOC 容器，并且`Controller` 类的 bean 在 SpringMVC 的 IOC 容器中，但是它可以引用 Spring 的 IOC 容器中的 bean 如 service 和 dao 层的 bean，反之则不行，因为 Spring IOC 容器和 SpringMVC IOC 容器是父子关系，相当于全局变量和局部变量的关系！

# 十七、SpringMVC 运行流程

![SpringMVC运行流程.jpg](/assets/img/2019-01-15/4322526-a61eb7892a24ce26.webp)
