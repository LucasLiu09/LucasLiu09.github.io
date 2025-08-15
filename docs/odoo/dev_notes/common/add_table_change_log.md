---
title: 创建变更日志表及触发器
description: 通过sql创建变更日志表及触发器
sidebar_label: 创建变更日志表及触发器
keyword:
    - odoo
    - odoo development
tags: [odoo]
last_update:
  date: 2025/8/15
  author: Lucas
---

# 创建变更日志表及触发器

:::info[Note]
从数据库层面通过sql创建变更日志表及触发器，该文档便于模板复用。
:::

## sql模板

```sql
DO $$
DECLARE
    -- 配置变量 - 修改这些变量来适配不同的表
    table_name TEXT := 'res_users';        -- 目标表名
    log_table_suffix TEXT := '_changed_log';                   -- 日志表后缀
    function_suffix TEXT := '_changed_log';                    -- 函数后缀
    trigger_prefix TEXT := 'trg_';                             -- 触发器前缀
    trigger_suffix TEXT := '_log';                             -- 触发器后缀
    
    -- 自动生成的变量 - 无需修改
    log_table_name TEXT;
	index_prefix TEXT;										   -- 索引前缀
    function_name TEXT;
    trigger_name TEXT;
    sql_text TEXT;
BEGIN
    -- 生成完整的表名、函数名和触发器名
    log_table_name := table_name || log_table_suffix;
	index_prefix := 'idx_' || table_name || '_log_';
    function_name := table_name || function_suffix;
    trigger_name := trigger_prefix || table_name || trigger_suffix;
    
    -- 1. 创建日志表
    sql_text := format('
        CREATE TABLE IF NOT EXISTS public.%I (
            id serial4 NOT NULL,
            log_time timestamp DEFAULT now() NOT NULL,
            "action" varchar(15) NOT NULL,
            model varchar(50) NOT NULL,
            model_id int4 NOT NULL,
            changed_column varchar(255) NULL,
            old_value text NULL,
            new_value text NULL,
            json_data jsonb NULL,
            user_name varchar(255) NOT NULL,
            ip_address inet NOT NULL,
            CONSTRAINT %I_pkey PRIMARY KEY (id)
        )', log_table_name, log_table_name);
    
    EXECUTE sql_text;
    RAISE NOTICE '已创建日志表: %', log_table_name;
    
    -- 2. 创建索引
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I_action ON public.%I USING btree (action)', 
                  index_prefix || 'action', log_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I_column ON public.%I USING btree (changed_column)', 
                  index_prefix || 'column', log_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I_model_id ON public.%I USING btree (model_id)', 
                  index_prefix || 'model_id', log_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I_time ON public.%I USING btree (log_time)', 
                  index_prefix || 'time', log_table_name);
    
    RAISE NOTICE '已创建索引';
    
    -- 3. 创建触发器函数
    sql_text := format('
        CREATE OR REPLACE FUNCTION public.%I()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $function$
        DECLARE
            column_name_text TEXT;
            old_value TEXT;
            new_value TEXT;
            user_name TEXT;
            truncated_column VARCHAR(255);
            excluded_columns TEXT[] := ARRAY[''write_date'', ''create_date'', ''__last_update'', ''update_date''];
            user_query TEXT;
        BEGIN
            -- 处理 DELETE 操作
            IF TG_OP = ''DELETE'' THEN
                BEGIN
                    -- 获取操作用户名（带错误处理）
                    user_query := format(''SELECT login FROM res_users WHERE id = %%L'', OLD.write_uid);
                    EXECUTE user_query INTO user_name;
                    
                    -- 用户不存在时设为默认值
                    IF user_name IS NULL THEN
                        user_name := ''unknown_user'';
                    END IF;
                EXCEPTION
                    WHEN others THEN
                        user_name := ''error_fetching_user'';
                END;
                
                -- 插入删除日志
                INSERT INTO %I (
                    action, model, model_id, json_data, user_name, ip_address
                ) VALUES (
                    ''DELETE'', TG_TABLE_NAME, OLD.id, row_to_json(OLD), user_name, inet_client_addr()
                );
                RETURN OLD;
            
            -- 处理 CREATE 操作
            ELSIF TG_OP = ''INSERT'' THEN
                BEGIN
                    -- 获取创建者用户名
                    user_query := format(''SELECT login FROM res_users WHERE id = %%L'', NEW.create_uid);
                    EXECUTE user_query INTO user_name;
                    
                    IF user_name IS NULL THEN
                        user_name := ''unknown_user'';
                    END IF;
                EXCEPTION
                    WHEN others THEN
                        user_name := ''error_fetching_user'';
                END;
                
                -- 记录完整行数据
                INSERT INTO %I (
                    action, model, model_id, json_data, user_name, ip_address
                ) VALUES (
                    ''CREATE'', TG_TABLE_NAME, NEW.id, row_to_json(NEW), user_name, inet_client_addr()
                );
                
                -- 为每个字段添加详细记录
                FOR column_name_text IN 
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = %L
                      AND column_name <> ALL(excluded_columns)
                LOOP
                    BEGIN
                        -- 动态获取字段值
                        EXECUTE format(''SELECT $1.%%I'', column_name_text)
                        USING NEW INTO new_value;
                        
                        -- 安全处理列名长度
                        truncated_column := LEFT(column_name_text, 255);
                        
                        -- 插入字段级创建记录
                        INSERT INTO %I (
                            action, model, model_id, changed_column, 
                            old_value, new_value, user_name, ip_address
                        ) VALUES (
                            ''CREATE_FIELD'', TG_TABLE_NAME, NEW.id, truncated_column,
                            NULL, new_value, user_name, inet_client_addr()
                        );
                    EXCEPTION
                        WHEN others THEN
                            -- 记录字段级错误但不中断流程
                            INSERT INTO %I (
                                action, model, model_id, changed_column, 
                                old_value, new_value, user_name, ip_address
                            ) VALUES (
                                ''ERROR'', TG_TABLE_NAME, NEW.id, ''field_processing'',
                                ''ERROR'', ''Failed to log field: '' || column_name_text, 
                                user_name, inet_client_addr()
                            );
                    END;
                END LOOP;
                RETURN NEW;
            
            -- 处理 UPDATE 操作
            ELSIF TG_OP = ''UPDATE'' THEN
                BEGIN
                    -- 获取修改者用户名
                    user_query := format(''SELECT login FROM res_users WHERE id = %%L'', NEW.write_uid);
                    EXECUTE user_query INTO user_name;
                    
                    IF user_name IS NULL THEN
                        user_name := ''unknown_user'';
                    END IF;
                EXCEPTION
                    WHEN others THEN
                        user_name := ''error_fetching_user'';
                END;
                
                -- 遍历所有字段
                FOR column_name_text IN 
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = %L
                      AND column_name <> ALL(excluded_columns)
                LOOP
                    BEGIN
                        -- 动态获取新旧值
                        EXECUTE format(''SELECT $1.%%I, $2.%%I'', column_name_text, column_name_text)
                        USING OLD, NEW INTO old_value, new_value;
                        
                        -- 检测值变化（正确处理 NULL 值）
                        IF old_value IS DISTINCT FROM new_value THEN
                            -- 安全处理列名长度
                            truncated_column := LEFT(column_name_text, 255);
                            
                            -- 插入变更记录
                            INSERT INTO %I (
                                action, model, model_id, changed_column, 
                                old_value, new_value, user_name, ip_address
                            ) VALUES (
                                ''UPDATE'', TG_TABLE_NAME, NEW.id, truncated_column,
                                old_value, new_value, user_name, inet_client_addr()
                            );
                        END IF;
                    EXCEPTION
                        WHEN others THEN
                            -- 记录字段级错误但不中断流程
                            INSERT INTO %I (
                                action, model, model_id, changed_column, 
                                old_value, new_value, user_name, ip_address
                            ) VALUES (
                                ''ERROR'', TG_TABLE_NAME, NEW.id, ''field_processing'',
                                ''ERROR'', ''Failed to compare field: '' || column_name_text, 
                                user_name, inet_client_addr()
                            );
                    END;
                END LOOP;
                RETURN NEW;
            END IF;
            
            RETURN NULL;
        END;
        $function$',
        function_name, log_table_name, log_table_name, table_name, log_table_name, log_table_name, table_name, log_table_name, log_table_name);
    
    EXECUTE sql_text;
    RAISE NOTICE '已创建触发器函数: %', function_name;
    
    -- 4. 创建触发器
    sql_text := format('
        CREATE TRIGGER %I
        AFTER INSERT OR DELETE OR UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION %I()',
        trigger_name, table_name, function_name);
    
    EXECUTE sql_text;
    RAISE NOTICE '已创建触发器: %', trigger_name;
    
    RAISE NOTICE '完成! 为表 % 创建了变更日志表及表触发器', table_name;
END;
$$;
```
