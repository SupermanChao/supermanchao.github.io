---
layout: post
title: "Spring和MyBatis整合笔记"
subtitle: "Spring和MyBatis整合笔记"
date: 2018-11-22
categories: 技术
# cover: ""
tags: MyBatis Spring
---

> 对于 Spring 框架和 MyBatis 框架整合，摸爬滚打总结了这篇笔记，MyBatis 用 XML 文件替代了 Dao 接口实现 java 文件，所以将 XML 注入到 Spring 容器可能比正常类注入难理解些。

# 一、开始总结前先导入 Maven 依赖

① 注入 Spring 核心包

```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <version>5.1.1.RELEASE</version>
</dependency>

<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-beans</artifactId>
    <version>5.1.1.RELEASE</version>
</dependency>

<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-context</artifactId>
    <version>5.1.1.RELEASE</version>
</dependency>
```

② 注入 Spring 框架对象映射包，对 MyBatis、Hibernate..这样的第三方框架整合支持包

```xml
<!-- https://mvnrepository.com/artifact/org.springframework/spring-orm -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-orm</artifactId>
    <version>5.1.1.RELEASE</version>
</dependency>
```

③ 注入 MyBatis 包和 MyBatis 对 Spring 整合支持包

```xml
<dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis</artifactId>
    <version>3.4.6</version>
</dependency>

<dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis-spring</artifactId>
    <version>1.3.2</version>
</dependency>
```

④ 注入其他依赖包

```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>5.1.47</version>
</dependency>

<dependency>
    <groupId>log4j</groupId>
    <artifactId>log4j</artifactId>
    <version>1.2.17</version>
</dependency>

<!-- https://mvnrepository.com/artifact/com.mchange/c3p0 -->
<dependency>
    <groupId>com.mchange</groupId>
    <artifactId>c3p0</artifactId>
    <version>0.9.5.2</version>
</dependency>

<!-- https://mvnrepository.com/artifact/junit/junit -->
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.12</version>
    <scope>test</scope>
</dependency>
```

# 二、注入 SqlSessionFactory 对象进 Spring 容器

这是至关重要的一步，后面所有的创建都需要依赖这个 sessionFactory。

创建工厂 bean，在 Spring 的 XML 配置如下

```xml
<bean id="sqlSessionFactory" class="org.mybatis.spring.SqlSessionFactoryBean">
    <property name="dataSource" ref="dataSource"></property>
    <property name="mapperLocations" value="classpath*:com/ogemray/mybatis/mapper/*.xml"></property>
    <property name="configLocation" value="classpath:mybaitis-config.xml"></property>
</bean>
```

这里需要注意以下几点

## 1. 注意资源映射文件的位置

如果是用 IntelliJ IDEA 进行开发，需要注意 XML 文件的位置，该工具默认不编译除 resources 文件下其他包或文件下的资源文件。解决方案有很多种，简单列举常用两种方式：

① 将所有资源文件都放在 resources 文件夹下

② 在 pom.xml 文件下做如下配置

```xml
<build>
    <resources>
        <resource>
            <directory>src/main/java</directory>
            <includes>
                <include>**/*.xml</include>
            </includes>
        </resource>
    </resources>
</build>
```

如果不进行上面的配置，会导致最终程序找不到资源文件而报错，如果使用 MyEclipse 或 Eclipse 则可以忽略该操作。

## 2. 工厂的创建

为什么 class 是 `SqlSessionFactoryBean`，而注入生成的是 `sqlSessionFactory ` 对象呢?

因为 `SqlSessionFactoryBean` 实现了 Spring 的 `FactoryBean` 接口(请参考 Spring 文档的 3.8 章节)这就说明了由 Spring 最终创建的 bean 不是 `SqlSessionFactoryBean` 本身，而是工厂类的 `getObject()` 返回的方法的结果。这种情况下，Spring 将会在应用启动时创建 `SqlSessionFactory` 对象，然后将它以 `sqlSessionFactory` 为名来存储。

在 Java 中, 相同的代码是:

```java
SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
SqlSessionFactory sessionFactory = factoryBean.getObject();
```

## 3. 加载 MyBatis 配置文件

