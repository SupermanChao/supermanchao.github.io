---
layout: post
title: "Hibernate(二) 关系数据库设计"
subtitle: "Hibernate 关系数据库设计"
date: 2018-11-07
categories: 技术
cover: "http://on2171g4d.bkt.clouddn.com/jekyll-theme-h2o-postcover.jpg"
tags: java orm Hibernate JDBC 数据库
---

> 最近重新学习了一遍 Hibernate 框架，感觉收益颇多。Hibernate 对于关系型数据库的配置还是有点麻烦的，所以在此做篇有关记录关系型数据库配置流程。
> 本篇笔记主要记录 **一对多关系配置**、**一对一关系配置**、**多对多关系配置**、**组件映射关系配置**、**继承映射关系配置**，其中在还有自己对关系维护权利 **`inverse`** 属性和级联操作属性 **`cascade`** 的用法及注意总结。因为文章长度问题，本文关系配置都是双向的，略过单向关系配置。

在我们实际开发中，数据表之间往往不是独立的，而是相互关联的，这个是后就涉及到关系型数据库，Hibernate 为关系型数据库设计提供很好的支持，下面我们来看看不同关系型数据库的 mapping 映射文件中的配置和实现效果。

# 一、一对多关系

![一对多关系物理模型图.jpg](/assets/img/2018-11-07/4322526-71f4b811ff899203.webp)

应用场景：例如学生和班级之间的关系，一个班级可以有很多学生，每个学生只能属于一个班级，从上面的物理关系图可以看出，`Student` 对象表通过外键引入 `Grade` 表的主键来形成多对一的关系，所以我们接下来可以分别建立 `hbm_one2many_ grade` 表 和 `hbm_one2many_student` 表，分别对应 `Grade ` 和 `Student` 表。

下面来看看实体类和实体类映射文件的配置

```java
//省略 set get 部分
public class Student {
	private int id;
	private String name;
	private Date birthday;
	private Grade grade;
}

public class Grade {
	private int id;
	private String name;
	private Set<Student> students = new HashSet<Student>();
}
```

**Student.hbm.xml** 配置文件，学生与班级关系是 **多对一**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-mapping PUBLIC "-//Hibernate/Hibernate Mapping DTD 3.0//EN" "http://hibernate.sourceforge.net/hibernate-mapping-3.0.dtd" >
<hibernate-mapping package="com.ogemray.one2many.entity">
	<class name="Student" table="hbm_one2many_student">
		<id name="id" column="id" type="integer">
			<generator class="native"></generator>
		</id>
		<property name="name" column="name" type="string"/>
		<property name="birthday" column="birthday" type="date"></property>

		<!-- name:属性名 column:外引用字段在表里面的名字 class:外引用类 -->
		<many-to-one name="grade" column="grade_id" class="Grade"></many-to-one>
	</class>
</hibernate-mapping>
```

**Grade.hbm.xml** 配置文件，班级与学生关系是 **一对多**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-mapping PUBLIC "-//Hibernate/Hibernate Mapping DTD 3.0//EN" "http://hibernate.sourceforge.net/hibernate-mapping-3.0.dtd" >
<hibernate-mapping package="com.ogemray.one2many.entity">
	<class name="Grade" table="hbm_one2many_grade">
		<id name="id" column="id" type="integer">
			<generator class="native"></generator>
		</id>
		<property name="name" column="name" type="string"></property>

		<!-- name:集合属性名 table:集合里面存储对象对应的表 -->
		<set name="students" table="hbm_one2many_student">
			<!-- 关联对象表里外引用(引用本表主键)字段名 -->
			<key column="grade_id"></key>
			<!-- 关联对象类名 -->
			<one-to-many class="Student"/>
		</set>
	</class>
</hibernate-mapping>
```

下面来看一个简单的插入测试

```java
@Test
public void testSave_inverseTure() {

	Grade grade = new Grade("文科二班");
	Student s1 = new Student("Tom", new Date());
	Student s2 = new Student("Marry", new Date());
	//在Grade对象上添加关系
	grade.getStudents().add(s1);
	grade.getStudents().add(s2);
	//在Student上绑定关系
	s1.setGrade(grade);
	s2.setGrade(grade);

	Session session = sessionFactory.openSession();
	session.beginTransaction();

	session.save(grade);
	session.save(s1);
	session.save(s2);

	session.getTransaction().commit();
	session.close();
```

执行的 SQL 语句

```java
insert into hbm_one2many_grade (name) values (?)
insert into hbm_one2many_student (name, birthday, grade_id) values (?, ?, ?)
insert into hbm_one2many_student (name, birthday, grade_id) values (?, ?, ?)
update hbm_one2many_student set grade_id=? where id=?
update hbm_one2many_student set grade_id=? where id=?
```

