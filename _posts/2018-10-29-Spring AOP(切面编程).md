---
layout: post
title: "Spring AOP(切面编程)"
subtitle: "切面编程"
date: 2018-10-29
categories: 技术
# cover: "http://on2171g4d.bkt.clouddn.com/jekyll-theme-h2o-postcover.jpg"
tags: Java Spring AOP 切面编程
---

> 最近在学习 Spring 框架，写这篇文章也算是对近段学习的一个总结，本文主要从**三种代理模式写起，静态代理、动态代理和 Cglib 代理**，然后到**Spring AOP 的配置及使用**，包括 XML 方式配置和注解两种实现方式

# 一、代理模式

代理模式是一种设计模式，简单说即是在不改变源码的情况下，实现对**目标对象的功能扩展**。

`功能需求: 现在假设有个 UserDao 接口，有保存动作 save() 方法，UserDaoImpl 实现 UserDao接口 , 但是在执行 save() 方法的时候动态植入两句打印`

### 1. 静态代理

静态代理方式处理的，**目标对象必须实现接口**，并且**代理对象要实现跟目标对象一样的接口**。

```java
public interface UserDao {
	public void save();
}
```

```java
public class UserDaoImpl implements UserDao {

	@Override
	public void save() {
		System.out.println("执行保存动作");
	}
}
```

```java
/**
 * 静态代理类
 * @author liuchao
 */
public class UserProxy implements UserDao {

	private UserDao _userDao;

	public UserProxy(UserDao userDao) {
		_userDao = userDao;
	}

	@Override
	public void save() {
		//静态代理方式实现开始植入
		System.out.println("开启事务");

		_userDao.save();

		//静态代理方式实现结束植入
		System.out.println("提交事务");
	}
}
```

```java
import org.junit.Test;
/**
 * 测试类
 * @author liuchao
 */
public class UserTest {

	@Test
	public void testSave() {

		//1. 创建目标对象
		UserDao userDao = new UserDaoImpl();

		//2. 创建代理工厂对象
		UserProxy factory = new UserProxy(userDao);

		//3. 执行代理工厂保存方法
		factory.save();
	}
}
```

```java
//控制台打印结果
开启事务
执行保存动作
提交事务
```

## 2. 动态代理

动态代理是 JDK 自带的，所以也叫做 JDK 代理，**也需要目标对象实现接口**，也是只能对目标对象实现接口里面的方法进行拦截。

调用 Proxy 类的静态方法 newProxyInstance 即可，该方法会返回代理类对象

`static Object newProxyInstance(ClassLoader loader, Class<?>[] interfaces,InvocationHandler h )`
接收的三个参数依次为:

- ClassLoader loader：指定当前目标对象使用类加载器，写法固定
- Class<?>[] interfaces：目标对象实现的接口的类型，写法固定
- InvocationHandler h：事件处理接口，需传入一个实现类，一般直接使用匿名内部类

```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

/**
 * 动态代理工厂类
 * @author liuchao
 */
public class ProxyFactory {

	// 生成动态代理对象
	public static Object newProxyInstance(Object target) {
		// InvocationHandler
		return Proxy.newProxyInstance(target.getClass().getClassLoader(), target.getClass().getInterfaces(),
				new InvocationHandler() {

					@Override
					public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {

						System.out.println("开启事务");

						Object result = method.invoke(target, args);

						System.out.println("提交事务");

						return result;
					}
				});
	}
}
```

```java
import org.junit.Test;
/**
 * 测试类
 * @author liuchao
 */
public class UserTest {

	@Test
	public void testSave() {

		UserDao userDao = new UserDaoImpl();

		//生成代理对象 (动态创建一个实现该接口的匿名内部类)
		UserDao proxyInstance = (UserDao)ProxyFactory.newProxyInstance(userDao);

		//执行保存方法
		proxyInstance.save();
	}
}
```

```java
//控制台打印
开启事务
执行保存动作
提交事务
```

## 3. Cglib 代理

第三方框架实现的对基本代理模式的一个拓展，该代理植入不需要目标对象实现接口，内部通过动态生成目标对象子类的方式来实现对目标对象方法拦截

**前提条件：**

- 1. 需要引入 Cglib 的 jar 文件，由于 Spring 的核心包中已经包括了 Cglib 功能，所以也可以直接引入`spring-core-4.0.6.RELEASE.jar`
- 2. 目标类不能为 final
- 3. 目标对象的方法如果为`final` 或 `static`，那么不会被拦截

所以接下来重新定义的 `UserDaoImpl` 类不必实现任何接口

```java
public class UserDaoImpl {

	public void save() {
		System.out.println("执行保存动作");
	}
}
```

代理工厂类必须实现 `MethodInterceptor ` 接口，因为方法拦截是通过实现该接口里面的 `intercept (..)` 方法。

