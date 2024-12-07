---
layout: post
title: "Hibernate(三) 检索方式和策略"
subtitle: "Hibernate 检索方式和策略"
date: 2018-11-08
categories: 技术
# cover: ""
tags: Hibernate
---

> 最近重新学习了一遍 Hibernate 框架，感觉收益颇多。学到最后不得不说下 Hibernate 的检索，为了提高检索速度，Hibernate 提供了**立即检索策略**、**延迟检索策略**和**左外连接检索策略**三种策略。为了满足用户不同习惯和多样化搜索需求，Hibernate 提供了五中检索数据的方式，这其中我主要记录了**HQL 检索方式**。

说到检索，为了实现高效的检索，我们先来说下 Hibernate 的检索策略。

# 一、Hibernate 的检索策略

Hibernate 的 session 在加载对象是可以将其关联的对象也加载到缓存中来，以便调用，但在有些情况下，我们不太需要加载太多无用的对象到缓存中来，一是浪费内存，二是消耗无谓的查询。所以为了合理使用缓存，Hibernate 提供了**立即检索策略**、**延迟检索策略**和**左外连接检索策略**。

## 1. 立即检索策略和延迟检索策略

**立即检索策略**就是立即将查询对象查询出来加进缓存，并且将其关联对象也加载出来，这样做能够及时加载自身数据和关联对象数据，但是比较占内存和执行过多的 select 语句。

**延时检索策略**在不涉及到连级操作单张表时，只适用 `session` 的 `load` 方法，只有在用到对象除 `id` 以外的属性时才会去加载对象。在涉及到关联类操作时，只有在用到关联对象的时候才会去加载。**优点: 由程序决定加载哪些内容，避免了大量无用的查询语句。缺点: 在 session 关闭后，就不能访问关联类的对象了，强行访问会发生懒加载异常**

下面我们来通过例子说明下**立即检索策略**和**延时检索策略**的区别。下面举例用到的是 `Grade` 类和 `Student` 类，分别对应数据库里面 `hbm_one2many_grade` 和 `hbm_one2many_student` 两张表，两者是一对多关系。

**① 当不涉及到关联操作，只有一张表时 `get` 和 `load` 的区别**

```java
session.get(Grade.class, 1);
```

会立即发送 SQL 查询语句，将查询对象加进缓存

```java
session.load(Grade.class, 1);
```

`load` 执行后并不发送 SQL 查询语句，只有在访问到该对象的除 id 外的其他属性时才会发送 SQL 查询语句。

**② 在 `<set>` 集合标签里面设置 `lazy` 属性，值分别是 `true` / `false` / `extra`。**

**当 `<set ... lazy="true">...</set>`时**，使用懒加载

```java
Grade grade = session.get(Grade.class, 1);
```

这个时候只会查询 `Grade` 对象，其关联的对象(set 集合关联的对象)不会去查询，只有在用到关联对象的时候才会发送数据查询 SQL 语句。

**当 `<set ... lazy="false">...</set>`时**，不使用懒加载

```java
Grade grade = session.get(Grade.class, 1);
```

不采用懒加载的方式， 查询 `Grade` 的时候会将其关联的对象(set 集合关联的对象)全部查询出来。

**当 `<set ... lazy="extra">...</set>`时**，Hibernate 又对懒加载方式做了些优化

```java
Grade grade = session.get(Grade.class, 1);
```

这个时候不会去查询 set 集合关联的对象

```java
grade.getStudents().size();
```

这个时候也不会去查询 set 集合关联的对象, 而是发送条聚合查询 `select count(id) from ... where grade_id =?`

```java
for (Student student : grade.getStudents()) {
	//System.out.println(student.toString());
}
```

这个时候才会发送 SQL 语句查询 set 集合关联的对象。

**③ 在 `<many-to-one>` 标签里面设置 lazy 属性，值分别是 `false` / `proxy` / `no-proxy`。**

**当 `<many-to-one ... lazy="false"></many-to-one>` 时，也是其默认**

```java
session.get(Student.class, 1);
```

这个查询会将会 many-to-one 关联的对象也给查询出来

**当 `<many-to-one ... lazy="proxy"></many-to-one>` 和 `<many-to-one ... lazy="no-proxy"></many-to-one>`** 时，对于 many-to-one 关联的对象查询使用懒加载的方式，用到是才会发送 SQL 语句查询。

**注意:** 当大环境是懒加载时，可以调用 `initialize(...)` 方法立即加载懒加载对象。

```java
Grade grade = session.get(Grade.class, 1);
grade.getStudents(); //这时懒加载没有被查询
Hibernate.initialize(grade.getStudents()); //即使是懒加载, 也会被查询出来
```

## 3. 左外连接检索策略

