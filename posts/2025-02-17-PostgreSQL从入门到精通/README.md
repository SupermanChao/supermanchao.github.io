# PostgreSQL从入门到精通

> 📅 发布时间：2025-02-17
>
> 🏷️ 标签：`PostgreSQL` `Database` `SQL`
>
> ⏱️ 阅读时长：约 30 分钟

本文专注于PostgreSQL（简称PgSQL）的实操用法，从基础SQL操作到高级特性（索引、事务、存储过程等）逐步递进，适合已完成安装、希望快速上手并精通PgSQL的开发者。

## 第一章：PgSQL基础操作（入门必备）

### 1.1 连接PgSQL数据库

安装完成后，通过命令行或可视化工具（如Navicat、DBeaver）连接数据库，核心命令行连接方式：

```bash
# 基本连接（默认端口5432）
psql -U 用户名 -d 数据库名 -h 主机地址 -p 端口号

# 示例（本地连接，用户postgres，数据库postgres）
psql -U postgres -d postgres
```

连接成功后，输入密码即可进入PgSQL交互终端，终端提示符为 `postgres=#`（超级用户）或`test=>`（普通用户）。

### 1.2 数据库核心操作（DDL语句）

DDL（数据定义语言）用于创建、修改、删除数据库对象（数据库、表、视图等），核心语法如下：

#### 1.2.1 数据库操作

```sql
-- 1. 创建数据库（指定编码为UTF-8，避免中文乱码）
CREATE DATABASE test_db WITH ENCODING 'UTF8' LC_COLLATE 'zh_CN.UTF-8' LC_CTYPE 'zh_CN.UTF-8';

-- 2. 查看所有数据库
\l  -- 命令行快捷方式（md格式中保留实操命令）
-- 或SQL语句
SELECT datname FROM pg_database;

-- 3. 切换数据库
\c test_db  -- 快捷方式
-- 或SQL语句（需重新连接，不如快捷方式便捷）
\connect test_db;

-- 4. 删除数据库（谨慎操作，不可恢复）
DROP DATABASE IF EXISTS test_db;
```

#### 1.2.2 Schema操作（数据库对象的命名空间）

Schema（模式）是PgSQL中用于组织数据库对象的命名空间，可理解为“数据库中的文件夹”，用于隔离不同的表、视图、索引等对象（避免同名冲突），默认每个数据库会自动创建一个`public`模式（前文操作的表均默认在public模式下）。核心实操语法如下：

```sql
-- 1. 创建Schema（示例：创建用于存储用户相关对象的schema）
CREATE SCHEMA IF NOT EXISTS user_schema;
-- 创建Schema并指定所属用户（可选，限制只有指定用户能操作该Schema）
CREATE SCHEMA IF NOT EXISTS admin_schema AUTHORIZATION postgres;

-- 2. 查看当前数据库的所有Schema
\dn  -- 命令行快捷方式（常用）
-- 或SQL语句
SELECT nspname FROM pg_namespace;

-- 3. 切换Schema（后续操作默认在切换后的Schema下执行）
SET search_path TO user_schema;  -- 切换到user_schema
-- 查看当前默认Schema
SELECT current_schema();

-- 4. 在指定Schema下创建表（无需切换，直接指定Schema）
CREATE TABLE IF NOT EXISTS user_schema.user_info (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL
);

-- 5. 查看指定Schema下的表（两种方式）
-- 方式1：指定Schema.表名
SELECT * FROM user_schema.user_info;
-- 方式2：切换到对应Schema后查看
SET search_path TO user_schema;
\dt  -- 此时查看的是user_schema下的表

-- 6. 修改Schema（重命名，谨慎操作）
ALTER SCHEMA admin_schema RENAME TO manage_schema;

-- 7. 删除Schema（谨慎操作，分两种情况）
-- 情况1：删除空Schema（无任何数据库对象）
DROP SCHEMA IF EXISTS admin_schema;
-- 情况2：删除Schema及旗下所有对象（级联删除，不可恢复）
DROP SCHEMA IF EXISTS user_schema CASCADE;

-- 补充：恢复默认Schema（切换回public）
SET search_path TO public;
```

