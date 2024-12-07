---
layout: post
title: "Spring JDBCTemplate"
subtitle: "Spring JDBCTemplate学习"
date: 2018-10-30
categories: 学习笔记
# cover: ""
tags: Java JDBC
---

> 最近学习 Spring 框架，写这篇文章是对这段时间学习的一个总结也是学习的笔记，这篇笔记主要讲 Spring 提供的一个简易持久层操作数据的模板**JDBCTemplate**的增删改查功能，他跟自己用**DBUtils**封装的持久层有点类似。

在文章开始前，我们先来看下 Spring 为几种持久化技术提供的简单操作模板类。

| ORM 持久化技术 | Spring 提供的模板类                                                            |
| -------------- | ------------------------------------------------------------------------------ |
| JDBC           | org.springframework.jdbc.core.JdbcTemplate                                     |
| Hibernate5.0   | org.springframework.orm.hibernate5.HibernateTemplate                           |
| MyBatis        | org.springframework.orm.ibatis.SqlMapClientTemplate **后面已经被 Spring 移除** |
| JPA            | org.springfrmaework.orm.jpa.JpaTemplate                                        |

# 1. 依赖架包导入

Spring 核心包

```java
commons-logging-1.1.3.jar
spring-beans-4.0.6.RELEASE.jar
spring-context-4.0.6.RELEASE.jar
spring-core-4.0.6.RELEASE.jar
spring-expression-4.0.6.RELEASE.jar
```

JDBC 支持包

```java
spring-jdbc-4.0.6.RELEASE.jar
spring-tx-4.0.6.RELEASE.jar
```

数据库驱动包和连接池架包

```java
mysql-connector-java-5.1.7-bin.jar
c3p0-0.9.1.2.jar
```

# 2. 简单操作示例

先简单来，不 c3p0 连接池，而是用 Spring 配置内置的连接池 DriverManagerDataSource 做一个 JDBCTemplate 的数据库操作，来看看 JDBCTemplate 的初步用法(前提自己创建好数据库并定义好表)。

```java
/**
 * JDBCTemplate简单操作测试类
 * @author liuchao
 */
public class JDBCDataSourceTest {

	private DriverManagerDataSource dataSource;

	@Before
	public void beforeAction() {
		dataSource = new DriverManagerDataSource();
		dataSource.setDriverClassName("com.mysql.jdbc.Driver");
		dataSource.setUrl("jdbc:mysql://10.22.70.2:3306/database_chao?useUnicode=true&characterEncoding=utf8");
		dataSource.setUsername("xxx");
		dataSource.setPassword("xxx");
	}

	//增
	public void testSimpleInsert() {..

	//删
	public void testSimpleDelete() {..

	//改
	public void testSimpleUpdate() {..

	//聚合查询
	public void testSimpleAggregation() {..

	//查: 执行给定静态SQL的查询，使用RowCallbackHandler以每行为基础读取ResultSet。
	public void testSimpleQuery_RowCallbackHandler() {..

	//查: 执行给定静态SQL的查询，通过RowMapper将每一行映射到Java对象。
	public void testSimpleQuery_RowMapper() {..

	//查: 在给定静态SQL的情况下执行查询，使用ResultSetExtractor读取ResultSet。
	@Test
	public void testSimpleQuery_ResultSetExtractor() {..
```

插入 删除 更新 都用 `update..` 方法, 其中用 `public int update(String sql, Object... args)` 方法最为方便。
查询用 `query..`。

- ① 插入

```java
@Test
public void testSimpleInsert() {

	JdbcTemplate template = new JdbcTemplate(dataSource);

	String sql = "insert into contact (name, age) values (?, ?)";
	int rows = template.update(sql, "测试", 12);
	System.out.println("执行影响行数 " + rows);
}
```

- ② 删除

```java
@Test
public void testSimpleDelete() {

	JdbcTemplate template = new JdbcTemplate(dataSource);

	String sql = "delete from contact where id<?";
	int rows = template.update(sql, 18);
	System.out.println("执行影响行数 " + rows);
}
```

- ③ 更新

```java
@Test
public void testSimpleUpdate() {

	JdbcTemplate template = new JdbcTemplate(dataSource);

	String sql = "update contact set name=?, age=? where id=?";
	int rows = template.update(sql, "测试更新", 24, 20);
	System.out.println("执行影响行数 " + rows);
}
```

- ④ 聚合查询
  - `public <T> T queryForObject(String sql, Class<T> requiredType)`

```java
@Test
public void testSimpleAggregation() {

	JdbcTemplate template = new JdbcTemplate(dataSource);

	String sql = "select count(id) from contact";
	long count = template.queryForObject(sql, Long.class);
	System.out.println("一共有 " + count + " 条记录");
}
```