**反思 1**：从上面输出看出，理论上后面两句更新语句不应该有，在 `save` 完 `grade` 的时候，已经被加入 `session` 的缓存，此时的 `grade` 的 `id` 字段已经分配了值，再 `save` `Student` 对象的时候，`s1` 和 `s2` 引用的 `grade` 对象已经有 `id` 字段，所以保存 `s1` 和 `s2` 的时候，就已经把这个关系保存到数据库了，为什么后面还会多两条更新呢？
是不是保存的顺序问题呢？那么下面我们来换下保存位置，先保存学生再保存班级。

```java
session.save(s1);
session.save(s2);
session.save(grade);
```

执行的 SQL 语句

```sql
insert into hbm_one2many_student (name, birthday, grade_id) values (?, ?, ?)
insert into hbm_one2many_student (name, birthday, grade_id) values (?, ?, ?)
insert into hbm_one2many_grade (name) values (?)
update hbm_one2many_student set name=?, birthday=?, grade_id=? where id=?
update hbm_one2many_student set name=?, birthday=?, grade_id=? where id=?
update hbm_one2many_student set grade_id=? where id=?
update hbm_one2many_student set grade_id=? where id=?
```

这回更夸张，下面多了四条更新语句，这里就要说下维护关系权利的问题。

## (1). **inverse**

集合元素标签(`<list>` 、`<set>`、`<map>`)里面的属性，他指定关系表里面由哪一边来维护关系，默认值是 `inverse="false"` 双方都维护，建议在一的那端在集合元素上设置 `inverse="true"` 自己不维护，把维护权利交给(反转给)多的一方。

**例子 1**：测试保存，`inverse=true`, Grade 方不维护关系

在 **Grade.hbm.xml** 中做如下更改

```xml
<set ... inverse="true">
	....
</set>
```

先保存班级再保存学生

```java
session.save(grade);
session.save(s1);
session.save(s2);
```

执行 SQL 语句

```sql
insert into hbm_one2many_grade (name) values (?)
insert into hbm_one2many_student (name, birthday, grade_id) values (?, ?, ?)
insert into hbm_one2many_student (name, birthday, grade_id) values (?, ?, ?)
```

先保存学生再保存班级

```java
session.save(s1);
session.save(s2);
session.save(grade);
```

执行 SQL 语句

```sql
insert into hbm_one2many_student (name, birthday, grade_id) values (?, ?, ?)
insert into hbm_one2many_student (name, birthday, grade_id) values (?, ?, ?)
insert into hbm_one2many_grade (name) values (?)
update hbm_one2many_student set name=?, birthday=?, grade_id=? where id=?
update hbm_one2many_student set name=?, birthday=?, grade_id=? where id=?
```

**总结**：先插入班级，班级对象先进入 `session` 缓存，这个时候再保存 `Student` 对象时其引用的 `Grade` 对象是完整的对象(id 字段已经有值)，后面也没有再对 `Grade` 对象做更改的操作，所以在 `commit` 的时候没有检测 `Studen` 对象在 `save` 方法之后(被变为持久化对象之后) 有变化，所以没有更新语句，虽然检测到 `Grade` 对象在 `save` 之后，引用的 `Student` 对象有变化(`Student` 被持久化了，id 字段加了值)，但是他没有维护双方关系的权利，所以也没有更新语句 。先插入学生对象，`Student` 对象被持久化，再插入 `Grade` 对象，在 `commit` 的时候，检测到 `Student` 在 `save` 之后，引用的 `Grade` 对象有变化，所以会发送两条更新语句。

所以设置好 `inverse` 属性，能简化插入对象时一些不必要的重复操作。

**例子 2**：测试删除，分别测 `inverse=true` 和 `inverse=false`，Grade 方维护关系和不维护关系的两种情况

①. 先测一的一方(班级对象这边)维护关系的时候，在 **Grade.hbm.xml** 中做如下更改，默认 `inverse="false"`，这里做个配置主要是为了区分下面

```xml
<set ... inverse="false">
    ....
</set>
```

直接来总结吧

- 删除学生对象的时候，因为多的这一方(学生方)始终都有维护关系的权利，所以没影响
- 删除班级对象的时候，先更新掉学生表里面引用到该对象的部分，引用字段置空，然后再删除班级对象

```sql
update hbm_one2many_student set grade_id=null where grade_id=?
delete from hbm_one2many_grade where id=?
```

②. 再测一的一方(班级对象这边)不维护关系的时候，在 **Grade.hbm.xml** 中做如下更改

```xml
<set ... inverse="true">
    ....
</set>
```

总结:

- 删除学生对象的时候没有什么问题，对引用的班级对象也没有影响
- 删除班级对象的时候，没有被外引用的没有问题，有被外引用的删除会报错。

说完 **inverse**，这里还得说另外一个属性，**cascade**连级操作。

