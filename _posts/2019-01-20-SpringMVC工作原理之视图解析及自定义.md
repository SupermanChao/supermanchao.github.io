---
layout: post
title: "SpringMVC工作原理之视图解析及自定义"
subtitle: "SpringMVC视图解析"
date: 2019-01-20
categories: 技术
# cover: ""
tags: SpringMVC Spring
---

> 本篇笔记记录分为两大部分:
>
> 第一部分主要记录 SpringMVC 如何解析、渲染视图并转发返回结果对象，主要是针对源码执行过程的追踪。
>
> 第二部分记录一个 SpringMVC 自定义视图步骤及过程。
>
> 本篇笔记主要分析 SpringMVC 5.1.1 这个版本。

![SpringMVC运行流程](/assets/img/2019-01-20/4322526-6d273b8e210126ad.webp)

# 一、Spring MVC 视图解析过程

## 1. ModelAndView

SpringMVC 内部最终会将返回的参数及视图名字封装成一个 `ModelAndView` 对象，这个对象包含两个部分：`Model` 是一个 `HashMap` 集合，`View` 一般则是一个 `String` 类型记录要跳转视图的名字或者是视图对象(**当然如果是视图对象的话则直接跳过视图解析器的解析过程了**)。

![](/assets/img/2019-01-20/4322526-dde04eeebd10c66a.webp)

源码内部最终会根据执行 `Controller` 里面的方法生成的 `ModelAndViewContainer` 对象创建 `ModelAndView` 对象。

SpringMVC 内部最终是借助这个 `ModelAndView` 对象里面的 `View` 来选取视图解析器，解析出视图，然后将 `Model` 里面的键值写进 `requestScope` 里面，最终呈现给客户端渲染后的视图，不懂这的没关系，咱们接着往下看。

## 2. View & ViewResolver

在开始源码分析之前，我们先来看下两个基本概念，视图和视图解析器。

### 2.1 视图 View

视图的作用是渲染模型数据，将模型里的数据以某种形式呈现给客户，其实就是 html、jsp 甚至 word、excel 文件。

为了实现视图模型和具体实现技术的解耦，SpringMVC 定义了一个高度抽象的 View 接口 `org.springframework.web.servlet.View`。

视图对象由视图解析器负责实例化，由于他们是无状态的，所以不存在线程安全的问题。

下面来看下 View 接口实现类都有哪些

![](/assets/img/2019-01-20/4322526-b69b1163211399c6.webp)

顺带说下 IDEA 查看接口实现类的方法

![view2.png](/assets/img/2019-01-20/4322526-4a016b8472273731.webp)

我们挑几个常用的了解下

| 视图                    | 说明                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------- |
| InternalResourceView    | 将 JSP 或其他资源封装成一个视图，一般 JSP 页面用该视图类                           |
| JstlView                | 继承自 InternalResourceView，如果 JSP 页面使用了 JSTL 标签，则需要使用该视图类     |
| AbstractPdfView         | PDF 视图的抽象超类                                                                 |
| AbstractXlsView         | 传统 XLS 格式的 Excel 文档视图的便捷超类，与 Apache POI 3.5 及更高版本兼容。       |
| AbstractXlsxView        | Office 2007 XLSX 格式的 Excel 文档视图的便捷超类，兼容 Apache POI 3.5 及更高版本。 |
| MappingJackson2JsonView | 将模型数据 通过 Jackson 开源框架的 ObjectMapper 以 JSON 方式输出                   |

### 2.2 视图解析器 ViewResolver

SpringMVC 为逻辑视图名的解析提供了不同的策略，可以在 Spring Web 上下文中配置一种或多种解析策略，并指定他们之间的先后顺序。