采用左外连接检索，能够使用 SQL 的外连接查询将关联对象加进缓存中。
优点: 使用了外连接，select 语句数目少。
缺点: 可能会加载应用程序不需要的对象进缓存，白白浪费内存，同时复杂的数据库表连接也会影响检索性能。

对应 `fetch` 属性，可设置在 `<set>` 标签和 `<many-to-one>` 标签中，对应三种值分别是 `join` / `select` / `subselect`

下面拿 `<set>` 标签使用 `fetch` 属性举例

**当 `<set ... fetch="join"></set>` 时进行查询操作**

```java
session.get(Grade.class, 1);
```

执行上面代码发送查询的 SQL 语句

```sql
select
    ...
from
    hbm_one2many_grade grade0_
left outer join
    hbm_one2many_student students1_
        on grade0_.id=students1_.grade_id
where
    grade0_.id=?
```

通过左外连接的方式将其 `<set>` 集合标签关联的对象也都全部查询出来，这时 `<set>` 标签里面的 `lazy` 属性无效。

**当 `<set ... fetch="select"></set>` 时进行查询操作**

这时会按照 `lazy` 设置方式加载关联对象，发送普通的 select SQL 语句进行相关查询。

# 二、Hibernate 的检索方式

Hibernate 检索数据分为 5 中方式，分别是 **OID 检索、导航对象图检索、HQL 检索、QBC 检索、和本地 SQL 检索**。

## 1. OID 检索方式

这种检索方式使我们最常用的，根据对象 id 查询对象，涉及到的方法 `session.get("xx", id)` 和 `session.load("xx", id)`。

## 2. 导航对象图检索方式

通过已加载的对象导航到其他关联对象，一般用在关系数据表对象查询中。

```java
Student student = session.get(Student.class, 1);

Grade grade = student.getGrade();
```

后面根据 `student` 对象查询里面关联的 `grade` 对象

## 3. QBC 检索方式

Hibenate 的 QBC 查询个人认为是 Hibernate 的很大一个亮点，提供个丰富的查询 API，但是 QBC 据我了解几乎没有程序员使用，跟使用起来麻烦有很大关系。下面我们通过例子了解下。

以前用 QBC 我们都用`session.createCriteria()`来开始查询，不过这种方式已经被废弃 `@deprecated (since 5.2) for Session, use the JPA Criteria`，很明显作者认为以前创建 QBC 查询方式不够好，现在改成用 JAP Criteria，通过下面的一个查询简单看下。

```java
@Test
public void testQBCQuery() {
	//1. 创建CriteriaBuilder对象
	CriteriaBuilder builder = session.getCriteriaBuilder();
	//2. 获取 CriteriaQuery
	CriteriaQuery<Grade> criteriaQuery = builder.createQuery(Grade.class);
	//3. 构建搜索语句 		select * from grade
	Root<Grade> root = criteriaQuery.from(Grade.class);
	//3.1 构建条件  		+ where id > 2
	criteriaQuery.where(builder.gt(root.get("id"), 2));
	//3.2 构建排列顺序 	+ order by id desc
	criteriaQuery.orderBy(builder.desc(root.get("id")));
	//4. 执行查询, 返回结果集
	List<Grade> list = session.createQuery(criteriaQuery).getResultList();

	for (Grade student : list) {
		System.out.println(student);
	}
}
```

## 4. 本地 SQL 检索方式

一般我们都用 Hibernate 提供的 HQL 检索方式，但是有时可能需要根据底层数据库的 SQL 方言，来生成一些特殊的查询语句，在这种情况下就需要用到 Hibernate 提供的原生 SQL 检索方式。
先前执行原生 SQL 语句都用 `session.createSQLQuery()`，不过这个方法已经过时了 `@deprecated (since 5.2) use {@link #createNativeQuery(String)} instead`，那么下面我们将用 `createNativeQuery()` 来展示用原生 SQL 语句进行查询和更新。

当我们没有指定查询结果集类型时，Hibernate 将为我们返回字段值组成的数组

```java
@Test
public void testSQLQuery() {
	NativeQuery<Object[]> nativeQuery = session.createNativeQuery("select * from contact where id>?");
	nativeQuery.setParameter(1, 2);
	List<Object[]> list = nativeQuery.getResultList();
	for (Object[] objects : list) {
		System.out.println(Arrays.toString(objects));
	}
}
```

当我们指定查询结果集类型时，Hibernate 会帮我们把查询结果封装成对象

```java
@Test
public void testSQLQuery2() {
	String sql = "select * from contact where id>? and id<?";
	NativeQuery<Contact> nativeQuery = session.createNativeQuery(sql, Contact.class);
	nativeQuery.setParameter(1, 1);
	nativeQuery.setParameter(2, 3);
	List<Contact> list = nativeQuery.getResultList();
	for (Contact contact : list) {
		System.out.println(contact.toString());
	}
}
```