## (2). **cascade**

顾名思义，连级操作就是在操作一个对象的时候，顺带也把引用的对象给操作了，对应的值有三种这 `cascade="save-update"`、`cascade="delete"`、`cascade="save-update,delete"` 与 `cascade="all"`一样，分别是**连级保存和更新**、**连级删除**、**连级增改删**。

说在前面：`inverse` 和 `cascade` 经常会被搅在一起，其实两者可以说没有半分关系，维护关系是维护关系，连级操作是连级操作，下面我们通过例子仔细讲解下。

**例子 3**：测试级联保存

多的一方(Student)端设置了级联保存，在 **Grade.hbm.xml** 做如下更改

```xml
<set ... cascade="save-update">
	....
</set>
```

```java
//设置对象上的关联
grade.getStudents().add(s1);
grade.getStudents().add(s2);

session.save(grade);
/* 下面操作属于多余操作
session.save(s1);
session.save(s2);
*/
```

**分析**：因为班级对象设置了级联保存动作，在 `session.save(grade)` 的时候就连带其关联的 `s1` 和 `s2` 级联保存到数据库中, 持久化到 `session` 中，所以下面再 `session.save(s1)` 和 `session.save(s2)` 都是没有意义的，`session` 不会重新发起 SQL 语句。

**总结**：对于级联保存，Hibernate 内部对保存对象关联的对象自动调用 `save` 方法，基本跟自己手动调用一样，不一样的是级联保存的时候，Hibernate 内部对保存顺序做了优化，先保存一的一方(既班级对象)，然后再保存多的一方(学生方)，这样避免了不必要的动作，省了保存完学生完之后再保存班级，后面会多出更新学生与班级关系的语句。

**例子 4**：测试连级删除

①. 首先测试学生方(多的一方)设置级联删除，然后删除学生对象

在 **Student.hbm.xml** 中做如下更改

```xml
<many-to-one ... cascade="delete"></many-to-one>
```

测试代码

```java
@Test
public void testCascade_deleteStudent() {
	Session session = sessionFactory.openSession();
	session.beginTransaction();

	Student student = session.get(Student.class, 20);
	session.delete(student);

	session.getTransaction().commit();
	session.close();
}
```

执行的 SQL 语句

```sql
select ... from hbm_one2many_student student0_ where student0_.id=?
select ... from hbm_one2many_grade grade0_ where grade0_.id=?
update hbm_one2many_student set grade_id=null where grade_id=?
delete from hbm_one2many_student where id=?
delete from hbm_one2many_grade where id=?
```

这里结果有点多，用一张图展示下分析。

![Hibernate级联删除对象.jpg](/assets/img/2018-11-07/4322526-e2476ea65e0d86c3.webp)

所以不管怎么说，在多的方不建议设置级联删除，删除某一个学生要把学生引用的班级也删除，这种操作需求可以说几乎没有。

②. 再测试班级方(一的一方)设置级联删除，然后删除班级对象

**Grade.hbm.xml** 配置中做如下更改

```xml
<set ... cascade="delete">
	....
</set>
```

测试代码

```java
@Test
public void testDelete_cascadeGrade() {
	Session session = sessionFactory.openSession();
	session.beginTransaction();

	Grade grade = session.get(Grade.class, 10);
	session.delete(grade);

	session.getTransaction().commit();
	session.close();
}
```

当 **Grade.hbm.xml** 里面设置 `inverse="true"` (没有维护关系的权利)时，执行的 SQL 语句如下

```sql
select ... from hbm_one2many_grade grade0_ where grade0_.id=?
select ... from hbm_one2many_student students0_ where students0_.grade_id=?
delete from hbm_one2many_student where id=?
delete from hbm_one2many_student where id=?
delete from hbm_one2many_grade where id=?
```

当 **Grade.hbm.xml** 里面设置 `inverse="false"` (有维护关系的权利)时，执行 SQL 语句如下

```sql
select ... from hbm_one2many_grade grade0_ where grade0_.id=?
select ... from hbm_one2many_student students0_ where students0_.grade_id=?
update hbm_one2many_student set grade_id=null where grade_id=?
delete from hbm_one2many_student where id=?
delete from hbm_one2many_student where id=?
delete from hbm_one2many_grade where id=?
```

**分析**：从上面控制台输出可以看出，当 `Grade` 方没有维护关系的权利时，时直接查出关联的 `Student` 对象然后删除，最后删除自己，有维护关系权利的时候多了一步更新(因为他有维护关系的时候会先去引用表中清除关系然后再删除自己)。

**总结**：对于级联删除，Hibernate 内部自动帮我们调用了关联对象删除方法，跟我们手动调用没有什么差别。不过级联操作一般很少用，一不小心容易出问题(删了不该删的，删没有能力删的导致整个事务回滚)，还是自己手动去控制比较好。