- 每一种映射策略对应一个具体的视图解析器实现类。
- 视图解析器的作用是将逻辑视图解析为一个具体的物理视图对象。
- 所有的视图解析器都必须实现 `ViewResolver` 接口。
- 可以选择一种或多种视图解析器，可以通过其 order 属性指定解析器的优先顺序，order 越小优先级越高。
- SpringMVC 会按照视图解析器顺序的优先次序进行解析，直到返回视图对象。若无，则抛出 `ServletException` 异常。

下面来看下实现 ViewResolver 接口的类都有哪些

![viewResolver.png](/assets/img/2019-01-20/4322526-a7e28cb1cdd04c04.webp)

我们挑几个常用的了解下

| 视图解析器                     | 说明                                                                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| AbstractCachingViewResolver    | 一个抽象视图，继承该类可以让视图解析器具有缓存功能                                                                                      |
| XmlViewResolver                | 接受 XML 文件的视图解析器，默认配置文件在 /WEB-INF/views.xml                                                                            |
| ResourceBundleViewResolver     | 使用 properties 配置文件的视图解析器，默认配置文件是类路径下的 views.properties                                                         |
| UrlBasedViewResolver           | 一个简单的视图解析器，不做任何匹配，需要视图名和实际视图文件名相同                                                                      |
| InternalResourceViewResolver   | UrlBasedViewResolver 的一个子类，支持 Servlet 容器的内部类型（JSP、Servlet、以及 JSTL 等），可以使用 setViewClass(..)指定具体的视图类型 |
| FreeMarkerViewResolver         | 也是 UrlBasedViewResolver 的子类，用于 FreeMarker 视图技术                                                                              |
| ContentNegotiatingViewResolver | 用于解析基于请求文件名或 Accept header 的视图                                                                                           |
| BeanNameViewResolver           | 将逻辑视图名解析为一个 Bean，Bean 的 id 等于逻辑视图名                                                                                  |

## 3. 视图解析过程源码分析

1. 首先进入 `DispatcherServlet.doDispatch( )` 方法，经过解析处理，找到了对应的 `Controller` 里面的方法，执行完成之后得到 `ModeAndView` 对象，开始视图渲染前后一些列工作

![](/assets/img/2019-01-20/4322526-26ec69c7bb5c1637.webp)

2. 进入渲染方法，开始视图渲染前的工作

![](/assets/img/2019-01-20/4322526-f950162cd8967217.webp)

3. 进入 `render(..)` 方法查看渲染源码

![](/assets/img/2019-01-20/4322526-2b14dcd4d7872caa.webp)

3.1. 查看下 `View` 对象创建过程，进入 `resolveViewName(..)` 方法

![](/assets/img/2019-01-20/4322526-9beedb89923a8f15.webp)

4. 拿到 `View` 对象后开始视图上的渲染工作，执行 `view.render(..)` 方法，查看视图渲染的具体流程

![](/assets/img/2019-01-20/4322526-05957302351682cd.webp)

5. 进入 `renderMergedOutputModel(..)` 方法

![](/assets/img/2019-01-20/4322526-cac09f4bb55c4ad5.webp)

5.1 顺带看下 Model 数据写进 requestScope 过程，进入 `exposeModelAsRequestAttributes(..)` 方法

![](/assets/img/2019-01-20/4322526-7ac6c531f5640916.webp)

# 二. Spring MVC 自定义视图

表格导出在平时开发中经常用到，今天就记录一个导出数据成 Excel 表格形式的例子，下面我们按步骤开始做。

## 1. 首先导入 apache 的 poi 的支持 jar 包

```xml
<!-- https://mvnrepository.com/artifact/org.apache.poi/poi -->
  <dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi</artifactId>
    <version>3.17</version>
  </dependency>

  <!-- https://mvnrepository.com/artifact/org.apache.poi/poi-ooxml -->
  <dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>3.17</version>
  </dependency>
```

**poi：**提供 microsoft office 旧版本支持 [eg .xls Excel]

**poi-ooxml：**提供 microsoft office 新版本支持 [eg .xlsx Excel]

## 2. 创建自定义视图类