Schema使用注意事项：1. 同一Schema下不能有同名对象（如表、视图），但不同Schema下可创建同名对象；2. 普通用户需拥有Schema的权限（如创建、查询）才能操作，超级用户（postgres）默认拥有所有权限；3. 实际开发中，可按业务模块划分Schema（如user_schema、order_schema），提升数据库对象的可读性和可维护性。

#### 1.2.3 数据表操作

PgSQL支持多种数据类型（常用：int4/int8、varchar、text、date、timestamp、boolean等），核心表操作语法如下（索引操作详见第二章独立章节）：

```sql
-- 1. 创建表（示例：用户表user_info，默认在public模式下）
CREATE TABLE IF NOT EXISTS user_info (
    id SERIAL PRIMARY KEY,  -- SERIAL：自增主键（等价于MySQL的AUTO_INCREMENT）
    username VARCHAR(50) NOT NULL UNIQUE,  -- 用户名：非空、唯一
    password VARCHAR(100) NOT NULL,  -- 密码：非空（实际开发需加密）
    age INT4 CHECK (age > 0 AND age < 150),  -- 年龄：范围校验
    gender VARCHAR(10) DEFAULT '未知',  -- 性别：默认值
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 创建时间：默认当前时间
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 查看当前数据库所有表
\dt  -- 快捷方式（默认查看当前Schema下的表，即public）
-- 或SQL语句（查看public模式下的表）
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- 3. 查看表结构
\d user_info  -- 快捷方式（可查看表结构，索引需单独查看，详见第二章）
-- 或SQL语句（查看表字段）
SELECT * FROM information_schema.columns WHERE table_name = 'user_info' AND table_schema = 'public';

-- 4. 修改表结构（添加、修改、删除字段）
-- 添加字段
ALTER TABLE user_info ADD COLUMN email VARCHAR(100) UNIQUE;
-- 修改字段类型（注意：若字段有数据，需确保类型兼容；若字段有关联索引，需先删除索引再修改，详见第二章）
ALTER TABLE user_info ALTER COLUMN age TYPE INT8;
-- 删除字段（谨慎操作；若字段有关联索引，需先删除索引再删除字段，详见第二章）
ALTER TABLE user_info DROP COLUMN IF EXISTS email;

-- 5. 删除表（谨慎操作，删除表时会自动删除表关联的所有索引）
DROP TABLE IF EXISTS user_info;
```

### 1.3 数据操作（DML语句）

DML用于新增、修改、删除、查询数据，以下仅保留核心语法和高频示例，可直接复制实操：

#### 1.3.1 新增数据（INSERT）

```sql
-- 简化插入（常用，默认插入到public模式的user_info）
INSERT INTO user_info (username, password, age) VALUES ('lisi', '654321', 28);
-- 批量插入（高效推荐）
INSERT INTO user_info (username, password, age, gender)
VALUES ('wangwu', '111222', 22, '男'), ('zhaoliu', '222333', 30, '女');
-- PgSQL特色：插入并返回数据
INSERT INTO user_info (username, password, age) VALUES ('qianqi', '333444', 26)
RETURNING id, username, create_time;
```

#### 1.3.2 查询数据（SELECT）

```sql
-- 基础查询（合理创建索引可优化查询速度，详见第二章）
SELECT id, username, age FROM user_info; -- 推荐指定字段，不使用*
-- 条件+排序+分页（高频组合，索引可显著提升此类查询效率）
SELECT * FROM user_info WHERE gender = '男' ORDER BY age DESC LIMIT 2 OFFSET 2;
-- 聚合查询（常用）
SELECT COUNT(*) AS total, AVG(age) AS avg_age FROM user_info;
```

#### 1.3.3 修改数据（UPDATE）

```sql
-- 核心：必加WHERE，避免修改全表
UPDATE user_info SET password = 'abc123', update_time = CURRENT_TIMESTAMP WHERE id = 1;
-- 特色：修改并返回数据
UPDATE user_info SET age = age + 1 WHERE id = 2 RETURNING id, username, age;
```

