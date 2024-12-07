---
layout: post
title: "Spring Security 进阶-加密篇"
# subtitle: "subtitle"
date: 2019-03-23
categories: 技术
# cover: ""
tags: SpringSecurity
---

> 在 Spring Security 中加密是一个很简单却又不能忽略的模块，数据只有加密起来才更安全，这样就散算据库密码泄漏也都是密文。本文分析对应的版本是 5.14。

## 概念

Spring Security 为我们提供了一套加密规则和密码比对规则，org.springframework.security.crypto.password.PasswordEncoder 接口，该接口里面定义了三个方法。

```java
public interface PasswordEncoder {

	//加密(外面调用一般在注册的时候加密前端传过来的密码保存进数据库)
	String encode(CharSequence rawPassword);

	//加密前后对比(一般用来比对前端提交过来的密码和数据库存储密码, 也就是明文和密文的对比)
	boolean matches(CharSequence rawPassword, String encodedPassword);

	//是否需要再次进行编码, 默认不需要
	default boolean upgradeEncoding(String encodedPassword) {
		return false;
	}
}
```

### 该接口实现类有下面这几个

![clipboard.png](/assets/img/2019-03-23/1304272651-5c94c51ea42c4_fix732.webp)

其中常用到的分别有下面这么几个

- BCryptPasswordEncoder：Spring Security 推荐使用的，使用 BCrypt 强哈希方法来加密。
- MessageDigestPasswordEncoder：用作传统的加密方式加密(支持 MD5、SHA-1、SHA-256...)
- DelegatingPasswordEncoder：最常用的，根据加密类型 id 进行不同方式的加密，兼容性强
- NoOpPasswordEncoder：明文， 不做加密
- 其他

#### `MessageDigestPasswordEncoder`

构造的时候需要传入算法字符串，例如 "MD5"、"SHA-1"、"SHA-256"...

```java
String password = "123";

MessageDigestPasswordEncoder encoder = new MessageDigestPasswordEncoder("MD5");
String encode = encoder.encode(password);
System.out.println(encode);
System.out.println(encoder.matches(password,encode) == true ? "相等" : "不相等");
```

输出

```
{EUjIxnT/OVlk5J54s3LaJRuQgwTchm1gduFHTqI0qjo=}4b40375c57c285cc56c7048bb114db23
相等
```

调用 `encode(..)` 加密方法每次都会随机生成盐值，所以对相同的明文进行多次加密，每次结果也是不一样的。
从上面输出部分结合源码可以的出：加密的最终结果分为两部分，**盐值 + MD5(password+盐值)**，调用 `matches(..)` 方法的时候先从密文中得到盐值，用该盐值加密明文和最终密文作对比。

#### `BCryptPasswordEncoder`

构造的时候可以传入哈希强度(`strength`)，强度越大计算量就越大，也就意味着越安全，`strength` 取值区间[4-31]，系统默认是 10。

```java
String password = "123";

BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
String encode = encoder.encode(password);
System.out.println(encode);
System.out.println(encoder.matches(password, encode) == true ? "相等" : "不相等");
```

输出

```
$2a$10$lxPfE.Zvat6tejB8Q1QGYu3M9lXUUpiWFYzboeyK64kbfgN9v7iBq
相等
```

调用 `encode(..)` 方法加密跟上面一样，每次都会随机生成盐值，密文也分为两部分，盐值和最终加密的结果，最终对比的时候从密文里面拿出盐值对明文进行加密，比较最终加密后的结果。

#### `DelegatingPasswordEncoder`

这是 Spring Security 推出的一套兼容方案，根据加密类型 id 字符串(`idForEncode`)去自身缓存的所有加密方式中(`idToPasswordEncoder`)取出对应的加密方案对象对明文进行加密和对应密文的对比，只是其密文前面都加上了加密方案 id 的字符串，具体的咱们看下面代码演示。

其初始化 Spring Security 提供了一个工厂构造方法

