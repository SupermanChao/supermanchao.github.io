# MySQL学习笔记

> 📅 发布时间：2019-11-11
>
> 🏷️ 标签：`MySQL` `数据库` `SQL`
>
> ⏱️ 阅读时长：约 30 分钟

本篇文章为我个人 MySQL 基础知识学习笔记，记录得比较粗略，旨在自己能看懂，所以各位读者如果恰好看到本篇笔记并阅读，遇到不详细的地方还是需要自己查更详细的资料，见谅！！！

## 一、MySQL 核心基础

### 1.1 连接与退出 MySQL

```sql
-- MySQL连接与退出完整命令
-- 一、连接数据库
# 基础本地连接（回车后输入密码）
mysql -u 用户名 -p
# 本地连接示例（root用户）
mysql -u root -p

# 远程连接（指定主机IP和端口）
mysql -h 远程IP -P 端口号 -u 用户名 -p
# 远程连接示例（连接192.168.1.100的3306端口）
mysql -h 192.168.1.100 -P 3306 -u root -p

-- 二、退出数据库（两种方式均可）
exit;
quit;
```

### 1.2 数据库操作（DDL）

```sql
-- 数据库操作（DDL）完整语句
-- 1. 查看所有数据库
SHOW DATABASES;

-- 2. 创建数据库（指定字符集和排序规则，推荐 utf8mb4）
-- 注意：永远不要使用 utf8（最多3字节），无法存储Emoji。必须使用 utf8mb4。
CREATE DATABASE IF NOT EXISTS mydb
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_unicode_ci;

-- 3. 切换数据库
USE mydb; -- 切换到 mydb 数据库

-- 4. 删除数据库（谨慎操作，删除后数据不可恢复）
DROP DATABASE IF EXISTS mydb;
```

### 1.3 数据表操作（DDL）

```sql
-- 数据表操作（DDL）完整语句
-- 1. 查看当前数据库的所有表
SHOW TABLES;

-- 2. 创建数据表（示例：创建用户表 user）
CREATE TABLE IF NOT EXISTS `user` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID（主键）',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(100) NOT NULL COMMENT '密码（严禁明文存储，生产环境请使用bcrypt等哈希加密）',
  `age` TINYINT UNSIGNED DEFAULT 0 COMMENT '年龄',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`), -- 主键约束
  UNIQUE KEY `uk_username` (`username`) -- 唯一索引（用户名不重复）
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信息表';

-- 3. 查看表结构
DESC user; -- 简洁版
-- 或（详细版）
SHOW CREATE TABLE user;

-- 4. 修改数据表
-- 4.1 添加字段（示例：添加手机号字段）
ALTER TABLE user ADD COLUMN `phone` VARCHAR(20) DEFAULT '' COMMENT '手机号' AFTER `age`;
-- 4.2 修改字段（示例：修改 age 字段类型）
ALTER TABLE user MODIFY COLUMN `age` INT UNSIGNED DEFAULT 0 COMMENT '年龄';
-- 4.3 删除字段（谨慎操作）
ALTER TABLE user DROP COLUMN `phone`;
-- 4.4 修改表名
ALTER TABLE user RENAME TO `user_info`;

-- 5. 删除数据表（谨慎操作）
DROP TABLE IF EXISTS user;
```

### 1.4 数据操作（DML）

```sql
-- 1. 插入单条数据
INSERT INTO user (username, password, age)
VALUES ('zhangsan', '123456', 20);

-- 2. 插入多条数据（高效）
INSERT INTO user (username, password, age)
VALUES
('lisi', '654321', 22),
('wangwu', '987654', 25);

-- 3. 插入时忽略重复（基于唯一索引）
INSERT IGNORE INTO user (username, password, age)
VALUES ('zhangsan', '123456', 21); -- 用户名重复则忽略