- ⑤ 查询：执行给定静态 SQL 的查询，使用 RowCallbackHandler 以每行为基础读取 ResultSet，以下面两种方法查询最为方便。

  - `public void query(String sql, RowCallbackHandler rch)`
  - `public void query(String sql, RowCallbackHandler rch, Object... args)`

```java
@Test
public void testSimpleQuery_RowCallbackHandler() {

	JdbcTemplate template = new JdbcTemplate(dataSource);

	String sql = "select * from contact";

	ArrayList<Contact> list = new ArrayList<Contact>();

	template.query(sql, new RowCallbackHandler() {

		@Override
		public void processRow(ResultSet rs) throws SQLException {
			Contact contact = new Contact();
			contact.setId(rs.getInt("id"));
			contact.setName(rs.getString("name"));
			contact.setAge(rs.getInt("age"));
			list.add(contact);
		}
	});

	for (Contact contact : list) { System.out.println(contact.toString()); }
}
```

- ⑥ 查询：执行给定静态 SQL 的查询，通过 RowMapper 将每一行映射到 Java 对象。以下面两种方法查询最为方便。

  - `public <T> List<T> query(String sql, RowMapper<T> rowMapper)`
  - `public <T> List<T> query(String sql, RowMapper<T> rowMapper, Object... args)`

```java
@Test
public void testSimpleQuery_RowMapper() {

	JdbcTemplate template = new JdbcTemplate(dataSource);

	String sql = "select * from contact";

	List<Contact> list = template.query(sql, new RowMapper<Contact>() {

		@Override
		public Contact mapRow(ResultSet rs, int rowNum) throws SQLException {
			Contact contact = new Contact();
			contact.setId(rs.getInt("id"));
			contact.setName(rs.getString("name"));
			contact.setAge(rs.getInt("age"));
			return contact;
		}
	});

	for (Contact contact : list) { System.out.println(contact.toString()); }
}
```

- ⑦ 查询：在给定静态 SQL 的情况下执行查询，使用 ResultSetExtractor 读取 ResultSet。以下面两种方法查询最为方便。

  - `public <T> T query(final String sql, final ResultSetExtractor<T> rse)`
  - `public <T> T query(String sql, ResultSetExtractor<T> rse, Object... args)`

```java
@Test
public void testSimpleQuery_ResultSetExtractor() {

	JdbcTemplate template = new JdbcTemplate(dataSource);

	String sql = "select * from contact";

	List<Contact> list = template.query(sql, new ResultSetExtractor<List<Contact>>() {

		@Override
		public List<Contact> extractData(ResultSet rs) throws SQLException, DataAccessException {

			ArrayList<Contact> tempList = new ArrayList<Contact>();
			while (rs.next()) {
				Contact contact = new Contact();
				contact.setId(rs.getInt("id"));
				contact.setName(rs.getString("name"));
				contact.setAge(rs.getInt("age"));
				tempList.add(contact);
			}
			return tempList;
		}
	});

	for (Contact contact : list) { System.out.println(contact.toString()); }
}
```

由上面的小测试我们基本了解到该如何下手，接下来进行正式的操作，连接池配置到 Spring 的 XML 文件中，对象都用 ioc set 方式注入。

# 3. JDBCTemplate 规范操作和配置