#### 1.3.4 删除数据（DELETE）

```sql
-- 核心：必加WHERE，谨慎操作
DELETE FROM user_info WHERE id = 5;
-- 特色：删除并返回数据
DELETE FROM user_info WHERE username = 'qianqi' RETURNING id, username;
-- 清空表（保留结构，不可回滚；会自动删除表关联索引）
TRUNCATE TABLE user_info; -- 表有外键时不可用
```

### 1.4 条件控制与函数（基础拓展）

#### 1.4.1 CASE WHEN 条件判断

```sql
-- 示例：根据年龄分组，返回年龄阶段
SELECT 
    id,
    username,
    age,
    CASE 
        WHEN age < 18 THEN '未成年'
        WHEN age BETWEEN 18 AND 30 THEN '青年'
        WHEN age BETWEEN 31 AND 50 THEN '中年'
        ELSE '老年'
    END AS age_stage
FROM user_info;
```

#### 1.4.2 常用系统函数

```sql
-- 字符串函数
SELECT CHAR_LENGTH(username) AS name_len FROM user_info;  -- 字符串长度
SELECT CONCAT(username, '_', age) AS user_age FROM user_info;  -- 字符串拼接
SELECT REPLACE(password, '123', '***') AS hide_pwd FROM user_info;  -- 字符串替换

-- 时间函数
SELECT NOW();  -- 获取当前时间（timestamp类型）
SELECT CURRENT_DATE;  -- 获取当前日期（date类型）
SELECT EXTRACT(YEAR FROM create_time) AS create_year FROM user_info;  -- 提取年份
SELECT TO_CHAR(create_time, 'YYYY-MM-DD HH24:MI:SS') AS create_time_str FROM user_info;  -- 时间格式化

-- 数值函数
SELECT ROUND(AVG(age), 1) AS avg_age_round FROM user_info;  -- 四舍五入（保留1位小数）
SELECT ABS(-100) AS abs_num;  -- 绝对值
```

## 第二章：PgSQL进阶特性（提升效率）

### 2.1 事务（保证数据一致性）

事务是一组不可分割的SQL操作，要么全部执行成功，要么全部执行失败（ACID特性：原子性、一致性、隔离性、持久性），PgSQL默认自动提交事务，手动事务需用BEGIN/COMMIT/ROLLBACK控制。

```sql
-- 手动开启事务
BEGIN;

-- 执行一系列SQL操作（示例：转账场景，张三给李四转100）
-- 1. 张三余额减100
UPDATE account SET balance = balance - 100 WHERE username = 'zhangsan';
-- 2. 李四余额加100
UPDATE account SET balance = balance + 100 WHERE username = 'lisi';

-- 检查操作是否正确，若正确，提交事务（数据永久生效）
COMMIT;

-- 若操作错误，回滚事务（恢复到事务开启前的状态）
-- ROLLBACK;
```

#### 2.1.1 事务隔离级别（PgSQL默认级别：READ COMMITTED）

事务隔离级别用于解决并发事务中的问题（脏读、不可重复读、幻读），PgSQL支持4种隔离级别，核心设置方式：

```sql
-- 查看当前隔离级别
SELECT current_setting('transaction_isolation');

-- 开启事务时指定隔离级别（示例：REPEATABLE READ）
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
```

### 2.2 索引（查询优化核心）

索引是PgSQL中提升查询效率的核心工具，本质是对表中特定字段构建的“快速查询目录”，可大幅减少查询时的扫描行数。索引不存储实际数据，仅存储字段值和对应数据的物理地址，适合用于查询频繁、过滤性强的字段，以下是完整实操语法和使用规范。

#### 2.2.1 索引核心类型（按使用场景分类）

PgSQL支持多种索引类型，其中B-tree索引最常用，不同类型适配不同查询场景，核心类型及用法如下：