-- 4. 插入重复时更新（INSERT ON DUPLICATE KEY UPDATE，基于唯一索引/主键）
-- 核心：当插入数据触发唯一索引（如username）或主键（id）重复时，执行更新操作，不重复则正常插入
-- 示例1：基于username唯一索引，重复时更新密码和年龄
INSERT INTO user (username, password, age)
VALUES ('zhangsan', '666666', 23)
ON DUPLICATE KEY UPDATE password = VALUES(password), age = VALUES(age);

-- 示例2：基于主键id，重复时更新相关字段（适合批量插入+更新场景）
INSERT INTO user (id, username, password, age)
VALUES (1, 'zhangsan', '888888', 24)
ON DUPLICATE KEY UPDATE password = '888888', age = 24;

-- 示例3：多条插入+更新（高效，避免循环单条操作）
INSERT INTO user (username, password, age)
VALUES
('lisi', '222222', 23),
('wangwu', '333333', 26)
ON DUPLICATE KEY UPDATE password = VALUES(password), age = VALUES(age);

-- 补充：MySQL 8.0.19+ 推荐新语法（使用别名 new 避免 VALUES() 废弃警告）：
-- INSERT INTO user (username, password, age)
-- VALUES ('lisi', '222222', 23) AS new
-- ON DUPLICATE KEY UPDATE password = new.password, age = new.age;
```

```sql
-- 1. 基础查询
SELECT id, username, age FROM user; -- 查询指定字段
SELECT * FROM user; -- 查询所有字段（生产环境慎用，性能差）

-- 2. 条件查询（WHERE）
SELECT * FROM user WHERE age > 20; -- 年龄大于20
SELECT * FROM user WHERE username = 'zhangsan' AND age = 20; -- 多条件且
SELECT * FROM user WHERE age BETWEEN 20 AND 25; -- 年龄在20-25之间
SELECT * FROM user WHERE username LIKE 'zhang%'; -- 模糊查询（以zhang开头）

-- 3. 排序（ORDER BY）
SELECT * FROM user ORDER BY age DESC; -- 按年龄降序（ASC 升序，默认）

-- 4. 分页（LIMIT，核心用于列表分页）
SELECT * FROM user ORDER BY id DESC LIMIT 0, 10; -- 第1页，每页10条（0是偏移量）
SELECT * FROM user ORDER BY id DESC LIMIT 10 OFFSET 10; -- 第2页（偏移量10）

-- 5. 去重（DISTINCT）
SELECT DISTINCT age FROM user; -- 去重后的年龄

-- 6. 聚合查询
SELECT
  COUNT(*) AS total, -- 总条数
  AVG(age) AS avg_age, -- 平均年龄
  MAX(age) AS max_age, -- 最大年龄
  MIN(age) AS min_age -- 最小年龄
FROM user;

-- 7. 分组查询（GROUP BY）
SELECT age, COUNT(*) AS num FROM user GROUP BY age; -- 按年龄分组统计人数
```

```sql
-- 基础更新（务必加 WHERE，否则更新全表！）
UPDATE user SET password = '888888' WHERE username = 'zhangsan';

-- 多字段更新
UPDATE user SET age = 21, phone = '13800138000' WHERE id = 1;

-- 安全更新（避免全表更新，建议开启）
SET sql_safe_updates = 1; -- 无 WHERE 或 LIMIT 时拒绝更新
```

```sql
-- 条件删除（务必加 WHERE）
DELETE FROM user WHERE id = 3;

-- 清空表（自增主键重置）
TRUNCATE TABLE user; -- 比 DELETE * 高效，不可回滚
```

### 1.5 MySQL 数据类型（核心常用）

MySQL 数据类型决定了字段存储的数据类型、占用空间及运算规则，合理选择可节省空间、提升性能，以下是开发中最常用的分类及类型详解。

#### 1.5.1 数值类型（存储数字）

分为整数和小数，优先选择匹配数据范围的最小类型，避免浪费空间。

```sql
-- 常用数值类型及示例
-- 整数类型（最常用）
TINYINT      -- 1字节，范围：-128~127（无符号：0~255），适合存储年龄、状态（0/1）
INT          -- 4字节，范围：-2147483648~2147483647（无符号：0~4294967295），适合存储ID、数量
BIGINT       -- 8字节，范围极大，适合存储大数据量数字（如订单号、时间戳）

