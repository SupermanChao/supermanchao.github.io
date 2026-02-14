# Git常用命令

> 📅 发布时间：2019-10-16
>
> 🏷️ 标签：`git`
>
> ⏱️ 阅读时长：约 20 分钟

---

### 1. 新建代码库

```bash
# 初始化本地仓库，在当前目录下生成 .git 文件夹
$ git init
```

```bash
# 默认在当前目录下创建和版本库名相同的文件夹并下载版本到该文件夹下
$ git clone <remote-url>

# 指定本地仓库的目录
$ git clone <remote-url> <local-file-path>

# -b 指定要克隆的分支或tag，默认是master分支
$ git clone <remote-url> -b <remote-branch-name> <local-file-path>

# --depth 指定克隆深度，很多时候我们并不需要将一个仓库下的所有历史全部拉下来，而是只需要最新的代码，这个时候就可以用该参数来控制
# 需要该仓库下的最新代码：git clone git@gitlab... --depth 1
$ git clone <remote-url> --depth 1

# 克隆带主仓库，并递归初始化和更新依赖子模块
$ git clone --recurse-submodules <remote-url>
```

**参考资料：**[Git 基础 - 远程仓库的使用](https://git-scm.com/book/zh/v2/Git-%E5%9F%BA%E7%A1%80-%E8%BF%9C%E7%A8%8B%E4%BB%93%E5%BA%93%E7%9A%84%E4%BD%BF%E7%94%A8)

### 2. 操作远程库

```bash
# 列出已经存在的远程仓库
$ git remote

# 列出远程仓库的详细信息，在别名后面列出URL地址
$ git remote -v

# 添加远程仓库
$ git remote add <remote-name> <remote-url>

# 修改远程仓库的别名
$ git remote rename <origin-name> <new-name>

# 修改远程仓库的 URL 地址
$ git remote set-url <remote-name> <new-remote-url>
```

### 3. 状态查看及变更

```bash
# 查看本地仓库的状态
$ git status

# 以简短模式查看本地仓库的状态
# 会显示两列，第一列是文件的状态，第二列是对应的文件
# 文件状态：A 新增，M 修改，D 删除，?? 未添加到Git中
$ git status -s 或 git status --short

# 查看依赖的子模块信息
$ git submodule status
```

```bash
# 把指定的文件添加到暂存区中
$ git add <文件> ...

# 添加所有文件到暂存区
$ git add .

# 暂存补丁（交互式选择暂存文件指定部分）
# y 暂存该修改块
# n 不暂存该修改块
# q 退出，同时不会暂存本次提示和所有文件剩余没有提示过的修改块
# a 暂存本次提示和该文件剩余没有提示过的修改块
# d 不暂存本次提示和该文件剩余没有提示过的修改块
# g - select a hunk to go to（未尝试）
# / - search for a hunk matching the given regex（未尝试）
# j - leave this hunk undecided, see next undecided hunk（未尝试）
# J - leave this hunk undecided, see next hunk（未尝试）
# e - manually edit the current hunk（未尝试）
# ? 打印帮助文档
$ git add -p 或 git add --patch

# 进入交互式暂存操作
# Commands:
# 1: status，状态查看，在 What now> 的时候输入 1 或 s 或 status 然后按enter，可以查看文件改动
# 2: update，暂存，在 What now> 的时候输入 2 或 u 或 update 然后按enter进入文件选择模式，输入需要暂存文应的编号，多个文件中间用 ',' 隔开（例：Update>> 1、Update>> 1,2）然后按enter进入确认模式，这个时候可以追加暂存文件，将会被暂存的文件前面会用 '*' 标记出来，如果在 Update>> 提示符后不输入任何东西并直接按enter，被标记文件会被暂存起来
# 3: revert，取消暂存，在 What now> 的时候输入 3 或 r 或 revert 然后按enter进入文件选择模式，输入需要取消暂存文应的编号，多个文件中间用 ',' 隔开（例：Revert>> 1、Revert>> 1,2）然后按enter进入确认模式，这个时候可以追加要取消暂存的文件，将会被取消暂存的文件前面会用 '*' 标记出来，如果在 Update>> 提示符后不输入任何东西并直接按enter，被标记文件会被取消暂存
# 4: add untracked，添加未被跟踪文件到暂存，跟 update 和 revert 操作类似
# 5: patch，暂存补丁，（相当于执行 git add -p），在 What now> 的时候输入 5 或 p 或 patch 然后按enter进入文件选择模式，输入需要补丁暂存操作的文件编号，多个文件中间用 ',' 隔开（例：Patch update>> 1、Patch update>> 1,2）然后按enter进入确认模式，这个时候可以追加要补丁暂存操作的文件，将会被补丁暂存操作的文件前面会用 '*' 标记出来，如果在 Patch update>> 提示符后不输入任何东西并直接按enter，进入补丁暂存操作，跟据提示完成补丁暂存工作
# 6: diff，查看暂存内容（相当于执行 git diff --cached），跟 patch 操作类似
# 7: quit，退出交互式暂存操作，在 What now> 的时候输入 7 或 q 或 quit 然后按enter退出交互式暂存操作
# 8: help，打印帮助文档
$ git add -i 或 git add --interactive
```

```bash
# 查看工作空间修改（尚未暂存的修改）
$ git diff

# 查看指定文件尚未暂存的修改
$ git diff <file>...

# 查看已暂存起来的修改（Git 1.6.1 及更高版本还允许使用 git diff --staged，效果是相同的）
$ git diff --cached
```

**参考资料：**[Git 基础 - 记录每次更新到仓库](https://git-scm.com/book/zh/v2/Git-%E5%9F%BA%E7%A1%80-%E8%AE%B0%E5%BD%95%E6%AF%8F%E6%AC%A1%E6%9B%B4%E6%96%B0%E5%88%B0%E4%BB%93%E5%BA%93)、[Git 工具 - 交互式暂存](https://git-scm.com/book/zh/v2/Git-%E5%B7%A5%E5%85%B7-%E4%BA%A4%E4%BA%92%E5%BC%8F%E6%9A%82%E5%AD%98)

### 4. 撤销

```bash
# 撤销工作区指定文件的修改
git restore <file>... 或 git checkout -- <file>...

# 撤销工作区所有文件的修改
git restore . 或 git checkout -- .

# 取消指定文件的暂存修改
$ git restore --staged <file>... 或 git reset HEAD <file>...

# 取消所有文件的暂存修改
$ git restore --staged . 或 git reset HEAD .
```

**参考资料：**[Git 基础 - 撤消操作](https://git-scm.com/book/zh/v2/Git-%E5%9F%BA%E7%A1%80-%E6%92%A4%E6%B6%88%E6%93%8D%E4%BD%9C)

### 5. 贮藏

```bash
# 将修改贮藏起来，包括工作空间的修改和索引中暂存的修改
$ git stash | $ git stash push

# 将修改贮藏起来并加上对应描述
$ git stash push --message "<贮藏描述>" 或 git stash push -m "<贮藏描述>"

# 将修改贮藏起来，同时保持索引中的暂存修改
$ git stash --keep-index 或 git stash push -k

# 交互式地提示哪些修改想要贮藏、哪些修改不想贮藏，根据提示进行选择（类似上面的 git add -p）
$ git stash --patch 或 git stash -p

# 查看贮藏列表
$ git stash list

# 将最近一次贮藏内容重新应用（不从贮藏列表中清除）
$ git stash apply 或 git stash apply stash@{0}

# 将最近一次贮藏内容重新应用（不从贮藏列表中清除），并且保持贮藏时的索引暂存状态
$ git stash apply --index

# 将最近一次贮藏内容重新应用（从贮藏列表中清除）
$ git stash pop

# 丢弃贮藏列表中最近的一次贮藏记录
$ git stash drop 或 git stash drop stash@{0}

# 清空贮藏列表
$ git stash clear
```

**参考资料：**[Git 工具 - 贮藏与清理](https://git-scm.com/book/zh/v2/Git-%E5%B7%A5%E5%85%B7-%E8%B4%AE%E8%97%8F%E4%B8%8E%E6%B8%85%E7%90%86)

### 6. 清理

```bash
# 删除未被跟踪的文件
$ git clean

# 删除指定的未被跟踪的文件
$ git clean <file>...

# 删除未被跟踪的文件和目录
$ git clean -d

# 做一次演习然后告诉将要移除什么，实际不会删除任何文件
$ git clean -n

# 如果Git配置变量clean.requireForce未设置为false，git clean将拒绝删除文件或目录，除非给定-f
$ git clean -f

# 例：删除所有未被跟踪的文件及目录
$ git clean -d -f
```

**参考资料：**[Git 工具 - 贮藏与清理](https://git-scm.com/book/zh/v2/Git-%E5%B7%A5%E5%85%B7-%E8%B4%AE%E8%97%8F%E4%B8%8E%E6%B8%85%E7%90%86)

### 7. 提交

```bash
# 把索引中暂存的修改提交到本地仓库中并添加描述信息
$ git commit -m "<提交的描述信息>"

# 相当于 'git add .' 和 'git commit' 组合
$ git commit -a -m "<提交的描述信息>"

# 将另外某个分支上的修改作用到当前分支上
$ git cherry-pick <commit-id>
```

### 8. 重写历史（未同步到远程仓库）

```bash
# 修改最后一条提交，追加索引中新暂存的修改，可以修改commit message（以vim方式展示）
# 如果想撤销 amend 操作可以参考 https://www.jianshu.com/p/97341ed9d89e，原理：用 git reflog 查找到对应的commit id，然后回滚回去
$ git commit --amend

# 修改最后一条提交，追加索引中新暂存的修改，并修改commit message
$ git commit --amend -m "<提交的描述信息>"

# 索引中新暂存的修改同步到最后一次commit，跳过commit message编辑
$ git commit --amend --no-edit

# 交互式操作最近的n次提交，例如对最近3次提交进行修改 'git rebase -i HEAD~3'
# Commands:
# p, pick <commit> = 保留该commit
# r, reword <commit> = 保留该commit, 但是可以编辑commit message
# e, edit <commit> = 保留该commit, 停留在该次commit, 对该次commit或前后面做些修改, 修改完后运行 'git rebase --continue' 往下走
# s, squash <commit> = 保留该commit, 将其合并到前一次commit
# f, fixup <commit> = 跟squash一样, 但是会跳过合并后的commit message编辑
# x, exec <command> = run command (the rest of the line) using shell (未尝试)
# b, break = stop here (continue rebase later with 'git rebase --continue')  (未尝试)
# d, drop <commit> = 丢弃该commit
# l, label <label> = label current HEAD with a name  (未尝试)
# t, reset <label> = reset HEAD to a label  (未尝试)
# m, merge [-C <commit> | -c <commit>] <label> [# <oneline>]  (未尝试)
$ git rebase -i HEAD~n
```

**参考资料：**[Git 工具 - 重写历史](https://git-scm.com/book/zh/v2/Git-%E5%B7%A5%E5%85%B7-%E9%87%8D%E5%86%99%E5%8E%86%E5%8F%B2)、[撤销 git commit --amend](https://www.jianshu.com/p/97341ed9d89e)

### 9. 重置

```bash
# 将HEAD挪到指定提交，索引暂存和工作区保持不变
$ git reset --soft <commit-id>

# 将HEAD挪到指定提交，索引暂存区回滚到指定提交，工作区保持不变
$ git reset --mixed <commit-id> 或 git reset <commit-id>

# 将HEAD挪到指定提交，索引暂存区和工作区都回滚到指定提交
$ git reset --hard <commit-id>

# 将HEAD挪到前一次或前n次提交，索引暂存和工作区保持不变
$ git reset --soft HEAD~ 或 git reset --soft HEAD~n

# 将HEAD挪到前一次或前n次提交，索引暂存区回滚到前一次或前n次提交，工作区保持不变
$ git reset --mixed HEAD~ 或 git reset HEAD~n

# 将HEAD挪到前一次或前n次提交，索引暂存区和工作区都回滚到前一次或前n次提交
$ git reset --hard HEAD~ 或 git reset --hard HEAD~n
```

**参考资料：**[Git 工具 - 重置揭密](https://git-scm.com/book/zh/v2/Git-%E5%B7%A5%E5%85%B7-%E9%87%8D%E7%BD%AE%E6%8F%AD%E5%AF%86)

### 10. 提交查看

```bash
# 按提交时间列出所有的更新（会列出每个提交的 SHA-1 校验和、作者的名字和电子邮件地址、提交时间以及提交说明）
$ git log

# 显示每次提交的内容差异
$ git log -p

# 可以加上 -1 来仅显示最近一次提交的内容差异
$ git log -p -1

# 显示每次提交内容简略的统计信息
$ git log --stat

# 只显示 --stat 中最后的行数修改添加移除统计
$ git log --shortstat

# 只显示 --stat 中已修改的文件清单
$ git log --name-only

# --pretty选项可以指定使用不同于默认格式的方式展示提交历史。 比如用 oneline 将每个提交放在一行显示。 另外还有 short，full 和 fuller 可以用，展示的信息或多或少有些不同
$ git log --pretty=oneline

# 显示 ASCII 图形表示的分支合并历史，常与 git log --pretty 配合使用 git log --pretty=oneline --graph
$ git log --graph

# 仅显示指定时间之后的提交，例如：git log --since="2019-11-27"
$ git log --since 或 git log --after

# 仅显示指定时间之前的提交，例如：git log --since="2019-11-27" --until="2019-11-28" 可以查看 2019年11月27日到2019年11月28日之间的提交
$ git log --until 或 git log --before

# 仅显示指定作者相关的提交
$ git log --author

# 仅显示含指定关键字的提交，例如：git log --grep="xxx"，或者后面可以直接跟正则表达式，
$ git log --grep

# 仅显示指定文件或者目录的历史提交，-- 告诉 git log 接下来的参数是文件路径而不是分支名，如果分支名和文件名不可能冲突，你可以省略 --
$ git log -- <file>

# 显示那些添加或移除了某些字符串的提交，想找出添加或移除了某一个特定函数的提交，例如：git log -S "main()"
$ git log -S

# 查看所有分支提交
$ git log --all

#  输出当前分支提交历史（每次提交一行显示），--oneline 是 --pretty=oneline --abbrev-commit 合用的简写
$ git log --oneline

# 输出提交历史、各个分支的指向以及项目的分支分叉情况
$ git log --graph --oneline --all

# 格式化查看提交历史，--pretty=format
# 常用可选项
#   %H  提交的完整哈希值
#   %h  提交的简写哈希值
#   %P  父提交的完整哈希值
#   %p  父提交的简写哈希值
#   %an  作者名字
#   %ae  作者的电子邮件地址
#   %ad  作者修订日期（可以用 --date=选项 来定制格式）
#   %ar  作者修订日期，按多久以前的方式显示
#   %cd  提交日期
#   %cr  提交日期（距今多长时间）
#   %s  提交说明
# 例：git log --pretty=format:"%h  %an"
$ git log --pretty=format:“<指定给是>"
```

**参考资料：**[Git 基础 - 查看提交历史](https://git-scm.com/book/zh/v2/Git-%E5%9F%BA%E7%A1%80-%E6%9F%A5%E7%9C%8B%E6%8F%90%E4%BA%A4%E5%8E%86%E5%8F%B2)、[Git log 高级用法](<[https://github.com/geeeeeeeeek/git-recipes/wiki/5.3-Git-log-%E9%AB%98%E7%BA%A7%E7%94%A8%E6%B3%95](https://github.com/geeeeeeeeek/git-recipes/wiki/5.3-Git-log-%E9%AB%98%E7%BA%A7%E7%94%A8%E6%B3%95)>)

### 11. 分支

```bash
# 列出本地的所有分支，当前所在分支以 "*" 标出
$ git branch

# 列出所有本地分支和远程分支
$ git branch -a

# 查看每一个分支的最后一次提交
$ git branch -v

# 将所有的本地分支列出来并且包含更多的信息，如每一个分支正在跟踪哪个远程分支与本地分支是否是领先、落后或是都有
$ git branch -vv

# 创建本地新分支，新的分支基于前一次提交建立
$ git branch <branch-name>

# 查看已经合并到当前分支的分支
$ git branch --merged

# 查看所有未合并到当前分支的分支
$ git branch --no-merged

# 删除指定的本地分支
$ git branch -d <branch-name>

# 强制删除指定的本地分支，例如分支上有改动没提交或合并删除需要使用强制删除
$ git branch -D <branch-name>

# 切换到已存在的指定分支
$ git checkout <branch-name>

# 创建并切换到指定的本地分支
# 等同于 "git branch" 和 "git checkout" 两个命令合并
$ git checkout -b <branch-name>

# 从远程跟踪分支检出一个本地分支，名字与远程分支名一样
$ git checkout --track <remote-name>/<remote-branch-name>

# 从远程跟踪分支检出一个本地分支，名字与远程分支名可以不一致
$ git checkout -b <local-branch-name> <remote-name>/<local-branch-name>

# 当前分支与指定远程分支建立追踪关系，例如：git branch -u origin/develop
$ git branch -u <remote-name>/<remote-branch-name>

# 指定本地分支与远程分支建立追踪关系，例如：git branch --set-upstream-to=origin/develop develop
$ git branch --set-upstream-to=<remote-name>/<remote-branch-name> <local-branch-name>

# 修改本地分支名称
# 如果不指定原分支名称则为当前所在分支
$ git branch -m <new-branch-name>
# 修改指定分支
$ git branch -m <origin-branch-name> <new-branch-name>
# 强制修改分支名称
$ git branch -M <origin-branch-name> <new-branch-name>
```

**参考资料：**[Git 分支 - 远程分支](https://git-scm.com/book/zh/v2/Git-%E5%88%86%E6%94%AF-%E8%BF%9C%E7%A8%8B%E5%88%86%E6%94%AF)、[Git 分支 - 分支简介](https://git-scm.com/book/zh/v2/Git-%E5%88%86%E6%94%AF-%E5%88%86%E6%94%AF%E7%AE%80%E4%BB%8B)、[Git 分支 - 分支管理](https://git-scm.com/book/zh/v2/Git-%E5%88%86%E6%94%AF-%E5%88%86%E6%94%AF%E7%AE%A1%E7%90%86)

### 12. 合并

```bash
# 将指定分支合并到当前分支，可以用作"快进"合并
$ git merge <branch-name>
```

```bash
# 将某一个分支“变基”合并到当前分支
# 实现步骤
# 首先，git 会把当前分支里面的每个 commit 取消掉；
# 其次，把上面的操作临时保存成 patch 文件，存在 .git/rebase 目录下；
# 然后，把当前分支更新到最新的 basebranch 分支；
# 最后，把上面保存的 patch 文件应用到当前分支上；
$ git rebase <base-branch>

# 将某一个分支“变基”合并到指定分支
$ git rebase <base-branch> <topic-branch>

# 取出 topic-branch 分支，找出它从 exception-branch 分支分歧之后的补丁，然后把这些补丁在 base-branch 分支上重放一遍，让 topic-branch 看起来像直接基于 base-branch 修改一样
$ git rebase --onto <base-branch> <exception-branch> <topic-branch>

# 将对应的远程分支“变基”合并到当前本地分支
$ git pull --rebase
```

**参考资料：**[Git 分支 - 分支的新建与合并](https://git-scm.com/book/zh/v2/Git-%E5%88%86%E6%94%AF-%E5%88%86%E6%94%AF%E7%9A%84%E6%96%B0%E5%BB%BA%E4%B8%8E%E5%90%88%E5%B9%B6)、[Git 分支 - 变基](https://git-scm.com/book/zh/v2/Git-%E5%88%86%E6%94%AF-%E5%8F%98%E5%9F%BA)

### 13. 远程同步

```bash
#  创建远程分支
$ git push <remote-name> <loacl-branch-name>:<remote-branch-name>

# 将远程分支与当前本地分支建立对应关系
$ git push --set-upstream <remote-name> <remote-branch-name>

# 一步到位创建远程分支并与本地分支建立对应关系
$ git push -u <remote-name> <loacl-branch-name>:<remote-branch-name>

# 强制将本地差异推送到远端，让远端跟本地保持同步，例如：当远程仓库比本地更新，可以通过该指令将远程更新成和本地一样
$ git push -f <remote-name>
$ git push --force <remote-name>

# 将本地所有分支提交到远端
$ git push --all

# 删除远程分支
$ git push <remote-name> :<remote-branch-name>
$ git push <remote-name> --delete <remote-branch-name>

# 将本地分支修改内容推送到对应的远程分支
$ git push <remote-name> <remote-branch-name>

# 从远程仓库中获得数据，不会自动合并或修改你当前的工作
$ git fetch <remote-name>

# 同步远程分支，例如小伙伴已经删除了 origin/develop这个分支，但是我们本地仓库还有这个分支，可以执行下面指令进行同步
$ git remote prune origin
```

**参考资料：**[Git 分支 - 远程分支](https://git-scm.com/book/zh/v2/Git-%E5%88%86%E6%94%AF-%E8%BF%9C%E7%A8%8B%E5%88%86%E6%94%AF)

### 14. 标签

```bash
# 在最新commit上打上标签，例如：git tag v1.0
$ git tag <tagname>

# 在指定commit上打标签，例如：git tag v1.0 e7bd1d2
$ git tag <tagname> <commit-id>

# 创建带有说明的标签，用-a指定标签名，-m指定说明文字，例如：git tag -a v1.0 -m "version 1.0" e7bd1d2
$ git tag -a <tagname> -m <tag description> <commit-id>

# 将本地标签同步到远程，例如：git push origin v1.0
$ git push <remote-name> <tagname>

# 一次性推送全部尚未推送到远程的本地标签
$ git push <remote-name> --tags

# 删除本地标签，例如：git tag -d v1.0
$ git tag -d <tagname>

# 删除远程标签，例如：git push origin :refs/tags/v1.0
$ git push <remote-name> :refs/tags/<tagname>

# 查看所有的标签，按字母排序
$ git tag

# 查看指定标签信息
$ git show <tagname>
```

**参考资料：**[Git 基础 - 打标签](https://git-scm.com/book/zh/v2/Git-%E5%9F%BA%E7%A1%80-%E6%89%93%E6%A0%87%E7%AD%BE)

### 15. 别名配置

```bash
# 为指定命令设置一个别名，例如：git config --global alias.co checkout
$ git config --global alias.<alias> <order>

# 修改指定别名对应的命令，例如：git config --global alias.co 'commit'
$ git config --global alias.<alias> '<order>'
```

可以直接在 ~/.gitconfig 文件中将其设置别名，我的别名设置如下

```
[alias]
	st = status -s
	lg = log --graph --oneline --abbrev-commit
	lga = log --graph --oneline --decorate --all
	sbi = submodule init
	sbu = submodule update
	sbuir = submodule update --init --recursive
	crsb = clone --recurse-submodules
 	sbst = git submodule status
 	renameTag = "!sh -c 'set -e;git tag $2 $1; git tag -d $1;git push origin :refs/tags/$1;git push --tags' -"
```

**参考资料：**[Git 基础 - Git 别名](https://git-scm.com/book/zh/v2/Git-%E5%9F%BA%E7%A1%80-Git-%E5%88%AB%E5%90%8D)

### 16. 配置

```bash
# 全局配置git提交用户名，该配置将会被写到~/.gitconfig文件里面
$ git config --global user.name "John Doe"

# 全局配置git提交用户邮箱，该配置将会被写到~/.gitconfig文件里面
$ git config --global user.email johndoe@example.com

# 项目里面配置git提价用户名，该配置将会被写到项目目录下的.git/config文件里面
$ git config user.name "John Doe"

# 项目里面配置git提交用户邮箱，该配置将会被写到项目目录下的.git/config文件里面
$ git config user.email johndoe@example.com
```

**Git**使用一系列配置文件来保存你自定义的行为。 它首先会查找系统级的`/etc/gitconfig`文件，该文件含有系统里每位用户及他们所拥有的仓库的配置值。 如果传递`--system`选项给`git config`，它就会读写该文件。
接下来**Git**会查找每个用户的`~/.gitconfig`文件（或者`~/.config/git/config`文件）。 可以传递`--global`选项让**Git**读写该文件。
最后**Git**会查找你正在操作的仓库所对应的**Git**目录下的配置文件（`.git/config`）。 这个文件中的值只对该仓库有效，它对应于向`git config`传递`--local`选项。
以上三个层次中每层的配置（系统、全局、本地）都会覆盖掉上一层次的配置，所以`.git/config`中的值会覆盖掉`/etc/gitconfig`中所对应的值。
**参考资料：**[自定义 Git - 配置 Git](https://git-scm.com/book/zh/v2/%E8%87%AA%E5%AE%9A%E4%B9%89-Git-%E9%85%8D%E7%BD%AE-Git)

### 17. 其它

```bash
# 查看最近 HEAD 和分支引用所指向的历史
$ git reflog

# 查看引用日志信息
$ git log -g

# 查看上一个提交，也就是 “HEAD 的父提交”
$ git show HEAD^

# 操作或查看指定目录下的仓库，例如查看指定目录仓库log：git -C ~/Desktop/Demo log
$ git -C <local-repository-path> <cmd>
```

**参考资料：**[Git 工具 - 选择修订版本](https://git-scm.com/book/zh/v2/Git-%E5%B7%A5%E5%85%B7-%E9%80%89%E6%8B%A9%E4%BF%AE%E8%AE%A2%E7%89%88%E6%9C%AC)