```sql
-- 1. 普通索引（B-tree类型，默认，最常用）
-- 适配场景：单字段查询、排序、范围查询（如=、>、<、BETWEEN）
-- 示例：为user_info表的username字段创建普通索引（查询用户名时提速）
CREATE INDEX idx_user_info_username ON user_info(username);

-- 2. 唯一索引（B-tree类型，兼具唯一约束和索引功能）
-- 适配场景：字段值唯一且需频繁查询（等价于UNIQUE约束+普通索引）
-- 示例：为user_info表的email字段创建唯一索引（避免重复且提速查询）
CREATE UNIQUE INDEX idx_user_info_email ON user_info(email);

-- 3. 联合索引（多字段组合索引，遵循“最左前缀匹配”原则）
-- 适配场景：多字段组合查询（如WHERE gender = '男' AND age > 20）
-- 示例：为user_info表的gender和age字段创建联合索引
CREATE INDEX idx_user_info_gender_age ON user_info(gender, age);

-- 4. 补充：Hash索引（仅适配等值查询，不支持排序、范围查询，使用率低）
-- 示例：为user_info表的password字段创建Hash索引（仅用于WHERE password = 'xxx'查询）
CREATE INDEX idx_user_info_password ON user_info USING HASH(password);
```

#### 2.2.2 索引核心操作（创建、查看、删除）

```sql
-- 一、创建索引（核心语法，通用格式）
-- CREATE [索引类型] INDEX 索引名 ON 表名(字段名1, 字段名2...);
-- 示例：为order_info表的order_no字段创建普通索引
CREATE INDEX idx_order_info_order_no ON order_info(order_no);

-- 二、查看索引（3种常用方式，按需选择）
-- 1. 查看当前数据库所有索引（快捷方式）
\di
-- 2. 查看指定表的所有索引（最常用，快捷方式）
\di user_info*
-- 3. 查看指定表的索引详情（SQL语句，可查看索引类型、关联字段）
SELECT 
    indexname AS 索引名,
    indexdef AS 索引定义
FROM pg_indexes 
WHERE tablename = 'user_info' AND schemaname = 'public'; -- 指定表名和Schema

-- 三、删除索引（谨慎操作，删除后不影响表数据，仅删除索引目录）
-- 核心语法：DROP INDEX IF EXISTS 索引名;
-- 示例1：删除普通索引
DROP INDEX IF EXISTS idx_user_info_username;
-- 示例2：删除联合索引
DROP INDEX IF EXISTS idx_user_info_gender_age;
-- 示例3：删除指定Schema下的索引（若索引不在public模式）
DROP INDEX IF EXISTS user_schema.idx_user_info_email;
```

#### 2.2.3 索引使用注意事项（避坑关键）

1. 索引不是越多越好：插入、修改、删除数据时，PgSQL会同步维护所有关联索引，索引过多会导致写操作（INSERT/UPDATE/DELETE）效率大幅下降，建议单表索引不超过5个。

2. 合理选择索引字段：适合创建索引的场景——主键、外键、唯一约束字段、查询频繁的字段（如username、order_no）；不适合创建索引的场景——字段值重复率高（如gender，重复率>30%）、数据量小的表（<1万条）、频繁修改的字段。

3. 联合索引遵循“最左前缀匹配”：如idx_user_info_gender_age（gender, age），仅对“gender”“gender+age”查询生效，对单独“age”查询不生效，创建时需按查询频率排序字段。

4. 避免索引失效：WHERE子句中对索引字段使用函数（如TO_CHAR(create_time, 'YYYY') = '2024'）、使用不等于（!=、<>）、模糊查询前缀通配符（如LIKE '%lisi'），会导致索引失效，查询退化为全表扫描。

5. 索引与表的关联：删除表时，会自动删除表关联的所有索引；修改/删除表字段时，若字段有关联索引，需先删除索引再执行修改/删除操作。

### 2.3 约束（保证数据完整性）

约束用于限制表中数据的规则，除了入门阶段的PRIMARY KEY、UNIQUE、NOT NULL、CHECK，重点补充外键约束：