-- 小数类型（常用）
DECIMAL(M,D) -- 定点数，M表示总位数，D表示小数位数（如DECIMAL(10,2)适合存储金额）
FLOAT        -- 4字节，单精度浮点数，适合非精确小数（如温度）
DOUBLE       -- 8字节，双精度浮点数，精度高于FLOAT

-- 示例（表字段定义）
age TINYINT UNSIGNED DEFAULT 0 COMMENT '年龄（无符号，0~255足够）',
id INT UNSIGNED AUTO_INCREMENT COMMENT '用户ID',
balance DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '账户余额',
temperature FLOAT DEFAULT 0.0 COMMENT '体温'
```

#### 1.5.2 字符串类型（存储文本）

核心区分“固定长度”和“可变长度”，优先使用可变长度类型节省空间。

```sql
-- 常用字符串类型及示例
-- 可变长度（推荐使用）
VARCHAR(M)   -- 长度0~65535，仅占用实际存储长度+1字节，适合存储用户名、手机号（长度不固定）
TEXT         -- 长度0~65535，适合存储长文本（如备注、简介），超过则用MEDIUMTEXT/LONGTEXT

-- 固定长度（特殊场景使用）
CHAR(M)      -- 长度1~255，固定占用M字节，适合存储长度固定的内容（如身份证号、手机号固定11位）

-- 示例（表字段定义）
username VARCHAR(50) NOT NULL COMMENT '用户名（最长50位）',
phone CHAR(11) DEFAULT '' COMMENT '手机号（固定11位）',
remark TEXT COMMENT '用户备注（长文本）',
avatar VARCHAR(255) DEFAULT '' COMMENT '头像地址'
```

#### 1.5.3 日期时间类型（存储时间）

根据精度需求选择，避免使用字符串存储时间（无法直接做时间运算）。

```sql
-- 常用日期时间类型及示例
-- 日期时间类型核心补充：CURRENT_TIMESTAMP（高频实用）
DATETIME     -- 8字节，范围：1000-01-01 00:00:00 ~ 9999-12-31 23:59:59，适合存储具体时间（如创建时间）
DATE         -- 3字节，仅存储日期（如2024-01-01），适合存储生日、注册日期
TIME         -- 3字节，仅存储时间（如12:30:00），适合存储时长、具体时刻
TIMESTAMP    -- 4字节，范围：1970-01-01 00:00:01 ~ 2038-01-19 03:14:07，会随时区自动调整
CURRENT_TIMESTAMP -- 非独立数据类型，是「当前日期时间」的快捷值，等价于 NOW()，常用作字段默认值

-- 核心用法1：作为字段默认值（最常用，自动填充当前时间）
-- 示例（表字段定义，贴合前文user表）
create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间（插入时自动填充当前时间，不随更新变化）',
update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间（插入/更新时均自动填充当前时间）',

-- 核心用法2：直接调用，获取当前日期时间（等价于 NOW()）
-- 单独调用
SELECT CURRENT_TIMESTAMP; -- 结果：2024-01-01 12:00:00（日期+时间）
-- 插入/更新时直接使用
INSERT INTO user (username, password, create_time)
VALUES ('zhaoliu', '111222', CURRENT_TIMESTAMP); -- 手动指定当前时间插入
```

#### 1.5.4 其他常用类型

```sql
-- 其他常用类型及示例
BOOLEAN      -- 等价于TINYINT(1)，0表示false，1表示true，适合存储状态（如是否启用）
ENUM         -- 枚举类型，只能从指定值中选择一个，适合存储固定选项（如性别、订单状态）
JSON         -- (MySQL 5.7+) 适合存储JSON对象或数组，自动校验格式

