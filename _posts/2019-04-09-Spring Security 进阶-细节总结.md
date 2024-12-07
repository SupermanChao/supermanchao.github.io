---
layout: post
title: "Spring Security 进阶-细节总结"
# subtitle: "subtitle"
date: 2019-04-09
categories: 技术
# cover: ""
tags: SpringSecurity
---

> 关于 Spring Security 的学习已经告一段落了，刚开始接触该安全框架感觉很迷茫，总觉得没有 Shiro 灵活，到后来的深入学习和探究才发现它非常强大。简单快速集成，基本不用写任何代码，拓展起来也非常灵活和强大。

## 系统集成

集成完该框架默认情况下，系统帮我们生成一个登陆页，默认除了登陆其他请求都需要进行身份认证，没有身份认证前的任何操作都会跳转到默认登录页。
默认生成的密码也会在控制台输出。

## 简单页面自定义

接下来我们可能需要自己控制一下权限，自定义一下登录界面

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.csrf().disable()
        .formLogin()
            .loginPage("/login.html") //自定义登录界面
            .loginProcessingUrl("/login.action") //指定提交地址
            .defaultSuccessUrl("/main.html") //指定认证成功跳转界面
            //.failureForwardUrl("/error.html") //指定认证失败跳转界面(注: 转发需要与提交登录请求方式一致)
            .failureUrl("/error.html") //指定认证失败跳转界面(注: 重定向需要对应的方法为 GET 方式)
            .usernameParameter("username") //username
            .passwordParameter("password") //password
            .permitAll()
            .and()
        .logout()
            .logoutUrl("/logout.action") //指定登出的url, controller里面不用写对应的方法
            .logoutSuccessUrl("/login.html") //登出成功跳转的界面
            .permitAll()
            .and()
        .authorizeRequests()
            .antMatchers("/register*").permitAll() //设置不需要认证的
            .mvcMatchers("/main.html").hasAnyRole("admin")
            .anyRequest().authenticated() //其他的全部需要认证
            .and()
        .exceptionHandling()
            .accessDeniedPage("/error.html"); //配置权限失败跳转界面 (注: url配置不会被springmvc异常处理拦截, 但是注解配置springmvc异常机制可以拦截到)
}
```

从上面配置可以看出自定义配置可以简单地分为四个模块（登录页面自定义、登出自定义、权限指定、异常设定），每个模块都对应着一个过滤器，详情请看 [Spring Security 进阶-原理篇](https://segmentfault.com/a/1190000018616620)

**需要注意的是：**

- 配置登录提交的 URL `loginProcessingUrl(..)`、登出 URL `logoutUrl(..)` 都是对应拦截器的匹配地址，会在对应的过滤器里面执行相应的逻辑，不会执行到 Controller 里面的方法。
- 配置的登录认证成功跳转的 URL `defaultSuccessUrl(..)`、登录认证失败跳转的 URL `failureUrl(..)`、登录认证失败转发的 URL `failureForwardUrl(..)`......以及下面登出和权限配置的 URL 可以是静态界面地址，**也可以是 Controller 里面对应的方法**。
- 这里配置 URL 对应的访问权限，访问失败不会被 SpringMVC 的异常方法拦截到，注解配置的可以被拦截到。但是我们最好不要在 SpringMVC 里面对他进行处理，而是放到配置的权限异常来处理。
- 登录身份认证失败跳转对应的地址前会把异常保存到 request(转发) 或 session(重定向) 里面，可以通过 key `WebAttributes.AUTHENTICATION_EXCEPTION` 来取出，但是前提是使用系统提供的身份认证异常处理 handler `SimpleUrlAuthenticationFailureHandler`。
- 上面这种配置身份认证失败都会跳转到登录页，权限失败会跳转指定的 URL，没有配置 URL 则会响应 403 的异常给前端，前提是在使用系统为我们提供的默认权限异常处理 handler `AccessDeniedHandlerImpl`。

## 异步响应配置

大多数开发情况下都是前后端分离，响应也都是异步的，不是上面那种表单界面的响应方式，虽然通过上面跳转到 URL 对应的 Controller 里面的方法也能解决，但是大多数情况下我们需要的是极度简化，这时候一些自定义的处理 handler 就油然而生。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.csrf().disable()
        .formLogin()
            .loginProcessingUrl("/login")
            .successHandler(new AuthenticationSuccessHandler() {
                @Override
                public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
                    System.out.println("****** 身份认证成功 ******");
                    response.setStatus(HttpStatus.OK.value());
                }
            })
            .failureHandler(new AuthenticationFailureHandler() {
                @Override
                public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
                    System.out.println("****** 身份认证失败 ******");
                    response.sendError(HttpStatus.UNAUTHORIZED.value(), HttpStatus.UNAUTHORIZED.getReasonPhrase());
                }
            })
            .permitAll()
            .and()
        .logout()
            .logoutUrl("/logout")
            .logoutSuccessHandler(new LogoutSuccessHandler() {
                @Override
                public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
                    System.out.println("****** 登出成功 ******");
                    response.setStatus(HttpStatus.OK.value());
                }
            })
            .permitAll()
            .and()
        .authorizeRequests()
            .antMatchers("/main").hasAnyRole("admin")
            .and()
        .exceptionHandling()
            .authenticationEntryPoint(new AuthenticationEntryPoint() {
                @Override
                public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
                    System.out.println("****** 没有进行身份认证 ******");
                    response.sendError(HttpStatus.UNAUTHORIZED.value(), HttpStatus.UNAUTHORIZED.getReasonPhrase());
                }
            })
            .accessDeniedHandler(new AccessDeniedHandler() {
                @Override
                public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException, ServletException {
                    System.out.println("****** 没有权限 ******");
                    response.sendError(HttpStatus.UNAUTHORIZED.value(), HttpStatus.UNAUTHORIZED.getReasonPhrase());
                }
            });
}
```

