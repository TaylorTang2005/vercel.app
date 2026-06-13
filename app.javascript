// ==========================================
// ⚠️ 关键配置区：请在这里填入你的 Supabase 信息
// ==========================================
const SUPABASE_URL = 'https://oolqaprvhxkplywexuwg.supabase.co'; // 替换这里
const SUPABASE_KEY = 'sb_publishable_dISN4q5YmuuWyapmlrI2FA_IOMZWgst; // 替换这里
// ==========================================

// 初始化 Supabase 客户端
let supabase;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("Supabase 客户端已创建");
    } else {
        throw new Error("无法加载 Supabase 库，请检查网络或 index.html");
    }
} catch (e) {
    document.getElementById('status-box').innerText = "❌ 致命错误: " + e.message;
}

document.addEventListener('DOMContentLoaded', async () => {
    const statusBox = document.getElementById('status-box');
    const dataList = document.getElementById('data-list');

    // 注册 Service Worker (PWA 必须)
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('./sw.js');
            console.log('SW 注册成功');
        } catch (err) {
            console.error('SW 注册失败:', err);
        }
    }

    // 按钮 1：测试连接
    document.getElementById('test-btn').addEventListener('click', async () => {
        statusBox.innerText = "🔄 正在连接数据库...";
        statusBox.className = "status-box loading";

        // 1. 检查配置是否填写
        if (SUPABASE_URL.includes('你的项目ID') || SUPABASE_KEY.includes('你的')) {
            statusBox.innerText = "❌ 错误：请在 app.js 中填入真实的 URL 和 Key！";
            return;
        }

        try {
            // 尝试查询 products 表
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .limit(5);

            if (error) {
                console.error(error);
                if (error.message.includes('relation') || error.message.includes('does not exist')) {
                    statusBox.innerText = "❌ 数据库里没有 'products' 表！请先运行 SQL 建表语句。";
                } else if (error.message.includes('permission denied') || error.code === '42501') {
                    statusBox.innerText = "❌ 权限被拒绝！请去 Supabase 关闭 RLS 或开启匿名读取策略。";
                } else {
                    statusBox.innerText = "❌ 连接失败: " + error.message;
                }
            } else {
                statusBox.innerText = "✅ 连接成功！获取到 " + data.length + " 条数据。";
                statusBox.className = "status-box success";
                renderList(data);
            }
        } catch (err) {
            statusBox.innerText = "❌ 发生未知错误: " + err.message;
        }
    });

    // 按钮 2：模拟写入数据
    document.getElementById('add-data-btn').addEventListener('click', async () => {
        statusBox.innerText = "📝 正在写入数据...";
        const newItem = {
            name: '测试商品-' + Math.floor(Math.random() * 1000),
            stock: 10,
            qr_data: 'QR-' + Date.now()
        };

        const { data, error } = await supabase.from('products').insert([newItem]).select();

        if (error) {
            statusBox.innerText = "❌ 写入失败: " + error.message;
        } else {
            statusBox.innerText = "✅ 写入成功！";
            // 刷新列表
            const { data: allData } = await supabase.from('products').select('*').limit(10);
            renderList(allData);
        }
    });

    function renderList(data) {
        dataList.innerHTML = '';
        if (!data || data.length === 0) {
            dataList.innerHTML = '<p style="color:#666">暂无数据</p>';
            return;
        }
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `<strong>${item.name}</strong> <span>库存: ${item.stock}</span>`;
            dataList.appendChild(div);
        });
    }
});