-- 示例（表字段定义）
is_enable BOOLEAN DEFAULT 1 COMMENT '是否启用（1=启用，0=禁用）',
gender ENUM('male','female','other') DEFAULT 'other' COMMENT '性别',
extra_info JSON COMMENT '扩展信息（如 {"wechat": "zs123"}）',
order_status ENUM('pending','paid','shipped','completed') DEFAULT 'pending' COMMENT '订单状态'
```

核心原则：**按需选择，最小够用**，例如“年龄”用TINYINT而非INT，“手机号”用CHAR(11)而非VARCHAR(11)，避免资源浪费。

### 1.6 条件与运算符

| 类型       | 运算符                  | 示例                             |
| ---------- | ----------------------- | -------------------------------- |
| 比较运算符 | =, >, <, >=, <=, !=, <> | `age != 20`                      |
| 逻辑运算符 | AND, OR, NOT            | `age > 20 AND username = 'lisi'` |
| 范围运算符 | IN, NOT IN              | `age IN (20,22,25)`              |
| 模糊匹配   | LIKE                    | `username LIKE '%zhang%'`        |
| 空值判断   | IS NULL, IS NOT NULL    | `phone IS NULL`                  |

## 二、MySQL 进阶应用

### 2.1 索引（性能优化核心）

#### 2.1.1 索引类型

- **主键索引**：主键默认创建，唯一且非空；

- **唯一索引**：值唯一，可包含 NULL；

- **普通索引**：无唯一性约束；

- **联合索引**：多个字段组合的索引（遵循最左前缀原则）。

#### 2.1.2 索引操作

```sql
-- 1. 创建普通索引
CREATE INDEX idx_age ON user(age);

-- 2. 创建联合索引
CREATE INDEX idx_username_age ON user(username, age);

-- 3. 查看索引
SHOW INDEX FROM user;

-- 4. 删除索引
DROP INDEX idx_age ON user;
```

#### 2.1.3 索引使用原则

- 优先给 **查询条件（WHERE）、排序（ORDER BY）、分组（GROUP BY）** 的字段加索引；

- 避免给频繁更新的字段加索引；

- 联合索引遵循 **最左前缀**，如 `idx_username_age` 支持 `username`、`username+age`，不支持单独 `age`；

- 小表无需加索引（查询全表更快）。

### 2.2 事务（ACID 特性）

#### 2.2.1 事务基础

- **原子性（A）**：要么全执行，要么全回滚；

- **一致性（C）**：事务前后数据状态一致；

- **隔离性（I）**：多事务互不干扰；

- **持久性（D）**：提交后数据永久保存。

#### 2.2.2 事务操作

```sql
-- 开启事务
START TRANSACTION;

-- 执行操作（示例：转账）
UPDATE account SET balance = balance - 100 WHERE id = 1;
UPDATE account SET balance = balance + 100 WHERE id = 2;

-- 提交事务（确认执行）
COMMIT;

-- 回滚（出错时撤销操作）
-- ROLLBACK;
```

#### 2.2.3 事务隔离级别

```sql
-- 查看当前隔离级别
SELECT @@transaction_isolation;

-- 设置隔离级别（示例：读已提交，主流）
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

隔离级别（从低到高）：

1. 读未提交（READ UNCOMMITTED）：可能读取未提交数据（脏读）；

2. 读已提交（READ COMMITTED）：避免脏读，可能不可重复读；

3. 可重复读（REPEATABLE READ）：MySQL 默认，避免脏读、不可重复读，可能幻读；

4. 串行化（SERIALIZABLE）：完全隔离，性能最差，无并发问题。

### 2.3 多表关联查询

#### 2.3.1 关联类型

- **INNER JOIN**：内连接，只返回匹配的记录；

- **LEFT JOIN**：左连接，返回左表所有记录 + 右表匹配记录；

- **RIGHT JOIN**：右连接，返回右表所有记录 + 左表匹配记录。

#### 2.3.2 示例（用户表 + 订单表）