```sql
-- 示例：创建订单表order_info，外键关联用户表user_info的id
-- 1. 先创建主表（已存在user_info）
-- 2. 创建从表（订单表），添加外键
CREATE TABLE IF NOT EXISTS order_info (
    order_id SERIAL PRIMARY KEY,
    user_id INT4 NOT NULL,
    order_no VARCHAR(50) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 外键约束：user_id关联user_info的id
    CONSTRAINT fk_order_info_user_id FOREIGN KEY (user_id)
    REFERENCES user_info(id)
    ON DELETE CASCADE  -- 级联删除：主表数据删除，从表关联数据也删除
    ON UPDATE CASCADE  -- 级联更新：主表主键更新，从表关联字段也更新
);

-- 注意：外键字段的类型必须与主表主键字段类型一致
--  删除外键约束
ALTER TABLE order_info DROP CONSTRAINT IF EXISTS fk_order_info_user_id;
```

### 2.4 视图（简化复杂查询）

视图是虚拟表，基于SQL查询结果创建，不存储实际数据，仅保存查询逻辑，适合简化复杂查询、控制数据访问权限。视图查询时会复用底层表的索引，提升查询效率。

```sql
-- 1. 创建视图（示例：查询用户及其订单信息）
CREATE VIEW v_user_order AS
SELECT 
    u.id AS user_id,
    u.username,
    o.order_id,
    o.order_no,
    o.amount,
    o.create_time AS order_create_time
FROM user_info u
LEFT JOIN order_info o ON u.id = o.user_id;

-- 2. 查询视图（和查询普通表一样，复用底层表索引）
SELECT * FROM v_user_order WHERE user_id = 1;

-- 3. 修改视图（修改查询逻辑）
CREATE OR REPLACE VIEW v_user_order AS
SELECT 
    u.id AS user_id,
    u.username,
    u.age,
    o.order_id,
    o.order_no,
    o.amount
FROM user_info u
LEFT JOIN order_info o ON u.id = o.user_id;

-- 4. 删除视图
DROP VIEW IF EXISTS v_user_order;
```

## 第三章：PgSQL高级特性（精通必备）

### 3.1 存储过程与函数（封装复杂逻辑）

PgSQL支持存储过程（PROCEDURE）和函数（FUNCTION），用于封装重复的复杂SQL逻辑，提升代码复用性和维护性，两者核心区别：函数有返回值，存储过程无返回值（可执行批量操作）。

#### 3.1.1 函数（FUNCTION）

```sql
-- 示例：创建函数，根据用户id查询用户名
CREATE OR REPLACE FUNCTION get_username_by_id(p_user_id INT4)
RETURNS VARCHAR(50)  -- 返回值类型
LANGUAGE plpgsql  -- 语言（plpgsql是PgSQL的内置过程语言）
AS $$
DECLARE
    v_username VARCHAR(50);  -- 声明变量
BEGIN
    SELECT username INTO v_username FROM user_info WHERE id = p_user_id;
    RETURN v_username;  -- 返回结果
END;
$$;

-- 调用函数
SELECT get_username_by_id(1);  -- 输出：zhangsan

-- 删除函数
DROP FUNCTION IF EXISTS get_username_by_id(INT4);
```

#### 3.1.2 存储过程（PROCEDURE）

```sql
-- 示例：创建存储过程，批量更新用户年龄（所有用户年龄加1）
CREATE OR REPLACE PROCEDURE batch_update_user_age()
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE user_info SET age = age + 1;
    RAISE NOTICE '批量更新完成，更新条数：%', FOUND;  -- 打印提示信息
END;
$$;

-- 调用存储过程
CALL batch_update_user_age();

-- 删除存储过程
DROP PROCEDURE IF EXISTS batch_update_user_age();
```

### 3.2 触发器（自动执行逻辑）

触发器是一种特殊的存储程序，当表发生INSERT、UPDATE、DELETE操作时，自动触发执行，适合实现数据审计、自动更新字段等场景。