# 二、一对一关系

举例：一个人只能拥有一张身份证，某个身份证只属于一个人。

根据策略不同，配置一对一关系分为两种方式：**主键关联策略**和**唯一外键关联策略**。

## 1. 主键关联策略

引用另个实体表主键充当自身表主键(主键即是外键)，靠这种引用方式实现对另一个表进行管理。

首先来看下一个应用场景物理模型图

![一对一关系物理模型图(主键关联).jpg](/assets/img/2018-11-07/4322526-1e2c84cc13eeb966.webp)

场景中应该是人持有身份证的引用，所以两者关系应该由 `Person` 来维护，所以 `Person` 引用 `IdCard` 主键作为自己外键主键。首先来建立实体类 `Person` 和 `IdCard`，分别对应数据库里面 `hbm_one2one_person` 和 `hbm_one2one_Idcard` 两张表。

下面来看看实体类和实体类映射文件的配置

```java
public class Person {
	private int id;
	private String name;
	private IdCard idCard;
}

public class IdCard {
	private int id;
	private String number;
	private Person person;
}
```

**IdCard.hbm.xml** 配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-mapping PUBLIC "-//Hibernate/Hibernate Mapping DTD 3.0//EN" "http://hibernate.sourceforge.net/hibernate-mapping-3.0.dtd" >
<hibernate-mapping package="com.ogemray.one2one.entity">
	<class name="IdCard" table="hbm_one2one_idcard">
		<id name="id" column="id">
			<generator class="native"></generator>
		</id>
		<property name="number" type="string"></property>

		<one-to-one name="person" class="Person"></one-to-one>
	</class>
</hibernate-mapping>
```

**Person.hbm.xml** 配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-mapping PUBLIC "-//Hibernate/Hibernate Mapping DTD 3.0//EN" "http://hibernate.sourceforge.net/hibernate-mapping-3.0.dtd" >
<hibernate-mapping package="com.ogemray.one2one.entity">
	<class name="Person" table="hbm_one2one_person">
		<id name="id">
			<!-- foreign指定本类主键 id 生成策略是外键引入的方式 -->
			<generator class="foreign">
				<param name="property">idCard</param>
			</generator>
		</id>
		<property name="name" type="string"></property>

		<!-- constrained="true" 约束本类和 IdCard 类关联起来,
			配合上面主键生成策略引用 IdCard 类的表的主键充当本类主键 -->
		<one-to-one name="idCard" class="IdCard" constrained="true" cascade="all"></one-to-one>
	</class>
</hibernate-mapping>
```

**建表 SQL 语句**

```sql
create table hbm_one2one_idcard (id integer not null auto_increment, number varchar(255), primary key (id)) engine=InnoDB
create table hbm_one2one_person (id integer not null, name varchar(255), primary key (id)) engine=InnoDB
alter table hbm_one2one_person add constraint FK4214wxpa3xbqj27sgnmgk3uw6 foreign key (id) references hbm_one2one_idcard (id)
```

由于 `Person` 和 `IdCard` 是一对一关系，并且 `Person` 管理者 `IdCard`，`IdCard` 少了 `Person` 也没有存在的意义，`Person` 没了 `IdCard` 也创建不了，所以这里在 `Person` 的一方加上了连级操作(连级保存，更新和删除)。

增删改查没什么好说了，`Person` 类设置了连级操作，对准 `Person` 对象操作就行。因为 `Person` 的主键时引用 `IdCard` 的主键，所以删除 `IdCard` 对象的时候注意下就行。

## 2. 唯一外键关联策略

和前面多对一的配置差不多，只不过为了实现一对一，在多的这端外键加上唯一约束，从而实现了一对一的关联。

首先来看下一个应用场景物理模型图

![一对一关系物理模型图(唯一外键关联).jpg](/assets/img/2018-11-07/4322526-3ccf48bb0eb7c290.webp)

场景中应该是人持有身份证的引用，所以两者关系应该由 `Person` 来维护，所以 `Person` 有一个单独的外键引用 `IdCard` 主键来管理`IdCard`。首先来建立实体类 `Person` 和 `IdCard`，分别对应数据库里面 `hbm_one2one_person` 和 `hbm_one2one_Idcard` 两张表。

下面来看看实体类和实体类映射文件的配置

```java
public class Person {
	private int id;
	private String name;
	private IdCard idCard;
}

public class IdCard {
	private int id;
	private String number;
	private Person person;
}
```

