# 命令行说明
+ -s -c **.conf
    - 运行完命令行后生成配置文件
+ --stop-after-init
    - 在初始化后停止server
+ -d
    - 指定数据库
+ -r
    - 指定数据库用户名
+ -w
    - 指定数据库用户密码

# 配置文件详解
```text
[options]
; addons模块的查找路径（可以配多个，多个之间以逗号分隔）
addons_path = /home/odoo/odoo-12/odoo/addons,/home/odoo/odoo-12/addons,/home/odoo/odoo-12/custom
; 数据库管理密码(用于创建、还原和备份数据库等操作)
admin_passwd = admin
; data目录, 用于存放session数据、附件、缓存文件等
data_dir = /home/odoo/.local/share/Odoo
;csv读取格式
csv_internal_sep = ,
;##################### 数据库相关配置####################
; 数据库主机名
db_host = False
; 数据库端口号，False为默认
db_port = False
; 数据库用户名
db_user = False
; 数据库用户密码
db_password = False
; 数据库的最大连接数
db_maxconn = 64
; 指定要预加载的数据库，多个以逗号分隔
db_name = odoo-test
; 创建新数据库时使用的数据库模板
db_template = template0
; 过滤要显示的供选择数据库名称
dbfilter = odoo-stage-*
;##################### 邮件相关配置####################
; 用于发送邮件的邮箱地址
email_from = False
; SMTP服务器名
smtp_server = localhost
; SMTP端口号
smtp_port = 25
; SMTP服务器是否支持SSL协议
smtp_ssl = False
; 发送邮件的SMTP用户名
smtp_user = False
; 发送邮件的SMTP用户密码
smtp_password = False
; 哪些模块不加载demo数据
without_demo = all
; 一个处理器允许使用的最大物理内存, Odoo默认为2G
limit_memory_hard = 2684354560
; 一个处理器允许使用的最大虚拟内存
limit_memory_soft = 2147483648
; 一个处理器接受的最大请求数
limit_request = 8192
; 一个请求最多占用多少处理器时间
limit_time_cpu = 60
; 一个请求允许的最长实时时间
limit_time_real = 240
; 是否允许显示数据库列表
list_db = True
; 是否将log写入db的ir_logging表
log_db = False
; 设置模块的日志级别，可以是一组module:log_level对, 默认值是“:INFO”(表示所有模块的默认日志级别为INFO)
log_handler = :INFO
; 日志的级别, 可选值：debug_rpc_answer, debug_rpc, debug, debug_sql, info, warn, error, critical
log_level = warning
; 指定用来存储日志的文件
logfile = /var/log/odoo/odoo-server.log
; 是否按天存放日志
logrotate = True
; 长连接池使用的端口号（当设置了此值后系统以gevent模式跑在这里指定的端口下）
longpolling_port = 8072
; 处理当前计划任务的最大线程数
max_cron_threads = 2
; 强制保存在virtual osv_memory表中的记录的最长时间，以小时为单位
osv_memory_age_limit = 1.0
; 强制一个virtual osv_memory表的最大记录数
osv_memory_count_limit = False
; 数据库可执行文件的路径
pg_path = None
; 存储服务器pid的文件名
pidfile = None
; 是否使用反向代理模式
proxy_mode = True
; 是否压缩报表
reportgz = False
; 指定用于SSL连接的证书文件
secure_cert_file = server.cert
; 指定用于SSL连接的主密钥文件
secure_pkey_file = server.pkey
; server范围的模块,以逗号分隔
server_wide_modules = base,web
; 是否把日志发送给系统日志服务器
syslog = False
; 是否提交YAML或XML测试造成的数据库更改
test_commit = False
; 是否允许YAML和单元测试
test_enable = False
; YML测试文件
test_file = False
; 报表的范例的存放位置
test_report_directory = False
; 为系统提供一个参照的时区
timezone = False
; 哪些模块可翻译, 默认为all
translate_modules = ['all']
; 是否使用数据库的unaccent功能
unaccent = False
; 在安装时哪些模块不加载演示数据
without_demo = False
; 要使用的处理器数量
workers = None
;##################### xml服务相关配置####################
; 是否允许使用XML-RPC协议（即是否启用http服务），默认为True
xmlrpc = True
; 指定使用XML-RPC协议的IP地址，为空时表示绑定到现有IP
xmlrpc_interface = 
; XML-RPC协议使用的TCP端口
xmlrpc_port = 8069
; 是否允许使用XML-RPC安全协议，默认为True
xmlrpcs = True
; 指定使用XML-RPC安全协议的IP地址，为空时表示绑定到现有IP
xmlrpcs_interface = 
; XML-RPC安全协议使用的TCP端口
xmlrpcs_port = 8071
```

# works内置服务器配置
> 摘自odoo官方文档

Odoo包括内置的HTTP服务器，使用多线程或多处理。 对于生产使用，建议使用多处理服务器，因为它增加了稳定性，更好地利用了计算资源，并且可以更好地监视和限制资源。

多处理是通过配置非零数量的工作进程来实现的，工作进程的数量应该基于机器中的核心数量（可能有一些空间供cron工作进程使用，这取决于预测的cron工作量） 可以根据硬件配置配置工作进程限制，以避免资源耗尽。

工作进程数量计算

数量规则：(#CPU * 2) + 1

Cron工作者需要CPU 1个工作进程~=6个并发用户

内存大小计算

我们认为20%的请求是繁重请求，而80%是简单请求 一个繁重的工作，当所有的计算字段都设计好了，SQL请求设计好了，…估计要消耗大约1G的RAM 在相同的情况下，一个较轻的工作估计要消耗大约150MB的RAM

Needed RAM = #worker * ( (light_worker_ratio * light_worker_ram_estimation) + (heavy_worker_ratio * heavy_worker_ram_estimation) )

LiveChat

在多处理中，会自动启动一个专用的LiveChat工作进程并监听longpolling端口，但客户端不会连接到它。 相反，必须有一个代理将其URL以/longpolling/开头的请求重定向到longpolling端口。其他请求应被代理到正常的HTTP端口 要实现这一点，您需要在Odoo前面部署一个反向代理，比如nginx或apache。这样做时，您需要将更多的http头转发给Odoo，并在Odoo配置中激活代理模式，让Odoo读取这些头。

配置实例

4 CPU 8线程服务器 60个并发用户 60个用户/6=10<-理论上需要的worker数量 （4×2）＋1＝9＜理论最大worker数 我们将使用8个workers+1作为cron。我们还将使用监控系统来测量cpu负载，并检查它是否在7到7.5之间。 RAM=9（（0.8150）+（0.2*1024））~=3Go RAM用于Odoo