测试用 Hibernate 执行原生 SQL 更新语句，用到 `executeUpdate()` 方法，更新、删除和插入都用这个方法

```java
@Test
public void testSQLUpdate() {
	String sql = "update contact set name=? where id=?";
	NativeQuery<Object[]> nativeQuery = session.createNativeQuery(sql);
	nativeQuery.setParameter(1, "修改后的名字");
	nativeQuery.setParameter(2, 2);
	int num = nativeQuery.executeUpdate();
	System.out.println("影响行数 " + num);
}
```

## 5. HQL 检索方式

下面我们重点来说下 HQL 检索方式

# 三、HQL 检索方式详叙

HQL (Hibernate Query Language) 是面向对象的查询语言，他和 SQL 查询语言有些相似，在 Hibernate 提供的各种检索方式中，HQL 是使用最广泛的一中检索方式，他可以将自行的 HQL 语句翻译成对应数据库的 SQL 语句，更换数据库十分方便。

## 1. HQL 简单查询列表

```java
String hql = "from Contact";
List<?> list = session.createQuery(hql).getResultList();
for (Object object : list) { System.out.println(object); }
```

注意：HQL 语句中关键字不区分大小写，但是实体类和对象属性要区分大小写。没有指定列查询 Hibernate 内部会将返回数据封装成查询类的对象。

## 2. HQL 语句占位符

```java
String hql = "from Contact where id>?";
List<?> list = session.createQuery(hql).setParameter(0, 2).getResultList();
for (Object object : list) { System.out.println(object); }
```

注意：占位符的索引位置跟 JDBC 里面参数索引有些区别，Hibernate 索引位置是从 0 开始的。

## 3. HQL 语句中使用形参充当占位符

```java
String hql = "from Contact where id>:id";
List list = session.createQuery(hql)
				 	.setParameter("id", 3)
				 	.getResultList();
System.out.println(list);
```

这种用 `:id` 来代替 `?` 当占位符要更常用，因为后面可以直接根据参数名字赋值，直接明了。

## 4. HQL 查询单条记录

```java
String hql = "from Contact where id=?";
Object object = session.createQuery(hql)
						.setParameter(0, 2)
						.getResultList()
						.get(0);
System.out.println(object);
```

注意：这样查询出来的是单条记录，但是一般不推荐使用 `.getResultList().get(0)`，因为当如果 id=0 的 Contact 对象不存在时，使用 get(0)会抛出异常，我们通常使用下面这种方式

```java
String hql = "from Contact where id=?";
Object object = session.createQuery(hql)
					    .setParameter(0, 2)
					    .uniqueResult();
System.out.println(object);
```

通过 `uniqueResult()` 方法返回一个 Object 对象，如果对象不存在则返回 null，如果返回值不唯一，则抛出异常。

## 5. HQL 聚合查询

```java
String hql = "select count(id) from Contact";
Object uniqueResult = session.createQuery(hql).uniqueResult();
System.out.println(uniqueResult);
```

同时还支持 `avg()`、`min()`、`max()`...聚合函数的查询。

## 6. HQL 查询单列字段

```java
String hql = "select c.name from Contact c";
List<Object> list = session.createQuery(hql).getResultList();
for (Object object : list) { System.out.println(object); }
```

## 7. HQL 查询多列字段，用数组方式

以数组盛装单行查询字段结果集，然后将各行的结果集放进 List 数组里

```java
String hql = "select c.name, c.birthday from Contact c";
List<Object[]> list = session.createQuery(hql).getResultList();
for (Object[] objects : list) { System.out.println(Arrays.toString(objects)); }
```

## 8. HQL 查询多列字段，用对象方式

以对象盛装单行查询字段结果集，然后将各行的结果集放进 List 数组里

```java
String hql = "select new Contact(c.name, c.birthday) from Contact c";
List list = session.createQuery(hql).getResultList();
for (Object object : list) { System.out.println(object); }
```

注意：要求实体类必须有对应的构造方法

## 9. HQL 查询结果排序

```java
String hql = "from Contact where id>? order by id desc";
List list = session.createQuery(hql).setParameter(0, 2).getResultList();
System.out.println(list);
```

按照查询结果 id 进行降序排序

## 10. HQL 分页查询

```java
String hql = "from Contact";
List list = session.createQuery(hql)
					.setFirstResult(1)
					.setMaxResults(2)
					.getResultList();
System.out.println(list);
```

注意：Hibernate 会将语句翻译成 SQL 语句 `limit 1, 2`，`setFirstResult()` 指记录开始的 index(index 从 0 开始表示第一条)，`setMaxResults()` 设置从第 index+1 条开始往后取多少条。