```sql
-- 示例：创建触发器，自动更新user_info的update_time字段
-- 1. 先创建触发器函数（触发器必须依赖函数）
CREATE OR REPLACE FUNCTION update_user_time()
RETURNS TRIGGER  -- 返回值类型为TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.update_time = CURRENT_TIMESTAMP;  -- NEW表示更新后的记录
    RETURN NEW;
END;
$$;

-- 2. 创建触发器
CREATE TRIGGER trig_user_info_update_time
BEFORE UPDATE ON user_info  -- BEFORE：更新前触发
FOR EACH ROW  -- 行级触发器：每更新一行，触发一次
EXECUTE FUNCTION update_user_time();

-- 测试触发器：修改用户数据，查看update_time是否自动更新
UPDATE user_info SET password = 'test123' WHERE id = 1;
SELECT id, update_time FROM user_info WHERE id = 1;

-- 删除触发器
DROP TRIGGER IF EXISTS trig_user_info_update_time ON user_info;
-- 删除触发器函数
DROP FUNCTION IF EXISTS update_user_time();
```

### 3.3 分区表（处理大数据量）

当表中数据量达到百万、千万级时，查询效率会显著下降，分区表可将大表拆分为多个小表（分区），提升查询和维护效率，PgSQL支持多种分区方式，重点掌握范围分区（按时间分区最常用）。分区表可结合索引使用，进一步提升查询性能。

```sql
-- 示例：创建订单分区表（按create_time的年份分区）
-- 1. 创建主分区表（不存储实际数据，仅定义结构）
CREATE TABLE IF NOT EXISTS order_partition (
    order_id SERIAL,
    user_id INT4 NOT NULL,
    order_no VARCHAR(50) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    create_time TIMESTAMP NOT NULL
) PARTITION BY RANGE (create_time);  -- 按create_time范围分区

-- 2. 创建分区（2024年分区、2025年分区）
-- 2024年分区（create_time在2024-01-01到2025-01-01之间）
CREATE TABLE order_partition_2024
PARTITION OF order_partition
FOR VALUES FROM ('2024-01-01 00:00:00') TO ('2025-01-01 00:00:00');

-- 2025年分区
CREATE TABLE order_partition_2025
PARTITION OF order_partition
FOR VALUES FROM ('2025-01-01 00:00:00') TO ('2026-01-01 00:00:00');

-- 3. 为分区表创建索引（分区表索引可按分区创建，提升查询效率）
CREATE INDEX idx_order_partition_user_id ON order_partition(user_id);
CREATE INDEX idx_order_partition_create_time ON order_partition(create_time);

-- 4. 插入数据（数据会自动分配到对应分区）
INSERT INTO order_partition (user_id, order_no, amount, create_time)
VALUES 
(1, '2024001', 100.00, '2024-05-10 10:00:00'),
(2, '2025001', 200.00, '2025-03-15 14:30:00');

-- 5. 查询数据（自动查询对应分区，索引同步生效）
SELECT * FROM order_partition WHERE create_time BETWEEN '2024-01-01' AND '2024-12-31';

-- 6. 查看分区表结构（含分区索引）
\dt+ order_partition*;
```

### 3.4 常用优化技巧（精通关键）

1. 查询优化：避免使用SELECT *，合理创建索引（详见第二章2.2节），避免在WHERE子句中使用函数导致索引失效，复杂查询可拆分或使用视图。

2. 批量操作优化：批量插入使用VALUES批量写入，避免循环单条插入；批量删除/修改尽量使用TRUNCATE、批量UPDATE（避免逐条操作）。

3. 数据类型优化：选择合适的数据类型（如年龄用int4，不用int8；字符串用varchar，不用text（除非长度不固定且较长）），减少存储空间和查询开销。

4. 并发优化：合理设置事务隔离级别，避免长事务（长事务会占用连接，导致并发下降），使用连接池管理数据库连接。

5. 日志与监控：开启PgSQL日志（postgresql.conf配置），监控慢查询，及时优化低效SQL；定期分析表（ANALYZE），更新表统计信息，帮助PgSQL优化查询计划。

## 第四章：PgSQL与MySQL的核心差异化