**Person.hbm.xml** 配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-mapping PUBLIC "-//Hibernate/Hibernate Mapping DTD 3.0//EN" "http://hibernate.sourceforge.net/hibernate-mapping-3.0.dtd" >
<hibernate-mapping package="com.ogemray.one2one.entity">
	<class name="Person" table="hbm_one2one_person">
		<id name="id" column="id">
			<generator class="native"></generator>
		</id>
		<property name="name" type="string"></property>

		<!-- unique="true" 表示 在 hbm_one2one_person这张表中 idCard_id字段不能重复
			 从而从多对一变成了 一对一
		 -->
		<many-to-one name="idCard" class="IdCard" column="idCard_id" unique="true" cascade="all"></many-to-one>
	</class>
</hibernate-mapping>
```

**IdCard.hbm.xml** 配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-mapping PUBLIC "-//Hibernate/Hibernate Mapping DTD 3.0//EN" "http://hibernate.sourceforge.net/hibernate-mapping-3.0.dtd" >
<hibernate-mapping package="com.ogemray.one2one.entity">
	<class name="IdCard" table="hbm_one2one_idcard">
		<id name="id" column="id">
			<generator class="native"></generator>
		</id>
		<property name="number" type="string"></property>

		<one-to-one name="person" class="Person" property-ref="idCard"></one-to-one>
	</class>
</hibernate-mapping>
```

**建表 SQL 语句**

```sql
create table hbm_one2one_idcard (id integer not null auto_increment, number varchar(255), primary key (id)) engine=InnoDB
create table hbm_one2one_person (id integer not null auto_increment, name varchar(255), idCard_id integer, primary key (id)) engine=InnoDB
alter table hbm_one2one_person drop index UK_gkxn16yhui3f1uo9li4odvhn4
alter table hbm_one2one_person add constraint UK_gkxn16yhui3f1uo9li4odvhn4 unique (idCard_id)
alter table hbm_one2one_person add constraint FKhe809xg7lgstqxi4xkw09ke2l foreign key (idCard_id) references hbm_one2one_idcard (id)
```

其操作跟一对多操作基本一样，一般用这种方式建立一对一关系比较常用，因为这样 `Person` 就不必依赖 `IdCard` 来创建，维护起来也方便。

# 三、多对多关系

平时开发很多时候涉及到两者互相包含的关系，即双方关系是多对多，例如：讨论组合讨论组里面的人，讨论组里面有很多人，但是里面的人又加入很多讨论组，两者相互包含。下面我们来以学生和选修课来示例，每个学生可以选修多门选修课，一们选修课可以被多名学生选修。下面我们先来看下物理关系图。

![多对多关系物理模型图.jpg](/assets/img/2018-11-07/4322526-52325d0fae349549.webp)

从物理模型中可以看出，数据库底层为了表示多对多的关系通过建一个中间关系表，从而让两个形参多对多的关系。

下面我们来看下实体类

```java
public class Student {
	private int id;
	private String name;
	private Set<Course> courses = new HashSet<Course>();
}

public class Course {
	private int id;
	private String name;
	private Set<Student> stundets = new HashSet<Student>();
}
```

**Student.hbm.xml** 配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-mapping PUBLIC "-//Hibernate/Hibernate Mapping DTD 3.0//EN" "http://hibernate.sourceforge.net/hibernate-mapping-3.0.dtd" >
<hibernate-mapping package="com.ogemray.many2many">
	<class name="Student" table="hbm_many2many_student">
		<id name="id" column="id" type="integer">
			<generator class="native"></generator>
		</id>
		<property name="name" column="name" type="string"></property>

		<set name="courses" table="hbm_many2many_course_r_student">
			<key column="s_id"></key>
			<many-to-many column="c_id" class="Course"></many-to-many>
		</set>
	</class>
</hibernate-mapping>
```

**Course.hbm.xml** 配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-mapping PUBLIC "-//Hibernate/Hibernate Mapping DTD 3.0//EN" "http://hibernate.sourceforge.net/hibernate-mapping-3.0.dtd" >
<hibernate-mapping package="com.ogemray.many2many">
	<class name="Course" table="hbm_many2many_course">
		<id name="id" column="id" type="integer">
			<generator class="native"></generator>
		</id>
		<property name="name" column="name" type="string"></property>

		<set name="stundets" table="hbm_many2many_course_r_student" inverse="true">
			<key column="c_id"></key>
			<many-to-many column="s_id" class="Student"></many-to-many>
		</set>
	</class>
</hibernate-mapping>
```

建表 SQL 语句

```sql
create table hbm_many2many_course (id integer not null auto_increment, name varchar(255), primary key (id)) engine=InnoDB
create table hbm_many2many_course_r_student (c_id integer not null, s_id integer not null, primary key (s_id, c_id)) engine=InnoDB
create table hbm_many2many_student (id integer not null auto_increment, name varchar(255), primary key (id)) engine=InnoDB
alter table hbm_many2many_course_r_student add constraint FKi5k7l8seeax7lot26dofbxk0o foreign key (s_id) references hbm_many2many_student (id)
alter table hbm_many2many_course_r_student add constraint FKlr7lu61domeeo9wuu7owwts4r foreign key (c_id) references hbm_many2many_course (id)
```