属性 `configLocation` 是用来指定 MyBatis 的 XML 配置文件路径的。 如果基本的 MyBatis 配置需要改变，那么这就是一个需要它的地方。 通常这会是 `<settings>` 或 `<typeAliases>` 或 `<properties>` 的部分。如果写了`<environments>` 部分也无效，因为设置 `dataSource` 连接池属性的时候已经创建 `sessionFactory` 连接环境。

属性 `mapperLocations` 是用来指定映射文件路径，也可以配置在 MyBatis 的 XML 配置文件中，然后加载用 `configLocation` 属性加载(如上)。

# 三、将 Dao 实现类注入 Spring 容器的四种方式

这四种方式简单的说可以分为两大类：① 使用 MyBatis 提供的模板类为 Dao 实现类得到 `SqlSession`，② MyBatis 根据 XML 映射文件自动生成代理类实现 Dao 接口，并注入到 Spring 容器中

第一种方式为了得到 `SqlSession`，mybatis-spring 为我们提供了两个简单的方案 `SqlSessionTemplate` 和 `SqlSessionDaoSupport`。Dao 接口实现类通过这两个方案拿到 `SqlSession` 来实现一些列数据库交互操作，然后手动将 Dao 接口实现类注入到 Spring 容器中。很显然这种方式已经过时了，为了方便快速开发，mybatis 提供了另一种快速开发方案。

第二种方式 mybatis-spring 为我们提供了 `MapperFactoryBean` 和 `MapperScannerConfigurer` 来实现映射器的快速注入，免去了写 Dao 接口实现类的麻烦，将自动生成代理类并实现 Dao 接口，然后注入 Spring 容器中。

**总结：平时开发我们都会选择 `MapperScannerConfigurer` 来注入映射器**

下面来看下各个方案的具体显示

## 1. 利用 SqlSessionTemplate 为 Dao 接口实现类提供 SqlSession

`SqlSessionTemplate` 是 MyBatis-Spring 的核心，他负责管理 MyBatis 的 `SqlSession`，`SqlSessionTemplate` 实现了 `SqlSession` 接口，这就是说，在代码中无需对 MyBatis 的 `SqlSession` 进行替换。

`SqlSessionTemplate` 对象可以使用 `SqlSessionFactory` 作为构造方法的参数来创建。

```xml
<bean id="sqlSession" class="org.mybatis.spring.SqlSessionTemplate">
   <constructor-arg ref="sqlSessionFactory"></constructor-arg>
</bean>
```

结合案例使用

```java
public class ContactDaoImpl implements ContactDao {
    private SqlSession sqlSession;
    public void setSqlSession(SqlSession sqlSession) {
        this.sqlSession = sqlSession;
    }

    @Override
    public Contact findObjectById(int id) {
        return sqlSession.selectOne("com.ogemray.mybatis.mapper.ContactMapper.findObjectById", id);
    }
}
```

```xml
<bean id="contactDao" class="com.ogemray.mybatis.dao.ContactDaoImpl">
    <property name="sqlSession">
        <bean class="org.mybatis.spring.SqlSessionTemplate">
            <constructor-arg ref="sqlSessionFactory"></constructor-arg>
        </bean>
    </property>
</bean>
```

```java
@Test
public void testTemplateFindById() throws Exception {
    ContactDao contactDao = (ContactDao) context.getBean("contactDao");
    Contact contact = contactDao.findObjectById(1);
    System.out.println(contact);
}
```

## 2. 继承 SqlSessionDaoSupport 为 Dao 接口实现类提供 SqlSession

`SqlSessionDaoSupport` 是一个抽象的支持类，用来为继承他的子类提供 `SqlSession`。 调 用 `getSqlSession()` 方法就会得到一个 `SqlSessionTemplate`，之后可以用于执行 SQL 方法。

```java
import org.mybatis.spring.support.SqlSessionDaoSupport;
public class ContactDaoImpl extends SqlSessionDaoSupport implements ContactDao {
    @Override
    public Contact findObjectById(int id) {
        return getSqlSession().selectOne("com.ogemray.mybatis.mapper.ContactMapper.findObjectById", id);
    }
}
```

`ContactDaoImpl` 是 `SqlSessionDaoSupport` 的子类，它可以在 Spring 中进行如下注入。

```xml
<bean id="contactDao" class="com.ogemray.mybatis.dao.ContactDaoImpl">
    <property name="sqlSessionFactory" ref="sqlSessionFactory"></property>
</bean>
```