```sql
-- 先创建订单表
CREATE TABLE `order` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '订单金额',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 左连接：查询所有用户及其订单（无订单的用户也显示）
SELECT u.username, o.id AS order_id, o.amount
FROM user u
LEFT JOIN `order` o ON u.id = o.user_id
ORDER BY u.id;

-- 内连接：查询有订单的用户及其订单
SELECT u.username, o.id AS order_id, o.amount
FROM user u
INNER JOIN `order` o ON u.id = o.user_id;
```

### 2.4 视图（虚拟表）

```sql
-- 创建视图（示例：用户订单视图）
CREATE VIEW v_user_order AS
SELECT u.id, u.username, o.amount, o.create_time
FROM user u
LEFT JOIN `order` o ON u.id = o.user_id;

-- 使用视图（和普通表一样查询）
SELECT * FROM v_user_order WHERE amount > 100;

-- 删除视图
DROP VIEW IF EXISTS v_user_order;
```

**使用场景**：简化复杂查询、权限控制（只暴露视图字段）。

## 三、MySQL 高级优化

### 3.1 执行计划（EXPLAIN）

通过 `EXPLAIN` 分析 SQL 执行效率，定位性能问题：

```sql
EXPLAIN SELECT * FROM user WHERE age > 20;
```

核心字段说明：

- `type`：访问类型（ALL 全表扫描 < range 范围 < ref 索引扫描 < eq_ref 主键扫描 < const/system，越靠右性能越好）；

- `key`：实际使用的索引（NULL 表示未使用索引）；

- `rows`：预估扫描行数（越少越好）；

- `Extra`：额外信息（如 `Using filesort` 排序性能差、`Using temporary` 临时表性能差）。

### 3.2 慢查询日志

#### 3.2.1 开启慢查询日志

```sql
-- 临时开启（重启失效）
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1; -- 执行时间超过1秒的记录为慢查询
SET GLOBAL slow_query_log_file = '/var/lib/mysql/slow.log'; -- 日志路径

-- 查看慢查询配置
SHOW VARIABLES LIKE '%slow_query%';
SHOW VARIABLES LIKE 'long_query_time';
```

#### 3.2.2 分析慢查询

使用`mysqldumpslow` 工具分析：

```Bash
# 查看最慢的10条SQL
mysqldumpslow -s t -t 10 /var/lib/mysql/slow.log
```

### 3.3 常用优化技巧

1. **避免 SELECT \*\*\***：只查询需要的字段，减少IO；

2. **合理使用索引**：避免在索引字段做函数运算（如 `DATE(create_time) = '2024-01-01'`）；

3. **分页优化**：大数据量分页用 `WHERE id > 上一页最大ID LIMIT 10` 替代 `LIMIT 10000, 10`；

4. **批量操作**：批量插入/更新代替单条循环，减少交互次数；

5. **避免大事务**：大事务会锁表时间长，影响并发；

6. **使用 VARCHAR 代替 CHAR**：CHAR 固定长度，VARCHAR 可变长度，节省空间。

## 四、常用函数

### 4.1 字符串函数

```sql
-- 字符串函数（补充高频遗漏）
SELECT LENGTH('abc'); -- 长度（3，统计字节数）
SELECT CHAR_LENGTH('abc'); -- 字符数（3，区分字节数，适合多字节字符）
SELECT CONCAT('a', 'b', 'c'); -- 拼接（abc）
SELECT CONCAT_WS('-', '2024', '01', '01'); -- 带分隔符拼接（2024-01-01，避免NULL影响）
SELECT SUBSTRING('abcdef', 2, 3); -- 截取（bcd，从第2位开始，取3位）
SELECT SUBSTRING_INDEX('a.b.c.d', '.', 2); -- 按分隔符截取（a.b，取前2个分隔符左侧内容）
SELECT TRIM('  abc  '); -- 去前后空格（abc）
SELECT LTRIM('  abc  '); -- 去左侧空格
SELECT RTRIM('  abc  '); -- 去右侧空格
SELECT UPPER('abc'); -- 转大写（ABC）
SELECT LOWER('ABC'); -- 转小写（abc）
SELECT REPLACE('abcabc', 'a', 'x'); -- 替换（xbcxbc，将所有a替换为x）
```