PgSQL与MySQL均为主流开源关系型数据库，二者基础SQL语法通用，但在特性支持、性能表现、适用场景上差异显著，以下结合前文PgSQL知识点，对比核心差异（聚焦实操与开发重点）：

### 4.1 核心定位与设计理念

- PgSQL：定位“企业级开源数据库”，追求**功能全面性、数据完整性、扩展性**，底层架构更偏向严谨的关系型数据库设计，支持复杂业务场景和自定义扩展。

- MySQL：定位“轻量、高效、易用”，追求**高并发读写性能、简单部署与维护**，早期侧重Web场景优化，架构相对简洁，更适合中小规模场景快速落地。

### 4.2 实操层面核心差异（重点）

#### 4.2.1 数据类型与约束

- 数据类型：PgSQL支持更丰富的类型，如数组（int[]、varchar[]）、JSONB（高效JSON存储与查询）、地理空间类型（geometry）、枚举类型（ENUM）更灵活；MySQL支持类型相对基础，JSON查询性能弱于PgSQL，地理空间类型依赖扩展。

- 约束支持：二者均支持主键、外键、唯一、非空约束，但PgSQL的CHECK约束**完全生效**（如前文age的范围校验），MySQL5.7及以上仅语法支持，实际不生效（需通过触发器实现）；PgSQL还支持排他约束（EXCLUDE），MySQL无此特性。

- 自增主键：PgSQL用SERIAL（或IDENTITY），支持更精细的自增配置（如起始值、步长）；MySQL用AUTO_INCREMENT，配置相对简单，且仅能用于主键。

#### 4.2.2 索引与查询优化

- 索引类型：PgSQL支持B-tree、Hash、GiST、SP-GiST等多种索引，适合复杂查询（如地理空间查询）；MySQL默认仅B-tree索引，Hash索引支持有限（仅Memory引擎），复杂索引需依赖扩展。

- 查询优化：PgSQL查询优化器更智能，对复杂查询（多表关联、子查询、聚合）的优化效果更优；MySQL适合简单查询，复杂查询需手动优化（如调整索引、拆分SQL）。

- 分页语法：二者均支持LIMIT+OFFSET，但PgSQL支持**FETCH NEXT**（标准SQL语法，更规范），MySQL仅支持LIMIT+OFFSET；大数据量分页时，PgSQL性能更稳定。

#### 4.2.3 事务与并发

- 事务隔离级别：二者均支持4种隔离级别，但PgSQL默认READ COMMITTED，且支持Serializable快照隔离（SSI），解决幻读更彻底；MySQL默认也是READ COMMITTED，但Serializable级别性能较差，实际很少使用。

- 并发控制：PgSQL采用MVCC（多版本并发控制）+ 行级锁，读不加锁，并发读写冲突更少；MySQLInnoDB引擎也用MVCC，但在高并发写场景下，锁竞争更明显（如间隙锁导致的死锁概率更高）。

- 长事务支持：PgSQL对长事务的兼容性更好，不会轻易出现锁表、事务阻塞；MySQL长事务易导致锁表、日志膨胀，影响整体性能。

#### 4.2.4 高级特性（存储过程、触发器等）

- 存储过程与函数：PgSQL支持PL/pgSQL、Python等多种语言编写，逻辑控制更灵活（如复杂条件、循环、异常捕获）；MySQL仅支持SQL编写，功能有限，复杂逻辑需在应用层实现。

- 触发器：PgSQL支持行级、语句级触发器，可监听INSERT/UPDATE/DELETE等操作，且能调用自定义函数；MySQL触发器功能简单，仅支持行级触发，且无法调用外部函数。

- 分区表：PgSQL支持范围、列表、哈希等多种分区方式，且支持动态分区、分区索引，适合大数据量拆分；MySQL分区功能有限，仅支持基础范围分区，且分区表查询优化较差。

### 4.3 性能与适用场景差异

#### 4.3.1 性能表现

- 读性能：简单查询MySQL更快；复杂查询、多表关联查询PgSQL更优，尤其是结合索引使用时，性能优势更明显。

- 写性能：高并发简单写（如Web表单提交）MySQL更有优势；复杂写（如多表联动、事务写）PgSQL更稳定，不易出现数据不一致。