## 3. 利用 MapperFactoryBean 自动创建实现类后注入

为了代替手动使用 `SqlSessionDaoSupport` 或 `SqlSessionTemplate` 编写 Dao 层实现类代码，MyBatis-Spring 提供了一个动态代理的实现：`MapperFactoryBean`。这个类可以让你直接注入数据映射器接口到你的 service 层 bean 中。不需要编写 Dao 实现的代码，因为 MyBatis-Spring 会根据 XML 映射文件自动创建代理实现类。然后我们就可以直接调用了。

```xml
<bean id="contactMapper" class="org.mybatis.spring.mapper.MapperFactoryBean">
    <property name="mapperInterface" value="com.ogemray.mybatis.mapper.ContactMapper"></property>
    <property name="sqlSessionFactory" ref="sqlSessionFactory"></property>
</bean>
```

`MapperFactoryBean` 创建的代理类实现了 `ContactMapper` 接口，并且注入到应用程序中。

最后注入 service 对象

```xml
<bean id="contactService" class="com.ogemray.mybatis.service.ContactServiceImpl">
    <property name="contactMapper" ref="contactMapper"></property>
</bean>
```

```java
public class ContactServiceImpl implements ContactService {
    private ContactMapper contactMapper;
    public void setContactMapper(ContactMapper contactMapper) {
        this.contactMapper = contactMapper;
    }

    @Override
    public Contact findObjectById(int id) throws Exception {
        return contactMapper.findObjectById(id);
    }
}
```

调用测试

```java
@Test
public void testSpringMergeFindById() throws Exception {
    ContactMapper mapper = (ContactMapper) context.getBean("contactMapper");
    Contact contact = mapper.findObjectById(1);
    System.out.println(contact);
}
```

## 4. 利用 MapperScannerConfigurer 扫描容器注入

没有必要在 Spring 的 XML 配置文件中注册所有的映射器，因为一个个注入太麻烦太浪费时间，所以 mybatis-spring 为我们提供了一种简单的注入方式。可以使用 `MapperScannerConfigurer` , 它将会查找类路径下的映射器并自动将它们创建成 `MapperFactoryBean` 对象。

在 Spring 的配置中添加如下代码：

```xml
<bean class="org.mybatis.spring.mapper.MapperScannerConfigurer">
    <property name="basePackage" value="com.ogemray.mybatis.mapper"></property>
</bean>
```

`basePackage` 属性是为映射器接口文件设置基本的包路径, **可以使用分号或逗号作为分隔符设置多于一个的包路径** ，每个映射器将会在指定的包路径中递归地被搜索到。

**注意：**全局就一个`SqlSessionFactory`时就没有必要去指定 `SqlSessionFactory`，因为 `MapperScannerConfigurer` 将会在创建 `MapperFactoryBean` 之后自动装配。但是如果使用了一个 以上的 DataSource ，那么自动装配可能会失效。这种情况下，需要使用 `sqlSessionFactoryBeanName` 或 `sqlSessionTemplateBeanName` 属性来设置正确的 bean 名称来使用。**注意这里属性里面需要用 value 来替代 ref**。

```xml
<bean class="org.mybatis.spring.mapper.MapperScannerConfigurer">
    <property name="basePackage" value="com.ogemray.mybatis.mapper"></property>
    <property name="sqlSessionFactoryBeanName" value="sqlSessionFactory"></property>
</bean>
```

最后注入 service 对象

```xml
<bean id="contactService" class="com.ogemray.mybatis.service.ContactServiceImpl">
    <property name="contactMapper" ref="contactMapper"></property>
</bean>
```

**最后我们可能注意到，自动扫描加入 spring 容器的 bean 的 id 是什么呢？**
最后我们一起来看下 `MapperScannerConfigurer` 里面生成 beanName 的代码

![beanName.png](/assets/img/2018-11-22/4322526-a26da59c5e38c15d.webp)

应该就是注入对象类名首字母小写作为 beanName

# 四、附加

我们一般用 mybatis 开发都希望看到执行的 sql 语句，所以这里不仅需要导入 log4j 架包，同时需要在 mybatis 配置文件中加上如下代码

```xml
<settings>
    <setting name="logImpl" value="STDOUT_LOGGING"/>
</settings>
```