首先来看下 Spring XML 文件的配置

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:aop="http://www.springframework.org/schema/aop"
	xmlns:tx="http://www.springframework.org/schema/tx"
	xmlns:context="http://www.springframework.org/schema/context"
	xsi:schemaLocation="
    	http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/context
        http://www.springframework.org/schema/context/spring-context.xsd
        http://www.springframework.org/schema/aop
        http://www.springframework.org/schema/aop/spring-aop.xsd
        http://www.springframework.org/schema/tx
 	    http://www.springframework.org/schema/tx/spring-tx.xsd">


 	    <!-- 1. 连接池配置 -->
 	    <bean id="dataSource" class="com.mchange.v2.c3p0.ComboPooledDataSource">
 	    	<property name="driverClass" value="com.mysql.jdbc.Driver"></property>
 	    	<property name="jdbcUrl">
 	    		<value><![CDATA[jdbc:mysql://10.22.70.2:3306/database_chao?useUnicode=true&characterEncoding=utf8]]></value>
 	    	</property>
 	    	<property name="user" value="xxx"></property>
 	    	<property name="password" value="xxx"></property>
 	    	<property name="initialPoolSize" value="1"></property>
 	    	<property name="minPoolSize" value="1"></property>
 	    	<property name="maxPoolSize" value="2"></property>
 	    </bean>


 	    <!-- 2. JDBCTemplate -->
 	    <bean id="jdbcTemplate" class="org.springframework.jdbc.core.JdbcTemplate">
 	    	<property name="dataSource" ref="dataSource"></property>
 	    </bean


 	    <!-- 3. 项目里面自己创建类的bean定义部分 -->
 	    <bean id="contactDaoImpl" class="com.g_JdbcTemplate.dao.impl.ContactDaoImpl">
 	    	<property name="template" ref="jdbcTemplate"></property>
 	    </bean>

 	    <bean id="contactService" class="com.g_JdbcTemplate.service.ContactService">
 	    	<property name="contactDao" ref="contactDaoImpl"></property>
 	    </bean>

</beans>
```

接口省略，直接上实现类里面的增删改查代码

```java
public class ContactDaoImpl implements ContactDao {

	private JdbcTemplate template;
	public void setTemplate(JdbcTemplate template) {
		this.template = template;
	}

	//增
	@Override
	public int insertContact(Contact contact) throws Exception {
		String sql = "insert into contact (name, age) values (?, ?)";
		int rows = template.update(sql, contact.getName(), contact.getAge());
		return rows;
	}

	//删
	@Override
	public int deleteContactById(int id) throws Exception {
		String sql = "delete from contact where id=?";
		int rows = template.update(sql, id);
		return rows;
	}

	//改
	@Override
	public int updateContact(Contact contact) throws Exception {
		String sql = "update contact set name=?, age=? where id=?";
		int rows = template.update(sql, contact.getName(), contact.getAge(), contact.getId());
		return rows;
	}

	//根据id查询
	@Override
	public Contact queryContactById(int id) throws Exception {

		String sql = "select * from contact where id=?";

		List<Contact> list = template.query(sql, new RowMapper<Contact>() {

			@Override
			public Contact mapRow(ResultSet rs, int rowNum) throws SQLException {
				Contact contact = new Contact();
				contact.setId(rs.getInt("id"));
				contact.setName(rs.getString("name"));
				contact.setAge(rs.getInt("age"));
				return contact;
			}
		}, id);

		return (list != null && list.size() > 0) ? list.get(0) : null;
	}

	//查询全部
	@Override
	public List<Contact> queryAllContact() throws Exception {

		String sql = "select * from contact";

		List<Contact> list = template.query(sql, new RowMapper<Contact>() {

			@Override
			public Contact mapRow(ResultSet rs, int rowNum) throws SQLException {
				Contact contact = new Contact();
				contact.setId(rs.getInt("id"));
				contact.setName(rs.getString("name"));
				contact.setAge(rs.getInt("age"));
				return contact;
			}
		});

		return list;
	}
}
```

业务层代码，持久层出现异常接着往上抛，后面涉及到事务管理，异常回滚要用到。

```java
public class ContactService {

	private ContactDao contactDao;
	public void setContactDao(ContactDao contactDao) {
		this.contactDao = contactDao;
	}

	public int insertContact(Contact contact) throws Exception {
		if (contact == null) { return 0; }
		return contactDao.insertContact(contact);
	}

	public int deleteContactById(int id) throws Exception {
		return contactDao.deleteContactById(id);
	}

	public int updateContact(Contact contact) throws Exception {
		if (contact == null) { return 0; }
		return contactDao.updateContact(contact);
	}

	public Contact queryContactById(int id) throws Exception {
		return contactDao.queryContactById(id);
	}

	public List<Contact> queryAllContact() throws Exception {
		return contactDao.queryAllContact();
	}
}
```

测试类

```java
/**
 * 测试类
 * @author liuchao
 */
public class ContactTest {

	private ClassPathXmlApplicationContext context;

	@Before
	public void beforeAction() {
		context = new ClassPathXmlApplicationContext("com/g_JdbcTemplate/bean.xml");
	}

	@Test
	public void testInsertContact() {

		ContactService service = (ContactService) context.getBean("contactService");

		Contact contact = new Contact();
		contact.setName("Test");
		contact.setAge(13);

		int rows = 0;
		try {
			rows = service.insertContact(contact);
		} catch (Exception e) {
			e.printStackTrace();
		}

		System.out.println("插入影响行数 " + rows);
	}

	@Test
	public void testDeleteContactById() {..

	@Test
	public void testUpdateContact() {..

	@Test
	public void testQueryContactById() {..

	@Test
	public void testQueryAllContact() {..

```

# 4. JDBCTemplate 事务管理配置

请参考 [Spring 中持久层事务配置](https://www.jianshu.com/p/5536a9b12735)
