---
layout: post
title: "MyBatis进阶-Ehcache实现缓存"
subtitle: "MyBatis使用Ehcache实现二级缓存"
date: 2018-11-15
categories: 技术
# cover: ""
tags: Java MyBatis Ehcache
---

> 最近在探寻 MyBatis 持久层框架，发现入门简单，但是随着满足各种需求的增加，MyBatis 的功能也让人眼花缭乱。今天写笔记来记录下一个第三方缓存框架 Ehcache 和 MyBatis 的简单配合使用，来实现数据缓存。

# 一、Ehcache 简介

**Ehcache** 是一种广泛使用的开源 Java 分布式缓存。具有**快速**、**简单**、**低消耗**、**依赖性小**、**扩展性强**、**支持对象或序列化缓存**、**支持缓存或元素的失效**、**提供 LRU / LFU / FIFO 缓存策略**、**支持内存缓存和磁盘缓存**、**分布式缓存机制**等等特点。
　　 Ehcache 作为开放源代码项目，采用限制比较宽松的 Apache License V2.0 作为授权方式，被广泛地用于 Hibernate、Spring、Cocoon 等其他开源系统。Ehcache 从 Hibernate 发展而来，逐渐涵盖了 Cahce 界的全部功能，是目前发展势头最好的一个项目。

MyBatis 和 Ehcache 整合框架下载地址：[https://github.com/mybatis/ehcache-cache](https://github.com/mybatis/ehcache-cache)

Ehcache 缓存框架整合的文档地址：[http://www.mybatis.org/ehcache-cache/](http://www.mybatis.org/ehcache-cache/)

# 二、Ehcache 文件配置

## 1. Maven 工程配置 pom.xml 导入 jar 包

MyBatis 和 Ehcache 整合架包

```xml
<dependency>
    <groupId>org.mybatis.caches</groupId>
    <artifactId>mybatis-ehcache</artifactId>
    <version>1.1.0</version>
</dependency>
```

因为 Ehcache 的依赖 slf4j 这个日志的 jar 包，会和 log4j 的 jar 包冲突，导致日志不能显示了，解决办法就整合他们，导入联合 jar 包，所以还要一个依赖

```xml
<dependency>
	<groupId>org.slf4j</groupId>
	<artifactId>slf4j-log4j12</artifactId>
	<version>1.7.25</version>
	<scope>test</scope>
</dependency>
```

## 2. 配置步骤

**① 创建 `ehcache.xml` 文件**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ehcache>
	<!-- mac 电脑, 跟 win 设置路径有点不一样 示例: path="d:/ehcache/" -->
	<diskStore path="${user.home}/Downloads/ehcache" />

	<!-- 默认缓存配置 没有特别指定就用这个配置 -->
	<defaultCache maxElementsInMemory="10000"
				  eternal="false"
				  timeToIdleSeconds="3600" <!--1 hour-->
				  timeToLiveSeconds="3600" <!--1 hour-->
				  overflowToDisk="true"
				  maxElementsOnDisk="10000000"
				  diskPersistent="false"
				  memoryStoreEvictionPolicy="LRU"
				  diskExpiryThreadIntervalSeconds="120" />
</ehcache>
```

**② 在 MyBatis 配置文件中开启二级缓存配置**

```xml
<settings>
	<setting name="cacheEnabled" value="true" />
</settings>
```

**③ 在 Mapper 配置文件中开启缓存，添加 Ehcache 缓存**

```xml
<mapper namespace="com.ogemray.dao.StudentDao">
  <cache type="org.mybatis.caches.ehcache.EhcacheCache"/>
  ...
</mapper>
```

**④ 缓存实体类要实现 `Serializable` 接口**

```java
public class Student implements Serializable
```

## 3. Ehcache 配置标签和属性说明

- **diskStore：**指定数据存储位置，可指定磁盘中的文件夹位置。样例中配置位置为“d:/ehcache/”， 什么意思呢？ 内存中的缓存满了，装不下了，就放这里，注意:它是临时的文件, sessionFactory.close 后, 这里的文件会自动删除!
- **defaultCache：**默认缓存配置
- **cache：**指定对象的缓存配置，其中 name 属性为指定缓存的名称（必须唯一）

- **配置属性中的元素说明**
  - ① **maxElementsInMemory** (正整数)：在内存中缓存的最大对象数量
  - ② **maxElementsOnDisk** (正整数)：在磁盘上缓存的最大对象数量，默认值为 0，表示不限制。
  - ③ **eternal**：设定缓存对象保存的永久属性，默认为 false 。当为 true 时 timeToIdleSeconds、timeToLiveSeconds 失效。 表示这个缓存永远不清除!
  - ④ **timeToIdleSeconds** (单位：秒)：对象空闲时间，指对象在多长时间没有被访问就会失效。只对 eternal 为 false 的有效。默认值 0，表示一直可以访问。失效时间!
  - ⑤ **timeToLiveSeconds** (单位：秒)：对象存活时间，指对象从创建到失效所需要的时间。只对 eternal 为 false 的有效。默认值 0，表示一直可以访问。
  - ⑥ **overflowToDisk**：如果内存中数据超过内存限制，是否要缓存到磁盘上。
  - ⑦ **diskPersistent**：是否在磁盘上持久化。指重启 jvm 后，数据是否有效。默认为 false。
  - ⑧ **diskSpoolBufferSizeMB** (单位：MB)：DiskStore 使用的磁盘大小，默认值 30MB。每个 cache 使用各自的 DiskStore。
  - ⑨ **diskExpiryThreadIntervalSeconds**：清理线程执行清理的间隔时间。
  - ⑩ **memoryStoreEvictionPolicy**：如果内存中数据超过内存限制，向磁盘缓存时的策略。默认值 LRU，可选 FIFO、LFU。
    - **FIFO** (first in first out)：先进先出
    - **LFU** (Less Frequently Used)：最少被使用，缓存的元素有一个 hit 属性，hit 值最小的将会被清除缓存。
    - **LRU** (Least Recently Used) 默认策略：最近最少使用，缓存的元素有一个时间戳，当缓存容量满了，而又需要腾出地方来缓存新的元素的时候，那么现有缓存元素中时间戳离当前时间最远的元素将被清除缓存。