- 大数据量：千万级及以上数据量，PgSQL的分区表、索引优化更具优势，查询和维护更高效；MySQL大数据量下易出现性能瓶颈，需更多手动优化。

#### 4.3.2 适用场景

- PgSQL适用场景：企业级复杂业务（如金融、政务、电商核心业务）、大数据量存储与分析、需要复杂查询/自定义扩展、对数据完整性要求极高的场景。

- MySQL适用场景：中小规模Web应用（如博客、论坛、小型电商）、高并发简单读写场景、快速部署迭代、对数据库维护成本敏感的场景。

### 4.4 语法细节差异（高频实操）

```sql
-- 1. 自增主键语法差异
-- PgSQL（两种方式）
CREATE TABLE t1 (id SERIAL PRIMARY KEY, name VARCHAR(50));
CREATE TABLE t1 (id INT4 GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name VARCHAR(50));

-- MySQL
CREATE TABLE t1 (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(50));

-- 2. 插入并返回数据（PgSQL特色，MySQL无此语法）
-- PgSQL
INSERT INTO t1 (name) VALUES ('test') RETURNING id, name;

-- 3. LIMIT分页语法差异（PgSQL支持标准语法）
-- PgSQL（两种方式）
SELECT * FROM t1 LIMIT 10 OFFSET 20;
SELECT * FROM t1 OFFSET 20 FETCH NEXT 10 ROWS ONLY;

-- MySQL（仅一种方式）
SELECT * FROM t1 LIMIT 20, 10;
```

## 第五章：常见问题与解决方案

1. 问题1：查询速度慢？
解决方案：检查是否创建合适的索引（详见第二章2.2节）；避免SELECT *；优化WHERE子句，避免函数操作导致索引失效；分析慢查询日志（postgresql.conf中配置log_min_duration_statement）。

2. 问题2：插入中文乱码？
解决方案：创建数据库时指定编码为UTF-8；确保客户端连接编码为UTF-8（命令行执行`\encoding UTF8`）。

3. 问题3：事务回滚失败？
解决方案：检查事务是否已提交（COMMIT后无法回滚）；确保事务中没有执行DDL语句（DDL语句会自动提交事务）。

4. 问题4：外键约束报错，无法删除主表数据？
解决方案：删除主表数据前，先删除从表关联数据；或创建外键时设置ON DELETE CASCADE（级联删除）。

5. 问题5：存储过程/函数调用报错？
解决方案：检查参数类型是否匹配；检查变量声明是否正确；确保PL/pgSQL语言已启用（默认启用，可通过 `CREATE EXTENSION IF NOT EXISTS plpgsql;` 启用）。

6. 问题6：修改/删除字段时报索引相关错误？
解决方案：字段若有关联索引，需先删除索引（详见第二章2.2.2节删除索引语法），再执行修改/删除字段操作。

7. 问题7：查询不到表/操作表时报“不存在”错误？
解决方案：检查表所在的Schema是否正确，确认当前默认Schema（SELECT current_schema()）；若表在其他Schema下，需指定Schema.表名（如user_schema.user_info）或切换到对应Schema。

8. 问题8：创建索引后，查询效率无提升？
解决方案：检查索引类型是否适配查询场景（如范围查询不适合Hash索引）；检查查询语句是否导致索引失效（如使用函数、前缀通配符）；数据量较小时（<1万条），索引优势不明显，可无需创建。

## 总结

PgSQL的学习核心是“实操+理解”，从基础的SQL操作（DDL、DML）入手，掌握Schema的命名空间用法，再通过第二章独立的索引章节掌握查询优化核心，逐步掌握事务、视图等进阶特性，深入学习存储过程、触发器、分区表等高级特性，结合实战场景巩固用法，就能实现从入门到精通。

重点记住：PgSQL的优势在于强大的兼容性、扩展性和数据完整性，日常开发中需注重“高效查询”和“数据安全”，合理运用Schema、索引、事务、分区表等特性，才能发挥PgSQL的最大价值。