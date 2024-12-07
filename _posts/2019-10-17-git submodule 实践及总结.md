---
layout: post
title: "git submodule 实践及总结"
subtitle: "git 子模块"
date: 2019-10-17
categories: 技术
# cover: "http://on2171g4d.bkt.clouddn.com/jekyll-theme-h2o-postcover.jpg"
tags: git submodule
---

> 合作开发，不得不使用 git 来进行项目管理，下面来记录下关于 git 的踩坑记录。

### 子模块概念

对于一些比较大的工程，为了便模块复用，常常需要抽取子项目，分布式管理项目依赖，会用到子模块（`git submodule`）。

子模块跟父工程之间是两个独立的`git`仓库，只是父工程存储了它依赖的子仓库的版本号信息而已，信息提交相互独立。

### 子模块创建

#### 子模块添加

```
# 在主工程仓库中添加子依赖子模块
$ git submodule add <远程子模块仓库地址> <相对于项目的本地路径>
```

下面模拟添加，执行完添加之后会返现本地多了一个`.gitmodules`隐藏文件。

```
$ git submodule add https://github.com/xxx/module.git module
$ cat .gitmodules
[submodule "module"]
	path = module
	url = https://github.com/xxx/module.git
```

#### 设置子模块依赖分支

```
$ git submodule set-branch (--branch|-b <branch>) [--] <path>

# 例如设置 module 子模块依赖分支为 develop
$ git submodule set-branch -b develop module

$ cat .gitmodules
[submodule "module"]
    path = module
    url = https://github.com/xxx/module.git
    branch = develop
```

查看`.gitmodules`文件发现其指定了一个依赖的子模块，`path`指明在主仓库的位置，`url`指明子模块仓库的远程地址。
并且在主工程仓库的`.git/config`配置文件中加入了`submodule`字段

```
[submodule "module"]
	url = https://github.com/xxx/module.git
	active = true
```

### clone 带有子模块的仓库

在主工程仓库添加完子模块并`push`到远端之后，同事需要`clone`或者`pull`主工程仓库之后，会发现子模块依赖信息（有`.gitmodules`文件），但是子模块文件目录下面是空的，这个时候需要手动对子模块信息初始化并更新。

```
$ git submodule init

# 执行结果
Submodule 'module' (https://github.com/xxxx/module.git) registered for path 'module'
```

补充：当有该仓库下依赖了多个子模块，但是只想初始化指定的子模块，可以在指令后面追加需要初始化模块`path`

```
$ git submodule init [<path>…]
# 例如 git submodule init demo1 demo2
```

这时`.git/config`配置文件中会包含有依赖的子模块信息，再执行更新，从远程拉取依赖的`commit id`子模块代码

```
git submodule update

# 执行结果
Cloning into '/.../MainProject/module'...
Submodule path 'module': checked out 'submodule commit id'
```

当多层依赖子模块时（子模块里面依赖有子模块），这个时候就比较麻烦了，每次`clone`下来之后首先要在第一层依赖的子模块的仓库对子模块进行`init`和`update`，之后再进入依赖有子模块的子模块仓库再进行`init`和`update`，以此递归下去，比较麻烦，此时可以使用下面指令一次性完成递归`init`和`update`

```
$ git submodule update --init --recursive
```

也或者直接在`clone`的时候完成多层依赖的子模块们的`init`和`update`

```
$ git clone --recurse-submodules <远程主工程仓库地址>
```

这样便省去了手动递归执行`$ git submodule init`和`$ git submodule update`

**注意：不管是使用系统的递归克隆还是手动递归执行的初始化和更新，此时子模块的 HEAD 都有可能处于游离状态，需要手动切换到对应的分支**

### 子模块信息更改

主工程都记录有依赖的子工程的提交版本，查看主工程依赖的`commit id`

```
$ git submodule status

# 结果
414b65085b41f4270322716df924625fdbcedf7b module (heads/master)
```

我们可以`cd`到子工程仓库目录下面，对子工模块代码做一些修改，在`commit`之前主仓库`status`会显示`module modified content`，显示子模块原先提交版本上有脏数据；在`commit`之后主仓库的`status`会显示`module new commits`，依赖的子模块的提交版本号发生变化，在子模块仓库代码提交并更新到远端之后，便可以提交更新依赖的子模块的提交版本号。

**注意：主工程的提交及更新并不会对子模块代码造成影响，只会影响其依赖的子模块提交版本**

如果同事更新了子模块代码，然后更新了父项目中依赖的版本号。你在主仓库执行`git pull`之后会发现子模块文件有变更，执行`git diff`会发现如下更改

```
$ git diff
-Subproject commit f88b46fefb73438e2e65c2b7bc7baba8a64ae5d2 #同事新提交的子模块版本
+Subproject commit c577a495c14159b3693c54af2a0bb9760d748246 #我们原来依赖的子模块的老版本
```

这时我们如果对父工程仓库代码直接进行提交，便会更改父仓库依赖的子模块版本号，别人更新下来的父仓库还是依赖老的子模块提交版本。虽然后期可以通过更新依赖版本更正过来，但是也会给平时的合作开发带来不必要的麻烦，因此每次对主仓库进行`git pull`之后，还要执行`git submodule update`对依赖的子模块代码进行一次更新。
但是如果子模块里面还依赖有子模块，我们就需要 cd 到对应的目录下面，一层层调用子模块更新，此时为了方便，我们可以用`git submodule update --recursive`指令完成多层子模块代码的更新。

### 子模块删除

**删除一共分为 3 步**
1、从`.git/config`中删除子模块条目

```
$ git submodule deinit -f <path>

# 例如：想删除名字叫 module 的子模块
$ git submodule deinit -f module
```

2、从`.git/modules`目录中删除子模块目录

```
$ rm -rf .git/modules/<path>

# 例如：想删除名字叫 module 的子模块
$ rm -rf .git/modules/module
```

3、删除`.gitmodules`中子模块条目，并删除项目目录下的子模块目录

```
$ git rm -f <path>

# 例如：想删除名字叫 module 的子模块
$ git rm -f module
```
