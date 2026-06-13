// --- 1. 配置 Supabase ---
// ⚠️ 重要：请去 Supabase 后台 -> Settings -> API 复制这两个值填进去
const SUPABASE_URL = 'https://oolqaprvhxkplywexuwg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_dISN4q5YmuuWyapmlrI2FA_IOMZWgst';

// 初始化客户端
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2. 页面加载后的逻辑 ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("应用已启动");

    // 注册 Service Worker (PWA 离线功能的核心)
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker 注册成功:', registration.scope);
        } catch (error) {
            console.error('Service Worker 注册失败:', error);
        }
    }

    // 绑定按钮点击事件进行测试
    const btn = document.getElementById('test-btn');
    const statusDiv = document.getElementById('status');

    if(btn) {
        btn.addEventListener('click', async () => {
            statusDiv.innerText = "正在查询数据库...";

            // 尝试从 products 表读取前 5 条数据
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .limit(5);

            if (error) {
                console.error('查询出错:', error);
                statusDiv.innerText = "❌ 连接失败: " + error.message;
                alert("请检查 app.js 中的 URL 和 Key 是否正确！");
            } else {
                console.log('获取到的数据:', data);
                statusDiv.innerText = `✅ 连接成功！获取到 ${data.length} 条数据`;
                // 你可以在这里把 data 渲染到页面上
            }
        });
    }
});