注意：

- 没有指定登录界面，那么久需要至少配置两个 handler，登出失败 hander `logoutSuccessHandler(..)`，登录身份认证失败的 handler `failureHandler(..)`，以免默认这样两个步骤向不存在的登录页跳转。
- 配置的登录身份认证失败 handler `failureHandler(..)` 和 没有进行身份认证的异常 handler `authenticationEntryPoint(..)`，这两个有区别，前者是在认证过程中出现异常处理，后者是在访问需要进行身份认证的 URL 时没有进行身份认证异常处理。

## 自定义身份认证过程

开发的时候我们需要自己来实现登录登出的流程，下面来个最简单的自定义。

```java
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.csrf().disable()
        .logout()
            .logoutUrl("/logout")
            .logoutSuccessHandler(new LogoutSuccessHandler() {
                @Override
                public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
                    System.out.println("****** 登出成功 ******");
                    response.setStatus(HttpStatus.OK.value());
                }
            })
            .permitAll()
            .and()
        .authorizeRequests()
            .antMatchers("/main").hasAnyRole("admin")
            .and()
        .exceptionHandling()
            .authenticationEntryPoint(new AuthenticationEntryPoint() {
                @Override
                public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
                    System.out.println("****** 没有进行身份认证 ******");
                    response.sendError(HttpStatus.UNAUTHORIZED.value(), HttpStatus.UNAUTHORIZED.getReasonPhrase());
                }
            })
            .accessDeniedHandler(new AccessDeniedHandler() {
                @Override
                public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException, ServletException {
                    System.out.println("****** 没有权限 ******");
                    response.sendError(HttpStatus.UNAUTHORIZED.value(), HttpStatus.UNAUTHORIZED.getReasonPhrase());
                }
            })
            .and()
        .addFilterBefore(new LoginFilter(), UsernamePasswordAuthenticationFilter.class);
}
```

**注意：**

- 这里配置了登出，也可以不配置，在自定义登出的 Controller 方法里面进行手动清空 `SecurityContextHolder.clearContext();`，但是建议配置，一般登录和登出最好都在过滤器里面进行处理。
- 添加自定义登录过滤器，相当于配置登录。
- 记得配置登录认证前和过程中的一些请求不需要身份认证。

自定义登录过滤器详情

```java
public class LoginFilter extends GenericFilterBean {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {

        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        HttpServletResponse httpServletResponse = (HttpServletResponse) response;

        if ("/login".equals(httpServletRequest.getServletPath())) { //开始登录过程

            String username = httpServletRequest.getParameter("username");
            String password = httpServletRequest.getParameter("password");
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(username, password);

            //模拟数据库查出来的
            User.UserBuilder userBuilder = User.withUsername(username);
            userBuilder.password("123");
            userBuilder.roles("user", "admin");
            UserDetails user = userBuilder.build();

            if (user == null) {
                System.out.println("****** 自定义登录过滤器 该用户不存在 ******");
                httpServletResponse.sendError(HttpStatus.UNAUTHORIZED.value(), HttpStatus.UNAUTHORIZED.getReasonPhrase());
            }
            if (!user.getUsername().equals(authentication.getPrincipal())) {
                System.out.println("****** 自定义登录过滤器 账号有问题 ******");
                httpServletResponse.sendError(HttpStatus.UNAUTHORIZED.value(), HttpStatus.UNAUTHORIZED.getReasonPhrase());
            }
            if (!user.getPassword().equals(authentication.getCredentials())) {
                System.out.println("****** 自定义登录过滤器 密码有问题 ******");
                httpServletResponse.sendError(HttpStatus.UNAUTHORIZED.value(), HttpStatus.UNAUTHORIZED.getReasonPhrase());
            }

            UsernamePasswordAuthenticationToken result = new UsernamePasswordAuthenticationToken(user.getUsername(), authentication.getCredentials(), user.getAuthorities());
            result.setDetails(authentication.getDetails());

            //注: 最重要的一步
            SecurityContextHolder.getContext().setAuthentication(result);

            httpServletResponse.setStatus(HttpStatus.OK.value());
        } else  {
            chain.doFilter(request, response);
        }
    }
}
```

**注意：**

- 不是登录认证就接着执行下一个过滤器或其他。
- 登录认证失败不能直接抛出错误，需要向前端响应异常。
- 完成登录逻辑直接响应，不需要接着往下执行什么。