关于映射文件里面的配置跟上面的一对多差不多，下面我们来看下测试。
首先是插入，我们先来看一组**正确**的插入方式

```java
@Test
public void testCorrectSave() {
	Student s1 = new Student("Mike");
	Student s2 = new Student("Jerry");
	Course c1 = new Course("高等数学上");
	Course c2 = new Course("英语");

	s1.getCourses().add(c1);
	s1.getCourses().add(c2);
	s2.getCourses().add(c1);
	s2.getCourses().add(c2);

	Session session = sessionFactory.openSession();
	session.beginTransaction();

	session.save(c1);
	session.save(c2);
	session.save(s1);
	session.save(s2);

	session.getTransaction().commit();
	session.close();
}
```

执行的 SQL 语句，两个对象表各插入两个对象，中间关系表插入四条关系

```sql
insert into hbm_many2many_course (name) values (?)
insert into hbm_many2many_course (name) values (?)
insert into hbm_many2many_student (name) values (?)
insert into hbm_many2many_student (name) values (?)
insert into hbm_many2many_course_r_student (s_id, c_id) values (?, ?)
insert into hbm_many2many_course_r_student (s_id, c_id) values (?, ?)
insert into hbm_many2many_course_r_student (s_id, c_id) values (?, ?)
insert into hbm_many2many_course_r_student (s_id, c_id) values (?, ?)
```

分析：关系交给 `Student` 来添加，下面然后 `save` 四个对象，如果不想写这么多可以用级联操作，级联操作跟上面解释的一对多的级联操作方式一样。

下面在来看一组 **异常** 插入

```java
@Test
public void testAbnormalSave() {
	Student s1 = new Student("小明");
	Student s2 = new Student("小红");
	Course c1 = new Course("物理");
	Course c2 = new Course("化学");

	s1.getCourses().add(c1);
	s1.getCourses().add(c2);
	s2.getCourses().add(c1);
	s2.getCourses().add(c2);

	c1.getStundets().add(s1);
	c1.getStundets().add(s2);
	c2.getStundets().add(s1);
	c2.getStundets().add(s2);

	Session session = sessionFactory.openSession();
	session.beginTransaction();

	session.save(c1);
	session.save(c2);

	session.save(s1);
	session.save(s2);

	session.getTransaction().commit();
	session.close();
}
```

分析：双方在创建对象的时候都添加了关系，在 Hibernate 配置里面，双方都默认有维护关系的权利，这里跟一对多有点不一样，一对多双方都有维护权利时无非重复了更新关系的语句，而在多对多里面则会在中间关系表里面重复添加关系，造成错误。所以这里要么改一方不维护关系 `inverse="true"` 或者在插入对象之前只有一方对象包含关系，**不过一般是设定在插入前一方对象包含关系，不建议关掉某一方维护关系的权利，因为接下来的删除很重要**。

测试 **删除**

```java
@Test
public void testDelete() {
	Session session = sessionFactory.openSession();
	session.beginTransaction();

	Course course = session.get(Course.class, 7);
	session.delete(course);

	session.getTransaction().commit();
	session.close();
}
```

执行的 SQL 语句

```sql
select course0_.id as id1_1_0_, course0_.name as name2_1_0_ from hbm_many2many_course course0_ where course0_.id=?
delete from hbm_many2many_course_r_student where c_id=?
delete from hbm_many2many_course where id=?
```

分析：从输出可以看出，删除某个对象时是先删除中间表中的关系，然后再删除自身，**注意 这是在被删除方有维护关系的权利下，如果没有维护关系的权利，删除对象时是直接删除自己本身，因为本身主键由被关系表引用，所以会报错**。

# 四、组件映射关系

组件映射中，主键也是一个类，但是这个类他不独立称为一个实体，也就是说数据库中没有一个表和他对应，具体看下面演示。

首先看实体类，用户的构成部分有账户信息组件

```java
//这个类有id属性，他才是POJO类，在数据库中有对应的表
public class User {
	private int id;
	private String name;
	private AccountInfo account_info;
}

//这个类没有id属性，属于组件类，在数据库中不映射表
public class AccountInfo {
	private String account;
	private String pwd;
}
```

**User.hbm.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-mapping PUBLIC "-//Hibernate/Hibernate Mapping DTD 3.0//EN" "http://hibernate.sourceforge.net/hibernate-mapping-3.0.dtd" >
<hibernate-mapping package="com.ogemray.component.entity">
	<class name="User" table="hbm_component_user">
		<id name="id" column="id" type="integer">
			<generator class="native"></generator>
		</id>
		<property name="name" column="name" type="string"/>
		<component name="account_info" class="AccountInfo">
			<property name="account" column="account" type="string"></property>
			<property name="pwd" column="pwd" type="string"></property>
		</component>
	</class>