创建自定义表格视图类需要继承自 `AbstractXlsxView` 表格视图抽象类，实现 `buildExcelDocument(..)` 方法，在该方法里面实现视图处理操作。

```java
public class ExcelView extends AbstractXlsxView {

    @Override
    protected void buildExcelDocument(Map<String, Object> model, Workbook workbook, HttpServletRequest request, HttpServletResponse response) throws Exception {

        String filename = "students.xlsx";
        response.setContentType("application/ms-excel;charset=UTF-8");
        response.setHeader("Content-Disposition", "inline; filename=" + filename);

        //根据工作簿创建Excel表
        Sheet sheet = workbook.createSheet("sheet1");

        Row row = sheet.createRow(0);
        row.createCell(0).setCellValue("id");
        row.createCell(1).setCellValue("姓名");
        row.createCell(2).setCellValue("年龄");
        row.createCell(3).setCellValue("生日");

        if (model == null) return;
        List<Student> list = (List<Student>) model.get("list");

        for (int i = 0; i < list.size(); i++) {
            Student student = list.get(i);

            Row tempRow = sheet.createRow(i+1);
            tempRow.createCell(0).setCellValue(student.getId());
            tempRow.createCell(1).setCellValue(student.getName());
            tempRow.createCell(2).setCellValue(student.getAge());
            tempRow.createCell(3).setCellValue(student.getBirthday());
        }

        OutputStream outputStream = response.getOutputStream();
        workbook.write(outputStream);
        outputStream.flush();
        outputStream.close();
    }
}
```

## 3. 编写 Controller 类里的方法

可以从数据库取数据，这里为了简单，这里模拟的假数据装进 Model 里面

```java
@Controller
public class ExcelController {

    @GetMapping(value = "downloadList")
    public ModelAndView downloadStudentList() {
        System.out.println("准备下载学生列表");
        Student s1 = new Student(1, "Tom", 13, new Date());
        Student s2 = new Student(2, "Jerry", 14, new Date());
        Student s3 = new Student(3, "阿凡提", 20, new Date());
        Student s4 = new Student(4, "麦麦提", 24, new Date());
        ArrayList<Student> list = new ArrayList<>();
        list.add(s1); list.add(s2); list.add(s3); list.add(s4);

        ModelAndView mv = new ModelAndView();
        mv.addObject("list", list);
        View view = new ExcelView();
        mv.setView(view); //注意: 这里是将实例化的自定义视图对象当做参数传进入, 而不是视图名字
        return mv;
    }
}
```

最终请求到该方法里面便可完成下载。

注意这里 `ModelAndView` 模型里面的 `view` 属性承装的是自定义视图实体，而不是自定义视图的名字，如果直接写成返回视图名字的话需要注入 `BeanNameViewResolver` 视图解析器。

**如果想写成视图名字返回的话需要如下配置**

1.Controller 里面更改如下

```java
@RequestMapping("ec")
@Controller
public class ExcelController {

    @GetMapping(value = "downloadList")
    public String downloadStudentList(Model model) {
        System.out.println("准备下载学生列表");
        Student s1 = new Student(1, "Tom", 13, new Date());
        Student s2 = new Student(2, "Jerry", 14, new Date());
        Student s3 = new Student(3, "阿凡提", 20, new Date());
        Student s4 = new Student(4, "麦麦提", 24, new Date());
        ArrayList<Student> list = new ArrayList<>();
        list.add(s1); list.add(s2); list.add(s3); list.add(s4);

        model.addAttribute("list", list);
        return "excelView";
    }
}
```

2.在 Spring MVC 配置文件中添加 `BeanNameViewResolver` 视图解析器

```java
<bean class="org.springframework.web.servlet.view.BeanNameViewResolver">
    <property name="order" value="10"></property>
</bean>
```

3.在自定义视图类上加上 `Component`，把视图类的对象放 Spring 容器里。

```java
@Component
public class ExcelView extends AbstractXlsxView {
  ...
}
```