```java
import java.lang.reflect.Method;

import org.springframework.cglib.proxy.Enhancer;
import org.springframework.cglib.proxy.MethodInterceptor;
import org.springframework.cglib.proxy.MethodProxy;
/**
 * Cglib代理工厂类
 * @author liuchao
 */
public class ProxyFactory implements MethodInterceptor {

	private Object target;

	public ProxyFactory(Object target) {
		this.target = target;
	}

	//实例化代理对象
	public Object getProxyInstance() {
		//1. 工具类
		Enhancer en = new Enhancer();
		//2. 设置父类
		en.setSuperclass(this.target.getClass());
		//3. 设置回调，会调用下面的intercept(..)方法
		en.setCallback(this);
		//4. 创建子类对象
		return en.create();
	}

	@Override
	public Object intercept(Object obj, Method method, Object[] args, MethodProxy proxy) throws Throwable {

		System.out.println("开启事务");

		Object result = method.invoke(this.target, args);

		System.out.println("提交事务");

		return result;
	}
}
```

```java
import org.junit.Test;
/**
 * 测试类
 * @author liuchao
 */
public class UserTest {

	@Test
	public void testSave() {
		//1. 创建目标对象
		UserDaoImpl userDao = new UserDaoImpl();

		//2. 生成代理对象
		UserDaoImpl proxyInstance = (UserDaoImpl) new ProxyFactory(userDao).getProxyInstance();

		//3. 执行保存方法
		proxyInstance.save();

		System.out.println("代理对象类名: " +  proxyInstance.getClass().getSimpleName());
		System.out.println("代理对象父类名: " + proxyInstance.getClass().getSuperclass().getSimpleName());
	}
}
```

```java
//控制台打印
开启事务
执行保存动作
提交事务
代理对象类名: UserDaoImpl$$EnhancerByCGLIB$$5467e6b5
代理对象父类名: UserDaoImpl
```

# 二、Spring AOP 编程

**需要导入的 jar 包**

```java
//Spring核心包
	spring-core-4.0.6.RELEASE.jar
	spring-expression-4.0.6.RELEASE.jar
	spring-beans-4.0.6.RELEASE.jar
	commons-logging-1.1.3.jar

//后期通过注解方式实现需要
	spring-context-4.0.6.RELEASE.jar

//Aop部分架包
	spring-aop-4.0.6.RELEASE.jar
	aspectjweaver-1.8.7.jar //下载地址: http://central.maven.org/maven2/org/aspectj/aspectjweaver/1.8.7/
	aopalliance-1.0.jar //下载地址: http://central.maven.org/maven2/aopalliance/aopalliance/1.0/
```

**基本概念**

