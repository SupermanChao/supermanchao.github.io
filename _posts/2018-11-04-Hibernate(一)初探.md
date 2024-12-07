---
layout: post
title: "Hibernate(一) 初探"
subtitle: "Hibernate 初探"
date: 2018-11-04
categories: 技术
cover: "http://on2171g4d.bkt.clouddn.com/jekyll-theme-h2o-postcover.jpg"
tags: java orm Hibernate JDBC 数据库
---

> 最近重新学习了一遍 Hibernate 框架，感觉收益颇多，再次做个学习总结和笔记。本篇文章主要记录和总结 Hibernate 的基本配置项和 一级缓存及 Hibernate 中的对象状态。

今天这篇总结将会用 Hibernate 最新的稳定版本，数据库也用新的稳定版本，由于设计到众多依赖项，所以就构建一个 Maven 工程，pom.xml 依赖项配置如下

```java
<dependency>
	<groupId>org.hibernate</groupId>
	<artifactId>hibernate-core</artifactId>
	<version>5.2.17.Final</version>
</dependency>

<dependency>
	<groupId>mysql</groupId>
	<artifactId>mysql-connector-java</artifactId>
	<version>5.1.47</version>
</dependency>
```

# 一、基本配置及概念

[源自百度百科](https://baike.baidu.com/item/Hibernate/206989?fr=aladdin)：Hibernate 是一个开放源代码的对象关系映射框架，它对 JDBC 进行了非常轻量级的对象封装，它将 POJO 与数据库表建立映射关系，是一个全自动的 ORM(Object Relative DateBase-Mapping)框架。

## 1. XML 基本配置

hibernate.cfg.xml 配置 (总配置文件)

```java
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-configuration PUBLIC "-//Hibernate/Hibernate Configuration DTD 3.0//EN" "http://hibernate.sourceforge.net/hibernate-configuration-3.0.dtd" >
<hibernate-configuration>
<session-factory>
	<!-- 数据库连接部分 -->
	<property name="connection.driver_class">com.mysql.jdbc.Driver</property>
	<property name="connection.url">jdbc:mysql://10.22.70.2:3306/database_chao?useUnicode=true&amp;characterEncoding=utf8</property>
	<property name="connection.username">xxx</property>
	<property name="connection.password">xxx</property>

	<!-- 数据库方言 -->
	<property name="dialect">org.hibernate.dialect.MySQL55Dialect </property>

	<!-- 其他配置部分 -->
	<property name="hbm2ddl.auto">update</property>
	<property name="show_sql">true</property>
	<property name="format_sql">true</property>

	<!-- 实体类映射 -->
	<mapping resource="com/ogemray/a_primary/entity/Contact.hbm.xml" />

</session-factory>
</hibernate-configuration>
```

hbm.xml 配置 (实体类映射文件)

```java
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-mapping PUBLIC "-//Hibernate/Hibernate Mapping DTD 3.0//EN" "http://hibernate.sourceforge.net/hibernate-mapping-3.0.dtd" >

<hibernate-mapping package="com.ogemray.a_primary.entity">

	<class name="Contact" table="t_contact">
		<id name="id" column="id" type="integer">
			<generator class="native"></generator>
		</id>
		<property name="name" type="string"></property>
		<property name="birthday" type="date"></property>
	</class>

</hibernate-mapping>
```

其他字段就不过累述，下面主要讲下总配置文件中的数据库方言、建表策略和实体映射文件中的主键生成策略。

## 2. Hibernate 数据库方言

方言就是总配置文件中的`dialect`字段，因为 Hibernate 是要把 JavaBean 对象映射成数据库能够识别的数据结构，而不同的数据库有自己不同的标准，因此，Hibernate 为了更好适配各种数据库，针对每种数据库都指定了一个方言。根据指定的方言，将不同数据类型、SQL 语法转换成 Hibernate 能理解的统一的格式。如果没有对应的方言，Hibernate 是无法进行数据关系转换映射的。

具体方言:[https://blog.csdn.net/jialinqiang/article/details/8679171](https://blog.csdn.net/jialinqiang/article/details/8679171)
因为现我基本都用 MySQL 数据库，关于 MySQL 方言有三种。

- org.hibernate.dialect.MySQLDialect
- org.hibernate.dialect.MySQLInnoDBDialect
- org.hibernate.dialect.MySQLMyISAMDialect

`MySQLMyISAMDialect` 和 `MySQLInnoDBDialect` 都是继承 `MySQLDialect`，`MySQLInnoDBDialect` 创建的数据库引擎是 **InnoDB**，而 `MySQLMyISAMDialect` 创建的数据库引擎是 **MyISAM**，InnoDB 支持事务和外键，MyISAM 不支持事务和外键，但是处理速度要比 InnoDB 快，MyISAM 类型的二进制数据文件可以用做在不同操作系统中迁移。也就是可以直接从 Windows 系统拷贝到 linux 系统中使用。

InnoDB 的 `autocommit` 默认是打开的，即每条 SQL 语句会默认被封装成一个事务，自动提交，这样会影响速度，所以最好是把多条 SQL 语句显示放在 `begin` 和 `commit` 之间，组成一个事务去提交。

经过探索发现，在我目前尝试的这个版本，MySQL 5.1.47 默认创建的数据库引擎是 MyISAM，MySQL 5.5 之后默认创建引擎用的是 InnoDB ，MySQL 8 已经移除了 MyISAM 引擎。

总结：一般关系型数据库用 InnoDB 。

上面三个方言是针对 MySQL 5 之前的版本。主要变化还是在于建表 SQL 语句。MySQL 5 之后跟之前还是有不小的变化。比如 varchar 在 5.0.3 及之前版本最大长度限制为 255，之后版本最大长度限制为 65535。所以为了兼容 MySQL 5 之后，Hibernate 作者新出来了几种 dialect。

- org.hibernate.dialect.MySQL5Dialect
- org.hibernate.dialect.MySQL55Dialect
- org.hibernate.dialect.MySQL57InnoDBDialect
- org.hibernate.dialect.MySQL5InnoDBDialect

但是升级到 Hibernate 5 的时候，就会发现 `MySQL5InnoDBDialect`，被标注过时了。不仅仅是它过时了，所有带 InnoDB 的 Dialect 都被标注过时了，在标注有 InnoDBDialect 过时的同时 新加了 MySQL55Dialect 及 MySQL57Dialect。

如果查看源码就会发现 MySQL55Dialect 与 MySQL5InnoDBDialect 源码一模一样。

毕竟 MySQL 后面把 MyISAM 引擎给淘汰了，所以 Hibernate 作者认为没有必要再分为两类。

## 2. 建表策略

Hibernate 会根据 hbm2ddl.auto 设置生成对应的建表策略。

- **create**：每次都会先 drop 先前的表然后重新创建
- **create-drop**: 也表示创建，但是 SessionFactory 关闭的时候就会自动删除
- **update**: 没有则创建，有则不重新创建，有改变会更新表结构
- **validate**: 每次启动会验证配置的表结构是否和数据库里面的表结构一致，不一致会抛出异常，并不做更新

## 3. 主键生成策略

映射配置文件里面 `<id>` 元素内部 提供 `<generator>` 元素， 有 `class` 属性，指定数据表主键生成策略。Hibernate 里面对于主键生成策略有 11 种之多，下面来说说这其中最常用的几种策略。

- **assigned**：主键由外部程序负责生成，Hibernate 和底层数据库都不负责维护，可以跨数据库。

- **increment**：由 Hibernate 从数据库中取出最大值(每个 session 只取一次)，以该值为基础每次增量为 1，在内存中生成主键而不用依赖于数据库，因此可以实现跨数据库。**但是这种方式不适合多进程并发插入数据到数据库，适合单一进程访问数据库，不能用于集群环境**。
- **hilo**：高低位方式，Hibernate 中最常用的一种生成方式，需要一张额外的表保存 hi 的值，保存 hi 值的表至少有一条记录(只与第一条记录有关)，否则会出现错误，可以跨数据库(Hibernate 内部有一套自己的算法生成标志值，不依赖数据库底层)。

```xml
<id name="id" column="id">
	<generator class="hilo">
		<!-- 指定保存 hi 位值的表名 -->
		<param name="table">hibernate_hilo</param>
		<!-- 指定保存 hi 位置列的名 -->
		<param name="column">next_hi</param>
		<!-- 指定地位最大值 -->
		<param name="max_lo">100</param>
	</generator>
</id>
```

现在 Hibernate 已经将这种主键生成方式给移除了
![Hibernate主键生成策略源码.png](/assets/img/2018-11-04/4322526-152e52c2ca991bd6.webp)

- **seqhilo**：与 hilo 类似，通过 hi/lo 算法实现主键生成机制，只是将 hilo 中的数据表转换成了序列 sequence，需要数据库中先创建 sequence，使用于支持 sequence 的数据库，如 Oracle。
- **sequence**：采用数据库提供的 sequence 机制来生成主键，需要数据库支持 sequence，如 Oracle、DB...支持，MySQL 不支持。
- **identity**：由底层数据库生成自增长标识符，其他数据库都基本支持，但是 Oracle 不支持。
- **native**：由 Hibernate 根据使用数据库自行判断主键生成策略，灵活性很强，如果支持 identity 则使用 identity，如果支持 sequence 则使用 sequence。基本上是我们最常用的一中主键生成方式配置。
- **uuid**：Hibernate 在保存对象时，生成 UUID 字符串作为主键，保证了唯一性，可以实现跨数据库，以后切换数据库极其方便。缺点就是占用空间要大点，不过现在新标准的 UUID2 主键生成策略已经出来了，高版本建议用 UUID2 来代替 UUID。
- **guid**：Hibernate 在维护主键时，先查询数据库，获得一个 uuid 字符串，用该字符串作为主键，缺点就是支持生成 uuid 的数据库有限，需要数据库的支持。
- **foreign**：使用另外的一个相关联的对象的主键作为主键，主要用于一对一关系中。
- **select**：使用触发器生成主键，主要用于早期的数据库主键生成机制，能用到的地方非常少。

# 二、SessionFactory 创建

```java
SessionFactory sessionFactory = null;

// 创建一个 SessionFactory
final StandardServiceRegistry registry = new StandardServiceRegistryBuilder()
		.configure() // 默认加载文件名为 hibernate.cfg.xml 配置文件
		.build();
try {
	sessionFactory = new MetadataSources( registry ).buildMetadata().buildSessionFactory();
}
catch (Exception e) {
	//创建 SessionFactory 错误时销毁注册表
	StandardServiceRegistryBuilder.destroy( registry );
}
```

# 三、Hibernate 一级缓存及对象状态

在说到 Hibernate 的一级缓存，就不得不说 Hibernate 中对象的三种状态。

Hibernate 中对象有三种状态：**临时状态(Transient)**、**持久状态(Persistent)**、**游离状态(Detached)**。

理解 Hibernate 对象状态对于学习至关重要，话不多说，先从一张图开始。

![Hibernate中对象状态.jpg](/assets/img/2018-11-04/4322526-6c3b95d331f62132.webp)

- **临时状态**：对象刚被 new 出来并且未被持久化，还没有被加入到 Session 缓存中的 Java 对象。
- **持久化状态**：已经被持久化，并且已经被加入 Session 缓存中的 Java 对象。
- **游离状态**：已经被持久化，但是不处于 Session 的缓存中。

注意下几个操作 Hibernate 中对象状态的方法，对上面的图做个简单解释。

- `get(..)`、`load(..)`、`find(..)`、`save(..)`、`saveOrUpdate(..)` 等方法直接将对象加入 session 缓存中，通过上面图和下面例子能理解。
- `delete(..)` 删除对象，将对象由持久化状态变成临时状态。
- `close(..)` 关闭 session 对象，对象从 session 缓存中清除，但是数据库有有对应的记录，此时对象由持久化状态变成游离状态。
- `clear(..)` 清空 session 缓存，对象也是从 session 缓存中清除，由持久化状态变成游离状态。
- `evict(..)` 将指定对象从 session 缓存中清除，效果跟上面 `clear(..)` 一样，只不过这个更片面化，被清除的对象由持久化状态直接变成游离状态。

下面通过一段代码理解三种状态之间的关系

```java
@Test
public void testSimpleObjectState() {

	Session session = sessionFactory.openSession();
	session.beginTransaction();

	Contact contact = new Contact();
	contact.setName("LiuChao");
	contact.setBirthday(new Date());
	/**
	 * ①.[临时状态]
	 * 此时 contact 对象只是刚 new 出来的临时状态
	 */

	session.save(contact);
	/**
	 * ②. [持久化状态]
	 * 对象被保存到 session 缓存中, 并发送 insert 语句 对象被持久化到数据库
	 */

	session.getTransaction().commit();
	session.close();
	/**
	 * ③. [游离状态]
	 * session 关闭, 缓存自然被清空, 但是 contact 对象已经被保存到数据库
	 */
}
```

下面我们再通过一段代码来理解一下 Hibernate 的一级缓存(session 缓存) 和 对象状态之间的关系:

```java
@Test
public void testRelationshipBetweenSessionCacheAndObjectState() {

	Session session = sessionFactory.openSession();
	session.beginTransaction();

	Contact contact = session.get(Contact.class, 1);
	System.out.println(contact.toString());
	/**
	 * ①. [持久化状态]
	 * 直接从数据库里面查询出来的, 会发送一条 select 语句, 并被保存到 session 缓存中
	 */

	Contact contact2 = session.get(Contact.class, 1);
	System.out.println(contact2.toString());
	/**
	 * 这里不会再发送 select 语句, 而是直接 session 缓存里面拿
	 */

	contact2.setName("Merry");

	contact.setName("Tony");
	/**
	 * 这里的 contact 和 contact2 是同一个对象, 都是 session 所管理的对象
	 * 可以打印对象的 hashCode进行查看
	 */

	/**
	 * 在 commit 的时候, 会拿 session 所缓存的对象跟刚查询出来的时候作对比, 不一样则发一条 update 语句更新数据库
	 * 所以上面不管经过几次更改, 只有在 commit 的时候才会进行对比和更新
	 */
	session.getTransaction().commit();
	session.close();
}
```

这里是我的猜测总结：当查询或者插入对象的时候，将对象缓存到 session 中(这时会缓存两份，一份用于查询返回，一份用作后期样本对比)，在 session 未被关闭和清空前，不管查询多少次，都是返回 session 缓存的那个对象，是同一个对象，用 C 语言来说返回的指针指向堆上的同一个地址。在 commit 的时候，Hibernate 会拿 session 缓存中用于查询返回的对象和缓存的另一份样本对象作对比，不一样则更新数据库。

这里可以通过一个小实验得到证明：在 commit 之前直接修改返回的对象，然后再通过 session.get 方法拿取到的是修改后的，但是数据库里面是以前的，commit 之后数据库才会改变。

以上只是我的个人猜测，实际 Hibernate 里面怎么实现还是得看源码，现在能力有限看不了，等以后看了之后会对这里进行更正。

最后要提到一个方法 `flush()`，session 通过调用 `flush()` 方法能提前更新缓存中改变的对象数据到数据库，而不用等到 commit。