</hibernate-mapping>
```

增删改查和普通的 POJO 类没有什么区别，以保存为例

```java
@Test
public void testSave() {
	User user = new User("Jerry");
	user.setAccount_info(new AccountInfo("893081892", "123"));

	Session session = sessionFactory.openSession();
	session.beginTransaction();

	session.save(user);

	session.getTransaction().commit();
	session.close();
}
```

# 五、继承映射关系

Hibernate 是 ORM 框架的具体实现，最大的特点就是我们的开发中更加能体现出"面向对象"的思想。在面向对象的开发中，类和类之间可以相互继承，而 Hibernate 中也对这种继承关系提供了自己风格的封装，这就是我们接下来要介绍的 Hibernate 继承映射的三种策略。

![继承关系图.jpg](/assets/img/2018-11-07/4322526-1ccf0f6dc5e42732.webp)

三个类的关系：Device 设备父类，父类下面分别有两个子类，他们分别是插座设备和灯控设备，两个子类分别有自己的特性。

## 策略一

把三个类映射到一张表上，用`<subclass>`节点，注意用`<discriminator>` 标签声明区分字段，用 `discriminator-value` 属性区分不同子类

首先看下实体类

```java
public class Device {
	private int id;
	private String name;
	private String ip;
}

public class Light extends Device {
	private String colorValue;
}

public class Switcher extends Device {
	private int power;
}
```

**Device.hbm.xml** 配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-mapping PUBLIC "-//Hibernate/Hibernate Mapping DTD 3.0//EN" "http://hibernate.sourceforge.net/hibernate-mapping-3.0.dtd" >
<hibernate-mapping package="com.ogemray.inherit1">
	<class name="Device" table="hbm_inhert1_device" discriminator-value="device">
		<id name="id" column="id" type="integer">
			<generator class="native"></generator>
		</id>
		<discriminator column="type" type="string"></discriminator>
		<property name="name" column="name" type="string"></property>
		<property name="ip" column="ip" type="string"></property>

		<subclass name="Light" discriminator-value="light">
			<property name="colorValue" column="colorValue" type="string"></property>
		</subclass>

		<subclass name="Switcher" discriminator-value="switcher">
			<property name="power" column="power" type="integer"></property>
		</subclass>

	</class>
</hibernate-mapping>
```

测试保存方法

```java
@Test
public void testSave() {
	Device device = new Device("设备", "10.22.70.2");
	Light light = new Light("灯控设备", "10.22.70.3", "红色");
	Switcher switcher = new Switcher("插座设备", "10.22.70.4", 100);

	Session session = sessionFactory.openSession();
	session.beginTransaction();

	session.save(device);
	session.save(light);
	session.save(switcher);

	session.getTransaction().commit();
	session.close();
}
```

数据库存储存储数据

![继承映射1.png](/assets/img/2018-11-07/4322526-d9a8b898c01faf87.webp)

分析：这种映射方式可已将多个类放在同一张表中，但是颗粒度较粗，有冗余字段，但是因为多个类字段放在同一张表中，不涉及到关联查询，所以执行效率比较高。

## 策略二

每个类一张表，用`<joined-subclass>`节点属性，父表中有公共字段，子表中有个性字段和外键约束。

实体类跟上面的一样，只是配置文件里面略作修改

**Device.hbm.xml** 配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-mapping PUBLIC "-//Hibernate/Hibernate Mapping DTD 3.0//EN" "http://hibernate.sourceforge.net/hibernate-mapping-3.0.dtd" >
<hibernate-mapping package="com.ogemray.inherit2">
	<class name="Device" table="hbm_inherit2_device">
		<id name="id" column="id" type="integer">
			<generator class="native"></generator>
		</id>
		<property name="name" column="name" type="string"></property>
		<property name="ip" column="ip" type="string"></property>

		<joined-subclass name="Light" table="hbm_inherit2_light">
			<key column="light_id"></key>
			<property name="colorValue" column="colorValue" type="string"></property>
		</joined-subclass>

		<joined-subclass name="Switcher" table="hbm_inherit2_switcher">
			<key column="switcher_id"></key>
			<property name="power" column="power" type="integer"></property>
		</joined-subclass>
	</class>
</hibernate-mapping>
```

建表 SQL 语句

```sql
create table hbm_inherit2_light (light_id integer not null, colorValue varchar(255), primary key (light_id)) engine=InnoDB

create table hbm_inherit2_switcher (switcher_id integer not null, power integer, primary key (switcher_id)) engine=InnoDB

alter table hbm_inherit2_light add constraint FK68ry0npuwpdsjy7vnqa7pf9q3 foreign key (light_id) references hbm_inherit2_device (id)