- Pointcut(切入点)：简称切点，定义匹配通知所要织入的一个或多个连接点，一般常用正则表达式定义所匹配的类和方法名称来指定这些切点(切点表达式这里不做过多累述，详情请点击[https://www.cnblogs.com/domi22/p/8047929.html](https://www.cnblogs.com/domi22/p/8047929.html)。

- Aspect(切面)：通常是一个类，里面可以定义切入点和通知

- JointPoint(连接点)：应用执行过程中能够插入切面的一个点，一般是方法的调用

- Advice(通知)：AOP 在特定的切入点上执行的增强处理，有五种，分别为 **前置通(Before)**、**后置通知(After)**、**返回通知(After-returning)**、**异常通知(After-throwing)**、**环绕通知(Around)**

- AOP 代理：AOP 框架创建的对象，代理就是目标对象的加强。Spring 中的 AOP 代理可以使 JDK 动态代理，也可以是 Cglib 代理，前者基于接口，后者基于子类

## 1. XML 方式实现

`为了代码清晰省略了 UserDao 和 UserDaoImpl，直接在 UserService 层进行一个简单的数据保存模拟`

```java
import org.aspectj.lang.JoinPoint;

/**
 * 自定义一个切面类
 * @author liuchao
 */
public class Aspect {

	public void beforeAction(JoinPoint joinPoint) {
		System.out.println("开启事务");

		System.out.println("开启事务, 连接点 方法名: " + joinPoint.getSignature().getName());

		Object[] args = joinPoint.getArgs();
		if (args != null) {
			for (Object object : args) {
				System.out.println("开启事务, 方法参数: " + object.toString());
			}
		}
	}

	public void afterAction(JoinPoint joinPoint) {
		System.out.println("提交事务");

		System.out.println("提交事务, 连接点 方法名: " + joinPoint.getSignature().getName());

		Object[] args = joinPoint.getArgs();
		if (args != null) {
			for (Object object : args) {
				System.out.println("提交事务, 方法参数: " + object.toString());
			}
		}
	}
}
```

```java
/**
 * 业务层
 * @author liuchao
 */
public class UserService {

	public void save() {
		System.out.println("持久层对象调用保存方法进行数据保存");
	}
}
```

```java
/**
 * 视图控制器层
 * @author liuchao
 */
public class UserAction {
	//Spring IOC注入, 通过Set方式注入
	private UserService userService;
	public void setUserService(UserService userService) {
		this.userService = userService;
	}

	public void saveAction() {
		userService.save();
	}
}
```

Spring XML 文件配置

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:aop="http://www.springframework.org/schema/aop"
	xmlns:context="http://www.springframework.org/schema/context"
	xsi:schemaLocation="
    	http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/context
        http://www.springframework.org/schema/context/spring-context.xsd
        http://www.springframework.org/schema/aop
        http://www.springframework.org/schema/aop/spring-aop.xsd">

        <bean id="userService" class="com.e_aop_xml.UserService"></bean>

        <bean id="userAction" class="com.e_aop_xml.UserAction">
        	<property name="userService" ref="userService"></property>
        </bean>

        <!-- 切面类 -->
        <bean id="aspect" class="com.e_aop_xml.Aspect"></bean>

        <!-- Aop配置 -->
        <aop:config>
        	<!-- 切点定义: 定义一个切入点表达式, 指定那些方法需要进行切面编程 -->
        	<aop:pointcut expression="execution(* com.e_aop_xml.UserService.*(..))" id="pt"/>
        	<!-- 切面 -->
        	<aop:aspect ref="aspect">
        		<!-- 目标方法前置调用 -->
        		<aop:before method="beforeAction" pointcut-ref="pt"/>
        		<aop:after method="afterAction" pointcut-ref="pt"/>
        	</aop:aspect>
        </aop:config>

</beans>
```

```java
import org.junit.Test;
import org.springframework.context.support.ClassPathXmlApplicationContext;
/**
 * 测试类
 * @author liuchao
 */
public class UserTest {

	@Test
	public void testSaveAction() {
		@SuppressWarnings("resource")
		ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("com/e_aop_xml/bean.xml");
		UserAction userAction = (UserAction) context.getBean("userAction");
		userAction.saveAction();
	}
}
```

```java
//控制台输出
开启事务
开启事务, 连接点 方法名: save
持久层对象调用保存方法进行数据保存
提交事务
提交事务, 连接点 方法名: save
```

## 2. 注解方式实现

```java
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.After;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

/**
 * 自定义一个切面类
 * @author liuchao
 */
@Component
@org.aspectj.lang.annotation.Aspect
public class Aspect {

	@Before("execution(* com.f_aop_anno.UserService.*(..))")
	public void beforeAction(JoinPoint joinPoint) {
		System.out.println("开启事务, 连接点 方法名: " + joinPoint.getSignature().getName());
	}

	//自定义一个切点, 然后引用
	@Pointcut("execution(* com.f_aop_anno.UserService.*(..))")
	public void pointCut() {}

	@After("pointCut()")
	public void afterAction(JoinPoint joinPoint) {
		System.out.println("提交事务, 连接点 方法名: " + joinPoint.getSignature().getName());
	}
}
```

```java
import org.springframework.stereotype.Service;
/**
 * 业务层
 * @author liuchao
 */
@Service
public class UserService {

	public void save() {
		System.out.println("持久层对象调用保存方法进行数据保存");
	}
}
```

```java
import javax.annotation.Resource;

import org.springframework.stereotype.Controller;

/**
 * 视图控制器层
 * @author liuchao
 */
@Controller(value="userAction")
public class UserAction {

	@Resource
	private UserService userService;

	public void saveAction() {
		userService.save();
	}
}
```

Spring XML 文件配置

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:aop="http://www.springframework.org/schema/aop"
	xmlns:context="http://www.springframework.org/schema/context"
	xsi:schemaLocation="
    	http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/context
        http://www.springframework.org/schema/context/spring-context.xsd
        http://www.springframework.org/schema/aop
        http://www.springframework.org/schema/aop/spring-aop.xsd">

        <!-- 开启注解扫描 -->
        <context:component-scan base-package="com.f_aop_anno"></context:component-scan>

        <!-- 启用@AsjectJ支持, 需要配置下面一句: -->
        <aop:aspectj-autoproxy></aop:aspectj-autoproxy>
</beans>
```

```java
import org.junit.Test;
import org.springframework.context.support.ClassPathXmlApplicationContext;
/**
 * 测试类
 * @author liuchao
 */
public class UserTest {

	@Test
	public void testSaveAction() {
		@SuppressWarnings("resource")
		ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("com/f_aop_anno/bean.xml");
		UserAction userAction = (UserAction) context.getBean("userAction");
		userAction.saveAction();
	}
}
```

```java
//控制台打印
开启事务, 连接点 方法名: save
持久层对象调用保存方法进行数据保存
提交事务, 连接点 方法名: save
```