```java
public class PasswordEncoderFactories {

	@SuppressWarnings("deprecation")
	public static PasswordEncoder createDelegatingPasswordEncoder() {
		String encodingId = "bcrypt";
		Map<String, PasswordEncoder> encoders = new HashMap<>();
		encoders.put(encodingId, new BCryptPasswordEncoder());
		encoders.put("ldap", new org.springframework.security.crypto.password.LdapShaPasswordEncoder());
		encoders.put("MD4", new org.springframework.security.crypto.password.Md4PasswordEncoder());
		encoders.put("MD5", new org.springframework.security.crypto.password.MessageDigestPasswordEncoder("MD5"));
		encoders.put("noop", org.springframework.security.crypto.password.NoOpPasswordEncoder.getInstance());
		encoders.put("pbkdf2", new Pbkdf2PasswordEncoder());
		encoders.put("scrypt", new SCryptPasswordEncoder());
		encoders.put("SHA-1", new org.springframework.security.crypto.password.MessageDigestPasswordEncoder("SHA-1"));
		encoders.put("SHA-256", new org.springframework.security.crypto.password.MessageDigestPasswordEncoder("SHA-256"));
		encoders.put("sha256", new org.springframework.security.crypto.password.StandardPasswordEncoder());

		return new DelegatingPasswordEncoder(encodingId, encoders);
	}
}
```

这个工厂的静态构造方法把常用的几种方案都注入到缓存中，但是注入的 `idForEncode` 对应的却是 `BCryptPasswordEncoder`，这样系统就可以达到在新存储密码可以使用 `BCryptPasswordEncoder` 加密方案进行加密，但是对于数据库里面以前用其他方式加密的密码也支持比对。

```java
String password = "123";

PasswordEncoder encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
String encode = encoder.encode(password);
System.out.println(encode);
System.out.println(encoder.matches(password, encode) == true ? "相等" : "不相等");
```

输出

```
{bcrypt}$2a$10$Bh23zGZ2YPOsORNexoowb.fX4QH18GEh13eVtZUZvbe2Blx0jIVna
相等
```

从结果中可以看出，相比原始的 `BCryptPasswordEncoder` 密文前面多了加密方式的 id。

当然也可以自定义构造方法，来制定 `DelegatingPasswordEncoder` 用其他的方案进行加密。

接下来我们将其指定使用 MD5 方式来加密密码看看结果

```java
Map<String, PasswordEncoder> encoders = new HashMap<>();
encoders.put("MD5", new MessageDigestPasswordEncoder("MD5"));
DelegatingPasswordEncoder encoder = new DelegatingPasswordEncoder("MD5", encoders);
String encode = encoder.encode(password);
System.out.println(encode);
System.out.println(encoder.matches(password, encode) == true ? "相等" : "不相等");
```

输出

```
{MD5}{XYwuzP8/lL/a3ASzA9UVM4rFs8lbsLvEoa5ydKER844=}d7f919bfd94554150f8ab3a809209ee3
相等
```

相比原始的 `MessageDigestPasswordEncoder`也是密文前面多了加密方式的 id。

## 应用

先示范下使用系统的 `UserDetailsManager` 来演示下简单的注入

```java
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true, securedEnabled = true, jsr250Enabled = true)
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    public void configure(WebSecurity web) throws Exception {
        super.configure(web);
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.inMemoryAuthentication()
                .withUser("liuchao")
                    .password("{bcrypt}$2a$10$S.hMD3oV60YRIj38lHRhP.e3DAu3OwmssE/u/p2GLqqZ3SVsZA77W")
                    .roles("admin","user")
                    .and()
                .passwordEncoder(passwordEncoder);
    }

    @Bean(value = "passwordEncoder")
    public PasswordEncoder delegatingPasswordEncoder() {
        //构造 DelegatingPasswordEncoder 加密方案
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Autowired
    private PasswordEncoder passwordEncoder;
}
```