### 4.2 数值函数

```sql
-- 数值函数（补充高频遗漏）
SELECT ABS(-10); -- 绝对值（10）
SELECT ROUND(3.1415, 2); -- 四舍五入（3.14，保留2位小数）
SELECT ROUND(3.5); -- 四舍五入（4，默认保留0位）
SELECT CEIL(3.1); -- 向上取整（4）
SELECT FLOOR(3.9); -- 向下取整（3）
SELECT MOD(10, 3); -- 取余（1，10除以3的余数）
SELECT RAND(); -- 随机数（0~1之间的小数）
SELECT RAND(100); -- 固定种子的随机数（每次执行结果一致，便于测试）
SELECT TRUNCATE(3.1415, 2); -- 截断小数（3.14，不四舍五入）
```

### 4.3 日期函数

```sql
-- 日期函数（补充高频遗漏，新增CURRENT_TIMESTAMP对比）
SELECT NOW(); -- 当前时间（2024-01-01 12:00:00，日期+时间）
SELECT CURRENT_TIMESTAMP; -- 等价于NOW()，获取当前日期时间（最常用快捷方式）
SELECT CURDATE(); -- 当前日期（2024-01-01，等价于DATE(NOW())）
SELECT CURTIME(); -- 当前时间（12:00:00，仅时间）
SELECT DATE(NOW()); -- 当前日期（2024-01-01）
SELECT DATE_ADD(NOW(), INTERVAL 1 DAY); -- 加1天（可替换DAY为HOUR/MONTH/YEAR）
SELECT DATE_ADD(NOW(), INTERVAL -1 HOUR); -- 减1小时
SELECT DATE_SUB(NOW(), INTERVAL 1 MONTH); -- 减1个月（等价于DATE_ADD负数）
SELECT DATEDIFF('2024-01-02', '2024-01-01'); -- 日期差（1，前者减后者，仅日期）
SELECT TIMESTAMPDIFF(DAY, '2024-01-01', '2024-01-05'); -- 精准日期差（4，指定单位）
SELECT TIMESTAMPDIFF(YEAR, '2000-01-01', NOW()); -- 计算年龄（当前年份-出生年份，精准）
SELECT DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'); -- 日期格式化（自定义格式，常用）
SELECT STR_TO_DATE('2024-01-01', '%Y-%m-%d'); -- 字符串转日期（将文本转为DATE类型）
-- 补充：CURRENT_TIMESTAMP 与 NOW() 区别（无本质差异，用法一致）
SELECT CURRENT_TIMESTAMP = NOW(); -- 结果：1（TRUE，值完全相同）
-- 细微区别：CURRENT_TIMESTAMP 可省略括号（SELECT CURRENT_TIMESTAMP;），NOW() 需加括号
```

```sql
-- 补充：聚合函数（高频，贴合前文聚合查询场景）
SELECT COUNT(*) AS total; -- 统计总条数（包含NULL值）
SELECT COUNT(username) AS user_count; -- 统计非NULL字段条数（排除NULL）
SELECT SUM(age) AS sum_age; -- 求和（适用于数值字段，如金额、数量）
SELECT AVG(age) AS avg_age; -- 平均值（自动排除NULL）
SELECT MAX(age) AS max_age; -- 最大值
SELECT MIN(age) AS min_age; -- 最小值

-- 补充：其他高频函数（入门必备）
SELECT IF(age > 18, '成年', '未成年') AS age_type; -- 条件判断（简单二选一）
SELECT IFNULL(phone, '未填写') AS phone; -- 处理NULL值（将NULL替换为指定内容）
SELECT NULLIF(10, 10); -- 比较函数（两值相等返回NULL，否则返回第一个值）
```