alter table hbm_inherit2_switcher add constraint FKofcidha6fsvxtid78m88awk8m foreign key (switcher_id) references hbm_inherit2_device (id)
```

建了三种表，子类 id 引用父类 id

测试插入

```java
@Test
public void testSave() {
	Device device = new Device("设备", "10.22.70.2");
	Light light = new Light("灯控设备", "10.22.70.3", "红色");
	Switcher switcher = new Switcher("插座设备", "10.22.70.4", 100);

	Session session = sessionFactory.openSession();
	session.beginTransaction();

	session.save(device);
	session.save(light);
	session.save(switcher);

	session.getTransaction().commit();
	session.close();
}
```

执行 SQL 语句

```sql
insert into hbm_inherit2_device (name, ip) values (?, ?)
insert into hbm_inherit2_device (name, ip) values (?, ?)
insert into hbm_inherit2_light (colorValue, light_id) values (?, ?)
insert into hbm_inherit2_device (name, ip) values (?, ?)
insert into hbm_inherit2_switcher (power, switcher_id) values (?, ?)
```

三条 `Device` 表插入语句，两条子类表的插入语句。
插入子类前会先在父类中插入，引用父类表生成的 id，再插入子类表数据。

测试 **删除**

```java
@Test
public void testDelete() {
	Session session = sessionFactory.openSession();
	session.beginTransaction();
	Light light = session.get(Light.class, 2);
	session.delete(light);
	session.getTransaction().commit();
	session.close();
}
```

执行 SQL 语句

```sql
select ... from hbm_inherit2_light light0_ inner join hbm_inherit2_device light0_1_ on light0_.light_id=light0_1_.id where light0_.light_id=?
delete from hbm_inherit2_light where light_id=?
delete from hbm_inherit2_device where id=?
```

查询的时候用到关联查询，删除的时候是先删除自己，然后再删除父表里面的记录。

生成的数据库表图

![inherit2.png](/assets/img/2018-11-07/4322526-5467e30058a1104b.webp)

增删改查的操作跟单个 POJO 模型操作是一样的

这种继承映射方式**颗粒度比较细，条理清晰，没有冗余，但是查询时需要关联查询，插入的时候也要执行多条 SQL 语句，效率较差，适合继承成都不深的模型。**

## 策略三

每个具体类一张表(子类各对应一张表，父类对应的表可以选择性生成)，每张表都有自己所有的属性字段，包括父类的字段，用`<union-subclass>`节点属性实现。

实体类和映射文件都有些小的变动，主键生成策略改成 `UUID` 的方式了，因为虽然表面两个子类各对应一张表，id 属性又由自己维护，但是实际存储的是同一类型 `Device`，所以我们还得看做是一张表来操作，如果还有 `native` 则会造成两个表里面 id 有重复的。

下面我们来看下实体类

```java
public class Device {
	private String id;
	private String name;
	private String ip;
}

public class Light extends Device {
	private String colorValue;
}

public class Switcher extends Device {
	private int power;
}
```

**Device.hbm.xml** 配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE hibernate-mapping PUBLIC "-//Hibernate/Hibernate Mapping DTD 3.0//EN" "http://hibernate.sourceforge.net/hibernate-mapping-3.0.dtd" >
<hibernate-mapping package="com.ogemray.inherit3">
	<class name="Device" abstract="true">
		<id name="id" column="id" type="string">
			<generator class="uuid2"></generator>
		</id>
		<property name="name" column="name" type="string"></property>
		<property name="ip" column="ip" type="string"></property>

		<union-subclass name="Light" table="hbm_inherit3_light">
			<property name="colorValue" column="colorValue" type="string"></property>
		</union-subclass>

		<union-subclass name="Switcher" table="hbm_inherit3_switcher">
			<property name="power" column="power" type="integer"></property>
		</union-subclass>
	</class>
</hibernate-mapping>
```

**注意：主键正常策略改成 `UUID2` 了，因为生成 32 位的 `UUID` 已经不符合 ETF(Internet 工程委员会) RFC 4122 的标准，已经被 `UUID2` 取代。同时 `Device` 的 `<class>` 标签中新加了属性 `abstract="true"` 标识父类是个抽象类，不用生出具体的表。**

建表 SQL 语句

```sql
create table hbm_inherit3_light (id varchar(255) not null, name varchar(255), ip varchar(255), colorValue varchar(255), primary key (id)) engine=InnoDB
create table hbm_inherit3_switcher (id varchar(255) not null, name varchar(255), ip varchar(255), power integer, primary key (id)) engine=InnoDB
```

增删改查就没什么好说的了，都是操作各自对应的那张表。

# 总结

如果系统要经常对数据表进行操作并且子类较多，建议使用第一种方案，也是最常用的，因为效率高。如果追求细粒度并且子类不多，则可以用后面两种方案，每个类映射一张表或者每个具体类映射一张表。
